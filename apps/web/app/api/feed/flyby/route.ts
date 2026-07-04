import { listAgentTape, loadEnv } from "@copium/db";
import { NextResponse } from "next/server";

loadEnv();

export async function GET() {
  try {
    const tape = await listAgentTape(1);
    const row = tape[0];
    if (!row) {
      return NextResponse.json({ ok: true, flyby: null });
    }
    return NextResponse.json({
      ok: true,
      flyby: {
        id: row.id,
        agentName: row.agent_name,
        agentSlug: row.agent_slug,
        side: row.side,
        stake: row.stake,
        reasoning: row.reasoning,
        executeTx: row.execute_tx,
        pulseQuestion: row.pulse_question,
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "flyby failed";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
