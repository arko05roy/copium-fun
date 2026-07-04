import {
  getProofBundle,
  getPulse,
  insertSimulatorSession,
  loadEnv as loadDbEnv,
  updateSimulatorCursor,
} from "@copium/db";
import { spawnIntent } from "@copium/pulse-engine/spawn-handler";
import { evaluateBundle } from "@copium/pulse-engine/bundle-eval";
import { pulsePoolPda, COPIUM_PULSES_PROGRAM_ID, accountExists } from "@copium/pulses-client";
import { PULSE_CATALOG } from "@copium/pulse-engine/pulse-catalog";
import {
  buildSimBundle,
  detectStateAtCursor,
  goalCursor,
  loadEnv,
  loadServiceKeypair,
  replayStep,
  startGuestSession,
  SPAWN_LOG_KEY,
} from "@copium/txline";
import type { SimBundle } from "@copium/txline";
import { startListener } from "../apps/pulse-orchestrator/src/listen.ts";
import { toUnixSec } from "../apps/pulse-orchestrator/src/spawn.ts";
import { runPhaseAForPulse } from "../apps/settlement-worker/src/phase-a.ts";
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

function closesAtMs(pulse: { closes_at: string }): number {
  return new Date(pulse.closes_at).getTime();
}

/** Advance sim replay through pulse window end — real bundle timestamps only. */
async function replayThroughClosesAt(
  redis: Redis,
  bundle: SimBundle,
  cursor: number,
  closesMs: number,
): Promise<number> {
  let state = detectStateAtCursor(bundle, cursor);
  let index = cursor;

  while (index < bundle.events.length) {
    const event = bundle.events[index]!;
    if (event.ts >= closesMs) break;
    const step = await replayStep(redis, bundle, index, state, { maxEvents: 1 });
    state = detectStateAtCursor(bundle, step.cursor);
    index = step.cursor;
  }

  return index;
}

async function waitForOrchestratorReady(timeoutMs = 10_000): Promise<void> {
  const port = Number(process.env.PULSE_ORCHESTRATOR_PORT ?? 9091);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("pulse-orchestrator health not ready");
}

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

  const tail = await redis.lrange(SPAWN_LOG_KEY, 0, 5);
  redis.disconnect();
  throw new Error(
    `orchestrator did not spawn pulse within timeout — spawn_log: ${tail.join(" | ") || "(empty)"}`,
  );
}

async function main(): Promise<void> {
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) throw new Error("TXLINE_API_TOKEN missing");

  const redis = new Redis(REDIS_URL);
  await redis.ping();
  await redis.del(SPAWN_LOG_KEY);
  const dedupKeys = await redis.keys(`spawned:${DEFAULT_FIXTURE}:*`);
  if (dedupKeys.length > 0) await redis.del(...dedupKeys);
  redis.disconnect();

  const { stop: stopOrchestrator } = await startListener();
  await waitForOrchestratorReady();

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
    const spawned = await spawnPromise;

    const pulse = await getPulse(spawned.pulseId!);
    const endCursor = await replayThroughClosesAt(
      pub,
      bundle,
      result.cursor,
      closesAtMs(pulse),
    );
    pub.disconnect();
    await updateSimulatorCursor(row.id, endCursor);

    if (!pulse.onchain_pool_pubkey) {
      throw new Error("pulse row missing onchain_pool_pubkey");
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

    if (closesAtMs(pulse) > Date.now()) {
      throw new Error("historical pulse closes_at still in future — pick older fixture");
    }

    const phaseA = await runPhaseAForPulse(pulse.id);
    const proof = await getProofBundle(pulse.id);
    if (!proof?.truth_json || !proof.settlement_json || !proof.bundle_json) {
      throw new Error("proof_bundles row incomplete after Phase A");
    }

    const settled = await getPulse(pulse.id);
    if (settled.status !== "settled") {
      throw new Error(`pulse status ${settled.status} — expected settled`);
    }
    if (!settled.winning_side) {
      throw new Error("pulse missing winning_side");
    }
    if (!settled.settlement_root) {
      throw new Error("pulse missing settlement_root");
    }

    const truth = proof.truth_json as {
      winningSide?: string;
      validateResult?: { valid?: boolean; method?: string };
    };

    console.log("verify:d11 ok");
    console.log({
      sessionId: row.id,
      fixtureId: DEFAULT_FIXTURE,
      pulseId: pulse.id,
      poolPubkey: pulse.onchain_pool_pubkey,
      winningSide: phaseA.winningSide,
      settlementRootHex: phaseA.settlementRootHex,
      validateMethod: phaseA.validateMethod,
      validateStatValid: truth.validateResult?.valid,
      goalCursor: goalAt,
      simCursor: endCursor,
    });
  } finally {
    await stopOrchestrator();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
