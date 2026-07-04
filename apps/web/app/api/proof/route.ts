import { listSettledProofPulses, loadEnv } from "@copium/db";
import { NextResponse } from "next/server";

loadEnv();

export async function GET() {
  try {
    const pulses = await listSettledProofPulses(30);
    return NextResponse.json({ ok: true, pulses });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "proof list failed" },
      { status: 500 },
    );
  }
}
