import { getLatestSimulatorSession, listOpenPulses, loadEnv } from "@copium/db";
import { copiumGap } from "@copium/pulse-engine/copium-gap";
import { detectStateAtCursor, isSimBundle } from "@copium/txline/sim";
import { NextResponse } from "next/server";

loadEnv();

function minuteFromState(gameState?: string): number | null {
  if (!gameState) return null;
  if (gameState === "H1") return 22;
  if (gameState === "HT") return 45;
  if (gameState === "H2") return 67;
  const n = Number(gameState);
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  try {
    const [pulse] = await listOpenPulses(1);
    const crowd = pulse?.crowd_yes_pct ?? 50;
    const line = pulse?.line_pct ?? 50;
    const gap = copiumGap(crowd, line);

    let scoreHome = 0;
    let scoreAway = 0;
    let phase = "—";
    let minute: number | null = null;
    let fixtureId = pulse?.fixture_id ?? null;
    let simSessionId: string | null = null;

    const sim = await getLatestSimulatorSession();
    if (sim?.bundle && isSimBundle(sim.bundle)) {
      simSessionId = sim.id;
      fixtureId = sim.fixture_id ?? fixtureId;
      const state = detectStateAtCursor(sim.bundle, sim.cursor ?? 0);
      scoreHome = state.goals[1] ?? 0;
      scoreAway = state.goals[2] ?? 0;
      phase = state.gameState ?? "—";
      minute = minuteFromState(state.gameState);
    }

    return NextResponse.json({
      ok: true,
      context: {
        score: `${scoreHome}-${scoreAway}`,
        scoreHome,
        scoreAway,
        phase,
        minute,
        copiumGap: gap,
        crowdYesPct: crowd,
        linePct: line,
        fixtureId,
        simSessionId,
        pulseQuestion: pulse?.question ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "context failed";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
