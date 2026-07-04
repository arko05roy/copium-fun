import { getPulse, insertSimulatorSession, loadEnv as loadDbEnv, updateSimulatorCursor } from "@copium/db";
import { spawnIntent } from "@copium/pulse-engine/spawn-handler";
import { evaluateBundle } from "@copium/pulse-engine/bundle-eval";
import { pulsePoolPda, COPIUM_PULSES_PROGRAM_ID, accountExists } from "@copium/pulses-client";
import { PULSE_CATALOG } from "@copium/pulse-engine/pulse-catalog";
import {
  buildSimBundle,
  goalCursor,
  loadEnv,
  loadServiceKeypair,
  replayStep,
  startGuestSession,
  SPAWN_LOG_KEY,
} from "@copium/txline";
import { startListener } from "../apps/pulse-orchestrator/src/listen.ts";
import { toUnixSec } from "../apps/pulse-orchestrator/src/spawn.ts";
import { Redis } from "ioredis";

loadEnv();
loadDbEnv();

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const DEFAULT_FIXTURE = Number(process.env.VERIFY_D5_FIXTURE_ID ?? 17926704);

type SpawnLogEntry = {
  action?: string;
  pulseId?: string;
  poolPubkey?: string;
  signature?: string;
};

async function waitForSpawnedPulse(timeoutMs: number): Promise<SpawnLogEntry> {
  const redis = new Redis(REDIS_URL);
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const rows = await redis.lrange(SPAWN_LOG_KEY, 0, 20);
    for (const row of rows) {
      try {
        const parsed = JSON.parse(row) as SpawnLogEntry;
        if (parsed.action === "spawned_pulse" && parsed.pulseId && parsed.poolPubkey) {
          redis.disconnect();
          return parsed;
        }
      } catch {
        // skip
      }
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  redis.disconnect();
  throw new Error("orchestrator did not spawn pulse within timeout");
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
    const spawnPromise = waitForSpawnedPulse(120_000);
    const result = await replayStep(pub, bundle, 0, { goals: {} }, { untilGoal: true });
    pub.disconnect();

    const spawned = await spawnPromise;
    await updateSimulatorCursor(row.id, result.cursor);

    const pulse = await getPulse(spawned.pulseId!);
    if (!pulse.onchain_pool_pubkey) {
      throw new Error("pulse row missing onchain_pool_pubkey");
    }
    if (pulse.onchain_pool_pubkey !== spawned.poolPubkey) {
      throw new Error("DB pool pubkey mismatch spawn log");
    }
    if (!pulse.odds_message_id || !pulse.odds_proof) {
      throw new Error("pulse row missing locked odds proof");
    }

    const authority = loadServiceKeypair();
    const opensAtSec = toUnixSec(evalResult.goalPulse.suggestion.opensAt);
    const expectedPool = pulsePoolPda(
      COPIUM_PULSES_PROGRAM_ID,
      authority.publicKey,
      BigInt(DEFAULT_FIXTURE),
      PULSE_CATALOG.next_goal.pulseTypeCode,
      BigInt(opensAtSec),
    );
    if (expectedPool.toBase58() !== pulse.onchain_pool_pubkey) {
      throw new Error("pool PDA mismatch");
    }

    const onchain = await accountExists(pulse.onchain_pool_pubkey);
    if (!onchain) {
      throw new Error("on-chain pulse pool account not found on devnet");
    }

    console.log("verify:d10 ok");
    console.log({
      sessionId: row.id,
      fixtureId: DEFAULT_FIXTURE,
      pulseId: pulse.id,
      poolPubkey: pulse.onchain_pool_pubkey,
      signature: spawned.signature,
      oddsMessageId: pulse.odds_message_id,
      question: pulse.question,
      goalCursor: goalAt,
      emitted: result.emitted,
    });
  } finally {
    await stop();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
