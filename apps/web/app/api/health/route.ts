import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const db = createServerSupabase();
  const { count, error } = await db
    .from("fixtures")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.code },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    supabase: true,
    fixtures: count ?? 0,
  });
}
