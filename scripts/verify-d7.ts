import { insertSimulatorSession, loadEnv as loadDbEnv, updateSimulatorCursor } from "@copium/db";
import { spawnIntent } from "@copium/pulse-engine/spawn-handler";
import { evaluateBundle } from "@copium/pulse-engine/bundle-eval";
import {
  buildSimBundle,
  goalCursor,
  loadEnv,
  replayStep,
  startGuestSession,
  SPAWN_LOG_KEY,
} from "@copium/txline";
import { startListener } from "../apps/pulse-orchestrator/src/listen.ts";
import { Redis } from "ioredis";

loadEnv();
loadDbEnv();

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const DEFAULT_FIXTURE = Number(process.env.VERIFY_D5_FIXTURE_ID ?? 17926704);

async function waitForSpawnLog(timeoutMs: number): Promise<boolean> {
  const redis = new Redis(REDIS_URL);
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const rows = await redis.lrange(SPAWN_LOG_KEY, 0, 20);
    for (const row of rows) {
      try {
        const parsed = JSON.parse(row) as { action?: string };
        if (parsed.action === "would_spawn_pulse") {
          redis.disconnect();
          return true;
        }
      } catch {
        // skip
      }
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  redis.disconnect();
  return false;
}

async function main(): Promise<void> {
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) throw new Error("TXLINE_API_TOKEN missing");

  const redis = new Redis(REDIS_URL);
  await redis.ping();
  await redis.del(SPAWN_LOG_KEY);
  redis.disconnect();

  const { stop } = await startListener();

  try {
    const { jwt, apiOrigin } = await startGuestSession();
    const bundle = await buildSimBundle(apiOrigin, jwt, apiToken, DEFAULT_FIXTURE);
    const goalAt = goalCursor(bundle);
    if (goalAt === undefined) {
      throw new Error(`fixture ${DEFAULT_FIXTURE} has no goal in historical bundle`);
    }

    const evalResult = evaluateBundle(bundle);
    if (!evalResult.goalPulse) {
      throw new Error("evaluateBundle found no goal pulse on real bundle");
    }

    const dry = spawnIntent(
      { kind: "goal", fixtureId: bundle.fixtureId, ts: 1000, detail: {} },
      { minute: 67, linePct: 50 },
    );
    if (dry.action !== "would_spawn_pulse") {
      throw new Error("spawnIntent dry run failed");
    }

    const row = await insertSimulatorSession(
      DEFAULT_FIXTURE,
      JSON.parse(JSON.stringify(bundle)),
    );

    const pub = new Redis(REDIS_URL);
    const spawnPromise = waitForSpawnLog(30_000);
    const result = await replayStep(pub, bundle, 0, { goals: {} }, { untilGoal: true });
    pub.disconnect();

    const spawned = await spawnPromise;
    if (!spawned) {
      throw new Error("orchestrator did not log would_spawn_pulse within 30s");
    }

    await updateSimulatorCursor(row.id, result.cursor);

    console.log("verify:d7 ok");
    console.log({
      sessionId: row.id,
      fixtureId: DEFAULT_FIXTURE,
      events: bundle.events.length,
      goalCursor: goalAt,
      emitted: result.emitted,
      goalQuestion: evalResult.goalPulse.suggestion.question,
      orchestratorSpawn: true,
    });
  } finally {
    await stop();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
