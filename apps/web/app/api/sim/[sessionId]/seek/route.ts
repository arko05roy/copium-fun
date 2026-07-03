import { getSimulatorSession, updateSimulatorCursor } from "@copium/db";
import { createSpawnTracker } from "@copium/pulse-engine/spawn-handler";
import type { ScoreUpdate } from "@copium/txline/detect";
import { detectStateAtCursor, isSimBundle, loadEnv, replayStep } from "@copium/txline/sim";
import { Redis } from "ioredis";
import { NextResponse } from "next/server";

loadEnv();

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { sessionId } = await params;
  const body = (await req.json()) as { cursor?: number };

  const target = body.cursor;
  if (target === undefined || !Number.isFinite(target) || target < 0) {
    return NextResponse.json({ ok: false, error: "cursor required" }, { status: 400 });
  }

  const data = await getSimulatorSession(sessionId);
  if (!data.bundle || !isSimBundle(data.bundle)) {
    return NextResponse.json({ ok: false, error: "invalid bundle" }, { status: 500 });
  }
  if (data.fixture_id === null) {
    return NextResponse.json({ ok: false, error: "fixture_id missing" }, { status: 500 });
  }
  const fixtureId = data.fixture_id;

  const total = data.bundle.events.length;
  const current = data.cursor ?? 0;
  const clamped = Math.min(Math.floor(target), total);

  if (clamped < current) {
    await updateSimulatorCursor(sessionId, clamped);
    return NextResponse.json({
      ok: true,
      sessionId,
      cursor: clamped,
      total,
      emitted: 0,
      rewind: true,
    });
  }

  if (clamped === current) {
    return NextResponse.json({ ok: true, sessionId, cursor: clamped, total, emitted: 0 });
  }

  const redis = new Redis(REDIS_URL);
  try {
    await redis.ping();
    const tracker = createSpawnTracker();
    for (let i = 0; i < current; i++) {
      const event = data.bundle.events[i]!;
      if (event.stream === "scores") tracker.onScores(fixtureId, event.payload as ScoreUpdate);
      else tracker.onOdds(fixtureId, event.payload);
    }

    const result = await replayStep(
      redis,
      data.bundle,
      current,
      detectStateAtCursor(data.bundle, current),
      { maxEvents: clamped - current },
    );

    for (let i = current; i < result.cursor; i++) {
      const event = data.bundle.events[i]!;
      if (event.stream === "scores") tracker.onScores(fixtureId, event.payload as ScoreUpdate);
      else tracker.onOdds(fixtureId, event.payload);
    }

    await updateSimulatorCursor(sessionId, result.cursor);

    return NextResponse.json({
      ok: true,
      sessionId,
      cursor: result.cursor,
      total,
      emitted: result.emitted,
      detected: result.detected,
      spawnIntents: tracker.onDetected(result.detected),
      done: result.done,
    });
  } finally {
    redis.disconnect();
  }
}
