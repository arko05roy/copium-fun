import { attachPoolToPulse, insertPulse, loadEnv as loadDbEnv } from "@copium/db";
import { PULSE_CATALOG } from "@copium/pulse-engine/pulse-catalog";
import type { SpawnIntent } from "@copium/pulse-engine/spawn-handler";
import type { FixtureSpawnCtx } from "@copium/pulse-engine/spawn-handler";
import { createPulseOnChain } from "@copium/pulses-client";
import { lockOddsSnapshot } from "@copium/settlement";
import {
  loadEnv,
  loadServiceKeypair,
  startGuestSession,
} from "@copium/txline";
import type { Redis } from "ioredis";

loadEnv();
loadDbEnv();

/** TxLINE timestamps are ms; copium-pulses opens_at is unix sec. */
export function toUnixSec(ts: number): number {
  return ts > 1e12 ? Math.floor(ts / 1000) : Math.floor(ts);
}

function dedupKey(fixtureId: number, pulseType: string, opensAtSec: number): string {
  return `spawned:${fixtureId}:${pulseType}:${opensAtSec}`;
}

export async function executeSpawnPulse(
  redis: Redis,
  intent: Extract<SpawnIntent, { action: "would_spawn_pulse" }>,
  ctx: FixtureSpawnCtx,
): Promise<SpawnIntent> {
  const at = new Date().toISOString();
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) {
    return {
      action: "skip",
      fixtureId: intent.fixtureId,
      event: intent.event,
      reason: "TXLINE_API_TOKEN missing",
      at,
    };
  }

  const messageId = ctx.oddsMessageId;
  const oddsTs = ctx.oddsTs;
  if (!messageId || oddsTs === undefined) {
    return {
      action: "skip",
      fixtureId: intent.fixtureId,
      event: intent.event,
      reason: "no odds messageId/ts on fixture — wait for odds stream",
      at,
    };
  }

  const opensAtSec = toUnixSec(intent.pulse.opensAt);
  const closesAtSec = toUnixSec(intent.pulse.closesAt);
  const key = dedupKey(intent.fixtureId, intent.pulse.pulseType, opensAtSec);
  const claimed = await redis.set(key, "1", "EX", 86_400, "NX");
  if (claimed === null) {
    return {
      action: "skip",
      fixtureId: intent.fixtureId,
      event: intent.event,
      reason: `duplicate spawn ${key}`,
      at,
    };
  }

  try {
    const { jwt, apiOrigin } = await startGuestSession();
    const locked = await lockOddsSnapshot(
      apiOrigin,
      jwt,
      apiToken,
      messageId,
      oddsTs,
      intent.pulse.linePct ?? ctx.linePct,
    );

    const catalog = PULSE_CATALOG[intent.pulse.pulseType];
    const row = await insertPulse({
      fixture_id: intent.fixtureId,
      pulse_type: intent.pulse.pulseType,
      question: intent.pulse.question,
      opens_at: new Date(opensAtSec * 1000).toISOString(),
      closes_at: new Date(closesAtSec * 1000).toISOString(),
      line_pct: locked.linePct ?? null,
      odds_message_id: locked.messageId,
      odds_proof: JSON.parse(JSON.stringify(locked.proof)),
    });

    const authority = loadServiceKeypair();
    const onchain = await createPulseOnChain({
      authority,
      fixtureId: BigInt(intent.fixtureId),
      pulseTypeCode: catalog.pulseTypeCode,
      opensAt: BigInt(opensAtSec),
      closesAt: BigInt(closesAtSec),
      oddsLockRoot: locked.oddsLockRoot,
    });

    await attachPoolToPulse(row.id, onchain.pool.toBase58());

    return {
      action: "spawned_pulse",
      fixtureId: intent.fixtureId,
      pulseId: row.id,
      poolPubkey: onchain.pool.toBase58(),
      signature: onchain.signature,
      event: intent.event,
      pulse: intent.pulse,
      at,
    };
  } catch (err) {
    await redis.del(key);
    return {
      action: "skip",
      fixtureId: intent.fixtureId,
      event: intent.event,
      reason: err instanceof Error ? err.message : String(err),
      at,
    };
  }
}
