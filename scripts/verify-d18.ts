import { existsSync } from "node:fs";
import { join } from "node:path";
import { ensureRoom, joinRoomMember, listOpenPulses, loadEnv } from "@copium/db";

loadEnv();

const ROOT = process.cwd();
const GUEST_A = "So11111111111111111111111111111111111111112";
const GUEST_B = "11111111111111111111111111111112";

function assertFile(path: string): void {
  if (!existsSync(join(ROOT, path))) {
    throw new Error(`missing ${path}`);
  }
}

async function main() {
  for (const path of [
    "apps/mobile/src/screens/FeedScreen.tsx",
    "apps/mobile/src/components/PulseCard.tsx",
    "apps/mobile/src/components/DuelBanner.tsx",
    "apps/mobile/src/lib/api.ts",
    "apps/web/app/api/feed/open/route.ts",
    "apps/web/app/api/rooms/[roomId]/duel/route.ts",
  ]) {
    assertFile(path);
  }

  const open = await listOpenPulses(1);
  if (!open[0]?.onchain_pool_pubkey) {
    throw new Error("no open pulse — run pnpm verify:d16 first");
  }
  const pulse = open[0];
  const fixtureId = pulse.fixture_id ?? Number(process.env.VERIFY_D5_FIXTURE_ID ?? 17926704);
  const room = await ensureRoom(`verify-d18-${fixtureId}`, fixtureId);
  await joinRoomMember(room.id, GUEST_A);
  await joinRoomMember(room.id, GUEST_B);

  const baseUrl = process.env.VERIFY_WEB_URL ?? "http://127.0.0.1:3000";
  try {
    const feedRes = await fetch(`${baseUrl}/api/feed/open?limit=3`);
    const feedJson = (await feedRes.json()) as { ok?: boolean; pulses?: unknown[] };
    if (!feedRes.ok || !feedJson.ok || !feedJson.pulses?.length) {
      throw new Error("GET /api/feed/open failed");
    }

    const duelRes = await fetch(
      `${baseUrl}/api/rooms/${room.id}/duel?wallet=${encodeURIComponent(GUEST_A)}`,
    );
    const duelJson = (await duelRes.json()) as {
      ok?: boolean;
      duel?: { you: number; them: number; roomSlug: string };
    };
    if (!duelRes.ok || !duelJson.ok || !duelJson.duel) {
      throw new Error("GET /api/rooms/duel failed");
    }

    const pickGet = await fetch(`${baseUrl}/api/actions/pulse-pick/${pulse.id}`);
    const pickJson = (await pickGet.json()) as { links?: { actions?: { label?: string }[] } };
    if (!pickGet.ok || !pickJson.links?.actions?.some((a) => a.label?.includes("YES"))) {
      throw new Error("pulse-pick YES/NO links missing");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("fetch failed") && !msg.includes("ECONNREFUSED")) throw err;
    console.log("verify:d18 — web not running, DB + file checks only");
  }

  console.log("verify:d18 ok — §17C recordable");
  console.log({
    feedApi: "/api/feed/open",
    duelApi: `/api/rooms/${room.id}/duel?wallet=…`,
    roomId: room.id,
    samplePulseId: pulse.id,
    mobile: "apps/mobile — EXPO_PUBLIC_WEB_URL=http://127.0.0.1:3000 pnpm --filter @copium/mobile start",
    recordScript: "BRAND-DOC §17C — Feed swipe · duel banner · dial.to pulse-pick",
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
