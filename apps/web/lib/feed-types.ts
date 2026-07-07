export type FeedPulse = {
  id: string;
  fixture_id: number | null;
  sport: string | null;
  topic: string | null;
  template_id: string | null;
  question: string;
  opens_at: string;
  closes_at: string;
  line_pct: number | null;
  crowd_yes_pct: number | null;
  status: string | null;
  onchain_pool_pubkey: string | null;
  odds_message_id: string | null;
  matchName: string;
  triggerLabel: string;
  createdBy: string;
  settlementLabel: string;
  windowLabel: string;
  missedWindowCopy: string;
};

export type FeedContext = {
  score: string;
  scoreHome: number;
  scoreAway: number;
  phase: string;
  minute: number | null;
  copiumGap: number;
  crowdYesPct: number;
  linePct: number;
  fixtureId: number | null;
  matchName: string;
  simSessionId: string | null;
  pulseQuestion: string | null;
  /** Where score/minute came from — txline API or sim replay fallback. */
  source?: "txline" | "sim";
};

export const STAKE_OPTIONS = [
  { label: "$1", micro: 1_000_000 },
  { label: "$5", micro: 5_000_000 },
  { label: "$10", micro: 10_000_000 },
] as const;
