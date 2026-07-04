import { listAgentTape, loadEnv } from "@copium/db";
import { NextResponse } from "next/server";

loadEnv();

export async function GET() {
  try {
    const tape = await listAgentTape(50);
    return NextResponse.json({ ok: true, tape });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "tape failed" },
      { status: 500 },
    );
  }
}
