import { getProofBundle, listRecentPulses, loadEnv } from "@copium/db";

loadEnv();

type BundleJson = {
  pulseId?: string;
  truth?: unknown;
  settlement?: unknown;
};

async function findSettledPulseWithProof() {
  const pulses = await listRecentPulses(50);
  for (const pulse of pulses) {
    if (pulse.status !== "settled") continue;
    const proof = await getProofBundle(pulse.id);
    if (proof?.bundle_json && proof.truth_json && proof.settlement_json) {
      return { pulse, proof };
    }
  }
  return null;
}

async function checkApi(pulseId: string, baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/proof/${pulseId}`);
  const json = (await res.json()) as {
    ok?: boolean;
    proof?: { bundle_json?: BundleJson };
    error?: string;
  };
  if (!res.ok || !json.ok || !json.proof?.bundle_json) {
    throw new Error(json.error ?? `API ${res.status}`);
  }
  const bundle = json.proof.bundle_json;
  if (!bundle.truth || !bundle.settlement) {
    throw new Error("API bundle_json missing truth or settlement");
  }
}

async function main() {
  const row = await findSettledPulseWithProof();
  if (!row) {
    throw new Error("no settled pulse with proof bundle — run pnpm verify:d11 first");
  }

  const { pulse, proof } = row;
  const bundle = proof.bundle_json as BundleJson;
  if (!bundle.truth || !bundle.settlement) {
    throw new Error("bundle_json incomplete in DB");
  }

  const baseUrl = process.env.VERIFY_WEB_URL ?? "http://127.0.0.1:3000";
  try {
    await checkApi(pulse.id, baseUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED")) {
      console.log("verify:d13 — web not running, DB checks only");
    } else {
      throw err;
    }
  }

  const truth = proof.truth_json as {
    validateResult?: { valid?: boolean; method?: string };
    winningSide?: string;
  };

  console.log("verify:d13 ok");
  console.log({
    pulseId: pulse.id,
    question: pulse.question.slice(0, 60),
    winningSide: pulse.winning_side ?? truth.winningSide,
    settlementRoot: pulse.settlement_root,
    validateValid: truth.validateResult?.valid,
    validateMethod: truth.validateResult?.method,
    bundleKeys: Object.keys(bundle),
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
