import { createDbClient } from "./client.js";
import type { Json } from "./database.js";

export type PulseRow = {
  id: string;
  fixture_id: number | null;
  pulse_type: string;
  question: string;
  opens_at: string;
  closes_at: string;
  line_pct: number | null;
  crowd_yes_pct: number | null;
  status: string | null;
  onchain_pool_pubkey: string | null;
  odds_message_id: string | null;
  odds_proof: Json | null;
  settlement_root: string | null;
  winning_side: string | null;
  created_at: string | null;
};

export type FixtureRow = {
  txline_fixture_id: number;
  home_name: string | null;
  away_name: string | null;
  kickoff_at: string | null;
  phase: string | null;
  updated_at: string | null;
};

type PulseInsert = {
  fixture_id: number;
  pulse_type: string;
  question: string;
  opens_at: string;
  closes_at: string;
  line_pct?: number | null;
  crowd_yes_pct?: number | null;
  status?: string;
  odds_message_id?: string | null;
  odds_proof?: Json | null;
  onchain_pool_pubkey?: string | null;
};

// ponytail: supabase-js + hand-rolled Database types infer `never` on insert
function pulses() {
  return createDbClient().from("pulses") as unknown as {
    insert: (row: PulseInsert) => {
      select: (cols: string) => {
        single: () => Promise<{
          data: PulseRow | null;
          error: { message: string } | null;
        }>;
      };
    };
    update: (row: Partial<PulseInsert>) => {
      eq: (
        col: string,
        val: string,
      ) => {
        select: (cols: string) => {
          single: () => Promise<{
            data: PulseRow | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
    select: (cols: string) => {
      order: (
        col: string,
        opts: { ascending: boolean },
      ) => {
        limit: (n: number) => Promise<{
          data: PulseRow[] | null;
          error: { message: string } | null;
        }>;
      };
      eq: (
        col: string,
        val: string,
      ) => {
        single: () => Promise<{
          data: PulseRow | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

function fixtures() {
  return createDbClient().from("fixtures") as unknown as {
    upsert: (
      row: { txline_fixture_id: number },
      opts: { onConflict: string; ignoreDuplicates: boolean },
    ) => Promise<{ error: { message: string } | null }>;
    select: (cols: string) => {
      eq: (
        col: string,
        val: number,
      ) => {
        single: () => Promise<{
          data: FixtureRow | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

export async function ensureFixture(fixtureId: number): Promise<void> {
  const { error } = await fixtures().upsert(
    { txline_fixture_id: fixtureId },
    { onConflict: "txline_fixture_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);
}

export async function getFixture(
  fixtureId: number,
): Promise<FixtureRow | null> {
  const { data, error } = await fixtures()
    .select(
      "txline_fixture_id, home_name, away_name, kickoff_at, phase, updated_at",
    )
    .eq("txline_fixture_id", fixtureId)
    .single();
  if (error) return null;
  return data;
}

export async function insertPulse(row: PulseInsert): Promise<PulseRow> {
  await ensureFixture(row.fixture_id);
  const { data, error } = await pulses()
    .insert({
      ...row,
      status: row.status ?? "open",
      crowd_yes_pct: 50,
    })
    .select(
      "id, fixture_id, pulse_type, question, opens_at, closes_at, line_pct, crowd_yes_pct, status, onchain_pool_pubkey, odds_message_id, odds_proof, settlement_root, winning_side, created_at",
    )
    .single();
  if (error || !data) throw new Error(error?.message ?? "pulse insert failed");
  return data;
}

export async function attachPoolToPulse(
  pulseId: string,
  poolPubkey: string,
): Promise<PulseRow> {
  const { data, error } = await pulses()
    .update({ onchain_pool_pubkey: poolPubkey })
    .eq("id", pulseId)
    .select(
      "id, fixture_id, pulse_type, question, opens_at, closes_at, line_pct, crowd_yes_pct, status, onchain_pool_pubkey, odds_message_id, odds_proof, settlement_root, winning_side, created_at",
    )
    .single();
  if (error || !data) throw new Error(error?.message ?? "pulse update failed");
  return data;
}

export async function getPulse(pulseId: string): Promise<PulseRow> {
  const { data, error } = await pulses()
    .select(
      "id, fixture_id, pulse_type, question, opens_at, closes_at, line_pct, crowd_yes_pct, status, onchain_pool_pubkey, odds_message_id, odds_proof, settlement_root, winning_side, created_at",
    )
    .eq("id", pulseId)
    .single();
  if (error || !data) throw new Error(error?.message ?? "pulse not found");
  return data;
}

export async function listOpenPulses(limit = 10): Promise<PulseRow[]> {
  const { data, error } = await (
    createDbClient().from("pulses") as unknown as {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string,
        ) => {
          order: (
            col2: string,
            opts: { ascending: boolean },
          ) => {
            limit: (n: number) => Promise<{
              data: PulseRow[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    }
  )
    .select(
      "id, fixture_id, pulse_type, question, opens_at, closes_at, line_pct, crowd_yes_pct, status, onchain_pool_pubkey, odds_message_id, odds_proof, settlement_root, winning_side, created_at",
    )
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updatePulseCrowdPct(
  pulseId: string,
  crowdYesPct: number,
): Promise<void> {
  const { error } = await (
    createDbClient().from("pulses") as unknown as {
      update: (row: { crowd_yes_pct: number }) => {
        eq: (
          col: string,
          val: string,
        ) => Promise<{ error: { message: string } | null }>;
      };
    }
  )
    .update({ crowd_yes_pct: crowdYesPct })
    .eq("id", pulseId);
  if (error) throw new Error(error.message);
}

export async function listRecentPulses(limit = 20): Promise<PulseRow[]> {
  const { data, error } = await pulses()
    .select(
      "id, fixture_id, pulse_type, question, opens_at, closes_at, line_pct, crowd_yes_pct, status, onchain_pool_pubkey, odds_message_id, odds_proof, settlement_root, winning_side, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
