import { attachPoolToPulse, getPulse, type PulseRow } from "@copium/db";
import { PULSE_WINDOW_SEC } from "@copium/pulse-engine/calibration";
import { PULSE_CATALOG, type PulseType } from "@copium/pulse-engine/pulse-catalog";
import { createPulseOnChain } from "@copium/pulses-client";
import { fetchOddsValidation, toBytes32 } from "@copium/settlement";
import { loadServiceKeypair, startGuestSession } from "@copium/txline";

function toUnixSec(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

function oddsTsFromProof(proof: unknown): number | null {
  const ts = (proof as { odds?: { Ts?: number } })?.odds?.Ts;
  return typeof ts === "number" ? ts : null;
}

/** Attach on-chain pool when DB row was inserted but spawn never finished. */
export async function ensurePulsePool(pulseId: string): Promise<PulseRow> {
  const pulse = await getPulse(pulseId);
  if (pulse.onchain_pool_pubkey && pulse.odds_message_id) return pulse;

  if (!pulse.odds_message_id) {
    throw new Error("pulse missing odds snapshot");
  }

  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) throw new Error("TXLINE_API_TOKEN missing");

  const oddsTs = oddsTsFromProof(pulse.odds_proof);
  if (oddsTs == null) throw new Error("pulse missing odds ts");

  const { jwt, apiOrigin } = await startGuestSession();
  const validated = await fetchOddsValidation(
    apiOrigin,
    jwt,
    apiToken,
    pulse.odds_message_id,
    oddsTs,
  );
  const oddsLockRoot = toBytes32(validated.summary.oddsSubTreeRoot);

  const catalog = PULSE_CATALOG[pulse.pulse_type as PulseType];
  if (!catalog) throw new Error(`unknown pulse type ${pulse.pulse_type}`);
  if (!pulse.fixture_id) throw new Error("pulse missing fixture_id");

  const opensAtSec = toUnixSec(pulse.opens_at);
  let closesAtSec = toUnixSec(pulse.closes_at);
  if (closesAtSec <= opensAtSec) {
    closesAtSec = opensAtSec + PULSE_WINDOW_SEC;
  }

  const onchain = await createPulseOnChain({
    authority: loadServiceKeypair(),
    fixtureId: BigInt(pulse.fixture_id),
    pulseTypeCode: catalog.pulseTypeCode,
    opensAt: BigInt(opensAtSec),
    closesAt: BigInt(closesAtSec),
    oddsLockRoot,
  });

  return attachPoolToPulse(pulseId, onchain.pool.toBase58());
}
