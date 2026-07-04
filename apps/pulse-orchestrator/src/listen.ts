import { createServer, type Server } from "node:http";
import { createSpawnTracker, type SpawnIntent } from "@copium/pulse-engine/spawn-handler";
import { loadEnv, ORCHESTRATOR_META_KEY, SPAWN_LOG_KEY } from "@copium/txline";
import type { DetectedEvent, OddsUpdate, ScoreUpdate } from "@copium/txline";
import { Redis } from "ioredis";

loadEnv();

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const HEALTH_PORT = Number(process.env.PULSE_ORCHESTRATOR_PORT ?? 9091);
const SPAWN_LOG_MAX = 100;

type OrchestratorCounters = {
  eventsSeen: number;
  wouldSpawn: number;
  spawned: number;
  skipped: number;
  startedAt: string;
  lastEventAt?: string;
  lastSpawnAt?: string;
};

const counters: OrchestratorCounters = {
  eventsSeen: 0,
  wouldSpawn: 0,
  spawned: 0,
  skipped: 0,
  startedAt: new Date().toISOString(),
};

const recent: SpawnIntent[] = [];

function remember(entry: SpawnIntent): void {
  recent.unshift(entry);
  if (recent.length > 50) recent.length = 50;
}

async function pushSpawnLog(redis: Redis, entry: SpawnIntent): Promise<void> {
  await redis.lpush(SPAWN_LOG_KEY, JSON.stringify(entry));
  await redis.ltrim(SPAWN_LOG_KEY, 0, SPAWN_LOG_MAX - 1);
}

function startHealthServer(redis: Redis): Server {
  return createServer(async (req, res) => {
    if (req.url !== "/health") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false }));
      return;
    }

    let redisOk = false;
    try {
      redisOk = (await redis.ping()) === "PONG";
    } catch {
      redisOk = false;
    }

    const spawnLog = redisOk ? await readSpawnLog(redis, 10) : [];

    const body = {
      ok: redisOk,
      service: "pulse-orchestrator",
      redis: redisOk,
      counters,
      recent,
      spawnLog,
    };

    res.writeHead(body.ok ? 200 : 503, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  });
}

async function readSpawnLog(redis: Redis, limit = 50): Promise<SpawnIntent[]> {
  const rows = await redis.lrange(SPAWN_LOG_KEY, 0, limit - 1);
  const out: SpawnIntent[] = [];
  for (const row of rows) {
    try {
      out.push(JSON.parse(row) as SpawnIntent);
    } catch {
      // skip corrupt row
    }
  }
  return out;
}

export async function startListener(): Promise<{
  health: Server;
  redis: Redis;
  sub: Redis;
  stop: () => Promise<void>;
}> {
  const redis = new Redis(REDIS_URL);
  await redis.ping();

  const sub = new Redis(REDIS_URL);
  const tracker = createSpawnTracker();

  const onMessage = async (channel: string, message: string): Promise<void> => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }

    if (channel.startsWith("scores:")) {
      const fixtureId = Number(channel.slice("scores:".length));
      const envelope = parsed as { payload?: ScoreUpdate };
      if (!envelope.payload || !Number.isFinite(fixtureId)) return;
      tracker.onScores(fixtureId, envelope.payload);
      return;
    }

    if (channel.startsWith("odds:")) {
      const fixtureId = Number(channel.slice("odds:".length));
      const envelope = parsed as { payload?: OddsUpdate };
      if (!envelope.payload || !Number.isFinite(fixtureId)) return;
      tracker.onOdds(fixtureId, envelope.payload);
      return;
    }

    if (!channel.startsWith("event:")) return;

    const event = parsed as DetectedEvent;
    if (!event.kind || event.fixtureId === undefined) return;

    counters.eventsSeen += 1;
    counters.lastEventAt = new Date().toISOString();

    const intents = tracker.onDetected([event]);
    for (const intent of intents) {
      let finalIntent = intent;

      if (intent.action === "would_spawn_pulse") {
        counters.wouldSpawn += 1;
        const { executeSpawnPulse } = await import("./spawn.js");
        finalIntent = await executeSpawnPulse(
          redis,
          intent,
          tracker.contextFor(intent.fixtureId),
        );
      }

      remember(finalIntent);
      await pushSpawnLog(redis, finalIntent);

      if (finalIntent.action === "spawned_pulse") {
        counters.spawned += 1;
        counters.lastSpawnAt = finalIntent.at;
        console.log(JSON.stringify(finalIntent));
      } else if (finalIntent.action === "would_spawn_pulse") {
        counters.lastSpawnAt = finalIntent.at;
        console.log(JSON.stringify(finalIntent));
      } else {
        counters.skipped += 1;
      }
    }
  };

  await sub.psubscribe("event:*", "scores:*", "odds:*");
  let chain = Promise.resolve();
  sub.on("pmessage", (_pattern, channel, message) => {
    chain = chain.then(() => onMessage(channel, message));
  });

  const health = startHealthServer(redis);
  await new Promise<void>((resolve, reject) => {
    health.listen(HEALTH_PORT, () => resolve());
    health.on("error", reject);
  });

  const meta = {
    startedAt: counters.startedAt,
    healthPort: HEALTH_PORT,
    redisUrl: REDIS_URL.replace(/:[^:@/]+@/, ":***@"),
  };
  await redis.set(ORCHESTRATOR_META_KEY, JSON.stringify(meta));

  console.log(`pulse-orchestrator listen — health :${HEALTH_PORT}/health`);

  const stop = async (): Promise<void> => {
    health.close();
    sub.disconnect();
    redis.disconnect();
  };

  return { health, redis, sub, stop };
}

async function main(): Promise<void> {
  const { stop } = await startListener();

  const shutdown = async () => {
    await stop();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

import { pathToFileURL } from "node:url";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
