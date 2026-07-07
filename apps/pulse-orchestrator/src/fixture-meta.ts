import { getFixture, upsertFixtureMeta } from "@copium/db";
import { fetchFixturesSnapshot } from "@copium/txline";

type FixtureSnapshotRow = {
  FixtureId?: number;
  fixtureId?: number;
  CompetitionId?: number;
  competitionId?: number;
  Competition?: string;
  competition?: string;
  Participant1?: string;
  participant1?: string;
  Participant2?: string;
  participant2?: string;
  StartTime?: number;
  startTime?: number;
  GameState?: string;
  gameState?: string;
};

function fixtureIdFromSnapshot(row: FixtureSnapshotRow): number | undefined {
  return row.FixtureId ?? row.fixtureId;
}

export function competitionNameFromSnapshot(
  row: FixtureSnapshotRow,
): string | null {
  return row.Competition ?? row.competition ?? null;
}

export function derivePulseTopic(input: {
  sport: string;
  competitionName: string | null;
}): string {
  const name = input.competitionName?.toLowerCase() ?? "";
  if (input.sport === "soccer" && name.includes("world cup")) return "world-cup";
  return input.sport;
}

function kickoffFromSnapshot(row: FixtureSnapshotRow): string | null {
  const kickoff = row.StartTime ?? row.startTime;
  return kickoff ? new Date(kickoff).toISOString() : null;
}

async function upsertSnapshotRow(row: FixtureSnapshotRow): Promise<void> {
  const fixtureId = fixtureIdFromSnapshot(row);
  if (fixtureId === undefined) return;
  await upsertFixtureMeta({
    fixtureId,
    competitionId: row.CompetitionId ?? row.competitionId ?? null,
    competitionName: competitionNameFromSnapshot(row),
    homeName: row.Participant1 ?? row.participant1 ?? null,
    awayName: row.Participant2 ?? row.participant2 ?? null,
    kickoffAt: kickoffFromSnapshot(row),
    phase: row.GameState ?? row.gameState ?? null,
  });
}

export async function refreshFixtureCoverage(input: {
  apiOrigin: string;
  jwt: string;
  apiToken: string;
}): Promise<number> {
  const snapshot = await fetchFixturesSnapshot(
    input.apiOrigin,
    input.jwt,
    input.apiToken,
  );
  let updated = 0;
  for (const entry of snapshot.fixtures) {
    if (!entry || typeof entry !== "object") continue;
    await upsertSnapshotRow(entry as FixtureSnapshotRow);
    updated += 1;
  }
  return updated;
}

export async function ensureFixtureCoverageForFixture(input: {
  apiOrigin: string;
  jwt: string;
  apiToken: string;
  fixtureId: number;
}): Promise<{
  sport: string;
  topic: string;
  competitionName: string | null;
}> {
  let fixture = await getFixture(input.fixtureId);
  if (!fixture?.competition_name && !fixture?.home_name) {
    await refreshFixtureCoverage(input);
    fixture = await getFixture(input.fixtureId);
  }

  const sport = "soccer";
  const competitionName = fixture?.competition_name ?? null;
  return {
    sport,
    topic: derivePulseTopic({ sport, competitionName }),
    competitionName,
  };
}
