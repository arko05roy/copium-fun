import { createServerSupabase } from "@/lib/supabase/server";
import { INGEST_META_KEY, ORCHESTRATOR_META_KEY, SPAWN_LOG_KEY } from "@copium/txline";
import { Redis } from "ioredis";
import { NextResponse } from "next/server";

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const INGEST_PORT = Number(process.env.TXLINE_INGEST_PORT ?? 9090);
const ORCHESTRATOR_PORT = Number(process.env.PULSE_ORCHESTRATOR_PORT ?? 9091);

const TABLES = ["fixtures", "pulses", "simulator_sessions"] as const;

async function fetchJson(url: string): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const body = (await res.json()) as Record<string, unknown>;
    return { ok: res.ok, body };
  } catch (err) {
    return {
      ok: false,
      body: { error: err instanceof Error ? err.message : "unreachable" },
    };
  }
}

export async function GET() {
  const redis = new Redis(REDIS_URL);
  let redisOk = false;
  let ingestMeta: string | null = null;
  let orchestratorMeta: string | null = null;
  let spawnLogCount = 0;

  try {
    redisOk = (await redis.ping()) === "PONG";
    if (redisOk) {
      ingestMeta = await redis.get(INGEST_META_KEY);
      orchestratorMeta = await redis.get(ORCHESTRATOR_META_KEY);
      spawnLogCount = await redis.llen(SPAWN_LOG_KEY);
    }
  } finally {
    redis.disconnect();
  }

  const db = createServerSupabase();
  const tables: Record<string, number> = {};
  let supabaseOk = true;
  for (const table of TABLES) {
    const { error } = await db.from(table).select("*").limit(1);
    if (error) {
      supabaseOk = false;
      break;
    }
    const { count } = await db.from(table).select("*", { count: "exact" }).limit(0);
    tables[table] = count ?? 0;
  }

  const [ingest, orchestrator] = await Promise.all([
    fetchJson(`http://127.0.0.1:${INGEST_PORT}/health`),
    fetchJson(`http://127.0.0.1:${ORCHESTRATOR_PORT}/health`),
  ]);

  return NextResponse.json({
    ok: redisOk && supabaseOk,
    redis: redisOk,
    ingest: {
      reachable: ingest.ok,
      meta: ingestMeta ? JSON.parse(ingestMeta) : null,
      ...ingest.body,
    },
    orchestrator: {
      reachable: orchestrator.ok,
      meta: orchestratorMeta ? JSON.parse(orchestratorMeta) : null,
      spawnLogCount,
      ...orchestrator.body,
    },
    supabase: { ok: supabaseOk, tables },
  });
}
