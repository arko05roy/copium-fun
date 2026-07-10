import { insertPulse, listOpenPulses, loadEnv, upsertFixtureMeta } from "@copium/db";
import { fetchFixturesSnapshot, startGuestSession } from "@copium/txline";

loadEnv();

type SnapshotFixture = {
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

async function selectFixture(): Promise<{ id: number; row: SnapshotFixture }> {
  const configured = process.env.DEV_FIXTURE_ID?.trim();
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) throw new Error("TXLINE_API_TOKEN is required to seed a named fixture");
  const { jwt, apiOrigin } = await startGuestSession();
  const snapshot = await fetchFixturesSnapshot(apiOrigin, jwt, apiToken);
  const rows = snapshot.fixtures as SnapshotFixture[];
  const row = rows.find((entry) => {
    const id = entry.FixtureId ?? entry.fixtureId;
    return id !== undefined && (!configured || String(id) === configured) && Boolean(entry.Participant1 ?? entry.participant1) && Boolean(entry.Participant2 ?? entry.participant2);
  });
  if (!row) throw new Error(configured ? `fixture ${configured} was not found in the TxLINE snapshot` : "TxLINE snapshot has no named fixtures");
  const id = row.FixtureId ?? row.fixtureId;
  if (id === undefined) throw new Error("TxLINE fixture has no ID");
  await upsertFixtureMeta({
    fixtureId: id,
    competitionId: row.CompetitionId ?? row.competitionId ?? null,
    competitionName: row.Competition ?? row.competition ?? null,
    homeName: row.Participant1 ?? row.participant1 ?? null,
    awayName: row.Participant2 ?? row.participant2 ?? null,
    kickoffAt: (row.StartTime ?? row.startTime) ? new Date(row.StartTime ?? row.startTime!).toISOString() : null,
    phase: row.GameState ?? row.gameState ?? null,
  });
  return { id, row };
}

async function main(): Promise<void> {
  const fixture = await selectFixture();
  const existing = await listOpenPulses(50);
  if (existing.some((pulse) => {
    const remaining = new Date(pulse.closes_at).getTime() - Date.now();
    return pulse.trigger_source === "dev_seed" && pulse.fixture_id === fixture.id && remaining > 0 && remaining <= 120_000;
  })) {
    console.log("[dev:seed] Development pulse already exists");
    return;
  }

  const opensAt = new Date();
  const closesAt = new Date(opensAt.getTime() + 90_000);
  const pulse = await insertPulse({
    fixture_id: fixture.id,
    sport: "soccer",
    topic: "soccer",
    pulse_type: "next_goal",
    template_id: "next_goal",
    trigger_source: "dev_seed",
    question: "Will there be another goal before the window closes?",
    opens_at: opensAt.toISOString(),
    closes_at: closesAt.toISOString(),
    line_pct: 50,
    odds_message_id: `dev-seed-${opensAt.getTime()}`,
    odds_proof: { source: "local-dev-seed" },
  });

  console.log(`[dev:seed] Created ${fixture.row.Participant1 ?? fixture.row.participant1} vs ${fixture.row.Participant2 ?? fixture.row.participant2} pulse ${pulse.id}`);
}

main().catch((error: unknown) => {
  console.error("[dev:seed]", error instanceof Error ? error.message : error);
  process.exit(1);
});
