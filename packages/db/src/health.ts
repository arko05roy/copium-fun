import { createDbClient } from "./client.js";
import { loadEnv } from "./env.js";
import { PULSE_SCHEMA_TABLES } from "./tables.js";

async function main() {
  loadEnv();
  const db = createDbClient();

  for (const table of PULSE_SCHEMA_TABLES) {
    const { error } = await db.from(table).select("*", { head: true, count: "exact" });
    if (error) throw new Error(`${table}: ${error.message}`);
  }

  const { count, error } = await db
    .from("fixtures")
    .select("*", { count: "exact", head: true });
  if (error) throw error;

  console.log(`supabase ok — ${PULSE_SCHEMA_TABLES.length} tables, fixtures ${count ?? 0}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
