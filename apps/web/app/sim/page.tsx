"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type StackHealth = {
  ok: boolean;
  redis: boolean;
  ingest: { reachable: boolean; service?: string; counters?: Record<string, number> };
  orchestrator: {
    reachable: boolean;
    spawnLogCount?: number;
    spawnLog?: Array<{
      action: string;
      pulse?: { question: string; pulseType: string };
      at?: string;
    }>;
    counters?: { wouldSpawn?: number; eventsSeen?: number };
  };
  supabase: { ok: boolean; tables?: Record<string, number> };
};

function StatusDot({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${on ? "bg-emerald-600" : "bg-zinc-300"}`}
    />
  );
}

export default function SimIndexPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<StackHealth | null>(null);

  useEffect(() => {
    const poll = () =>
      void fetch("/api/stack/health")
        .then((r) => r.json())
        .then((data: StackHealth) => setHealth(data))
        .catch(() => setHealth(null));
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  const build = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sim/build", { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "build failed");
      router.push(`/sim/${json.sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "build failed");
    } finally {
      setBusy(false);
    }
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-8 font-mono text-sm">
      <h1 className="text-2xl font-semibold">Fixture simulator (D7)</h1>
      <p className="text-zinc-600 text-xs">
        Real TxLINE historical bundle → Redis replay → orchestrator logs{" "}
        <code>would_spawn_pulse</code>. Run <code>pnpm orchestrator:listen</code> for live M1.
      </p>

      {health ? (
        <div className="space-y-2 rounded border border-zinc-200 p-4 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <StatusDot on={health.redis} /> Redis
            </span>
            <span>{health.redis ? "up" : "down — pnpm redis:up"}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <StatusDot on={health.ingest.reachable} /> txline-ingest
            </span>
            <span>{health.ingest.reachable ? ":9090" : "offline — pnpm txline:ingest"}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <StatusDot on={health.orchestrator.reachable} /> pulse-orchestrator
            </span>
            <span>
              {health.orchestrator.reachable
                ? `spawn ${health.orchestrator.counters?.wouldSpawn ?? 0}`
                : "offline — pnpm orchestrator:listen"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <StatusDot on={health.supabase.ok} /> Supabase
            </span>
            <span>
              {health.supabase.ok
                ? `${health.supabase.tables?.simulator_sessions ?? 0} sim sessions`
                : "schema missing"}
            </span>
          </div>
          {health.orchestrator.spawnLog?.length ? (
            <div className="mt-3 space-y-1 border-t border-zinc-100 pt-2">
              <div className="text-zinc-500">recent spawn log</div>
              {health.orchestrator.spawnLog.slice(0, 3).map((row, i) => (
                <div key={i} className="truncate text-[10px]">
                  {row.action === "would_spawn_pulse" ? (
                    <span className="text-emerald-800">{row.pulse?.question}</span>
                  ) : (
                    <span className="text-zinc-400">skip</span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-zinc-500 text-xs">checking stack…</p>
      )}

      {error ? <p className="text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={build}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Fetching TxLINE historical…" : "Build session from historical"}
      </button>
    </main>
  );
}
