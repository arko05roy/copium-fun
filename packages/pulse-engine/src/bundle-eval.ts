import type { SimBundle } from "@copium/txline/sim";
import type { ScoreUpdate } from "@copium/txline/detect";
import {
  detectFromOddsUpdate,
  detectFromScoreUpdate,
  type FixtureDetectState,
  type OddsUpdate,
} from "@copium/txline/detect";
import { copiumGap } from "./copium-gap.js";
import { crowdYesPct } from "./pool-math.js";
import {
  settleNextGoal,
  settleOverUnderHt,
} from "./pulse-catalog.js";
import {
  fullGameGoals,
  h1GoalsFromStats,
  minuteFromUpdate,
  statsFromUpdate,
} from "./scores.js";
import { suggestPulse } from "./spawn.js";

export type GoalPulseEval = {
  eventIndex: number;
  winningSide: "yes" | "no";
  goalsAtOpen: Readonly<Record<number, number>>;
  goalsAtClose: Readonly<Record<number, number>>;
  suggestion: NonNullable<ReturnType<typeof suggestPulse>>;
};

export type HtPulseEval = {
  eventIndex: number;
  winningSide: "yes" | "no";
  h1Goals: Readonly<Record<number, number>>;
  suggestion: NonNullable<ReturnType<typeof suggestPulse>>;
};

export type BundleEval = {
  fixtureId: number;
  events: number;
  goalPulse: GoalPulseEval | null;
  htPulse: HtPulseEval | null;
  maxCopiumGap: number;
};

/** Walk real TxLINE sim bundle — settlement + spawn suggestions, no mocks. */
export function evaluateBundle(bundle: SimBundle): BundleEval {
  let state: FixtureDetectState = { goals: {} };
  let goalPulse: GoalPulseEval | null = null;
  let htPulse: HtPulseEval | null = null;
  let maxCopiumGap = 0;
  let minute = 0;

  for (let i = 0; i < bundle.events.length; i++) {
    const event = bundle.events[i]!;

    if (event.stream === "scores") {
      const payload = event.payload as ScoreUpdate;
      const openGoals = { ...state.goals };

      const { events: detected, next } = detectFromScoreUpdate(payload, state);
      state = next;
      minute = minuteFromUpdate(payload, minute);

      for (const det of detected) {
        if (det.kind === "goal" && !goalPulse) {
          const closeGoals = fullGameGoals(statsFromUpdate(payload));
          const winningSide = settleNextGoal(openGoals, closeGoals);
          const suggestion = suggestPulse("goal", det.detail, {
            eventTs: det.ts,
            minute,
            linePct: state.linePct,
          });
          if (!suggestion) continue;

          goalPulse = {
            eventIndex: i,
            winningSide,
            goalsAtOpen: openGoals,
            goalsAtClose: closeGoals,
            suggestion,
          };
        }

        if (det.kind === "phase_change" && det.detail.to === "HT" && !htPulse) {
          const h1 = h1GoalsFromStats(statsFromUpdate(payload));
          const winningSide = settleOverUnderHt(h1);
          const suggestion = suggestPulse("phase_change", det.detail, {
            eventTs: det.ts,
            minute,
            linePct: state.linePct,
          });
          if (!suggestion) continue;

          htPulse = {
            eventIndex: i,
            winningSide,
            h1Goals: h1,
            suggestion,
          };
        }
      }

    } else {
      const { next } = detectFromOddsUpdate(event.payload as OddsUpdate, state);
      state = next;
      if (state.linePct !== undefined) {
        const gap = copiumGap(crowdYesPct(0n, 0n), state.linePct);
        maxCopiumGap = Math.max(maxCopiumGap, gap);
      }
    }
  }

  return {
    fixtureId: bundle.fixtureId,
    events: bundle.events.length,
    goalPulse,
    htPulse,
    maxCopiumGap,
  };
}
