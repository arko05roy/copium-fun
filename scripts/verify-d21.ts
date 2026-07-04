import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ensureRoom,
  getLatestSimulatorSession,
  listAgentTape,
  listOpenPulses,
  listSettledProofPulses,
  loadEnv,
} from "@copium/db";

loadEnv();

const ROOT = process.cwd();

function assertFile(path: string): void {
  if (!existsSync(join(ROOT, path))) {
    throw new Error(`missing ${path}`);
  }
}

async function main() {
  const required = [
    ".github/workflows/ci.yml",
    "apps/web/vercel.json",
    "apps/mobile/eas.json",
    "apps/mobile/src/components/LiveHeader.tsx",
    "apps/mobile/src/components/AgentFlyby.tsx",
    "apps/mobile/src/components/DevnetBadge.tsx",
    "apps/web/app/api/feed/context/route.ts",
    "apps/web/app/api/feed/flyby/route.ts",
    "JUDGE.md",
  ];
  for (const path of required) assertFile(path);

  const settled = await listSettledProofPulses(1);
  const proofPulse =
    settled[0] ??
    (await (async () => {
      const { listRecentPulses } = await import("@copium/db");
      const recent = await listRecentPulses(30);
      return recent.find((p) => p.status === "settled") ?? null;
    })());
  if (!proofPulse) throw new Error("no settled pulse — run pnpm verify:d12");

  const open = await listOpenPulses(1);
  const tape = await listAgentTape(1);
  if (!tape[0]) throw new Error("no agent tape — run pnpm verify:d16");

  const fixtureId =
    open[0]?.fixture_id ?? proofPulse.fixture_id ?? Number(process.env.VERIFY_D5_FIXTURE_ID ?? 17926704);
  await ensureRoom("demo", fixtureId);
  const sim = await getLatestSimulatorSession();

  const baseUrl = process.env.VERIFY_WEB_URL ?? "http://127.0.0.1:3000";
  try {
    const checks = await Promise.all([
      fetch(`${baseUrl}/api/feed/context`).then((r) => r.json()),
      fetch(`${baseUrl}/api/feed/flyby`).then((r) => r.json()),
      fetch(`${baseUrl}/proof/${proofPulse.id}`),
      fetch(`${baseUrl}/desk`),
      fetch(`${baseUrl}/room/demo`),
      fetch(`${baseUrl}/actions.json`),
    ]);
    const [ctx, fly, proofRes, deskRes, roomRes, actionsRes] = checks;
    if (!(ctx as { ok?: boolean }).ok) throw new Error("feed/context failed");
    if (!(fly as { ok?: boolean }).ok) throw new Error("feed/flyby failed");
    if (!proofRes.ok || !deskRes.ok || !roomRes.ok) throw new Error("judge path page failed");
    const actionsJson = (await actionsRes.json()) as { rules?: unknown[] };
    if (!actionsRes.ok || !actionsJson.rules?.length) throw new Error("actions.json failed");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("fetch failed") && !msg.includes("ECONNREFUSED")) throw err;
    console.log("verify:d21 — web not running, file + DB checks only");
  }

  console.log("verify:d21 ok — dev ship checklist");
  console.log({
    ci: ".github/workflows/ci.yml",
    deploy: "apps/web/vercel.json",
    mobile: "apps/mobile/eas.json",
    judgePaths: ["/proof", "/desk", "/room/demo"],
    feedApis: ["/api/feed/context", "/api/feed/flyby"],
    simSession: sim?.id ?? "none — pnpm verify:d5",
    remaining: "Loom videos · Superteam forms · eas build · Vercel deploy",
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
