import { txlineHeaders } from "./auth.js";
import { parseSseBlock } from "./sse.js";
import type { OddsUpdate, ScoreUpdate } from "./detect.js";

export type SimStream = "scores" | "odds";

export type SimBundleEvent = {
  stream: SimStream;
  ts: number;
  payload: ScoreUpdate | OddsUpdate;
};

export type SimBundle = {
  fixtureId: number;
  builtAt: string;
  source: {
    scoresPath: string;
    oddsEpochDays: number[];
  };
  events: SimBundleEvent[];
};

function tsFromPayload(payload: { ts?: number; Ts?: number }): number {
  return payload.ts ?? payload.Ts ?? 0;
}

/** TxLINE historical scores endpoints return SSE `data:` blocks, not JSON arrays. */
export function parseSseRecording(body: string): unknown[] {
  const trimmed = body.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as unknown;
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  const entries: unknown[] = [];
  for (const block of body.split(/\r?\n\r?\n+/)) {
    if (!block.trim()) continue;
    const payload = parseSseBlock(block)?.data;
    if (!payload) continue;
    try {
      entries.push(JSON.parse(payload) as unknown);
    } catch {
      // skip malformed block
    }
  }
  return entries;
}

async function fetchText(
  apiOrigin: string,
  jwt: string,
  apiToken: string,
  path: string,
): Promise<{ path: string; text: string; status: number }> {
  const res = await fetch(new URL(path, apiOrigin), {
    headers: txlineHeaders(jwt, apiToken),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${path} ${res.status}: ${text.slice(0, 200)}`);
  }
  return { path, text, status: res.status };
}

export async function fetchScoresTimeline(
  apiOrigin: string,
  jwt: string,
  apiToken: string,
  fixtureId: number,
): Promise<{ path: string; updates: ScoreUpdate[] }> {
  for (const path of [
    `/api/scores/updates/${fixtureId}`,
    `/api/scores/historical/${fixtureId}`,
  ]) {
    const { text } = await fetchText(apiOrigin, jwt, apiToken, path);
    const updates = parseSseRecording(text) as ScoreUpdate[];
    if (updates.length > 0) {
      return { path, updates };
    }
  }
  throw new Error(`no score timeline for fixture ${fixtureId}`);
}

export async function fetchOddsForFixture(
  apiOrigin: string,
  jwt: string,
  apiToken: string,
  fixtureId: number,
  startTimeMs: number,
): Promise<{ epochDays: number[]; updates: OddsUpdate[] }> {
  const centerDay = Math.floor(startTimeMs / 86_400_000);
  const epochDays = [centerDay - 1, centerDay, centerDay + 1];
  const updates: OddsUpdate[] = [];

  for (const epochDay of epochDays) {
    for (let hour = 0; hour < 24; hour++) {
      const path = `/api/odds/updates/${epochDay}/${hour}/0`;
      try {
        const { text } = await fetchText(apiOrigin, jwt, apiToken, path);
        const batch = parseSseRecording(text) as OddsUpdate[];
        for (const row of batch) {
          const id = row.FixtureId ?? row.fixtureId;
          if (id === fixtureId) updates.push(row);
        }
      } catch {
        // ponytail: empty hour slots are normal on batch endpoints
      }
    }
  }

  return { epochDays, updates };
}

export async function buildSimBundle(
  apiOrigin: string,
  jwt: string,
  apiToken: string,
  fixtureId: number,
): Promise<SimBundle> {
  const { path: scoresPath, updates: scores } = await fetchScoresTimeline(
    apiOrigin,
    jwt,
    apiToken,
    fixtureId,
  );
  const startTimeMs =
    ((scores[0] as { StartTime?: number } | undefined)?.StartTime ??
      tsFromPayload(scores[0] ?? {})) ||
    Date.now();

  const { epochDays, updates: odds } = await fetchOddsForFixture(
    apiOrigin,
    jwt,
    apiToken,
    fixtureId,
    startTimeMs,
  );

  const events: SimBundleEvent[] = [
    ...scores.map((payload) => ({
      stream: "scores" as const,
      ts: tsFromPayload(payload),
      payload,
    })),
    ...odds.map((payload) => ({
      stream: "odds" as const,
      ts: tsFromPayload(payload),
      payload,
    })),
  ].sort((a, b) => a.ts - b.ts || (a.stream === "scores" ? -1 : 1));

  if (events.length === 0) {
    throw new Error(`empty bundle for fixture ${fixtureId}`);
  }

  return {
    fixtureId,
    builtAt: new Date().toISOString(),
    source: { scoresPath, oddsEpochDays: epochDays },
    events,
  };
}
