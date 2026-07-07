import {
  getFixture,
  getLatestSimulatorSession,
  listOpenPulses,
  loadEnv,
} from "@copium/db";
import { copiumGap } from "@copium/pulse-engine/copium-gap";
import { detectStateAtCursor, isSimBundle } from "@copium/txline/sim";
import { NextResponse } from "next/server";

import { fetchTxlineLiveContext } from "@/lib/txline-live-context";

loadEnv();

async function matchNameForFixture(fixtureId: number | null): Promise<string> {
  if (fixtureId == null) return "World Cup match";
  const fixture = await getFixture(fixtureId);
  if (fixture?.home_name && fixture.away_name)
    return `${fixture.home_name} vs ${fixture.away_name}`;
  return `Fixture ${fixtureId}`;
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
    let source: "txline" | "sim" = "sim";

    if (fixtureId != null) {
      const live = await fetchTxlineLiveContext(fixtureId);
      if (live) {
        scoreHome = live.scoreHome;
        scoreAway = live.scoreAway;
        phase = live.phase;
        minute = live.minute;
        source = "txline";
      }
    }

    if (source === "sim") {
      const sim = await getLatestSimulatorSession();
      if (sim?.bundle && isSimBundle(sim.bundle)) {
        simSessionId = sim.id;
        fixtureId = sim.fixture_id ?? fixtureId;
        const state = detectStateAtCursor(sim.bundle, sim.cursor ?? 0);
        scoreHome = state.goals[1] ?? 0;
        scoreAway = state.goals[2] ?? 0;
        phase = state.gameState ?? "—";
        minute =
          phase === "H1"
            ? 22
            : phase === "HT"
              ? 45
              : phase === "H2"
                ? 67
                : null;
      }
    }

    const matchName = await matchNameForFixture(fixtureId);

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
        matchName,
        simSessionId,
        pulseQuestion: pulse?.question ?? null,
        source,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "context failed";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
