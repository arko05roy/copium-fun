export { toBytes32, toProofNodes } from "./merkle.js";
export type { ProofNodeWire } from "./merkle.js";

export { fetchOddsValidation } from "./fetch-odds.js";
export type { OddsValidationPayload } from "./fetch-odds.js";

export { lockOddsSnapshot } from "./lock.js";
export type { LockedOddsSnapshot } from "./lock.js";

export { fetchStatValidation } from "./fetch.js";
export type { StatValidationParams, StatValidationPayload } from "./fetch.js";

export { dailyOddsPda, dailyScoresPda, epochDayFromTs } from "./pda.js";

export {
  COMPUTE_BUDGET_VALIDATE_STAT,
  predicateGoalScored,
  predicateGreaterThan,
  predicateLessThan,
  predicateOverUnderHtYes,
} from "./predicate.js";
export type { BinaryExpression, TraderPredicate } from "./predicate.js";

export { goalValidationTarget, htValidationTarget } from "./target.js";
export type {
  GoalValidationTarget,
  HtValidationTarget,
} from "./target.js";

export { validateStatOnChain } from "./validate.js";
export type { ValidateStatInput, ValidateStatResult } from "./validate.js";

import type { SimBundle } from "@copium/txline";
import { fetchStatValidation } from "./fetch.js";
import { predicateGoalScored, predicateOverUnderHtYes } from "./predicate.js";
import { goalValidationTarget, htValidationTarget } from "./target.js";
import { validateStatOnChain } from "./validate.js";

export type PulseStatValidation = {
  pulseType: "next_goal" | "over_under_ht";
  target: ReturnType<typeof goalValidationTarget> | ReturnType<typeof htValidationTarget>;
  validation: Awaited<ReturnType<typeof fetchStatValidation>>;
  result: Awaited<ReturnType<typeof validateStatOnChain>>;
};

/** Historical bundle → TxLINE stat-validation → txoracle.validate_stat.view(). */
export async function validatePulseFromBundle(
  apiOrigin: string,
  jwt: string,
  apiToken: string,
  bundle: SimBundle,
  pulseType: "next_goal" | "over_under_ht" = "next_goal",
): Promise<PulseStatValidation> {
  if (pulseType === "next_goal") {
    const target = goalValidationTarget(bundle);
    if (!target) throw new Error("bundle has no goal validation target");

    const validation = await fetchStatValidation(apiOrigin, jwt, apiToken, {
      fixtureId: target.fixtureId,
      seq: target.seq,
      statKey: target.statKey,
    });

    const result = await validateStatOnChain({
      validation,
      predicate: predicateGoalScored(target.openValue),
    });

    return { pulseType, target, validation, result };
  }

  const target = htValidationTarget(bundle);
  if (!target) throw new Error("bundle has no HT validation target");

  const validation = await fetchStatValidation(apiOrigin, jwt, apiToken, {
    fixtureId: target.fixtureId,
    seq: target.seq,
    statKey: target.statKey,
    statKey2: 1002,
  });

  const result = await validateStatOnChain({
    validation,
    predicate: predicateOverUnderHtYes(),
    statKey2: 1002,
    op: { add: {} },
  });

  return { pulseType, target, validation, result };
}
