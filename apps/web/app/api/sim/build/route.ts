import { insertSimulatorSession } from "@copium/db";
import { buildSimBundle, goalCursor, loadEnv, startGuestSession } from "@copium/txline/sim";
import { NextResponse } from "next/server";

loadEnv();

export async function POST(req: Request) {
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) {
    return NextResponse.json({ ok: false, error: "TXLINE_API_TOKEN missing" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as { fixtureId?: number };
  const fixtureId = Number(body.fixtureId ?? process.env.VERIFY_D5_FIXTURE_ID ?? 17926704);

  const { jwt, apiOrigin } = await startGuestSession();
  const bundle = await buildSimBundle(apiOrigin, jwt, apiToken, fixtureId);
  const row = await insertSimulatorSession(fixtureId, JSON.parse(JSON.stringify(bundle)));

  return NextResponse.json({
    ok: true,
    sessionId: row.id,
    fixtureId: row.fixture_id,
    events: bundle.events.length,
    goalCursor: goalCursor(bundle),
  });
}

export async function GET(req: Request) {
  const fixtureId = Number(
    new URL(req.url).searchParams.get("fixtureId") ??
      process.env.VERIFY_D5_FIXTURE_ID ??
      17926704,
  );
  return POST(
    new Request(req.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fixtureId }),
    }),
  );
}
