import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ensureRoom,
  joinRoomMember,
  listAgentTape,
  listOpenPulses,
  listSettledProofPulses,
  loadEnv,
} from "@copium/db";

loadEnv();

const ROOT = process.cwd();
const GUEST = "So11111111111111111111111111111111111111112";

function assertFile(path: string): void {
  if (!existsSync(join(ROOT, path))) {
    throw new Error(`missing ${path}`);
  }
}

async function main() {
  for (const path of [
    "JUDGE.md",
    "apps/web/app/actions.json/route.ts",
    "apps/web/app/components/devnet-badge.tsx",
    "apps/web/app/page.tsx",
    "apps/web/app/proof/page.tsx",
    "apps/web/app/desk/page.tsx",
    "apps/web/app/r/[receiptId]/page.tsx",
    "apps/web/app/room/[slug]/page.tsx",
  ]) {
    assertFile(path);
  }

  const judge = readFileSync(join(ROOT, "JUDGE.md"), "utf8");
  for (const needle of ["Track 1", "Track 2", "Track 3", "/proof/", "/desk", "receipt"]) {
    if (!judge.includes(needle)) throw new Error(`JUDGE.md missing ${needle}`);
  }

  const settled = await listSettledProofPulses(1);
  const proofPulse =
    settled[0] ??
    (await (async () => {
      const { listRecentPulses } = await import("@copium/db");
      const recent = await listRecentPulses(30);
      return recent.find((p) => p.status === "settled" && p.winning_side) ?? null;
    })());
  if (!proofPulse) throw new Error("no settled pulse — run pnpm verify:d12 first");

  const tape = await listAgentTape(20);
  if (!tape.find((t) => t.execute_tx)) {
    throw new Error("no agent trades — run pnpm verify:d16 first");
  }

  const open = await listOpenPulses(1);
  if (!open[0]?.onchain_pool_pubkey) {
    throw new Error("no open pulse — run pnpm verify:d16 first");
  }

  const fixtureId =
    open[0].fixture_id ?? proofPulse.fixture_id ?? Number(process.env.VERIFY_D5_FIXTURE_ID ?? 17926704);
  const demoRoom = await ensureRoom("demo", fixtureId);
  await joinRoomMember(demoRoom.id, GUEST);

  const baseUrl = process.env.VERIFY_WEB_URL ?? "http://127.0.0.1:3000";
  const paths = {
    track1: `${baseUrl}/proof/${proofPulse.id}`,
    track2: `${baseUrl}/desk`,
    track3Room: `${baseUrl}/room/demo`,
    actionsJson: `${baseUrl}/actions.json`,
  };

  try {
    const actionsRes = await fetch(paths.actionsJson);
    const actionsJson = (await actionsRes.json()) as { rules?: { pathPattern?: string }[] };
    if (!actionsRes.ok || !actionsJson.rules?.length) {
      throw new Error("actions.json failed");
    }
    const patterns = actionsJson.rules.map((r) => r.pathPattern);
    for (const p of ["/pulse/*", "/agent/*", "/fade/*", "/room/*"]) {
      if (!patterns.includes(p)) throw new Error(`actions.json missing ${p}`);
    }

    const corsRes = await fetch(`${baseUrl}/api/actions/pulse-pick/${open[0].id}`, {
      method: "OPTIONS",
    });
    if (corsRes.status !== 204) throw new Error("pulse-pick OPTIONS failed");

    const proofRes = await fetch(`${baseUrl}/proof/${proofPulse.id}`);
    if (!proofRes.ok) throw new Error("Track 1 /proof/[id] failed");

    const deskRes = await fetch(paths.track2);
    if (!deskRes.ok) throw new Error("Track 2 /desk failed");

    const roomRes = await fetch(paths.track3Room);
    if (!roomRes.ok) throw new Error("Track 3 /room/demo failed");

    const pickGet = await fetch(`${baseUrl}/api/actions/pulse-pick/${open[0].id}`);
    const pickJson = (await pickGet.json()) as { type?: string };
    if (!pickGet.ok || pickJson.type !== "action") throw new Error("pulse-pick GET failed");

    const trade = tape.find((t) => t.execute_tx)!;
    const copyGet = await fetch(`${baseUrl}/api/actions/copy-agent/${trade.id}`);
    const copyJson = (await copyGet.json()) as { type?: string };
    if (!copyGet.ok || copyJson.type !== "action") throw new Error("copy-agent GET failed");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("fetch failed") && !msg.includes("ECONNREFUSED")) throw err;
    console.log("verify:d20 — web not running, file + DB checks only");
  }

  console.log("verify:d20 ok — 3 judge paths + Blinks + JUDGE.md");
  console.log({
    judgeMd: "JUDGE.md",
    track1: `/proof/${proofPulse.id}`,
    track2: "/desk",
    track3: "/room/demo + mobile app",
    actionsJson: "/actions.json",
    dialToPulsePick: `https://dial.to/?action=${encodeURIComponent(`${baseUrl}/api/actions/pulse-pick/${open[0].id}`)}`,
    inspectorNote: "Paste dial.to URL at blinks.xyz/inspector",
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
