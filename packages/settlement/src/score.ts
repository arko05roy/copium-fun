import {
  settleNextGoal,
  settleNextScore,
  settleOverUnderHt,
  SOCCER_GOAL_KEYS,
} from "@copium/pulse-engine/pulse-catalog";
import {
  fullGameGoals,
  h1GoalsFromStats,
  statsFromUpdate,
} from "@copium/pulse-engine/scores";
import type { ScoreUpdate } from "@copium/txline/detect";
import { fetchScoresTimeline } from "@copium/txline";
import { fetchStatValidation } from "./fetch.js";
import {
  buildSettlementRoot,
  settlementRootHex,
  type PulseSettlementBundle,
  type PulseTruthBundle,
} from "./hash.js";
import {
  predicateGoalScored,
  predicateOverUnderHtYes,
} from "./predicate.js";
import { validateStatOnChain } from "./validate.js";

export type ValidateScoreInput = {
  pulseId: string;
  pulseType: "next_goal" | "next_score" | "over_under_ht";
  fixtureId: number;
  opensAt: Date;
  closesAt: Date;
  apiOrigin: string;
  jwt: string;
  apiToken: string;
  /** ponytail: skip HTTP when caller already fetched timeline (verify replay). */
  scoresTimeline?: ScoreUpdate[];
};

function eventTsMs(update: ScoreUpdate): number {
  const raw = update.ts ?? update.Ts ?? 0;
  return raw > 1e12 ? raw : raw * 1000;
}

function seqFrom(update: ScoreUpdate): number | undefined {
  const row = update as ScoreUpdate & { Seq?: number; seq?: number };
  return row.Seq ?? row.seq;
}

function scoreAtOrBefore(
  updates: ScoreUpdate[],
  targetMs: number,
): ScoreUpdate | null {
  let best: ScoreUpdate | null = null;
  let bestTs = -1;
  for (const update of updates) {
    const ts = eventTsMs(update);
    if (ts <= targetMs && ts >= bestTs) {
      best = update;
      bestTs = ts;
    }
  }
  return best;
}

function pickGoalStatKey(
  goalsAtOpen: Readonly<Record<number, number>>,
  goalsAtClose: Readonly<Record<number, number>>,
): { statKey: number; openValue: number } {
  for (const key of SOCCER_GOAL_KEYS) {
    const open = goalsAtOpen[key] ?? 0;
    const close = goalsAtClose[key] ?? 0;
    if (close > open) return { statKey: key, openValue: open };
  }
  return { statKey: 1, openValue: goalsAtOpen[1] ?? 0 };
}

/** Phase A truth — real TxLINE timeline + validate_stat.view(). */
export async function validateScore(
  input: ValidateScoreInput,
): Promise<PulseSettlementBundle> {
  const opensMs = input.opensAt.getTime();
  const closesMs = input.closesAt.getTime();
  if (closesMs < opensMs) {
    throw new Error("closes_at before opens_at");
  }

  const timeline =
    input.scoresTimeline ??
    (
      await fetchScoresTimeline(
        input.apiOrigin,
        input.jwt,
        input.apiToken,
        input.fixtureId,
      )
    ).updates;

  if (timeline.length === 0) {
    throw new Error(`no score timeline for fixture ${input.fixtureId}`);
  }

  const openUpdate = scoreAtOrBefore(timeline, opensMs);
  const closeUpdate = scoreAtOrBefore(timeline, closesMs);
  if (!openUpdate || !closeUpdate) {
    throw new Error("score timeline missing updates for pulse window");
  }

  const openSeq = seqFrom(openUpdate);
  const closeSeq = seqFrom(closeUpdate);
  if (openSeq === undefined || closeSeq === undefined) {
    throw new Error("score update missing seq");
  }

  const goalsAtOpen = fullGameGoals(statsFromUpdate(openUpdate));
  const goalsAtClose = fullGameGoals(statsFromUpdate(closeUpdate));

  let winningSide: "yes" | "no";
  let statKey: number;
  let statKey2: number | undefined;
  let openValue: number;
  let seq: number;

  if (input.pulseType === "next_goal" || input.pulseType === "next_score") {
    winningSide =
      input.pulseType === "next_goal"
        ? settleNextGoal(goalsAtOpen, goalsAtClose)
        : settleNextScore(goalsAtOpen, goalsAtClose);
    const picked = pickGoalStatKey(goalsAtOpen, goalsAtClose);
    statKey = picked.statKey;
    openValue = picked.openValue;
    seq = closeSeq;
  } else {
    const h1 = h1GoalsFromStats(statsFromUpdate(closeUpdate));
    winningSide = settleOverUnderHt(h1);
    statKey = 1001;
    statKey2 = 1002;
    openValue = 0;
    seq = closeSeq;
  }

  const validation = await fetchStatValidation(
    input.apiOrigin,
    input.jwt,
    input.apiToken,
    { fixtureId: input.fixtureId, seq, statKey, statKey2 },
  );

  const validateResult =
    input.pulseType === "next_goal" || input.pulseType === "next_score"
      ? await validateStatOnChain({
          validation,
          predicate: predicateGoalScored(openValue),
        })
      : await validateStatOnChain({
          validation,
          predicate: predicateOverUnderHtYes(),
          statKey2: 1002,
          op: { add: {} },
        });

  const truth: PulseTruthBundle = {
    pulseId: input.pulseId,
    pulseType: input.pulseType,
    fixtureId: input.fixtureId,
    winningSide,
    goalsAtOpen,
    goalsAtClose,
    validation,
    validateResult,
    settledAt: new Date().toISOString(),
  };

  const settlementRoot = buildSettlementRoot(validation, winningSide);

  return {
    truth,
    settlementRoot,
    settlementRootHex: settlementRootHex(settlementRoot),
  };
}
