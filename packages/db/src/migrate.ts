import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { databaseUrl, loadEnv } from "./env.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  loadEnv();
  const sql = readFileSync(join(root, "migrations/001_pulses.sql"), "utf8");
  const db = postgres(databaseUrl(), { max: 1 });

  try {
    await db.unsafe(sql);
    const tables = await db<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN (
          'fixtures', 'pulses', 'positions', 'agents', 'agent_trades',
          'rooms', 'room_members', 'receipts', 'proof_bundles',
          'simulator_sessions', 'copy_subscriptions'
        )
      ORDER BY tablename
    `;
    console.log(`migration ok — ${tables.length} tables`);
    for (const row of tables) console.log(`  ${row.tablename}`);
    if (tables.length !== 11) process.exitCode = 1;
  } finally {
    await db.end({ timeout: 5 });
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
