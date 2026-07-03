import { getSimulatorSession } from "@copium/db";
import { goalCursor, isSimBundle } from "@copium/txline/sim";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { sessionId } = await params;
  let data;
  try {
    data = await getSimulatorSession(sessionId);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "not found" },
      { status: 404 },
    );
  }

  if (!data.bundle || !isSimBundle(data.bundle)) {
    return NextResponse.json({ ok: false, error: "invalid bundle" }, { status: 500 });
  }

  const timeline = data.bundle.events.map((event, index) => ({
    index,
    stream: event.stream,
    ts: event.ts,
  }));

  return NextResponse.json({
    ok: true,
    sessionId: data.id,
    fixtureId: data.fixture_id,
    cursor: data.cursor ?? 0,
    events: data.bundle.events.length,
    goalCursor: goalCursor(data.bundle),
    timeline,
  });
}
