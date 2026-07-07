import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { databaseUrl, loadEnv } from "./env.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  loadEnv();
  const db = postgres(databaseUrl(), { max: 1 });

  try {
    const migrations = readdirSync(join(root, "migrations"))
      .filter((file) => file.endsWith(".sql"))
      .sort();
    for (const file of migrations) {
      try {
        await db.unsafe(readFileSync(join(root, "migrations", file), "utf8"));
        console.log(`applied ${file}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!/already exists/i.test(message)) throw err;
        console.log(`skipped ${file} — already applied`);
      }
    }
    const tables = await db<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN (
          'fixtures', 'pulses', 'positions', 'agents', 'agent_trades',
          'rooms', 'room_members', 'receipts', 'proof_bundles',
          'simulator_sessions', 'copy_subscriptions', 'agent_secrets',
          'agent_claim_codes'
        )
      ORDER BY tablename
    `;
    console.log(`migration ok — ${tables.length} tables`);
    for (const row of tables) console.log(`  ${row.tablename}`);
    if (tables.length !== 13) process.exitCode = 1;
  } finally {
    await db.end({ timeout: 5 });
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
