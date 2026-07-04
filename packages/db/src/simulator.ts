import { createDbClient } from "./client.js";
import type { Json } from "./database.js";

type SimSessionRow = {
  id: string;
  fixture_id: number | null;
  bundle: Json | null;
  cursor: number | null;
};

// ponytail: supabase-js 2.49 + hand-rolled Database types infer `never` on insert; narrow here once.
function sessions() {
  return createDbClient().from("simulator_sessions") as unknown as {
    insert: (row: {
      fixture_id: number;
      bundle: Json;
      cursor: number;
    }) => {
      select: (cols: string) => {
        single: () => Promise<{ data: SimSessionRow | null; error: { message: string } | null }>;
      };
    };
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        single: () => Promise<{ data: SimSessionRow | null; error: { message: string } | null }>;
      };
    };
    update: (row: { cursor: number }) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
}

export async function insertSimulatorSession(
  fixtureId: number,
  bundle: Json,
): Promise<SimSessionRow> {
  const { data, error } = await sessions()
    .insert({
      fixture_id: fixtureId,
      bundle: JSON.parse(JSON.stringify(bundle)) as Json,
      cursor: 0,
    })
    .select("id, fixture_id, bundle, cursor")
    .single();
  if (error || !data) throw new Error(error?.message ?? "insert failed");
  return data;
}

export async function getSimulatorSession(sessionId: string): Promise<SimSessionRow> {
  const { data, error } = await sessions()
    .select("id, fixture_id, bundle, cursor")
    .eq("id", sessionId)
    .single();
  if (error || !data) throw new Error(error?.message ?? "not found");
  return data;
}

export async function updateSimulatorCursor(
  sessionId: string,
  cursor: number,
): Promise<void> {
  const { error } = await sessions().update({ cursor }).eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export async function getLatestSimulatorSession(): Promise<SimSessionRow | null> {
  const { data, error } = await (createDbClient().from("simulator_sessions") as unknown as {
    select: (cols: string) => {
      order: (
        col: string,
        opts: { ascending: boolean },
      ) => {
        limit: (n: number) => Promise<{
          data: SimSessionRow[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  })
    .select("id, fixture_id, bundle, cursor")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
}

export type { SimSessionRow };
