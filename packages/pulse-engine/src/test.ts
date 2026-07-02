import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { copiumGap } from "./copium-gap.js";
import { duelPoints } from "./duel-points.js";
import { receiptLabel } from "./labels.js";
import { crowdYesPct, poolSplit, positionPayout, positionResult, prizePool, sumWinnerPayouts } from "./pool-math.js";
import {
  formatPulseQuestion,
  GAME_PHASE,
  periodStatKey,
  PULSE_CATALOG,
  pulseClosesAt,
  settleNextGoal,
  settleOverUnderHt,
} from "./pulse-catalog.js";
import { FEE_BPS, PULSE_WINDOW_SEC } from "./calibration.js";
import { pulseTypeForEvent, suggestPulse } from "./spawn.js";
import { readStat, fullGameGoals, h1GoalsFromStats } from "./scores.js";

describe("copiumGap", () => {
  it("returns absolute crowd-line distance", () => {
    assert.equal(copiumGap(71, 38), 33);
    assert.equal(copiumGap(40, 60), 20);
  });
});

describe("receiptLabel", () => {
  it("CERTIFIED when YES loss with crowd far above line", () => {
    assert.equal(
      receiptLabel({
        side: "yes",
        result: "loss",
        crowdYesPctAtPick: 71,
        linePctAtPick: 38,
      }),
      "CERTIFIED",
    );
  });

  it("PROPHETIC when early contrarian YES wins", () => {
    assert.equal(
      receiptLabel({
        side: "yes",
        result: "win",
        crowdYesPctAtPick: 14,
        linePctAtPick: 38,
      }),
      "PROPHETIC",
    );
  });

  it("PROPHETIC when pick in first 30s of window", () => {
    assert.equal(
      receiptLabel({
        side: "yes",
        result: "win",
        crowdYesPctAtPick: 40,
        linePctAtPick: 38,
        opensAt: 1_000,
        pickTimestamp: 1_020,
      }),
      "PROPHETIC",
    );
  });

  it("BASED when win aligned with line", () => {
    assert.equal(
      receiptLabel({
        side: "yes",
        result: "win",
        crowdYesPctAtPick: 72,
        linePctAtPick: 70,
      }),
      "BASED",
    );
  });

  it("WIN for generic win", () => {
    assert.equal(
      receiptLabel({
        side: "no",
        result: "win",
        crowdYesPctAtPick: 30,
        linePctAtPick: 55,
      }),
      "WIN",
    );
  });

  it("LOSS for generic loss without copium shame", () => {
    assert.equal(
      receiptLabel({
        side: "yes",
        result: "loss",
        crowdYesPctAtPick: 45,
        linePctAtPick: 50,
      }),
      "LOSS",
    );
  });
});

describe("duelPoints", () => {
  it("3 for PROPHETIC win", () => {
    assert.equal(duelPoints("win", "PROPHETIC"), 3);
  });

  it("2 for plain win", () => {
    assert.equal(duelPoints("win", "WIN"), 2);
    assert.equal(duelPoints("win", "BASED"), 2);
  });

  it("1 shame point to opponent on CERTIFIED loss", () => {
    assert.equal(duelPoints("loss", "CERTIFIED"), 1);
  });

  it("0 otherwise", () => {
    assert.equal(duelPoints("loss", "LOSS"), 0);
  });
});

