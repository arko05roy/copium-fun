import { createDbClient } from "./client.js";
import type { Json } from "./database.js";
import { listRecentPulses, type PulseRow } from "./pulses.js";

export type ProofBundleRow = {
  pulse_id: string;
  truth_json: Json | null;
  settlement_json: Json | null;
  verify_tx: string | null;
  bundle_json: Json | null;
  created_at: string | null;
};

type ProofInsert = {
  pulse_id: string;
  truth_json: Json;
  settlement_json: Json;
  bundle_json: Json;
  verify_tx?: string | null;
};

function proofBundles() {
  return createDbClient().from("proof_bundles") as unknown as {
    insert: (row: ProofInsert) => {
      select: (cols: string) => {
        single: () => Promise<{
          data: ProofBundleRow | null;
          error: { message: string } | null;
        }>;
      };
    };
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        single: () => Promise<{
          data: ProofBundleRow | null;
          error: { message: string } | null;
        }>;
      };
    };
    update: (row: { verify_tx: string }) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
}

function pulsesQueryable() {
  return createDbClient().from("pulses") as unknown as {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        lte: (
          col2: string,
          val2: string,
        ) => {
          order: (
            col3: string,
            opts: { ascending: boolean },
          ) => {
            limit: (n: number) => Promise<{
              data: PulseRow[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
    update: (row: {
      status?: string;
      winning_side?: string;
      settlement_root?: string;
    }) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
}

function pulses() {
  return pulsesQueryable();
}

function positions() {
  return createDbClient().from("positions") as unknown as {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{
        data: { id: string; side: "yes" | "no" | null }[] | null;
        error: { message: string } | null;
      }>;
    };
    update: (row: { result: string }) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
}

export async function listPulsesReadyToSettle(limit = 20): Promise<PulseRow[]> {
  const now = new Date().toISOString();
  const { data, error } = await pulsesQueryable()
    .select(
      "id, fixture_id, pulse_type, question, opens_at, closes_at, line_pct, crowd_yes_pct, status, onchain_pool_pubkey, odds_message_id, odds_proof, settlement_root, winning_side, created_at",
    )
    .eq("status", "open")
    .lte("closes_at", now)
    .order("closes_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getProofBundle(pulseId: string): Promise<ProofBundleRow | null> {
  const { data, error } = await proofBundles()
    .select("pulse_id, truth_json, settlement_json, verify_tx, bundle_json, created_at")
    .eq("pulse_id", pulseId)
    .single();
  if (error) return null;
  return data;
}

export async function insertProofBundle(row: ProofInsert): Promise<ProofBundleRow> {
  const { data, error } = await proofBundles()
    .insert(row)
    .select("pulse_id, truth_json, settlement_json, verify_tx, bundle_json, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "proof_bundles insert failed");
  return data;
}

export async function markPulseSettled(
  pulseId: string,
  winningSide: "yes" | "no",
  settlementRootHex: string,
): Promise<void> {
  const { error } = await pulses()
    .update({
      status: "settled",
      winning_side: winningSide,
      settlement_root: settlementRootHex,
    })
    .eq("id", pulseId);
  if (error) throw new Error(error.message);
}

export async function updatePositionResults(
  pulseId: string,
  winningSide: "yes" | "no",
): Promise<number> {
  const { data, error } = await positions()
    .select("id, side")
    .eq("pulse_id", pulseId);
  if (error) throw new Error(error.message);
  if (!data?.length) return 0;

  let updated = 0;
  for (const row of data) {
    if (!row.side) continue;
    const result = row.side === winningSide ? "win" : "loss";
    const { error: upErr } = await positions().update({ result }).eq("id", row.id);
    if (upErr) throw new Error(upErr.message);
    updated += 1;
  }
  return updated;
}

export async function updateProofVerifyTx(
  pulseId: string,
  verifyTx: string,
): Promise<void> {
  const { error } = await proofBundles()
    .update({ verify_tx: verifyTx })
    .eq("pulse_id", pulseId);
  if (error) throw new Error(error.message);
}

/** Phase B crank — settled pulse with proof bundle but no on-chain verify tx yet. */
export async function listPulsesReadyForPhaseB(limit = 20): Promise<PulseRow[]> {
  const pulses = await listRecentPulses(80);
  const out: PulseRow[] = [];
  for (const pulse of pulses) {
    if (pulse.status !== "settled") continue;
    if (!pulse.onchain_pool_pubkey || !pulse.winning_side) continue;
    const proof = await getProofBundle(pulse.id);
    if (!proof?.settlement_json || proof.verify_tx) continue;
    out.push(pulse);
    if (out.length >= limit) break;
  }
  return out;
}
