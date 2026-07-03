import type { SimBundle } from "@copium/txline";
import { detectFromScoreUpdate } from "@copium/txline/detect";
import { readStat, statsFromUpdate } from "@copium/pulse-engine/scores";
import { SOCCER_GOAL_KEYS } from "@copium/pulse-engine/pulse-catalog";

export type ScoreEventPayload = {
  FixtureId?: number;
  fixtureId?: number;
  Seq?: number;
  seq?: number;
};

export type GoalValidationTarget = {
  fixtureId: number;
  seq: number;
  statKey: number;
  openValue: number;
  provedValue: number;
  eventIndex: number;
};

export type HtValidationTarget = {
  fixtureId: number;
  seq: number;
  statKey: number;
  eventIndex: number;
};

function seqFrom(payload: ScoreEventPayload): number | undefined {
  return payload.Seq ?? payload.seq;
}

function fixtureIdFrom(payload: ScoreEventPayload): number | undefined {
  return payload.FixtureId ?? payload.fixtureId;
}

/** First goal in real TxLINE bundle — drives validate_stat spike + D8 verify. */
export function goalValidationTarget(bundle: SimBundle): GoalValidationTarget | null {
  let state: Parameters<typeof detectFromScoreUpdate>[1];

  for (let i = 0; i < bundle.events.length; i++) {
    const event = bundle.events[i]!;
    if (event.stream !== "scores") continue;

    const payload = event.payload as ScoreEventPayload & Parameters<typeof detectFromScoreUpdate>[0];
    const openGoals = { ...(state?.goals ?? {}) };
    const { events: detected, next } = detectFromScoreUpdate(payload, state);
    state = next;

    for (const det of detected) {
      if (det.kind !== "goal") continue;

      const seq = seqFrom(payload);
      const fixtureId = fixtureIdFrom(payload);
      if (seq === undefined || fixtureId === undefined) return null;

      const stats = statsFromUpdate(payload);
      for (const key of SOCCER_GOAL_KEYS) {
        const proved = readStat(stats, key);
        const open = openGoals[key] ?? 0;
        if (proved !== undefined && proved > open) {
          return {
            fixtureId,
            seq,
            statKey: key,
            openValue: open,
            provedValue: proved,
            eventIndex: i,
          };
        }
      }
      return null;
    }
  }

  return null;
}

/** HT phase change — over_under_ht stat validation target. */
export function htValidationTarget(bundle: SimBundle): HtValidationTarget | null {
  let state: Parameters<typeof detectFromScoreUpdate>[1];

  for (let i = 0; i < bundle.events.length; i++) {
    const event = bundle.events[i]!;
    if (event.stream !== "scores") continue;

    const payload = event.payload as ScoreEventPayload & Parameters<typeof detectFromScoreUpdate>[0];
    const { events: detected, next } = detectFromScoreUpdate(payload, state);
    state = next;

    for (const det of detected) {
      if (det.kind !== "phase_change" || det.detail.to !== "HT") continue;

      const seq = seqFrom(payload);
      const fixtureId = fixtureIdFrom(payload);
      if (seq === undefined || fixtureId === undefined) return null;

      return { fixtureId, seq, statKey: 1001, eventIndex: i };
    }
  }

  return null;
}
