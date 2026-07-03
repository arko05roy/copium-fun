export type TraderPredicate = {
  threshold: number;
  comparison: { greaterThan: Record<string, never> } | { lessThan: Record<string, never> } | { equalTo: Record<string, never> };
};

export type BinaryExpression = { add: Record<string, never> } | { subtract: Record<string, never> };

export const COMPUTE_BUDGET_VALIDATE_STAT = 1_400_000;

export function predicateGreaterThan(threshold: number): TraderPredicate {
  return { threshold, comparison: { greaterThan: {} } };
}

export function predicateLessThan(threshold: number): TraderPredicate {
  return { threshold, comparison: { lessThan: {} } };
}

/** over_under_ht YES — H1 combined goals > 0. */
export function predicateOverUnderHtYes(): TraderPredicate {
  return predicateGreaterThan(0);
}

/** next_goal YES — stat value strictly above count at pulse open. */
export function predicateGoalScored(openValue: number): TraderPredicate {
  return predicateGreaterThan(openValue);
}
