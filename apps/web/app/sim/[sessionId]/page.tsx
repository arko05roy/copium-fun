"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

type SessionMeta = {
  fixtureId: number;
  cursor: number;
  events: number;
  goalCursor?: number;
  timeline?: Array<{ index: number; stream: string; ts: number }>;
};

type SpawnIntent = {
  action: "would_spawn_pulse" | "spawned_pulse" | "skip";
  pulse?: { question: string; pulseType: string; closesAt: number };
  pulseId?: string;
  poolPubkey?: string;
  signature?: string;
  event?: { kind: string; fixtureId?: number };
  reason?: string;
  at?: string;
};

type PulseRow = {
  id: string;
  question: string;
  pulse_type: string;
  onchain_pool_pubkey: string | null;
  odds_message_id: string | null;
  status: string | null;
};

type OrchestratorLog = {
  ok: boolean;
  entries: SpawnIntent[];
};

type AdvanceResult = {
  cursor: number;
  total: number;
  emitted: number;
  detected: Array<{ kind: string }>;
  spawnIntents?: SpawnIntent[];
  done: boolean;
  rewind?: boolean;
};

type ValidateStatResult = {
  ok: boolean;
  valid?: boolean;
  method?: string;
  dailyScoresPda?: string;
  proved?: { key: number; value: number; period: number };
  error?: string;
};

