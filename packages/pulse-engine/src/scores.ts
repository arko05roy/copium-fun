/** TxLINE score payload stats map (keys are stringified stat ids). */
export type StatMap = Record<string, { value?: number } | number>;

export function minuteFromUpdate(
  update: {
    Minute?: number;
    minute?: number;
    gameState?: string;
    GameState?: string;
  },
  fallback: number,
): number {
  const m = update.Minute ?? update.minute;
  let minute = typeof m === "number" && Number.isFinite(m) ? m : fallback;
  const phase = update.gameState ?? update.GameState;
  if (phase === "HT") minute = 45;
  if (phase === "H2") minute = Math.max(minute, 46);
  return minute;
}

export function readStat(
  stats: StatMap | undefined,
  key: number,
): number | undefined {
  if (!stats) return undefined;
  const raw = stats[String(key)];
  if (raw === undefined) return undefined;
  return typeof raw === "number" ? raw : raw.value;
}

export function statsFromUpdate(update: {
  stats?: StatMap;
  Stats?: StatMap;
}): StatMap | undefined {
  return update.stats ?? update.Stats;
}

export function fullGameGoals(
  stats: StatMap | undefined,
): Readonly<Record<number, number>> {
  return { 1: readStat(stats, 1) ?? 0, 2: readStat(stats, 2) ?? 0 };
}

export function h1GoalsFromStats(
  stats: StatMap | undefined,
): Readonly<Record<number, number>> {
  return {
    1001: readStat(stats, 1001) ?? 0,
    1002: readStat(stats, 1002) ?? 0,
  };
}
