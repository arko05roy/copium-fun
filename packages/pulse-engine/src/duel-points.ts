import type { ReceiptLabel } from "./labels.js";

/** AGILE-PLAN §5.3 — match-scoped Room H2H points. */
export function duelPoints(
  result: "win" | "loss",
  label: ReceiptLabel,
): number {
  if (result === "win" && label === "PROPHETIC") return 3;
  if (result === "win") return 2;
  if (result === "loss" && label === "CERTIFIED") return 1;
  return 0;
}