export default function SimSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [meta, setMeta] = useState<SessionMeta | null>(null);
  const [last, setLast] = useState<AdvanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scrub, setScrub] = useState(0);
  const [orchestratorLog, setOrchestratorLog] = useState<SpawnIntent[]>([]);
  const [recentPulses, setRecentPulses] = useState<PulseRow[]>([]);
  const [validateResult, setValidateResult] = useState<ValidateStatResult | null>(null);
  const [validateBusy, setValidateBusy] = useState(false);

  const refreshSpawnLog = useCallback(async () => {
    const [logRes, pulseRes] = await Promise.all([
      fetch("/api/stack/spawn-log?limit=15"),
      fetch("/api/pulses?limit=5"),
    ]);
    const json = (await logRes.json()) as OrchestratorLog;
    const pulses = (await pulseRes.json()) as { ok: boolean; pulses?: PulseRow[] };
    if (json.ok) setOrchestratorLog(json.entries);
    if (pulses.ok && pulses.pulses) setRecentPulses(pulses.pulses);
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/sim/${sessionId}`);
    const json = await res.json();
    if (json.ok) {
      setMeta(json);
      setScrub(json.cursor ?? 0);
    }
  }, [sessionId]);

  useEffect(() => {
    void refresh();
    void refreshSpawnLog();
    const id = setInterval(() => void refreshSpawnLog(), 3000);
    return () => clearInterval(id);
  }, [refresh, refreshSpawnLog]);

  const runSeek = useCallback(
    async (target: number) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/sim/${sessionId}/seek`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cursor: target }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error ?? "seek failed");
        setLast(json);
        setScrub(json.cursor);
        await refresh();
        await refreshSpawnLog();
      } catch (e) {
        setError(e instanceof Error ? e.message : "seek failed");
      } finally {
        setBusy(false);
      }
    },
    [sessionId, refresh, refreshSpawnLog],
  );

  const step = useCallback(
    async (n: number) => {
      if (!meta) return;
      await runSeek(Math.min(meta.cursor + n, meta.events));
    },
    [meta, runSeek],
  );

  const toGoal = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sim/${sessionId}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ untilGoal: true }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "advance failed");
      setLast(json);
      setScrub(json.cursor);
      await refresh();
      await refreshSpawnLog();
    } catch (e) {
      setError(e instanceof Error ? e.message : "advance failed");
    } finally {
      setBusy(false);
    }
  }, [sessionId, refresh, refreshSpawnLog]);

  const runValidateStat = useCallback(async () => {
    setValidateBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settlement/validate-stat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, pulseType: "next_goal" }),
      });
      const json = (await res.json()) as ValidateStatResult;
      setValidateResult(json);
      if (!json.ok) throw new Error(json.error ?? "validate_stat failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "validate_stat failed");
    } finally {
      setValidateBusy(false);
    }
  }, [sessionId]);

  const total = meta?.events ?? 0;
  const cursor = meta?.cursor ?? 0;
  const pct = total > 0 ? Math.round((cursor / total) * 100) : 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8 font-mono text-sm">
      <Link href="/sim" className="text-zinc-500 hover:text-black">
        ← stack health
      </Link>
      <h1 className="text-2xl font-semibold">Track 1 recorder (§17A)</h1>
      <p className="text-zinc-600 text-xs">
        Simulator admin — goal inject → pool PDA · locked messageId · validate_stat →{" "}
        <a href="/proof" className="underline">
          /proof
        </a>
      </p>
      <p className="font-mono text-[10px] text-zinc-400">{sessionId}</p>

      {meta ? (
        <div className="grid gap-2 rounded border border-zinc-200 p-4 text-xs">
          <div className="flex justify-between">
            <span>fixture</span>
            <span>{meta.fixtureId}</span>
          </div>
          <div className="flex justify-between">
            <span>cursor</span>
            <span>
              {cursor} / {total} ({pct}%)
            </span>
          </div>
          {meta.goalCursor !== undefined ? (
            <div className="flex justify-between">
              <span>goal at event</span>
              <span>{meta.goalCursor}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {total > 0 ? (
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={total}
            value={scrub}
            disabled={busy}
            onChange={(e) => setScrub(Number(e.target.value))}
            onMouseUp={() => {
              if (scrub !== cursor) void runSeek(scrub);
            }}
            onTouchEnd={() => {
              if (scrub !== cursor) void runSeek(scrub);
            }}
            className="w-full"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || cursor <= 0}
              onClick={() => void runSeek(0)}
              className="rounded border px-3 py-1 disabled:opacity-40"
            >
              reset
            </button>
            <button
              type="button"
              disabled={busy || cursor >= total}
              onClick={() => void step(1)}
              className="rounded border px-3 py-1 disabled:opacity-40"
            >
              +1 event
            </button>
            <button
              type="button"
              disabled={busy || cursor >= total}
              onClick={() => void step(10)}
              className="rounded border px-3 py-1 disabled:opacity-40"
            >
              +10
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void toGoal()}
              className="rounded bg-emerald-700 px-3 py-1 text-white disabled:opacity-50"
            >
              replay to goal
            </button>
            <button
              type="button"
              disabled={validateBusy || !meta?.goalCursor}
              onClick={() => void runValidateStat()}
              className="rounded bg-violet-800 px-3 py-1 text-white disabled:opacity-50"
            >
              {validateBusy ? "validating…" : "validate_stat"}
            </button>
          </div>
        </div>
      ) : null}

      {validateResult?.ok ? (
        <div className="rounded border border-violet-300 bg-violet-50 p-4 text-xs">
          <div className="font-semibold text-violet-900">txoracle.validate_stat → true</div>
          <div className="mt-1 text-zinc-600">
            method {validateResult.method} · stat {validateResult.proved?.key}=
            {validateResult.proved?.value}
          </div>
          <div className="mt-1 truncate text-[10px] text-zinc-500">
            PDA {validateResult.dailyScoresPda}
          </div>
        </div>
      ) : null}

      {meta?.timeline ? (
        <div className="max-h-32 overflow-y-auto rounded bg-zinc-100 p-2 text-[10px]">
          {meta.timeline.map((row) => (
            <div
              key={row.index}
              className={
                row.index < cursor
                  ? "text-zinc-400"
                  : row.index === cursor
                    ? "font-semibold text-emerald-800"
                    : ""
              }
            >
              {row.index} · {row.stream} · ts {row.ts}
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-red-700">{error}</p> : null}

      {last?.spawnIntents?.length ? (
        <div className="space-y-2">
          <h2 className="font-semibold">spawn intents (replay)</h2>
          {last.spawnIntents.map((intent, i) => (
            <div
              key={i}
              className={
                intent.action === "would_spawn_pulse"
                  ? "rounded border border-emerald-300 bg-emerald-50 p-3 text-xs"
                  : "rounded bg-zinc-100 p-2 text-xs text-zinc-500"
              }
            >
              {intent.action === "would_spawn_pulse" ? (
                <>
                  <div className="font-semibold text-emerald-900">would_spawn_pulse</div>
                  <div>{intent.pulse?.question}</div>
                  <div className="text-zinc-600">{intent.pulse?.pulseType}</div>
                </>
              ) : (
                <>
                  skip · {intent.event?.kind} — {intent.reason}
                </>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {recentPulses.length ? (
        <div className="space-y-2">
          <h2 className="font-semibold">spawned pulses (D10)</h2>
          {recentPulses.map((pulse) => (
            <div
              key={pulse.id}
              className="rounded border border-amber-300 bg-amber-50 p-3 text-xs"
            >
              <div className="font-semibold text-amber-900">{pulse.question}</div>
              <div className="text-zinc-600">
                {pulse.pulse_type} · {pulse.status} · odds {pulse.odds_message_id}
              </div>
              {pulse.onchain_pool_pubkey ? (
                <a
                  href={`https://solscan.io/account/${pulse.onchain_pool_pubkey}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate text-[10px] text-blue-700 underline"
                >
                  pool {pulse.onchain_pool_pubkey}
                </a>
              ) : null}
              {pulse.status === "settled" ? (
                <a
                  href={`/proof/${pulse.id}`}
                  className="mt-1 inline-block text-[10px] font-semibold text-violet-800 underline"
                >
                  open proof →
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {orchestratorLog.length ? (
        <div className="space-y-2">
          <h2 className="font-semibold">orchestrator spawn log (D10 E2E)</h2>
          <p className="text-[10px] text-zinc-500">
            Redis <code>orchestrator:spawn_log</code> — needs{" "}
            <code>pnpm orchestrator:listen</code>
          </p>
          {orchestratorLog.map((intent, i) => (
            <div
              key={`orch-${i}-${intent.at ?? i}`}
              className={
                intent.action === "spawned_pulse"
                  ? "rounded border border-amber-400 bg-amber-50 p-3 text-xs"
                  : intent.action === "would_spawn_pulse"
                    ? "rounded border border-blue-300 bg-blue-50 p-3 text-xs"
                    : "rounded bg-zinc-100 p-2 text-xs text-zinc-500"
              }
            >
              {intent.action === "spawned_pulse" ? (
                <>
                  <div className="font-semibold text-amber-900">spawned_pulse</div>
                  <div>{intent.pulse?.question}</div>
                  <div className="text-zinc-600">pulse {intent.pulseId}</div>
                  {intent.poolPubkey ? (
                    <a
                      href={`https://explorer.solana.com/address/${intent.poolPubkey}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate text-[10px] text-blue-700 underline"
                    >
                      pool {intent.poolPubkey}
                    </a>
                  ) : null}
                </>
              ) : intent.action === "would_spawn_pulse" ? (
                <>
                  <div className="font-semibold text-blue-900">would_spawn_pulse</div>
                  <div>{intent.pulse?.question}</div>
                  <div className="text-zinc-600">
                    {intent.pulse?.pulseType} · fixture {intent.event?.fixtureId}
                  </div>
                  {intent.at ? <div className="text-zinc-400">{intent.at}</div> : null}
                </>
              ) : (
                <>
                  skip · {intent.event?.kind} — {intent.reason}
                </>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {last && !last.spawnIntents?.length ? (
        <pre className="rounded bg-zinc-100 p-3 text-xs">
          {JSON.stringify(
            {
              cursor: last.cursor,
              emitted: last.emitted,
              detected: last.detected,
              rewind: last.rewind,
            },
            null,
            2,
          )}
        </pre>
      ) : null}
    </main>
  );
}
