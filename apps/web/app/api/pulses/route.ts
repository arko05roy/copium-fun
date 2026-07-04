import { listRecentPulses, loadEnv } from "@copium/db";
import { NextResponse } from "next/server";

loadEnv();

export async function GET(req: Request) {
  const limit = Math.min(
    50,
    Math.max(1, Number(new URL(req.url).searchParams.get("limit") ?? 10)),
  );

  try {
    const pulses = await listRecentPulses(limit);
    return NextResponse.json({ ok: true, count: pulses.length, pulses });
  } catch (err) {
    const message = err instanceof Error ? err.message : "pulses fetch failed";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
