export const INGEST_META_KEY = "ingest:meta" as const;
export const ORCHESTRATOR_META_KEY = "orchestrator:meta" as const;
export const SPAWN_LOG_KEY = "orchestrator:spawn_log" as const;

export function oddsChannel(fixtureId: number | string): string {
  return `odds:${fixtureId}`;
}

export function scoresChannel(fixtureId: number | string): string {
  return `scores:${fixtureId}`;
}

export function eventChannel(fixtureId: number | string): string {
  return `event:${fixtureId}`;
}
