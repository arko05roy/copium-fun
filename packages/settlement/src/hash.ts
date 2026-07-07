import { createHash } from "node:crypto";
import type { StatValidationPayload } from "./fetch.js";
import { toBytes32 } from "./merkle.js";
import type { ValidateStatResult } from "./validate.js";

export type PulseTruthBundle = {
  pulseId: string;
  pulseType: "next_goal" | "next_score" | "over_under_ht";
  fixtureId: number;
  winningSide: "yes" | "no";
  goalsAtOpen: Readonly<Record<number, number>>;
  goalsAtClose: Readonly<Record<number, number>>;
  validation: StatValidationPayload;
  validateResult: ValidateStatResult;
  settledAt: string;
};

export type PulseSettlementBundle = {
  truth: PulseTruthBundle;
  settlementRoot: number[];
  settlementRootHex: string;
};

/** Deterministic 32-byte root for post_settlement — subtree root + outcome + proved stat. */
export function buildSettlementRoot(
  validation: StatValidationPayload,
  winningSide: "yes" | "no",
): number[] {
  const h = createHash("sha256");
  h.update(Buffer.from(toBytes32(validation.summary.eventStatsSubTreeRoot)));
  h.update(winningSide);
  h.update(String(validation.statToProve.key));
  h.update(String(validation.statToProve.value));
  return Array.from(h.digest());
}

export function settlementRootHex(root: number[]): string {
  return Buffer.from(root).toString("hex");
}
