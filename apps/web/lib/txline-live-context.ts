import { minuteFromUpdate } from "@copium/pulse-engine";
import {
  detectFromScoreUpdate,
  fetchScoresTimeline,
  startGuestSession,
  type FixtureDetectState,
} from "@copium/txline";

export type LiveFixtureContext = {
  source: "txline";
  scoreHome: number;
  scoreAway: number;
  phase: string;
  minute: number | null;
  fixtureId: number;
};

/** Latest score state from TxLINE GET /api/scores/updates/{fixtureId}. */
export async function fetchTxlineLiveContext(
  fixtureId: number,
): Promise<LiveFixtureContext | null> {
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) return null;

  const { jwt, apiOrigin } = await startGuestSession();
  const { updates } = await fetchScoresTimeline(apiOrigin, jwt, apiToken, fixtureId);
  if (!updates.length) return null;

  let state: FixtureDetectState = { goals: {} };
  for (const update of updates) {
    state = detectFromScoreUpdate(update, state).next;
  }

  const last = updates[updates.length - 1]!;
  const phase = state.gameState ?? last.GameState ?? last.gameState ?? "—";
  const minute = minuteFromUpdate(last, 0);

  return {
    source: "txline",
    scoreHome: state.goals[1] ?? 0,
    scoreAway: state.goals[2] ?? 0,
    phase,
    minute,
    fixtureId,
  };
}
