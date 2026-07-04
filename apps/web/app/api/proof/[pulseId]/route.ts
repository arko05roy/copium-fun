import { getProofBundle, getPulse, loadEnv } from "@copium/db";
import { NextResponse } from "next/server";

loadEnv();

type RouteParams = { params: Promise<{ pulseId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { pulseId } = await params;

  try {
    const [pulse, proof] = await Promise.all([
      getPulse(pulseId),
      getProofBundle(pulseId),
    ]);

    if (!proof) {
      return NextResponse.json(
        { ok: false, pulseId, pulse, proof: null, error: "proof bundle not ready" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      pulseId,
      pulse,
      proof,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "proof lookup failed",
      },
      { status: 500 },
    );
  }
}
