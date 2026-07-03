import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

function run(label: string, cmd: string, args: string[], cwd = root): void {
  const res = spawnSync(cmd, args, { cwd, stdio: "inherit", env: process.env });
  if (res.status !== 0) {
    throw new Error(`${label} failed (exit ${res.status ?? "unknown"})`);
  }
}

function main(): void {
  console.log("=== D9 copium-pulses create + open ===");

  const idl = join(root, "programs/copium-pulses/target/idl/copium_pulses.json");
  const lib = join(root, "programs/copium-pulses/programs/copium-pulses/src/lib.rs");
  if (!existsSync(lib)) throw new Error("missing copium-pulses program");

  run("config build", "pnpm", ["--filter", "@copium/config", "build"]);
  run("pulses-client build", "pnpm", ["--filter", "@copium/pulses-client", "build"]);
  run("anchor build", "pnpm", ["anchor:build"]);

  if (!existsSync(idl)) throw new Error("anchor build did not emit IDL");

  const parsed = JSON.parse(readFileSync(idl, "utf8")) as {
    instructions: { name: string }[];
  };
  const names = new Set(parsed.instructions.map((ix) => ix.name));
  for (const required of ["create_pulse", "open_position"]) {
    if (!names.has(required)) throw new Error(`IDL missing ${required}`);
  }
  console.log("IDL ok — create_pulse, open_position");

  run("anchor test", "anchor", ["test"], join(root, "programs/copium-pulses"));
  console.log("verify:d9 ok");
}

main();
