export const INGEST_META_KEY = "ingest:meta" as const;

export function oddsChannel(fixtureId: number | string): string {
  return `odds:${fixtureId}`;
}

export function scoresChannel(fixtureId: number | string): string {
  return `scores:${fixtureId}`;
}

export function eventChannel(fixtureId: number | string): string {
  return `event:${fixtureId}`;
}
