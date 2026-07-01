import { getSimulatorSession, updateSimulatorCursor } from "@copium/db";
import { isSimBundle, loadEnv, replayStep, detectStateAtCursor } from "@copium/txline/sim";
import { Redis } from "ioredis";
import { NextResponse } from "next/server";

loadEnv();

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { sessionId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    untilGoal?: boolean;
    steps?: number;
  };

  const data = await getSimulatorSession(sessionId);
  if (!data.bundle || !isSimBundle(data.bundle)) {
    return NextResponse.json({ ok: false, error: "invalid bundle" }, { status: 500 });
  }

  const redis = new Redis(REDIS_URL);
  try {
    await redis.ping();
    const result = await replayStep(redis, data.bundle, data.cursor ?? 0, detectStateAtCursor(data.bundle, data.cursor ?? 0), {
      untilGoal: body.untilGoal ?? false,
      maxEvents: body.steps ?? (body.untilGoal ? data.bundle.events.length : 1),
    });

    await updateSimulatorCursor(sessionId, result.cursor);

    return NextResponse.json({
      ok: true,
      sessionId,
      fixtureId: data.fixture_id,
      cursor: result.cursor,
      total: data.bundle.events.length,
      emitted: result.emitted,
      detected: result.detected,
      done: result.done,
    });
  } finally {
    redis.disconnect();
  }
}
