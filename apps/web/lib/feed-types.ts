export type FeedPulse = {
  id: string;
  question: string;
  opens_at: string;
  closes_at: string;
  line_pct: number | null;
  crowd_yes_pct: number | null;
  status: string | null;
  onchain_pool_pubkey: string | null;
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
