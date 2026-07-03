import { getSimulatorSession } from "@copium/db";
import {
  goalValidationTarget,
  validatePulseFromBundle,
} from "@copium/settlement";
import { loadEnv, startGuestSession } from "@copium/txline";
import type { SimBundle } from "@copium/txline";
import { NextResponse } from "next/server";

loadEnv();

export async function POST(req: Request) {
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) {
    return NextResponse.json(
      { ok: false, error: "TXLINE_API_TOKEN missing — run pnpm txline:subscribe" },
      { status: 503 },
    );
  }

  let body: { sessionId?: string; pulseType?: "next_goal" | "over_under_ht" };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "sessionId required" }, { status: 400 });
  }

  const row = await getSimulatorSession(sessionId);
  if (!row) {
    return NextResponse.json({ ok: false, error: "session not found" }, { status: 404 });
  }

  const bundle = row.bundle as SimBundle;
  const pulseType = body.pulseType ?? "next_goal";
  const target = goalValidationTarget(bundle);

  if (pulseType === "next_goal" && !target) {
    return NextResponse.json(
      { ok: false, error: "bundle has no goal event for validate_stat" },
      { status: 422 },
    );
  }

  try {
    const { jwt, apiOrigin } = await startGuestSession();
    const checked = await validatePulseFromBundle(
      apiOrigin,
      jwt,
      apiToken,
      bundle,
      pulseType,
    );

    return NextResponse.json({
      ok: checked.result.valid,
      pulseType: checked.pulseType,
      valid: checked.result.valid,
      method: checked.result.method,
      fixtureId: bundle.fixtureId,
      target: checked.target,
      dailyScoresPda: checked.result.dailyScoresPda,
      epochDay: checked.result.epochDay,
      proved: checked.validation.statToProve,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "validate_stat failed",
      },
      { status: 502 },
    );
  }
}
