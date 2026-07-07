import { listOpenPulses, loadEnv } from "@copium/db";
import { NextResponse } from "next/server";

loadEnv();

export async function GET(req: Request) {
  const limit = Math.min(
    20,
    Math.max(1, Number(new URL(req.url).searchParams.get("limit") ?? 5)),
  );

  try {
    const all = await listOpenPulses(limit * 3);
    const pulses = all.filter((p) => p.odds_message_id).slice(0, limit);
    return NextResponse.json({ ok: true, count: pulses.length, pulses });
  } catch (err) {
    const message = err instanceof Error ? err.message : "feed fetch failed";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