describe("pool-math", () => {
  it("crowdYesPct defaults to 50 on empty pool", () => {
    assert.equal(crowdYesPct(0n, 0n), 50);
  });

  it("crowdYesPct from totals", () => {
    assert.equal(crowdYesPct(700n, 300n), 70);
  });

  it("positionPayout pro-rata after 2% fee", () => {
    const payout = positionPayout({
      stake: 100n,
      side: "yes",
      yesTotal: 700n,
      noTotal: 300n,
      winningSide: "yes",
      feeBps: FEE_BPS,
    });
    assert.equal(payout, 140n);
  });

  it("positionPayout zero for losing side", () => {
    assert.equal(
      positionPayout({
        stake: 100n,
        side: "yes",
        yesTotal: 500n,
        noTotal: 500n,
        winningSide: "no",
      }),
      0n,
    );
  });

  it("poolSplit mirrors crowd yes", () => {
    assert.deepEqual(poolSplit(600n, 400n), { yesPct: 60, noPct: 40 });
  });

  it("prizePool applies fee", () => {
    assert.equal(prizePool(1000n, 0n, FEE_BPS), 980n);
  });

  it("sumWinnerPayouts conserves prize pool", () => {
    const yesTotal = 700n;
    const noTotal = 300n;
    const positions = [
      { side: "yes" as const, stake: 400n },
      { side: "yes" as const, stake: 300n },
    ];
    const paid = sumWinnerPayouts({
      positions,
      yesTotal,
      noTotal,
      winningSide: "yes",
    });
    assert.equal(paid, prizePool(yesTotal, noTotal));
  });

  it("positionResult win/loss", () => {
    assert.equal(positionResult("yes", "yes"), "win");
    assert.equal(positionResult("yes", "no"), "loss");
  });
});

describe("pulse-catalog", () => {
  it("periodStatKey matches TxLINE encoding", () => {
    assert.equal(periodStatKey(1, 1), 1001);
    assert.equal(periodStatKey(1, 2), 1002);
  });

  it("P0 catalog has two pulse types", () => {
    assert.equal(PULSE_CATALOG.next_goal.pulseTypeCode, 1);
    assert.equal(PULSE_CATALOG.over_under_ht.statKeys.length, 2);
  });

  it("formatPulseQuestion substitutes minute", () => {
    assert.equal(
      formatPulseQuestion("next_goal", { minute: 67 }),
      "Another goal before 67?",
    );
  });

  it("settleNextGoal YES when goals increase", () => {
    assert.equal(
      settleNextGoal({ 1: 1, 2: 0 }, { 1: 2, 2: 0 }),
      "yes",
    );
    assert.equal(
      settleNextGoal({ 1: 1, 2: 0 }, { 1: 1, 2: 0 }),
      "no",
    );
  });

  it("settleOverUnderHt uses H1 keys", () => {
    assert.equal(settleOverUnderHt({ 1001: 1, 1002: 0 }), "yes");
    assert.equal(settleOverUnderHt({ 1001: 0, 1002: 0 }), "no");
  });

  it("pulseClosesAt is 90s window", () => {
    assert.equal(pulseClosesAt(1_000), 1_000 + PULSE_WINDOW_SEC);
  });

  it("GAME_PHASE matches AGILE-PLAN §2.3", () => {
    assert.equal(GAME_PHASE.HT, 3);
    assert.equal(GAME_PHASE.F, 5);
  });
});

describe("scores", () => {
  it("readStat parses value objects", () => {
    assert.equal(readStat({ "1": { value: 2 } }, 1), 2);
    assert.equal(readStat({ "2": 1 }, 2), 1);
  });

  it("h1GoalsFromStats uses period keys", () => {
    assert.deepEqual(h1GoalsFromStats({ "1001": 1, "1002": 0 }), {
      1001: 1,
      1002: 0,
    });
  });

  it("fullGameGoals uses keys 1 and 2", () => {
    assert.deepEqual(fullGameGoals({ "1": 2, "2": 1 }), { 1: 2, 2: 1 });
  });
});

describe("spawn", () => {
  it("pulseTypeForEvent maps goal and HT", () => {
    assert.equal(pulseTypeForEvent("goal"), "next_goal");
    assert.equal(pulseTypeForEvent("phase_change", { to: "HT" }), "over_under_ht");
    assert.equal(pulseTypeForEvent("odds_move"), null);
  });

  it("suggestPulse builds 90s window", () => {
    const pulse = suggestPulse("goal", {}, { eventTs: 1000, minute: 67 });
    assert.ok(pulse);
    assert.equal(pulse!.closesAt, 1000 + PULSE_WINDOW_SEC);
    assert.match(pulse!.question, /67/);
  });
});
