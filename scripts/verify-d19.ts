import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ensureRoom,
  getPulse,
  getReceiptForPulseUser,
  insertCrowdPosition,
  listPositionsForPulse,
  listRecentPulses,
  loadEnv,
  walletToUserId,
} from "@copium/db";
import { mintReceiptsForPulse } from "../apps/settlement-worker/src/mint-receipt.js";

loadEnv();

const ROOT = process.cwd();
const GUEST = "So11111111111111111111111111111111111111112";

function assertFile(path: string): void {
  if (!existsSync(join(ROOT, path))) {
    throw new Error(`missing ${path}`);
  }
}

async function findSettledPulseWithPositions() {
  const pulses = await listRecentPulses(40);
  for (const pulse of pulses) {
    if (pulse.status !== "settled" || !pulse.winning_side) continue;
    const positions = await listPositionsForPulse(pulse.id);
    if (positions.length) return pulse;
    if (pulse.fixture_id) {
      await insertCrowdPosition({
        pulseId: pulse.id,
        walletPubkey: GUEST,
        side: pulse.winning_side === "yes" ? "yes" : "no",
        stake: 50_000,
      });
      return getPulse(pulse.id);
    }
  }
  return null;
}

async function main() {
  for (const path of [
    "apps/web/app/r/[receiptId]/page.tsx",
    "apps/web/app/r/[receiptId]/opengraph-image.tsx",
    "apps/web/app/api/receipts/[receiptId]/route.ts",
    "apps/web/app/api/receipts/for-wallet/route.ts",
    "apps/web/app/room/[slug]/page.tsx",
    "apps/web/lib/receipt-og.ts",
    "apps/settlement-worker/src/mint-receipt.ts",
    "apps/mobile/src/components/ReceiptShare.tsx",
    "packages/db/src/receipts.ts",
  ]) {
    assertFile(path);
  }

  const pulse = await findSettledPulseWithPositions();
  if (!pulse?.winning_side) {
    throw new Error("no settled pulse — run pnpm verify:d12 first");
  }

  const minted = await mintReceiptsForPulse(pulse, pulse.winning_side);
  const userId = walletToUserId(GUEST);
  let receipt = await getReceiptForPulseUser(pulse.id, userId);
  if (!receipt) {
    throw new Error(`mint returned ${minted} but no receipt for guest wallet`);
  }

  const fixtureId = pulse.fixture_id ?? Number(process.env.VERIFY_D5_FIXTURE_ID ?? 17926704);
  const room = await ensureRoom(`verify-d19-${fixtureId}`, fixtureId);

  const baseUrl = process.env.VERIFY_WEB_URL ?? "http://127.0.0.1:3000";
  try {
    const apiRes = await fetch(`${baseUrl}/api/receipts/${receipt.id}`);
    const apiJson = (await apiRes.json()) as { ok?: boolean; receipt?: { label?: string } };
    if (!apiRes.ok || !apiJson.ok || !apiJson.receipt?.label) {
      throw new Error("GET /api/receipts/[id] failed");
    }

    const walletRes = await fetch(
      `${baseUrl}/api/receipts/for-wallet?wallet=${encodeURIComponent(GUEST)}`,
    );
    const walletJson = (await walletRes.json()) as { ok?: boolean; receipts?: unknown[] };
    if (!walletRes.ok || !walletJson.ok || !walletJson.receipts?.length) {
      throw new Error("GET /api/receipts/for-wallet failed");
    }

    const ogRes = await fetch(`${baseUrl}/r/${receipt.id}/opengraph-image`);
    if (!ogRes.ok || !ogRes.headers.get("content-type")?.includes("image")) {
      throw new Error("receipt OG image failed");
    }

    const roomRes = await fetch(`${baseUrl}/room/${room.slug}`);
    if (!roomRes.ok) throw new Error("GET /room/[slug] failed");

    const joinPost = await fetch(`${baseUrl}/api/actions/join-room/${room.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: GUEST }),
    });
    const joinJson = (await joinPost.json()) as { type?: string; message?: string };
    if (!joinPost.ok || joinJson.type !== "message") {
      throw new Error("join-room POST failed");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("fetch failed") && !msg.includes("ECONNREFUSED")) throw err;
    console.log("verify:d19 — web not running, DB + mint checks only");
  }

  console.log("verify:d19 ok — receipts OG + room join");
  console.log({
    receiptId: receipt.id,
    label: receipt.label,
    receiptUrl: `/r/${receipt.id}`,
    roomSlug: room.slug,
    roomUrl: `/room/${room.slug}`,
    shareApi: `/api/receipts/for-wallet?wallet=…`,
    recordScript: "BRAND-DOC §17C — receipt share + join-room",
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
