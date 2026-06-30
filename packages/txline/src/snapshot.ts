import { txlineHeaders } from "./auth.js";

export type FixturesSnapshotResult = {
  status: number;
  count: number;
  fixtures: unknown[];
};

export async function fetchFixturesSnapshot(
  apiOrigin: string,
  jwt: string,
  apiToken: string,
  competitionId?: number,
): Promise<FixturesSnapshotResult> {
  const url = new URL("/api/fixtures/snapshot", apiOrigin);
  if (competitionId !== undefined) {
    url.searchParams.set("competitionId", String(competitionId));
  }

  const res = await fetch(url, { headers: txlineHeaders(jwt, apiToken) });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`fixtures snapshot ${res.status}: ${body}`);
  }

  const fixtures = JSON.parse(body) as unknown[];
  if (!Array.isArray(fixtures)) {
    throw new Error("fixtures snapshot response is not an array");
  }

  return { status: res.status, count: fixtures.length, fixtures };
}
