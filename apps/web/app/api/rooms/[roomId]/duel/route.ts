import { getRoomDuel, loadEnv } from "@copium/db";
import { NextResponse } from "next/server";

loadEnv();

export async function GET(
  req: Request,
  ctx: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await ctx.params;
  const wallet = new URL(req.url).searchParams.get("wallet")?.trim();
  if (!wallet) {
    return NextResponse.json({ ok: false, error: "wallet query required" }, { status: 400 });
  }

  try {
    const duel = await getRoomDuel(roomId, wallet);
    return NextResponse.json({ ok: true, duel });
  } catch (err) {
    const message = err instanceof Error ? err.message : "duel fetch failed";
    return NextResponse.json({ ok: false, error: message }, { status: 404 });
  }
}
