import { createServer, type Server } from "node:http";
import { loadEnv, SETTLEMENT_META_KEY } from "@copium/txline";
import { Redis } from "ioredis";
import { runPhaseAPoll, type PhaseAResult } from "./phase-a.js";

loadEnv();

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const HEALTH_PORT = Number(process.env.SETTLEMENT_WORKER_PORT ?? 9092);
const POLL_MS = Number(process.env.SETTLEMENT_POLL_MS ?? 5000);

const counters = {
  polls: 0,
  settled: 0,
  errors: 0,
  startedAt: new Date().toISOString(),
  lastPollAt: undefined as string | undefined,
  lastSettleAt: undefined as string | undefined,
};

const recent: PhaseAResult[] = [];

function remember(entry: PhaseAResult): void {
  recent.unshift(entry);
  if (recent.length > 20) recent.length = 20;
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
      ok: redisOk,
      service: "settlement-worker",
      redis: redisOk,
      counters,
      recent,
    };

    res.writeHead(body.ok ? 200 : 503, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  });
}

export async function startWorker(): Promise<{
  health: Server;
  redis: Redis;
  stop: () => Promise<void>;
}> {
  const redis = new Redis(REDIS_URL);
  await redis.ping();

  const health = startHealthServer(redis);
  await new Promise<void>((resolve, reject) => {
    health.listen(HEALTH_PORT, () => resolve());
    health.on("error", reject);
  });

  await redis.set(
    SETTLEMENT_META_KEY,
    JSON.stringify({
      startedAt: counters.startedAt,
      healthPort: HEALTH_PORT,
      pollMs: POLL_MS,
    }),
  );

  let timer: ReturnType<typeof setInterval> | undefined;
  let running = false;

  const poll = async (): Promise<void> => {
    if (running) return;
    running = true;
    counters.polls += 1;
    counters.lastPollAt = new Date().toISOString();
    try {
      const results = await runPhaseAPoll();
      for (const row of results) {
        remember(row);
        counters.settled += 1;
        counters.lastSettleAt = new Date().toISOString();
        console.log(JSON.stringify({ action: "phase_a_settled", ...row }));
      }
    } catch (err) {
      counters.errors += 1;
      console.error(
        JSON.stringify({
          action: "phase_a_error",
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    } finally {
      running = false;
    }
  };

  timer = setInterval(() => void poll(), POLL_MS);
  void poll();

  console.log(`settlement-worker — health :${HEALTH_PORT}/health poll ${POLL_MS}ms`);

  const stop = async (): Promise<void> => {
    if (timer) clearInterval(timer);
    health.close();
    redis.disconnect();
  };

  return { health, redis, stop };
}

async function main(): Promise<void> {
  const once = process.argv.includes("--once");

  if (once) {
    const results = await runPhaseAPoll();
    for (const row of results) {
      console.log(JSON.stringify({ action: "phase_a_settled", ...row }));
    }
    if (results.length === 0) {
      console.log(JSON.stringify({ action: "phase_a_idle" }));
    }
    return;
  }

  const { stop } = await startWorker();
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
