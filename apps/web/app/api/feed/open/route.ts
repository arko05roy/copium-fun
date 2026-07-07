import { getFixture, listOpenPulses, loadEnv } from "@copium/db";
import { NextResponse } from "next/server";

loadEnv();

function pulseTriggerLabel(pulseType: string): string {
  if (pulseType === "next_goal") return "TxLINE score event";
  if (pulseType === "over_under_ht") return "TxLINE phase window";
  return "TxLINE odds or match event";
}

function formatWindow(opensAt: string, closesAt: string): string {
  const seconds = Math.max(
    0,
    Math.round(
      (new Date(closesAt).getTime() - new Date(opensAt).getTime()) / 1000
    )
  );
  return `${seconds || 90}s voting window`;
}

async function matchNameForFixture(fixtureId: number | null): Promise<string> {
  if (fixtureId == null) return "World Cup match";
  const fixture = await getFixture(fixtureId);
  if (fixture?.home_name && fixture.away_name)
    return `${fixture.home_name} vs ${fixture.away_name}`;
  return `Fixture ${fixtureId}`;
}

export async function GET(req: Request) {
  const limit = Math.min(
    20,
    Math.max(1, Number(new URL(req.url).searchParams.get("limit") ?? 5))
  );

  try {
    const all = await listOpenPulses(limit * 3);
    const pulses = await Promise.all(
      all
        .filter((p) => p.odds_message_id)
        .slice(0, limit)
        .map(async (pulse) => ({
          ...pulse,
          matchName: await matchNameForFixture(pulse.fixture_id),
          triggerLabel: pulseTriggerLabel(pulse.pulse_type),
          createdBy: "Spawner opened this Pulse from TxLINE data",
          windowLabel: formatWindow(pulse.opens_at, pulse.closes_at),
          missedWindowCopy:
            "If the timer hits zero, this Pulse locks. Copy or fade agents on the next open Pulse, then check proof and receipts after settlement.",
        }))
    );
    return NextResponse.json({ ok: true, count: pulses.length, pulses });
  } catch (err) {
    const message = err instanceof Error ? err.message : "feed fetch failed";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
