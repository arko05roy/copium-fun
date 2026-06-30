import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const TABLES = [
  "fixtures",
  "pulses",
  "positions",
  "agents",
  "agent_trades",
  "rooms",
  "room_members",
  "receipts",
  "proof_bundles",
  "simulator_sessions",
  "copy_subscriptions",
] as const;

export async function GET() {
  const db = createServerSupabase();
  const tables: Record<string, number> = {};

  for (const table of TABLES) {
    const { error } = await db.from(table).select("*").limit(1);
    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          code: error.code,
          table,
          hint: "Run pnpm db:migrate (needs DATABASE_URL) or apply packages/db/migrations/001_pulses.sql in Supabase SQL editor",
        },
        { status: 503 },
      );
    }

    const { count, error: countError } = await db
      .from(table)
      .select("*", { count: "exact" })
      .limit(0);
    if (countError) {
      return NextResponse.json(
        { ok: false, error: countError.message, code: countError.code, table },
        { status: 503 },
      );
    }
    tables[table] = count ?? 0;
  }

  return NextResponse.json({
    ok: true,
    supabase: true,
    tableCount: TABLES.length,
    tables,
    fixtures: tables.fixtures ?? 0,
  });
}
