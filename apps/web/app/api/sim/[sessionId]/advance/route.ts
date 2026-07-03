import { getSimulatorSession, updateSimulatorCursor } from "@copium/db";
import { createSpawnTracker } from "@copium/pulse-engine/spawn-handler";
import type { ScoreUpdate } from "@copium/txline/detect";
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
  if (data.fixture_id === null) {
    return NextResponse.json({ ok: false, error: "fixture_id missing" }, { status: 500 });
  }
  const fixtureId = data.fixture_id;

  const redis = new Redis(REDIS_URL);
  try {
    await redis.ping();
    const cursor = data.cursor ?? 0;
    const tracker = createSpawnTracker();
    for (let i = 0; i < cursor; i++) {
      const event = data.bundle.events[i]!;
      if (event.stream === "scores") {
        tracker.onScores(fixtureId, event.payload as ScoreUpdate);
      } else {
        tracker.onOdds(fixtureId, event.payload);
      }
    }

    const result = await replayStep(
      redis,
      data.bundle,
      cursor,
      detectStateAtCursor(data.bundle, cursor),
      {
        untilGoal: body.untilGoal ?? false,
        maxEvents: body.steps ?? (body.untilGoal ? data.bundle.events.length : 1),
      },
    );

    for (let i = cursor; i < result.cursor; i++) {
      const event = data.bundle.events[i]!;
      if (event.stream === "scores") {
        tracker.onScores(fixtureId, event.payload as ScoreUpdate);
      } else {
        tracker.onOdds(fixtureId, event.payload);
      }
    }

    const spawnIntents = tracker.onDetected(result.detected);

    await updateSimulatorCursor(sessionId, result.cursor);

    return NextResponse.json({
      ok: true,
      sessionId,
      fixtureId: fixtureId,
      cursor: result.cursor,
      total: data.bundle.events.length,
      emitted: result.emitted,
      detected: result.detected,
      spawnIntents,
      done: result.done,
    });
  } finally {
    redis.disconnect();
  }
}
