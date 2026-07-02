import { spawnSync } from "node:child_process";
import { join } from "node:path";
import {
  buildSimBundle,
  loadEnv,
  startGuestSession,
} from "@copium/txline";
import {
  copiumGap,
  duelPoints,
  evaluateBundle,
  positionResult,
  prizePool,
  receiptLabel,
  sumWinnerPayouts,
} from "@copium/pulse-engine";

loadEnv();

const root = join(import.meta.dirname, "..");
const DEFAULT_FIXTURE = Number(process.env.VERIFY_D6_FIXTURE_ID ?? 17926704);

function runTests(): void {
  const res = spawnSync(
    "pnpm",
    ["--filter", "@copium/pulse-engine", "test"],
    { cwd: root, stdio: "inherit", env: process.env },
  );
  if (res.status !== 0) {
    throw new Error(`pulse-engine unit tests failed (exit ${res.status ?? "unknown"})`);
  }
}

async function verifyHistoricalBundle(fixtureId: number): Promise<void> {
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) throw new Error("TXLINE_API_TOKEN missing");

  const { jwt, apiOrigin } = await startGuestSession();
  const bundle = await buildSimBundle(apiOrigin, jwt, apiToken, fixtureId);
  const evalResult = evaluateBundle(bundle);

  if (!evalResult.goalPulse) {
    throw new Error(`fixture ${fixtureId}: no goal pulse in historical bundle`);
  }
  if (evalResult.goalPulse.winningSide !== "yes") {
    throw new Error(
      `goal pulse expected yes, got ${evalResult.goalPulse.winningSide}`,
    );
  }
  if (!evalResult.goalPulse.suggestion.question.includes("?")) {
    throw new Error("goal pulse missing question");
  }

  if (evalResult.htPulse) {
    console.log("ht pulse:", {
      winningSide: evalResult.htPulse.winningSide,
      h1Goals: evalResult.htPulse.h1Goals,
      question: evalResult.htPulse.suggestion.question,
    });
  } else {
    console.log("ht pulse: not in bundle (ok for partial timelines)");
  }

  const certified = receiptLabel({
    side: "yes",
    result: "loss",
    crowdYesPctAtPick: 71,
    linePctAtPick: 38,
  });
  if (certified !== "CERTIFIED" || copiumGap(71, 38) !== 33) {
    throw new Error("BRAND-DOC certified scenario failed");
  }
  if (duelPoints("loss", certified) !== 1) {
    throw new Error("CERTIFIED loss should award 1 duel shame point");
  }

  const yesTotal = 700n;
  const noTotal = 300n;
  const winningSide = "yes" as const;
  const positions = [
    { side: winningSide, stake: 400n },
    { side: winningSide, stake: 300n },
    { side: "no" as const, stake: 300n },
  ];
  const paid = sumWinnerPayouts({
    positions,
    yesTotal,
    noTotal,
    winningSide,
  });
  const pool = prizePool(yesTotal, noTotal);
  if (paid !== pool) {
    throw new Error(`pool conservation failed: paid ${paid} != pool ${pool}`);
  }
  if (positionResult("no", winningSide) !== "loss") {
    throw new Error("positionResult mismatch");
  }

  console.log("verify:d6 ok");
  console.log({
    fixtureId,
    events: evalResult.events,
    goalPulse: {
      index: evalResult.goalPulse.eventIndex,
      winningSide: evalResult.goalPulse.winningSide,
      question: evalResult.goalPulse.suggestion.question,
      goalsAtOpen: evalResult.goalPulse.goalsAtOpen,
      goalsAtClose: evalResult.goalPulse.goalsAtClose,
    },
    maxCopiumGap: evalResult.maxCopiumGap,
    certified,
    prizePool: pool.toString(),
  });
}

async function main(): Promise<void> {
  console.log("=== D6 unit tests (15+ cases) ===");
  runTests();

  console.log("\n=== D6 TxLINE historical bundle eval ===");
  if (!process.env.TXLINE_API_TOKEN?.trim()) {
    console.log("skip historical eval — TXLINE_API_TOKEN unset");
    console.log("D6 unit tests ok (set token for full end-to-end)");
    return;
  }

  await verifyHistoricalBundle(DEFAULT_FIXTURE);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
