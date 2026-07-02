import { PULSE_WINDOW_SEC } from "./calibration.js";
import {
  formatPulseQuestion,
  pulseClosesAt,
  type PulseType,
} from "./pulse-catalog.js";

export type SpawnableEventKind = "goal" | "phase_change" | "odds_move";

/** P0 catalog mapping — LLM Spawner overrides question text in D15+. */
export function pulseTypeForEvent(
  kind: SpawnableEventKind,
  detail?: Record<string, unknown>,
): PulseType | null {
  if (kind === "goal") return "next_goal";
  if (kind === "phase_change" && detail?.to === "HT") return "over_under_ht";
  return null;
}

export type SuggestedPulse = {
  pulseType: PulseType;
  question: string;
  opensAt: number;
  closesAt: number;
  linePct?: number;
};

export function suggestPulse(
  kind: SpawnableEventKind,
  detail: Record<string, unknown> | undefined,
  ctx: { eventTs: number; minute: number; linePct?: number },
): SuggestedPulse | null {
  const pulseType = pulseTypeForEvent(kind, detail);
  if (!pulseType) return null;

  return {
    pulseType,
    question: formatPulseQuestion(pulseType, { minute: ctx.minute }),
    opensAt: ctx.eventTs,
    closesAt: pulseClosesAt(ctx.eventTs, PULSE_WINDOW_SEC),
    linePct: ctx.linePct,
  };
}
