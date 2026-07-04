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
import { executeFirstAgentOnPulse } from "../apps/agent-runtime/src/executor.ts";

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
  if (!existsSync(join(ROOT, "apps/agent-runtime/src/executor.ts"))) {
    throw new Error("agent-runtime missing");
  }
  if (!existsSync(join(ROOT, "apps/web/app/desk/page.tsx"))) {
    throw new Error("desk page missing");
  }

  const pulseId = await pickPulseId();
  const pulseRow = await import("@copium/db").then((m) => m.getPulse(pulseId));
  const before = await listAgentTape(5);
  const result = await executeFirstAgentOnPulse(pulseId);

  if (result.skipped && !result.executeTx) {
    throw new Error(
      `${result.reason ?? "agent trade skipped"} (line ${pulseRow.line_pct}% crowd ${pulseRow.crowd_yes_pct ?? 50})`,
    );
  }

  const tape = await listAgentTape(10);
  const trade = tape.find(
    (t) => t.pulse_id === pulseId && (t.agent_slug === "quant" || t.agent_slug === "officer-copium"),
  );
  if (!trade?.execute_tx) {
    throw new Error("agent_trades row missing execute_tx");
  }

  const baseUrl = process.env.VERIFY_WEB_URL ?? "http://127.0.0.1:3000";
  try {
    const res = await fetch(`${baseUrl}/api/desk/tape`);
    const json = (await res.json()) as { ok?: boolean; tape?: { execute_tx?: string }[] };
    if (!res.ok || !json.ok) throw new Error("desk tape API failed");
    const onApi = json.tape?.some((t) => t.execute_tx === trade.execute_tx);
    if (!onApi) throw new Error("trade not visible on /api/desk/tape");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("fetch failed") && !msg.includes("ECONNREFUSED")) throw err;
    console.log("verify:d15 — web not running, DB checks only");
  }

  console.log("verify:d15 ok");
  console.log({
    pulseId,
    agent: trade.agent_slug,
    tradeId: trade.id,
    side: trade.side,
    executeTx: trade.execute_tx,
    reasoning: trade.reasoning?.slice(0, 80),
    deskUrl: "/desk",
    priorTapeRows: before.length,
    tapeRows: tape.length,
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
