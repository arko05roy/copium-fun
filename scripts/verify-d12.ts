import {
  getProofBundle,
  getPulse,
  listPulsesReadyForPhaseB,
  loadEnv,
} from "@copium/db";
import { POOL_STATUS, fetchPoolStatus } from "@copium/pulses-client";
import { runPhaseBForPulse } from "../apps/settlement-worker/src/phase-b.ts";

loadEnv();

async function main() {
  const ready = await listPulsesReadyForPhaseB(5);
  if (!ready.length) {
    throw new Error("no pulse ready for Phase B — run pnpm verify:d11 first");
  }

  const pulse = ready[0]!;
  const result = await runPhaseBForPulse(pulse.id);

  const proof = await getProofBundle(pulse.id);
  if (!proof?.verify_tx) {
    throw new Error("proof_bundles.verify_tx missing after Phase B");
  }

  const settled = await getPulse(pulse.id);
  if (!settled.onchain_pool_pubkey) {
    throw new Error("pulse missing onchain_pool_pubkey");
  }

  const onchain = await fetchPoolStatus(settled.onchain_pool_pubkey);
  if (onchain.status !== POOL_STATUS.settled) {
    throw new Error(`on-chain pool status ${onchain.status} — expected ${POOL_STATUS.settled}`);
  }

  console.log("verify:d12 ok");
  console.log({
    pulseId: pulse.id,
    poolPubkey: settled.onchain_pool_pubkey,
    verifyTx: proof.verify_tx,
    steps: result.steps,
    winningSide: settled.winning_side,
    onchainWinningSide: onchain.winningSide,
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
