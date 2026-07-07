import { getFixture, listOpenPulses, loadEnv } from "@copium/db";
import { NextResponse } from "next/server";

loadEnv();

function pulseTriggerLabel(pulseType: string): string {
  if (pulseType === "next_goal") return "TxLINE score event";
  if (pulseType === "over_under_ht") return "TxLINE phase window";
  return "TxLINE odds or match event";
}

function settlementLabel(pulseType: string): string {
  if (pulseType === "next_goal") return "Auto-settles from the next verified goal";
  if (pulseType === "over_under_ht")
    return "Auto-settles from verified first-half goal totals";
  return "Auto-settles from verified TxLINE data";
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
  const params = new URL(req.url).searchParams;
  const limit = Math.min(20, Math.max(1, Number(params.get("limit") ?? 5)));
  const topic = params.get("topic")?.trim().toLowerCase();

  try {
    const all = await listOpenPulses(limit * 3);
    const pulses = await Promise.all(
      all
        .filter((p) => p.odds_message_id)
        .filter((p) => !topic || p.topic === topic)
        .slice(0, limit)
        .map(async (pulse) => ({
          ...pulse,
          matchName: await matchNameForFixture(pulse.fixture_id),
          triggerLabel: pulseTriggerLabel(pulse.pulse_type),
          createdBy: "Officer Copium opened this pulse from TxLINE data",
          settlementLabel: settlementLabel(pulse.pulse_type),
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
