"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export default function SimIndexPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-8 font-mono text-sm">
      <h1 className="text-2xl font-semibold">Fixture simulator (D5)</h1>
      <p className="text-zinc-600">
        Pull real TxLINE historical scores + odds for fixture 17926704, store bundle in Supabase,
        replay into Redis until first goal.
      </p>
      {error ? <p className="text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={build}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Fetching TxLINE…" : "Build session from historical"}
      </button>
    </main>
  );
}
