import { createDbClient } from "./client.js";
import { loadEnv } from "./env.js";

async function main() {
  loadEnv();
  const db = createDbClient();
  const { count, error } = await db
    .from("fixtures")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  console.log(`supabase ok — fixtures count ${count ?? 0}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
