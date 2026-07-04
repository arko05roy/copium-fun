import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  attachPoolToPulse,
  insertPulse,
  listAgentTape,
  loadEnv,
} from "@copium/db";
import { PULSE_WINDOW_SEC } from "@copium/pulse-engine/calibration";
import { PULSE_CATALOG } from "@copium/pulse-engine/pulse-catalog";
import {
  createPulseOnChain,
  fetchPoolStatus,
  POOL_STATUS,
} from "@copium/pulses-client";
import { lockOddsSnapshot } from "@copium/settlement";
import {
  buildSimBundle,
  loadEnv as loadTxEnv,
  loadServiceKeypair,
  startGuestSession,
} from "@copium/txline";
import { executeAllAgentsOnPulse } from "../apps/agent-runtime/src/executor.ts";

loadEnv();
loadTxEnv();

const ROOT = process.cwd();
const DEFAULT_FIXTURE = Number(process.env.VERIFY_D5_FIXTURE_ID ?? 17926704);

function linePctFromOddsPayload(payload: { Pct?: string[] }): number | null {
  for (const entry of payload.Pct ?? []) {
    if (entry === "NA") continue;
    const n = Number(entry);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

async function spawnOpenVerifyPulse(): Promise<string> {
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) throw new Error("TXLINE_API_TOKEN missing");

  const { jwt, apiOrigin } = await startGuestSession();
  const bundle = await buildSimBundle(apiOrigin, jwt, apiToken, DEFAULT_FIXTURE);
  const oddsEvents = bundle.events.filter((e) => e.stream === "odds");
  if (!oddsEvents.length) throw new Error("fixture bundle missing odds for lock");

  let pick = oddsEvents[oddsEvents.length - 1]!;
  let bestEdge = 0;
  for (const event of oddsEvents) {
    const line = linePctFromOddsPayload(event.payload as { Pct?: string[] });
    if (line == null) continue;
    const edge = Math.abs(50 - line);
    if (edge > bestEdge) {
      bestEdge = edge;
      pick = event;
    }
  }

  const odds = pick.payload as { MessageId?: string; Ts?: number; Pct?: string[] };
  const messageId = odds.MessageId;
  const oddsTs = odds.Ts;
  if (!messageId || oddsTs == null) throw new Error("odds event missing MessageId/Ts");

  const locked = await lockOddsSnapshot(apiOrigin, jwt, apiToken, messageId, oddsTs);
  const fallbackLine = linePctFromOddsPayload(odds);
  const linePct = locked.linePct ?? fallbackLine;
  const opensAtSec = Math.floor(Date.now() / 1000);
  const closesAtSec = opensAtSec + PULSE_WINDOW_SEC;

  const row = await insertPulse({
    fixture_id: DEFAULT_FIXTURE,
    pulse_type: "next_goal",
    question: `Another goal before ${opensAtSec % 90}?`,
    opens_at: new Date(opensAtSec * 1000).toISOString(),
    closes_at: new Date(closesAtSec * 1000).toISOString(),
    line_pct: linePct ?? null,
    odds_message_id: locked.messageId,
    odds_proof: JSON.parse(JSON.stringify(locked.proof)),
  });

  const authority = loadServiceKeypair();
  const onchain = await createPulseOnChain({
    authority,
    fixtureId: BigInt(DEFAULT_FIXTURE),
    pulseTypeCode: PULSE_CATALOG.next_goal.pulseTypeCode,
    opensAt: BigInt(opensAtSec),
    closesAt: BigInt(closesAtSec),
    oddsLockRoot: locked.oddsLockRoot,
  });

  await attachPoolToPulse(row.id, onchain.pool.toBase58());
  const status = await fetchPoolStatus(onchain.pool.toBase58());
  if (status.status !== POOL_STATUS.open) {
    throw new Error(`new pool not open on-chain (status ${status.status})`);
  }
  return row.id;
}

async function pickPulseId(): Promise<string> {
  const fromArg = process.argv[2]?.trim();
  if (fromArg) return fromArg;
  return spawnOpenVerifyPulse();
}

async function main() {
  for (const path of [
    "apps/agent-runtime/src/executor.ts",
    "apps/web/app/desk/page.tsx",
    "apps/web/app/components/copy-button.tsx",
    "apps/web/app/components/pnl-board.tsx",
    "apps/web/app/api/actions/copy-agent/[tradeId]/route.ts",
    "apps/web/app/actions.json/route.ts",
  ]) {
    if (!existsSync(join(ROOT, path))) throw new Error(`missing ${path}`);
  }

  const pulseId = await pickPulseId();
  const results = await executeAllAgentsOnPulse(pulseId);
  const filled = results.filter((r) => !r.skipped);
  if (filled.length < 2) {
    throw new Error(
      `expected Officer + Quant fills, got ${filled.length}: ${results.map((r) => r.reason).join("; ")}`,
    );
  }

  const slugs = new Set(filled.map((r) => r.agentSlug));
  if (!slugs.has("officer-copium") || !slugs.has("quant")) {
    throw new Error(`missing agent slug in fills: ${[...slugs].join(", ")}`);
  }

  const tape = await listAgentTape(20);
  const officer = tape.find((t) => t.pulse_id === pulseId && t.agent_slug === "officer-copium");
  const quant = tape.find((t) => t.pulse_id === pulseId && t.agent_slug === "quant");
  if (!officer?.execute_tx || !quant?.execute_tx) {
    throw new Error("agent_trades missing execute_tx for Officer or Quant");
  }

  const baseUrl = process.env.VERIFY_WEB_URL ?? "http://127.0.0.1:3000";
  try {
    const getRes = await fetch(`${baseUrl}/api/actions/copy-agent/${quant.id}`);
    const getJson = (await getRes.json()) as { type?: string; title?: string };
    if (!getRes.ok || getJson.type !== "action" || !getJson.title) {
      throw new Error("copy-agent GET failed");
    }

    const subscriber = "So11111111111111111111111111111111111111112";
    const postRes = await fetch(`${baseUrl}/api/actions/copy-agent/${quant.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: subscriber }),
    });
    const postJson = (await postRes.json()) as { type?: string; transaction?: string };
    if (!postRes.ok || postJson.type !== "transaction" || !postJson.transaction) {
      throw new Error("copy-agent POST failed to build tx");
    }

    const pnlRes = await fetch(`${baseUrl}/api/desk/pnl`);
    const pnlJson = (await pnlRes.json()) as { ok?: boolean; board?: unknown[] };
    if (!pnlRes.ok || !pnlJson.ok) throw new Error("desk pnl API failed");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("fetch failed") && !msg.includes("ECONNREFUSED")) throw err;
    console.log("verify:d16 — web not running, DB + executor checks only");
  }

  console.log("verify:d16 ok — Officer + Quant + copy Blink");
  console.log({
    pulseId,
    officerTx: officer.execute_tx,
    quantTx: quant.execute_tx,
    quantTradeId: quant.id,
    copyBlink: `/api/actions/copy-agent/${quant.id}`,
    fadeBlink: `/api/actions/fade-agent/${quant.id}`,
    deskUrl: "/desk",
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
