import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

function run(label: string, cmd: string, args: string[]): void {
  const res = spawnSync(cmd, args, { cwd: root, stdio: "inherit", env: process.env });
  if (res.status !== 0) {
    throw new Error(`${label} failed (exit ${res.status ?? "unknown"})`);
  }
}

async function main(): Promise<void> {
  if (!existsSync(join(root, ".vendor/tx-on-chain/idl/txoracle.json"))) {
    console.log("cloning .vendor/tx-on-chain…");
    run("vendor:tx-on-chain", "pnpm", ["vendor:tx-on-chain"]);
  }

  console.log("=== D1–D3 + anchor (D1) ===");
  run("verify:d1-d3", "node", ["--import", "tsx", "scripts/verify-d1-d3.ts"]);

  console.log("\n=== D6 pulse-engine ===");
  run("verify:d6", "pnpm", ["verify:d6"]);

  console.log("\n=== D5 simulator ===");
  run("verify:d5", "pnpm", ["verify:d5"]);

  console.log("\n=== D4 ingest (optional — needs redis + TXLINE_API_TOKEN) ===");
  if (!process.env.TXLINE_API_TOKEN?.trim()) {
    console.log("skip D4 — TXLINE_API_TOKEN unset");
    console.log("\nD1–D3 + D5 + D6 verify ok (start `pnpm txline:ingest` then `pnpm verify:d4` for live SSE)");
    return;
  }

  const ingest = spawn("pnpm", ["txline:ingest"], {
    cwd: root,
    stdio: "ignore",
    env: process.env,
  });

  try {
    run("verify:d4", "node", ["--import", "tsx", "scripts/verify-d4.ts"]);
    console.log("\nD1–D6 verify ok");
  } finally {
    ingest.kill("SIGTERM");
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
