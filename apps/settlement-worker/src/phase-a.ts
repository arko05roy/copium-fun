import {
  getProofBundle,
  getPulse,
  insertProofBundle,
  listPulsesReadyToSettle,
  loadEnv as loadDbEnv,
  markPulseSettled,
  updatePositionResults,
  type PulseRow,
} from "@copium/db";
import { validateScore } from "@copium/settlement";
import type { ScoreUpdate } from "@copium/txline/detect";
import { loadEnv, startGuestSession } from "@copium/txline";

loadEnv();
loadDbEnv();

export type PhaseAResult = {
  pulseId: string;
  winningSide: "yes" | "no";
  settlementRootHex: string;
  positionsUpdated: number;
  validateMethod: string;
};

export async function runPhaseAForPulse(
  pulseId: string,
  opts?: { scoresTimeline?: ScoreUpdate[] },
): Promise<PhaseAResult> {
  const existing = await getProofBundle(pulseId);
  if (existing) {
    const truth = existing.truth_json as { winningSide?: "yes" | "no" } | null;
    return {
      pulseId,
      winningSide: truth?.winningSide ?? "no",
      settlementRootHex:
        (existing.settlement_json as { settlementRootHex?: string } | null)
          ?.settlementRootHex ?? "",
      positionsUpdated: 0,
      validateMethod: "cached",
    };
  }

  const pulse = await getPulse(pulseId);
  return settlePulseRow(pulse, opts);
}

export async function runPhaseAPoll(
  opts?: { scoresTimeline?: ScoreUpdate[]; limit?: number },
): Promise<PhaseAResult[]> {
  const ready = await listPulsesReadyToSettle(opts?.limit ?? 10);
  const out: PhaseAResult[] = [];
  for (const pulse of ready) {
    out.push(await settlePulseRow(pulse, opts));
  }
  return out;
}

async function settlePulseRow(
  pulse: PulseRow,
  opts?: { scoresTimeline?: ScoreUpdate[] },
): Promise<PhaseAResult> {
  if (pulse.status !== "open") {
    throw new Error(`pulse ${pulse.id} status ${pulse.status} — expected open`);
  }
  if (new Date(pulse.closes_at).getTime() > Date.now()) {
    throw new Error(`pulse ${pulse.id} window not closed`);
  }
  if (!pulse.fixture_id) {
    throw new Error(`pulse ${pulse.id} missing fixture_id`);
  }

  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) throw new Error("TXLINE_API_TOKEN missing");

  const pulseType = pulse.pulse_type as "next_goal" | "next_score" | "over_under_ht";
  if (
    pulseType !== "next_goal" &&
    pulseType !== "next_score" &&
    pulseType !== "over_under_ht"
  ) {
    throw new Error(`unsupported pulse_type ${pulse.pulse_type}`);
  }

  const { jwt, apiOrigin } = await startGuestSession();
  const bundle = await validateScore({
    pulseId: pulse.id,
    pulseType,
    fixtureId: pulse.fixture_id,
    opensAt: new Date(pulse.opens_at),
    closesAt: new Date(pulse.closes_at),
    apiOrigin,
    jwt,
    apiToken,
    scoresTimeline: opts?.scoresTimeline,
  });

  const truthJson = JSON.parse(JSON.stringify(bundle.truth));
  const settlementJson = {
    settlementRoot: bundle.settlementRoot,
    settlementRootHex: bundle.settlementRootHex,
    winningSide: bundle.truth.winningSide,
    validateMethod: bundle.truth.validateResult.method,
    dailyScoresPda: bundle.truth.validateResult.dailyScoresPda,
  };
  const bundleJson = {
    pulseId: pulse.id,
    fixtureId: pulse.fixture_id,
    pulseType,
    oddsMessageId: pulse.odds_message_id,
    oddsProof: pulse.odds_proof,
    truth: truthJson,
    settlement: settlementJson,
  };

  await insertProofBundle({
    pulse_id: pulse.id,
    truth_json: truthJson,
    settlement_json: settlementJson,
    bundle_json: bundleJson,
  });

  await markPulseSettled(
    pulse.id,
    bundle.truth.winningSide,
    bundle.settlementRootHex,
  );

  const positionsUpdated = await updatePositionResults(
    pulse.id,
    bundle.truth.winningSide,
  );

  if (pulse.fixture_id) {
    const { scoreRoomDuelsForPulse } = await import("./score-duel.js");
    await scoreRoomDuelsForPulse(pulse, bundle.truth.winningSide);
  }

  const { mintReceiptsForPulse } = await import("./mint-receipt.js");
  await mintReceiptsForPulse(pulse, bundle.truth.winningSide);

  return {
    pulseId: pulse.id,
    winningSide: bundle.truth.winningSide,
    settlementRootHex: bundle.settlementRootHex,
    positionsUpdated,
    validateMethod: bundle.truth.validateResult.method,
  };
}
