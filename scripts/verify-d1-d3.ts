import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(import.meta.dirname, "..");

function run(label: string, cmd: string, args: string[]): void {
  const res = spawnSync(cmd, args, { cwd: root, stdio: "inherit", env: process.env });
  if (res.status !== 0) {
    throw new Error(`${label} failed (exit ${res.status ?? "unknown"})`);
  }
}

function assertExists(path: string): void {
  if (!existsSync(join(root, path))) throw new Error(`missing ${path}`);
}

async function checkWebHealth(): Promise<void> {
  const port = process.env.VERIFY_WEB_PORT ?? "3456";
  const proc = spawn("pnpm", ["--filter", "@copium/web", "start", "-p", port], {
    cwd: root,
    stdio: "ignore",
    env: process.env,
  });

  const deadline = Date.now() + 30_000;
  let lastErr: unknown;

  try {
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/health`);
        const body = (await res.json()) as { ok?: boolean; fixtures?: number };
        if (res.ok && body.ok) {
          console.log(`web health ok — fixtures ${body.fixtures ?? 0}`);
          return;
        }
        lastErr = body;
      } catch (err) {
        lastErr = err;
      }
    }
    throw new Error(`web /api/health failed: ${String(lastErr)}`);
  } finally {
    proc.kill("SIGTERM");
  }
}

async function main(): Promise<void> {
  console.log("=== D1 foundation ===");
  assertExists("pnpm-workspace.yaml");
  assertExists("turbo.json");
  assertExists("apps/web/package.json");
  assertExists("apps/mobile/package.json");
  assertExists("packages/config/package.json");
  assertExists("submissions/t1-settlement/README.md");
  assertExists("submissions/t2-agent-desk/README.md");
  assertExists("submissions/t3-match-feed/README.md");
  assertExists("programs/copium-pulses/Anchor.toml");
  assertExists("programs/copium-pulses/programs/copium-pulses/src/lib.rs");
  assertExists("programs/copium-pulses/programs/copium-pulses/src/state.rs");
  assertExists(".vendor/tx-on-chain/idl/txoracle.json");
  console.log("scaffold files ok");

  run("build", "pnpm", ["build"]);
  run("typecheck", "pnpm", ["typecheck"]);
  run("anchor:build", "pnpm", ["anchor:build"]);

  console.log("\n=== D2 database ===");
  run("db:health", "pnpm", ["db:health"]);

  console.log("\n=== D3 txline ===");
  run("txline:verify", "pnpm", ["txline:verify"]);

  if (process.env.TXLINE_API_TOKEN?.trim()) {
    run("txline:probe", "pnpm", ["txline:probe"]);
  } else {
    console.log("TXLINE_API_TOKEN unset — running full subscribe flow");
    run("txline:subscribe", "pnpm", ["txline:subscribe"]);
    console.log("add TXLINE_API_TOKEN from subscribe output to .env for faster probes");
  }

  console.log("\n=== web API ===");
  await checkWebHealth();

  console.log("\nD1–D3 verify ok");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
