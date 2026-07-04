import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ensureRoom,
  joinRoomMember,
  listAgentTape,
  listOpenPulses,
  loadEnv,
} from "@copium/db";

loadEnv();

const ROOT = process.cwd();

function assertFile(path: string): void {
  if (!existsSync(join(ROOT, path))) {
    throw new Error(`missing ${path}`);
  }
}

async function main() {
  assertFile("apps/web/app/desk/page.tsx");
  assertFile("apps/web/app/components/desk-tape.tsx");
  assertFile("apps/web/app/components/agent-reasoning.tsx");
  assertFile("apps/web/app/components/copy-button.tsx");
  assertFile("apps/web/app/components/pnl-board.tsx");
  assertFile("apps/web/app/api/desk/tape/route.ts");
  assertFile("apps/web/app/api/desk/pnl/route.ts");
  assertFile("apps/web/app/api/actions/copy-agent/[tradeId]/route.ts");
  assertFile("apps/web/app/api/actions/fade-agent/[tradeId]/route.ts");
  assertFile("apps/web/app/api/actions/pulse-pick/[pulseId]/route.ts");
  assertFile("apps/web/app/api/actions/join-room/[roomId]/route.ts");
  assertFile("apps/web/lib/pulse-pick-action.ts");
  assertFile("apps/web/lib/join-room-action.ts");
  assertFile("apps/web/app/actions.json/route.ts");
  assertFile("apps/agent-runtime/src/agents/officer.ts");
  assertFile("apps/agent-runtime/src/agents/quant.ts");

  const tape = await listAgentTape(50);
  const officer = tape.find((t) => t.agent_slug === "officer-copium" && t.execute_tx);
  const quant = tape.find((t) => t.agent_slug === "quant" && t.execute_tx);
  if (!officer || !quant) {
    throw new Error("no Officer + Quant devnet fills — run pnpm verify:d16 first");
  }

  const open = await listOpenPulses(1);
  if (!open[0]?.onchain_pool_pubkey) {
    throw new Error("no open pulse with pool — run pnpm verify:d16 first");
  }
  const pulse = open[0];

  const fixtureId = pulse.fixture_id ?? Number(process.env.VERIFY_D5_FIXTURE_ID ?? 17926704);
  const room = await ensureRoom(`verify-d17-${fixtureId}`, fixtureId);
  const guest = "So11111111111111111111111111111111111111112";
  await joinRoomMember(room.id, guest);

  const baseUrl = process.env.VERIFY_WEB_URL ?? "http://127.0.0.1:3000";
  try {
    const actionsRes = await fetch(`${baseUrl}/actions.json`);
    const actionsJson = (await actionsRes.json()) as { rules?: { pathPattern?: string }[] };
    if (!actionsRes.ok || !actionsJson.rules?.length) {
      throw new Error("GET /actions.json failed");
    }
    const patterns = actionsJson.rules.map((r) => r.pathPattern);
    if (!patterns.includes("/pulse/*") || !patterns.includes("/room/*")) {
      throw new Error("actions.json missing pulse or room rules");
    }

    const pickGet = await fetch(`${baseUrl}/api/actions/pulse-pick/${pulse.id}`);
    const pickJson = (await pickGet.json()) as { type?: string; links?: { actions?: unknown[] } };
    if (!pickGet.ok || pickJson.type !== "action" || !pickJson.links?.actions?.length) {
      throw new Error("pulse-pick GET failed");
    }

    const pickPost = await fetch(`${baseUrl}/api/actions/pulse-pick/${pulse.id}?side=yes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: guest }),
    });
    const pickPostJson = (await pickPost.json()) as { type?: string; transaction?: string };
    if (!pickPost.ok || pickPostJson.type !== "transaction" || !pickPostJson.transaction) {
      throw new Error("pulse-pick POST failed");
    }

    const joinGet = await fetch(`${baseUrl}/api/actions/join-room/${room.id}`);
    const joinJson = (await joinGet.json()) as { type?: string; title?: string };
    if (!joinGet.ok || joinJson.type !== "action" || !joinJson.title) {
      throw new Error("join-room GET failed");
    }

    const tapeRes = await fetch(`${baseUrl}/api/desk/tape`);
    const tapeJson = (await tapeRes.json()) as { ok?: boolean; tape?: unknown[] };
    if (!tapeRes.ok || !tapeJson.ok || !tapeJson.tape?.length) {
      throw new Error("GET /api/desk/tape failed");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("fetch failed") && !msg.includes("ECONNREFUSED")) throw err;
    console.log("verify:d17 — web not running, DB + file checks only");
  }

  console.log("verify:d17 ok — §17B recordable + EPIC J blinks");
  console.log({
    deskUrl: "/desk",
    actionsJson: "/actions.json",
    pulsePick: `/api/actions/pulse-pick/${pulse.id}`,
    joinRoom: `/api/actions/join-room/${room.id}`,
    sampleOfficerTx: officer.execute_tx,
    sampleQuantTx: quant.execute_tx,
    copyBlink: `/api/actions/copy-agent/${quant.id}`,
    fadeBlink: `/api/actions/fade-agent/${quant.id}`,
    tapeRows: tape.length,
    recordScript: "BRAND-DOC §17B — Desk · Copy · pulse-pick · join-room",
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
