import { createServer, type Server } from "node:http";
import { Redis } from "ioredis";
import {
  detectFromOddsUpdate,
  detectFromScoreUpdate,
  eventChannel,
  INGEST_META_KEY,
  loadEnv,
  oddsChannel,
  openTxlineStream,
  parseSseJson,
  readSseMessages,
  scoresChannel,
  startGuestSession,
  type DetectedEvent,
  type FixtureDetectState,
  type OddsUpdate,
  type ScoreUpdate,
} from "@copium/txline";

loadEnv();

const HEALTH_PORT = Number(process.env.TXLINE_INGEST_PORT ?? 9090);
const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

type IngestCounters = {
  oddsMessages: number;
  scoresMessages: number;
  detectedEvents: number;
  startedAt: string;
  lastOddsAt?: string;
  lastScoresAt?: string;
  lastEventAt?: string;
};

const counters: IngestCounters = {
  oddsMessages: 0,
  scoresMessages: 0,
  detectedEvents: 0,
  startedAt: new Date().toISOString(),
};

const fixtureState = new Map<number, FixtureDetectState>();

function stateFor(fixtureId: number): FixtureDetectState {
  const existing = fixtureState.get(fixtureId);
  if (existing) return existing;
  const fresh: FixtureDetectState = { goals: {} };
  fixtureState.set(fixtureId, fresh);
  return fresh;
}

async function publishDetected(
  redis: Redis,
  events: DetectedEvent[],
): Promise<void> {
  for (const event of events) {
    counters.detectedEvents += 1;
    counters.lastEventAt = new Date().toISOString();
    await redis.publish(eventChannel(event.fixtureId), JSON.stringify(event));
  }
}

async function runOddsStream(redis: Redis, apiToken: string): Promise<never> {
  for (;;) {
    const { jwt, apiOrigin } = await startGuestSession();
    const res = await openTxlineStream(apiOrigin, jwt, apiToken, "odds");
    for await (const message of readSseMessages(res)) {
      const payload = parseSseJson(message.data);
      if (!payload || typeof payload !== "object") continue;

      const update = payload as OddsUpdate;
      const fixtureId = update.FixtureId ?? update.fixtureId;
      if (fixtureId === undefined) continue;
      if (!("MessageId" in update)) continue;

      counters.oddsMessages += 1;
      counters.lastOddsAt = new Date().toISOString();

      const prev = stateFor(fixtureId);
      const { events, next } = detectFromOddsUpdate(update, prev);
      fixtureState.set(fixtureId, next);

      const envelope = {
        stream: "odds" as const,
        receivedAt: new Date().toISOString(),
        payload: update,
      };
      await redis.publish(oddsChannel(fixtureId), JSON.stringify(envelope));
      await publishDetected(redis, events);
    }
  }
}

async function runScoresStream(redis: Redis, apiToken: string): Promise<never> {
  for (;;) {
    const { jwt, apiOrigin } = await startGuestSession();
    const res = await openTxlineStream(apiOrigin, jwt, apiToken, "scores");
    for await (const message of readSseMessages(res)) {
      const payload = parseSseJson(message.data);
      if (!payload || typeof payload !== "object") continue;

      const update = payload as ScoreUpdate;
      const fixtureId = update.fixtureId ?? update.FixtureId;
      if (fixtureId === undefined) continue;
      if (!("gameState" in update) && !("GameState" in update) && !update.stats) {
        continue;
      }

      counters.scoresMessages += 1;
      counters.lastScoresAt = new Date().toISOString();

      const prev = stateFor(fixtureId);
      const { events, next } = detectFromScoreUpdate(update, prev);
      fixtureState.set(fixtureId, next);

      const envelope = {
        stream: "scores" as const,
        receivedAt: new Date().toISOString(),
        payload: update,
      };
      await redis.publish(scoresChannel(fixtureId), JSON.stringify(envelope));
      await publishDetected(redis, events);
    }
  }
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

    const body = {
      ok: redisOk && counters.oddsMessages > 0,
      service: "txline-ingest",
      redis: redisOk,
      streams: {
        oddsConnected: counters.oddsMessages > 0,
        scoresConnected: counters.scoresMessages > 0,
      },
      counters,
      fixturesTracked: fixtureState.size,
    };

    res.writeHead(body.ok ? 200 : 503, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  });
}

async function main(): Promise<void> {
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) {
    throw new Error("TXLINE_API_TOKEN missing — run pnpm txline:subscribe");
  }

  const redis = new Redis(REDIS_URL);
  await redis.ping();

  const { apiOrigin } = await startGuestSession();

  const health = startHealthServer(redis);
  await new Promise<void>((resolve, reject) => {
    health.listen(HEALTH_PORT, () => resolve());
    health.on("error", reject);
  });

  const meta = {
    startedAt: counters.startedAt,
    apiOrigin,
    healthPort: HEALTH_PORT,
    redisUrl: REDIS_URL.replace(/:[^:@/]+@/, ":***@"),
  };
  await redis.set(INGEST_META_KEY, JSON.stringify(meta));

  console.log(`txline-ingest up — health :${HEALTH_PORT}/health redis ${REDIS_URL}`);

  const shutdown = async () => {
    health.close();
    redis.disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  await Promise.all([
    runOddsStream(redis, apiToken).catch((err: unknown) => {
      console.error("odds stream:", err instanceof Error ? err.message : err);
      process.exit(1);
    }),
    runScoresStream(redis, apiToken).catch((err: unknown) => {
      console.error("scores stream:", err instanceof Error ? err.message : err);
      process.exit(1);
    }),
  ]);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
