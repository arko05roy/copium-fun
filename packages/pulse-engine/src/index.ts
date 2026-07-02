export {
  BASED_GAP_MAX,
  CERTIFIED_GAP_PP,
  FEE_BPS,
  ODDS_MOVE_THRESHOLD_PP,
  PROPHETIC_CROWD_MAX,
  PROPHETIC_EARLY_SEC,
  PULSE_WINDOW_SEC,
} from "./calibration.js";
export { copiumGap } from "./copium-gap.js";
export { duelPoints } from "./duel-points.js";
export { receiptLabel } from "./labels.js";
export type { LabelInput, ReceiptLabel } from "./labels.js";
export { evaluateBundle } from "./bundle-eval.js";
export type { BundleEval, GoalPulseEval, HtPulseEval } from "./bundle-eval.js";
export {
  crowdYesPct,
  poolSplit,
  positionPayout,
  positionResult,
  prizePool,
  sumWinnerPayouts,
} from "./pool-math.js";
export type { PoolSide } from "./pool-math.js";
export {
  fullGameGoals,
  h1GoalsFromStats,
  readStat,
  statsFromUpdate,
} from "./scores.js";
export type { StatMap } from "./scores.js";
export { pulseTypeForEvent, suggestPulse } from "./spawn.js";
export type { SpawnableEventKind, SuggestedPulse } from "./spawn.js";
export {
  formatPulseQuestion,
  GAME_PHASE,
  H1_GOAL_KEYS,
  periodStatKey,
  PULSE_CATALOG,
  pulseClosesAt,
  settleNextGoal,
  settleOverUnderHt,
  SOCCER_GOAL_KEYS,
} from "./pulse-catalog.js";
export type { PulseCatalogEntry, PulseType } from "./pulse-catalog.js";
