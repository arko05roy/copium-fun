/**
 * AGILE-PLAN §2.3 — soccer stat encoding (TxLINE / txoracle).
 * period key = (period × 1000) + base · base 1 = P1 goals · base 2 = P2 goals
 */
export const SOCCER_GOAL_KEYS = [1, 2] as const;
export const H1_GOAL_KEYS = [1001, 1002] as const;

/** AGILE-PLAN §2.3 — NS=1, H1=2, HT=3, H2=4, F=5 */
export const GAME_PHASE = {
  NS: 1,
  H1: 2,
  HT: 3,
  H2: 4,
  F: 5,
} as const;

export type PulseType = "next_goal" | "over_under_ht";

export type PulseCatalogEntry = {
  pulseType: PulseType;
  questionTemplate: string;
  /** On-chain copium-pulses pulse_type u8 (AGILE-PLAN §8.1). */
  pulseTypeCode: number;
  settleNote: string;
  statKeys: readonly number[];
};

/** AGILE-PLAN §5.5 — P0 pulse catalog. */
export const PULSE_CATALOG: Record<PulseType, PulseCatalogEntry> = {
  next_goal: {
    pulseType: "next_goal",
    questionTemplate: "Another goal before {minute}?",
    pulseTypeCode: 1,
    settleNote: "score keys @ window end",
    statKeys: SOCCER_GOAL_KEYS,
  },
  over_under_ht: {
    pulseType: "over_under_ht",
    questionTemplate: "Over 0.5 goals in H1?",
    pulseTypeCode: 2,
    settleNote: "H1 keys 1001, 1002 @ HT",
    statKeys: H1_GOAL_KEYS,
  },
};

export function periodStatKey(period: number, baseKey: number): number {
  return period * 1000 + baseKey;
}

export function formatPulseQuestion(
  pulseType: PulseType,
  ctx: { minute: number },
): string {
  return PULSE_CATALOG[pulseType].questionTemplate.replace(
    "{minute}",
    String(ctx.minute),
  );
}

/** Another goal scored between open and close snapshots → YES. */
export function settleNextGoal(
  goalsAtOpen: Readonly<Record<number, number>>,
  goalsAtClose: Readonly<Record<number, number>>,
): "yes" | "no" {
  const openTotal = (goalsAtOpen[1] ?? 0) + (goalsAtOpen[2] ?? 0);
  const closeTotal = (goalsAtClose[1] ?? 0) + (goalsAtClose[2] ?? 0);
  return closeTotal > openTotal ? "yes" : "no";
}

/** H1 combined goals > 0 → YES on over 0.5. */
export function settleOverUnderHt(
  h1Goals: Readonly<Record<number, number>>,
): "yes" | "no" {
  const total = (h1Goals[1001] ?? 0) + (h1Goals[1002] ?? 0);
  return total > 0 ? "yes" : "no";
}

export function pulseClosesAt(opensAt: number, windowSec = 90): number {
  return opensAt + windowSec;
}
