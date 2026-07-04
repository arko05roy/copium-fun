import {
  getProofBundle,
  getPulse,
  listPulsesReadyForPhaseB,
  loadEnv as loadDbEnv,
  updateProofVerifyTx,
} from "@copium/db";
import { crankPulseOnChain, settlementRootFromHex } from "@copium/settlement";
import { loadEnv, loadServiceKeypair } from "@copium/txline";
import { POOL_STATUS, fetchPoolStatus } from "@copium/pulses-client";

loadEnv();
loadDbEnv();

export type PhaseBResult = {
  pulseId: string;
  signature: string;
  steps: string[];
  poolStatus: number;
};

function settlementRootFromProof(
  settlementJson: Record<string, unknown>,
  pulseRoot: string | null,
): number[] {
  const root = settlementJson.settlementRoot;
  if (Array.isArray(root) && root.length === 32) {
    return root.map((b) => Number(b));
  }
  const hex =
    (typeof settlementJson.settlementRootHex === "string"
      ? settlementJson.settlementRootHex
      : null) ?? pulseRoot;
  if (!hex) throw new Error("missing settlement root");
  return settlementRootFromHex(hex);
}

export async function runPhaseBForPulse(pulseId: string): Promise<PhaseBResult> {
  const pulse = await getPulse(pulseId);
  const proof = await getProofBundle(pulseId);

  if (!pulse.onchain_pool_pubkey) {
    throw new Error(`pulse ${pulseId} missing onchain_pool_pubkey`);
  }
  if (!pulse.winning_side) {
    throw new Error(`pulse ${pulseId} missing winning_side`);
  }
  if (!proof?.settlement_json) {
    throw new Error(`pulse ${pulseId} missing proof settlement_json`);
  }

  const pool = pulse.onchain_pool_pubkey;
  const before = await fetchPoolStatus(pool);

  if (proof.verify_tx && before.status === POOL_STATUS.settled) {
    return {
      pulseId,
      signature: proof.verify_tx,
      steps: ["cached"],
      poolStatus: before.status,
    };
  }

  const settlementRoot = settlementRootFromProof(
    proof.settlement_json as Record<string, unknown>,
    pulse.settlement_root,
  );

  const crank = loadServiceKeypair();
  const result = await crankPulseOnChain({
    crank,
    pool,
    settlementRoot,
    winningSide: pulse.winning_side as "yes" | "no",
  });

  const after = await fetchPoolStatus(pool);
  if (after.status !== POOL_STATUS.settled) {
    throw new Error(`pool ${pool} status ${after.status} — expected settled`);
  }

  const signature =
    result.signature === "already_settled" || result.signature === "noop"
      ? (proof.verify_tx ?? result.signature)
      : result.signature;

  if (
    signature &&
    signature !== "already_settled" &&
    signature !== "noop" &&
    signature !== proof.verify_tx
  ) {
    await updateProofVerifyTx(pulseId, signature);
  }

  return {
    pulseId,
    signature,
    steps: result.steps,
    poolStatus: after.status,
  };
}

export async function runPhaseBPoll(
  opts?: { limit?: number },
): Promise<PhaseBResult[]> {
  const ready = await listPulsesReadyForPhaseB(opts?.limit ?? 10);
  const out: PhaseBResult[] = [];
  for (const pulse of ready) {
    out.push(await runPhaseBForPulse(pulse.id));
  }
  return out;
}
