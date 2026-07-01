import type { Redis } from "ioredis";
import { detectFromOddsUpdate, detectFromScoreUpdate } from "./detect.js";
import type { DetectedEvent, FixtureDetectState, ScoreUpdate } from "./detect.js";
import type { SimBundle, SimBundleEvent } from "./historical.js";
import { eventChannel, oddsChannel, scoresChannel } from "./redis-channels.js";

export type ReplayResult = {
  cursor: number;
  emitted: number;
  detected: DetectedEvent[];
  done: boolean;
};

export function isSimBundle(value: unknown): value is SimBundle {
  if (!value || typeof value !== "object") return false;
  const bundle = value as SimBundle;
  return (
    typeof bundle.fixtureId === "number" &&
    Array.isArray(bundle.events) &&
    bundle.events.length > 0
  );
}

export async function replayStep(
  redis: Redis,
  bundle: SimBundle,
  cursor: number,
  fixtureState: FixtureDetectState,
  opts?: { untilGoal?: boolean; maxEvents?: number },
): Promise<ReplayResult> {
  const maxEvents = opts?.maxEvents ?? (opts?.untilGoal ? bundle.events.length : 1);
  const detected: DetectedEvent[] = [];
  let state = { ...fixtureState, goals: { ...fixtureState.goals } };
  let emitted = 0;
  let index = cursor;

  while (index < bundle.events.length && emitted < maxEvents) {
    const event = bundle.events[index]!;
    index += 1;
    emitted += 1;

    const batch = await emitEvent(redis, bundle.fixtureId, event, state);
    state = batch.next;
    detected.push(...batch.events);

    if (opts?.untilGoal && detected.some((e) => e.kind === "goal")) {
      break;
    }
  }

  return { cursor: index, emitted, detected, done: index >= bundle.events.length };
}

async function emitEvent(
  redis: Redis,
  fixtureId: number,
  event: SimBundleEvent,
  prev: FixtureDetectState,
): Promise<{ events: DetectedEvent[]; next: FixtureDetectState }> {
  const receivedAt = new Date().toISOString();

  if (event.stream === "scores") {
    const { events, next } = detectFromScoreUpdate(event.payload as ScoreUpdate, prev);
    await redis.publish(
      scoresChannel(fixtureId),
      JSON.stringify({ stream: "scores", receivedAt, sim: true, payload: event.payload }),
    );
    await publishDetected(redis, events);
    return { events, next };
  }

  const { events, next } = detectFromOddsUpdate(event.payload, prev);
  await redis.publish(
    oddsChannel(fixtureId),
    JSON.stringify({ stream: "odds", receivedAt, sim: true, payload: event.payload }),
  );
  await publishDetected(redis, events);
  return { events, next };
}

async function publishDetected(redis: Redis, events: DetectedEvent[]): Promise<void> {
  for (const event of events) {
    await redis.publish(eventChannel(event.fixtureId), JSON.stringify({ ...event, sim: true }));
  }
}

export function detectStateAtCursor(
  bundle: SimBundle,
  cursor: number,
): FixtureDetectState {
  let state: FixtureDetectState = { goals: {} };
  const end = Math.min(cursor, bundle.events.length);
  for (let i = 0; i < end; i++) {
    const event = bundle.events[i]!;
    if (event.stream === "scores") {
      state = detectFromScoreUpdate(event.payload as ScoreUpdate, state).next;
    } else {
      state = detectFromOddsUpdate(event.payload, state).next;
    }
  }
  return state;
}

export function goalCursor(bundle: SimBundle): number | undefined {
  let state: FixtureDetectState = { goals: {} };
  for (let i = 0; i < bundle.events.length; i++) {
    const event = bundle.events[i]!;
    if (event.stream !== "scores") continue;
    const { events, next } = detectFromScoreUpdate(event.payload as ScoreUpdate, state);
    state = next;
    if (events.some((e) => e.kind === "goal")) return i + 1;
  }
  return undefined;
}
