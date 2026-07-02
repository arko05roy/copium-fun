import {
  BASED_GAP_MAX,
  CERTIFIED_GAP_PP,
  PROPHETIC_CROWD_MAX,
  PROPHETIC_EARLY_SEC,
} from "./calibration.js";
import { copiumGap } from "./copium-gap.js";

export type ReceiptLabel =
  | "CERTIFIED"
  | "PROPHETIC"
  | "BASED"
  | "WIN"
  | "LOSS";

export type LabelInput = {
  side: "yes" | "no";
  result: "win" | "loss";
  crowdYesPctAtPick: number;
  linePctAtPick: number;
  pickTimestamp?: number;
  opensAt?: number;
};

function isEarlyYesPick(
  crowdYesPctAtPick: number,
  pickTimestamp: number | undefined,
  opensAt: number | undefined,
): boolean {
  if (crowdYesPctAtPick <= PROPHETIC_CROWD_MAX) return true;
  if (pickTimestamp !== undefined && opensAt !== undefined) {
    return pickTimestamp - opensAt <= PROPHETIC_EARLY_SEC;
  }
  return false;
}

/** AGILE-PLAN §5.2 — receipt shame / glory labels. */
export function receiptLabel(input: LabelInput): ReceiptLabel {
  const {
    side,
    result,
    crowdYesPctAtPick,
    linePctAtPick,
    pickTimestamp,
    opensAt,
  } = input;
  const crowdAboveLine = crowdYesPctAtPick - linePctAtPick;

  if (
    result === "loss" &&
    side === "yes" &&
    crowdAboveLine >= CERTIFIED_GAP_PP
  ) {
    return "CERTIFIED";
  }
  if (
    result === "win" &&
    side === "yes" &&
    isEarlyYesPick(crowdYesPctAtPick, pickTimestamp, opensAt)
  ) {
    return "PROPHETIC";
  }
  if (result === "win" && copiumGap(crowdYesPctAtPick, linePctAtPick) <= BASED_GAP_MAX) {
    return "BASED";
  }
  return result === "win" ? "WIN" : "LOSS";
}
