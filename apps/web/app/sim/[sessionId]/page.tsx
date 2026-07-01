"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

type SessionMeta = {
  fixtureId: number;
  cursor: number;
  events: number;
  goalCursor?: number;
};

type AdvanceResult = {
  cursor: number;
  total: number;
  emitted: number;
  detected: Array<{ kind: string; detail?: Record<string, unknown> }>;
  done: boolean;
};

export default function SimSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [meta, setMeta] = useState<SessionMeta | null>(null);
  const [advance, setAdvance] = useState<AdvanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/sim/${sessionId}`);
      const json = await res.json();
      if (json.ok) setMeta(json);
    })();
  }, [sessionId]);

  const injectGoal = useCallback(async () => {
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
      setAdvance({
        cursor: json.cursor,
        total: json.total,
        emitted: json.emitted,
        detected: json.detected ?? [],
        done: json.done,
      });
      setMeta((m) => (m ? { ...m, cursor: json.cursor } : m));
    } catch (e) {
      setError(e instanceof Error ? e.message : "advance failed");
    } finally {
      setBusy(false);
    }
  }, [sessionId]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-8 font-mono text-sm">
      <Link href="/sim" className="text-zinc-500 hover:text-black">
        ← new session
      </Link>
      <h1 className="text-2xl font-semibold">Session {sessionId}</h1>
      {meta ? (
        <pre className="rounded bg-zinc-100 p-3 text-xs">{JSON.stringify(meta, null, 2)}</pre>
      ) : null}
      {error ? <p className="text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={injectGoal}
        className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Replaying…" : "Inject goal (replay until goal)"}
      </button>
      {advance ? (
        <pre className="rounded bg-zinc-100 p-3 text-xs">{JSON.stringify(advance, null, 2)}</pre>
      ) : null}
    </main>
  );
}
