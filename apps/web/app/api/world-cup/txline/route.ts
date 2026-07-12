import { NextRequest, NextResponse } from "next/server";
import {
  assertTxLineCompatibleFrame,
  getWorldCupTxLineFrame,
} from "@/lib/world-cup-txline";

export async function GET(request: NextRequest) {
  const cursor = Number(request.nextUrl.searchParams.get("cursor") ?? "6");
  const frame = await getWorldCupTxLineFrame(
    Number.isFinite(cursor) ? cursor : 6
  );
  assertTxLineCompatibleFrame(frame);
  return NextResponse.json(
    { ok: true, frame },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Data-Mode": "txline-compatible-replay",
        "X-TxLINE-Schema": "soccer-feed-v1.1",
        "X-Verification-Status": "unverified-no-merkle-proof",
      },
    }
  );
}
