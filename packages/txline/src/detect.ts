/** Goal stat keys — AGILE-PLAN §2.3, soccer full-game totals. */
const GOAL_KEYS = [1, 2] as const;

export type DetectedEventKind = "goal" | "phase_change" | "odds_move";

export type DetectedEvent = {
  kind: DetectedEventKind;
  fixtureId: number;
  ts: number;
  detail: Record<string, unknown>;
};

export type ScoreUpdate = {
  fixtureId?: number;
  FixtureId?: number;
  gameState?: string;
  GameState?: string;
  ts?: number;
  Ts?: number;
  stats?: Record<string, { value?: number } | number>;
  Stats?: Record<string, { value?: number } | number>;
  Clock?: { Seconds?: number; Running?: boolean };
};

export type OddsUpdate = {
  FixtureId?: number;
  fixtureId?: number;
  Ts?: number;
  ts?: number;
  MessageId?: string;
  SuperOddsType?: string;
  Pct?: string[];
  GameState?: string | null;
};

export type FixtureDetectState = {
  gameState?: string;
  goals: Record<number, number>;
  linePct?: number;
  oddsMessageId?: string;
};

function fixtureIdFromScore(update: ScoreUpdate): number | undefined {
  return update.fixtureId ?? update.FixtureId;
}

function fixtureIdFromOdds(update: OddsUpdate): number | undefined {
  return update.FixtureId ?? update.fixtureId;
}

function tsFrom(update: { ts?: number; Ts?: number }): number {
  return update.ts ?? update.Ts ?? Date.now();
}

function gameStateFrom(update: ScoreUpdate): string | undefined {
  return update.gameState ?? update.GameState;
}

function statsFrom(
  update: ScoreUpdate,
): Record<string, { value?: number } | number> | undefined {
  const raw = update as ScoreUpdate & {
    Stats?: Record<string, { value?: number } | number>;
  };
  return raw.stats ?? raw.Stats;
}

function goalValue(
  stats: Record<string, { value?: number } | number> | undefined,
  key: number,
): number | undefined {
  if (!stats) return undefined;
  const raw = stats[String(key)];
  if (raw === undefined) return undefined;
  return typeof raw === "number" ? raw : raw.value;
}

function primaryLinePct(pct: string[] | undefined): number | undefined {
  if (!pct?.length) return undefined;
  for (const entry of pct) {
    if (entry === "NA") continue;
    const n = Number(entry);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function detectFromScoreUpdate(
  update: ScoreUpdate,
  prev: FixtureDetectState | undefined,
): { events: DetectedEvent[]; next: FixtureDetectState } {
  const fixtureId = fixtureIdFromScore(update);
  if (fixtureId === undefined) {
    return { events: [], next: prev ?? { goals: {} } };
  }

  const ts = tsFrom(update);
  const next: FixtureDetectState = {
    goals: { ...(prev?.goals ?? {}) },
    gameState: prev?.gameState,
    linePct: prev?.linePct,
    oddsMessageId: prev?.oddsMessageId,
  };
  const events: DetectedEvent[] = [];

  const state = gameStateFrom(update);
  if (state && state !== prev?.gameState) {
    if (prev?.gameState !== undefined) {
      events.push({
        kind: "phase_change",
        fixtureId,
        ts,
        detail: { from: prev.gameState, to: state },
      });
    }
    next.gameState = state;
  }

  const stats = statsFrom(update);
  for (const key of GOAL_KEYS) {
    const value = goalValue(stats, key);
    if (value === undefined) continue;
    const before = prev?.goals[key];
    next.goals[key] = value;
    if (before !== undefined && value > before) {
      events.push({
        kind: "goal",
        fixtureId,
        ts,
        detail: { teamKey: key, before, after: value, gameState: state },
      });
    }
  }

  return { events, next };
}

export function detectFromOddsUpdate(
  update: OddsUpdate,
  prev: FixtureDetectState | undefined,
  /** AGILE-PLAN §7.2 — implied move threshold in percentage points. */
  thresholdPp = 5,
): { events: DetectedEvent[]; next: FixtureDetectState } {
  const fixtureId = fixtureIdFromOdds(update);
  if (fixtureId === undefined) {
    return { events: [], next: prev ?? { goals: {} } };
  }

  const ts = tsFrom(update);
  const next: FixtureDetectState = {
    goals: { ...(prev?.goals ?? {}) },
    gameState: prev?.gameState,
    linePct: prev?.linePct,
    oddsMessageId: prev?.oddsMessageId,
  };
  const events: DetectedEvent[] = [];

  const linePct = primaryLinePct(update.Pct);
  if (linePct !== undefined) {
    const before = prev?.linePct;
    next.linePct = linePct;
    next.oddsMessageId = update.MessageId;
    if (before !== undefined && Math.abs(linePct - before) >= thresholdPp) {
      events.push({
        kind: "odds_move",
        fixtureId,
        ts,
        detail: {
          before,
          after: linePct,
          deltaPp: linePct - before,
          messageId: update.MessageId,
          superOddsType: update.SuperOddsType,
        },
      });
    }
  }

  return { events, next };
}

function demo(): void {
  let state: FixtureDetectState = { goals: {}, gameState: "H1" };

  const phase = detectFromScoreUpdate(
    { fixtureId: 1, gameState: "HT", ts: 1, stats: { "1": { value: 1 }, "2": { value: 0 } } },
    state,
  );
  console.assert(phase.events.length === 1 && phase.events[0]?.kind === "phase_change");
  state = phase.next;

  const goal = detectFromScoreUpdate(
    { fixtureId: 1, gameState: "H2", ts: 2, stats: { "1": { value: 2 }, "2": { value: 0 } } },
    state,
  );
  console.assert(goal.events.some((e) => e.kind === "goal"));
  state = goal.next;

  const goalStats = detectFromScoreUpdate(
    { FixtureId: 1, GameState: "H2", Ts: 3, Stats: { "1": 1, "2": 1 } } as ScoreUpdate,
    { goals: { "1": 1, "2": 0 }, gameState: "H2" },
  );
  console.assert(goalStats.events.some((e) => e.kind === "goal"));

  const odds = detectFromOddsUpdate(
    { FixtureId: 1, Ts: 3, Pct: ["40.000", "60.000"], MessageId: "a" },
    { ...state, linePct: 50 },
  );
  console.assert(odds.events.some((e) => e.kind === "odds_move"));

  console.log("detect demo ok");
}

import { pathToFileURL } from "node:url";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  demo();
}
