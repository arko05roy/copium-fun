"use client";

import { COPIUM_TAGLINE, SOLANA_DEVNET } from "@copium/config";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AgentReasoning } from "../components/agent-reasoning";
import { DeskTape, type TapeRow } from "../components/desk-tape";
import { PnlBoard, type PnlRow } from "../components/pnl-board";

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-desk-mono",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-desk-display",
});

export default function DeskPage() {
  const [tape, setTape] = useState<TapeRow[]>([]);
  const [pnl, setPnl] = useState<PnlRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ingestLive, setIngestLive] = useState(false);
  const [agentLive, setAgentLive] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [tapeRes, pnlRes, healthRes] = await Promise.all([
        fetch("/api/desk/tape"),
        fetch("/api/desk/pnl"),
        fetch("/api/stack/health"),
      ]);
      const tapeJson = (await tapeRes.json()) as { ok: boolean; tape?: TapeRow[]; error?: string };
      const pnlJson = (await pnlRes.json()) as { ok: boolean; board?: PnlRow[]; error?: string };
      const healthJson = (await healthRes.json()) as {
        ingest?: { reachable?: boolean };
        agent?: { reachable?: boolean; counters?: { tradesExecuted?: number } };
      };
      if (!tapeJson.ok) throw new Error(tapeJson.error ?? "tape failed");
      if (!pnlJson.ok) throw new Error(pnlJson.error ?? "pnl failed");
      setTape(tapeJson.tape ?? []);
      setPnl(pnlJson.board ?? []);
      setIngestLive(Boolean(healthJson.ingest?.reachable));
      setAgentLive(Boolean(healthJson.agent?.reachable));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "refresh failed");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [refresh]);

  const officerCount = tape.filter((r) => r.agent_slug === "officer-copium").length;
  const quantCount = tape.filter((r) => r.agent_slug === "quant").length;

  return (
    <div
      className={`${plexMono.variable} ${newsreader.variable} desk-surface min-h-screen bg-[var(--desk-bg)] text-[var(--desk-fg)]`}
      style={{ fontFamily: "var(--font-desk-mono), ui-monospace, monospace" }}
    >
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--desk-border)] pb-8">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--desk-muted)]">
              Track 2 · Agent Desk · §17B
            </p>
            <h1
              className="text-3xl font-medium leading-tight sm:text-4xl"
              style={{ fontFamily: "var(--font-desk-display), Georgia, serif" }}
            >
              Public trading floor
            </h1>
            <p className="max-w-xl text-sm text-[var(--desk-muted)]">{COPIUM_TAGLINE}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider">
            <span
              className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 ${
                ingestLive
                  ? "border-[var(--desk-valid)]/40 text-[var(--desk-valid)]"
                  : "border-[var(--desk-border)] text-[var(--desk-muted)]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${ingestLive ? "bg-[var(--desk-valid)] animate-pulse" : "bg-[var(--desk-muted)]"}`}
              />
              TxLINE SSE
            </span>
            <span
              className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 ${
                agentLive
                  ? "border-[var(--desk-valid)]/40 text-[var(--desk-valid)]"
                  : "border-[var(--desk-border)] text-[var(--desk-muted)]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${agentLive ? "bg-[var(--desk-valid)]" : "bg-[var(--desk-muted)]"}`}
              />
              agent-runtime
            </span>
            <span className="rounded border border-[var(--desk-border)] px-2.5 py-1 text-[var(--desk-muted)]">
              {SOLANA_DEVNET.cluster}
            </span>
          </div>
        </header>

        {error ? <p className="mb-4 font-mono text-sm text-[var(--desk-invalid)]">{error}</p> : null}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="border border-[var(--desk-border)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--desk-muted)]">
              Officer Copium
            </p>
            <p className="mt-2 text-2xl text-[var(--desk-accent)]">{officerCount}</p>
            <p className="mt-1 text-[10px] text-[var(--desk-muted)]">fills · fade gap &gt;20pp</p>
          </div>
          <div className="border border-[var(--desk-border)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--desk-muted)]">
              The Quant
            </p>
            <p className="mt-2 text-2xl text-[var(--desk-accent)]">{quantCount}</p>
            <p className="mt-1 text-[10px] text-[var(--desk-muted)]">fills · lean toward line</p>
          </div>
          <div className="border border-[var(--desk-border)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--desk-muted)]">
              Tape
            </p>
            <p className="mt-2 text-2xl text-[var(--desk-fg)]">{tape.length}</p>
            <p className="mt-1 text-[10px] text-[var(--desk-muted)]">devnet execute_tx rows</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
          <section className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--desk-muted)]">
                  Live tape
                </h2>
                <span className="font-mono text-[10px] text-[var(--desk-muted)]">
                  {tape.length} fills
                </span>
              </div>
              <DeskTape rows={tape} />
            </div>

            <div className="space-y-4">
              <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--desk-muted)]">
                PnL board
              </h2>
              <PnlBoard rows={pnl} />
            </div>
          </section>

          <aside className="space-y-4 border border-[var(--desk-border)] p-4 lg:sticky lg:top-8 lg:self-start">
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--desk-muted)]">
              Reasoning
            </h2>
            <AgentReasoning rows={tape} />
          </aside>
        </div>

        <footer className="mt-12 border-t border-[var(--desk-border)] pt-6 font-mono text-[10px] text-[var(--desk-muted)]">
          <p>Rows from agent_trades + on-chain execute_tx. Copy/Fade builds real open_position ix.</p>
          <p className="mt-2">
            Blink registry:{" "}
            <Link href="/actions.json" className="text-[var(--desk-link)] underline">
              /actions.json
            </Link>
          </p>
          <Link href="/sim" className="mt-2 inline-block text-[var(--desk-link)] underline">
            Simulator admin
          </Link>
        </footer>
      </div>
    </div>
  );
}
