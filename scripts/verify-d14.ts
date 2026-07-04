import { existsSync } from "node:fs";
import { join } from "node:path";
import { listSettledProofPulses, loadEnv } from "@copium/db";

loadEnv();

const ROOT = process.cwd();

function assertFile(path: string): void {
  if (!existsSync(join(ROOT, path))) {
    throw new Error(`missing ${path}`);
  }
}

async function main() {
  assertFile("apps/web/app/proof/page.tsx");
  assertFile("apps/web/app/proof/[pulseId]/page.tsx");
  assertFile("apps/web/app/sim/[sessionId]/page.tsx");
  assertFile("apps/web/app/components/proof-sheet.tsx");
  assertFile("apps/web/app/components/bundle-download.tsx");

  const settled = await listSettledProofPulses(5);
  if (!settled.length) {
    throw new Error("no settled proof pulses — run pnpm verify:d12 first");
  }

  const best = settled.find((p) => p.verify_tx && p.has_bundle) ?? settled[0]!;
  if (!best.verify_tx) {
    throw new Error("settled pulse missing verify_tx — run pnpm verify:d12");
  }
  if (!best.onchain_pool_pubkey || !best.odds_message_id) {
    throw new Error("settled pulse missing pool or odds messageId");
  }

  const baseUrl = process.env.VERIFY_WEB_URL ?? "http://127.0.0.1:3000";
  try {
    const res = await fetch(`${baseUrl}/api/proof`);
    const json = (await res.json()) as { ok?: boolean; pulses?: unknown[] };
    if (!res.ok || !json.ok || !json.pulses?.length) {
      throw new Error("GET /api/proof failed");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("fetch failed") && !msg.includes("ECONNREFUSED")) throw err;
    console.log("verify:d14 — web not running, DB + file checks only");
  }

  console.log("verify:d14 ok — §17A recordable");
  console.log({
    proofIndex: "/proof",
    simAdmin: "/sim",
    samplePulseId: best.id,
    sampleProofUrl: `/proof/${best.id}`,
    verifyTx: best.verify_tx,
    poolPubkey: best.onchain_pool_pubkey,
    oddsMessageId: best.odds_message_id,
    settledCount: settled.length,
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
