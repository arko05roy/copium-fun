import { listAgentPnl, loadEnv } from "@copium/db";
import { NextResponse } from "next/server";

loadEnv();

export async function GET() {
  try {
    const board = await listAgentPnl();
    return NextResponse.json({ ok: true, board });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "pnl failed" },
      { status: 500 },
    );
  }
}
