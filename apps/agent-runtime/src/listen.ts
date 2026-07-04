import { createServer, type Server } from "node:http";
import { AGENT_RUNTIME_META_KEY, loadEnv, PULSE_SPAWNED_CHANNEL } from "@copium/txline";
import { Redis } from "ioredis";
import { executeFirstAgentOnPulse } from "./executor.js";

loadEnv();

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const HEALTH_PORT = Number(process.env.AGENT_RUNTIME_PORT ?? 9093);

type PulseSpawned = {
  pulseId: string;
  poolPubkey: string;
  fixtureId: number;
  linePct?: number;
  question?: string;
};

const counters = {
  pulsesSeen: 0,
  tradesExecuted: 0,
  tradesSkipped: 0,
  startedAt: new Date().toISOString(),
  lastPulseAt: undefined as string | undefined,
  lastTradeAt: undefined as string | undefined,
};

function startHealthServer(): Server {
  return createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "agent-runtime", counters }));
  });
}

export async function startAgentRuntime(): Promise<{
  health: Server;
  redis: Redis;
  sub: Redis;
  stop: () => Promise<void>;
}> {
  const redis = new Redis(REDIS_URL);
  await redis.ping();
  const sub = new Redis(REDIS_URL);

  const onSpawned = async (message: string): Promise<void> => {
    let payload: PulseSpawned;
    try {
      payload = JSON.parse(message) as PulseSpawned;
    } catch {
      return;
    }
    if (!payload.pulseId) return;

    counters.pulsesSeen += 1;
    counters.lastPulseAt = new Date().toISOString();

    const result = await executeFirstAgentOnPulse(payload.pulseId);
    if (result.skipped) {
      counters.tradesSkipped += 1;
      console.log(JSON.stringify({ action: "skip_trade", pulseId: payload.pulseId, reason: result.reason }));
      return;
    }

    counters.tradesExecuted += 1;
    counters.lastTradeAt = new Date().toISOString();
    console.log(
      JSON.stringify({
        action: "agent_trade",
        agent: result.agentSlug,
        pulseId: payload.pulseId,
        side: result.side,
        executeTx: result.executeTx,
      }),
    );
  };

  await sub.subscribe(PULSE_SPAWNED_CHANNEL);
  let chain = Promise.resolve();
  sub.on("message", (_channel, message) => {
    chain = chain.then(() => onSpawned(message));
  });

  const health = startHealthServer();
  await new Promise<void>((resolve, reject) => {
    health.listen(HEALTH_PORT, () => resolve());
    health.on("error", reject);
  });

  await redis.set(
    AGENT_RUNTIME_META_KEY,
    JSON.stringify({ startedAt: counters.startedAt, healthPort: HEALTH_PORT }),
  );

  console.log(`agent-runtime listen — health :${HEALTH_PORT}/health`);

  const stop = async (): Promise<void> => {
    health.close();
    sub.disconnect();
    redis.disconnect();
  };

  return { health, redis, sub, stop };
}

async function main(): Promise<void> {
  const { stop } = await startAgentRuntime();
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
