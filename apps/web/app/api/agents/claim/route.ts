import { loadEnv, redeemAgentClaimCode } from "@copium/db";
import { NextResponse } from "next/server";

loadEnv();

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { code?: string; owner?: string };
    const code = body.code?.trim();
    const owner = body.owner?.trim();
    if (!code)
      return NextResponse.json(
        { ok: false, error: "code required" },
        { status: 400 }
      );
    if (!owner)
      return NextResponse.json(
        { ok: false, error: "owner required" },
        { status: 400 }
      );
    const agent = await redeemAgentClaimCode(code, owner);
    return NextResponse.json({ ok: true, agent });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "claim failed" },
      { status: 400 }
    );
  }
}
