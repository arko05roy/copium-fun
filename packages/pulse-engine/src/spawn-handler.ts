import {
  detectFromOddsUpdate,
  detectFromScoreUpdate,
  type DetectedEvent,
  type FixtureDetectState,
  type OddsUpdate,
  type ScoreUpdate,
} from "@copium/txline/detect";
import { minuteFromUpdate } from "./scores.js";
import { suggestPulse, type SpawnableEventKind, type SuggestedPulse } from "./spawn.js";

export type FixtureSpawnCtx = {
  minute: number;
  linePct?: number;
};

export type SpawnIntent =
  | {
      action: "would_spawn_pulse";
      fixtureId: number;
      event: DetectedEvent;
      pulse: SuggestedPulse;
      at: string;
    }
  | {
      action: "skip";
      fixtureId: number;
      event: DetectedEvent;
      reason: string;
      at: string;
    };

export function spawnIntent(
  event: DetectedEvent,
  ctx: FixtureSpawnCtx,
): Extract<SpawnIntent, { action: "would_spawn_pulse" }> | Extract<SpawnIntent, { action: "skip" }> {
  const at = new Date().toISOString();
  const pulse = suggestPulse(event.kind as SpawnableEventKind, event.detail, {
    eventTs: event.ts,
    minute: ctx.minute,
    linePct: ctx.linePct,
  });

  if (!pulse) {
    return {
      action: "skip",
      fixtureId: event.fixtureId,
      event,
      reason: `no P0 pulse for ${event.kind}`,
      at,
    };
  }

  return {
    action: "would_spawn_pulse",
    fixtureId: event.fixtureId,
    event,
    pulse,
    at,
  };
}

export function spawnIntentsForDetected(
  detected: DetectedEvent[],
  ctx: FixtureSpawnCtx,
): SpawnIntent[] {
  return detected.map((event) => spawnIntent(event, ctx));
}

type FixtureTrack = FixtureSpawnCtx & { detect: FixtureDetectState };

export function createSpawnTracker(): {
  onScores: (fixtureId: number, payload: ScoreUpdate) => void;
  onOdds: (fixtureId: number, payload: OddsUpdate) => void;
  contextFor: (fixtureId: number) => FixtureSpawnCtx;
  onDetected: (events: DetectedEvent[]) => SpawnIntent[];
} {
  const fixtures = new Map<number, FixtureTrack>();

  function track(fixtureId: number): FixtureTrack {
    const existing = fixtures.get(fixtureId);
    if (existing) return existing;
    const fresh: FixtureTrack = { minute: 0, detect: { goals: {} } };
    fixtures.set(fixtureId, fresh);
    return fresh;
  }

  return {
    onScores(fixtureId, payload) {
      const row = track(fixtureId);
      const { next } = detectFromScoreUpdate(payload, row.detect);
      row.detect = next;
      row.minute = minuteFromUpdate(payload, row.minute);
      row.linePct = next.linePct ?? row.linePct;
    },
    onOdds(fixtureId, payload) {
      const row = track(fixtureId);
      const { next } = detectFromOddsUpdate(payload, row.detect);
      row.detect = next;
      row.linePct = next.linePct ?? row.linePct;
    },
    contextFor(fixtureId) {
      const row = track(fixtureId);
      return { minute: row.minute, linePct: row.linePct };
    },
    onDetected(events) {
      return events.map((event) => spawnIntent(event, this.contextFor(event.fixtureId)));
    },
  };
}

function demo(): void {
  const goal = spawnIntent(
    { kind: "goal", fixtureId: 1, ts: 1000, detail: { gameState: "H2" } },
    { minute: 67, linePct: 55 },
  );
  console.assert(goal.action === "would_spawn_pulse");
  if (goal.action === "would_spawn_pulse") {
    console.assert(goal.pulse.question.includes("67"));
  }

  const skip = spawnIntent(
    { kind: "odds_move", fixtureId: 1, ts: 1000, detail: { deltaPp: 6 } },
    { minute: 30 },
  );
  console.assert(skip.action === "skip");

  console.log("spawn-handler demo ok");
}

import { pathToFileURL } from "node:url";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  demo();
}
