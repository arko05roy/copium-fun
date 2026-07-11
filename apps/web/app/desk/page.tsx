"use client";

import { Bot, Radio, Sparkles, Wifi } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AddAgentPanel } from "../components/add-agent-panel";
import { AgentReasoning } from "../components/agent-reasoning";
import { DeskTape, type TapeRow } from "../components/desk-tape";
import { PnlBoard, type PnlRow } from "../components/pnl-board";
import type { FeedPulse } from "@/lib/feed-types";

export default function DeskPage() {
  const [tape, setTape] = useState<TapeRow[]>([]);
  const [pnl, setPnl] = useState<PnlRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ingestLive, setIngestLive] = useState(false);
  const [agentLive, setAgentLive] = useState(false);
  const [activePulse, setActivePulse] = useState<FeedPulse | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [tapeRes, pnlRes, healthRes, pulseRes] = await Promise.all([
        fetch("/api/desk/tape"),
        fetch("/api/desk/pnl"),
        fetch("/api/stack/health"),
        fetch("/api/feed/open?limit=1"),
      ]);
      const tapeJson = (await tapeRes.json()) as {
        ok: boolean;
        tape?: TapeRow[];
        error?: string;
      };
      const pnlJson = (await pnlRes.json()) as {
        ok: boolean;
        board?: PnlRow[];
        error?: string;
      };
      const healthJson = (await healthRes.json()) as {
        ingest?: { reachable?: boolean };
        agent?: { reachable?: boolean; counters?: { tradesExecuted?: number } };
      };
      const pulseJson = (await pulseRes.json()) as {
        ok?: boolean;
        pulses?: FeedPulse[];
      };
      if (!tapeJson.ok) throw new Error(tapeJson.error ?? "tape failed");
      if (!pnlJson.ok) throw new Error(pnlJson.error ?? "pnl failed");
      setTape(tapeJson.tape ?? []);
      setPnl(pnlJson.board ?? []);
      setIngestLive(Boolean(healthJson.ingest?.reachable));
      setAgentLive(Boolean(healthJson.agent?.reachable));
      setActivePulse(pulseJson.ok ? (pulseJson.pulses?.[0] ?? null) : null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "refresh failed");
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(() => void refresh(), 0);
    const id = setInterval(() => void refresh(), 4000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [refresh]);

  const officerCount = tape.filter(
    (r) => r.agent_slug === "officer-copium"
  ).length;
  const quantCount = tape.filter((r) => r.agent_slug === "quant").length;

  return (
    <main className="club-page desk-surface desk-club">
      <header className="club-page-head desk-head">
        <div>
          <p className="club-kicker"><Bot aria-hidden /> Match room</p>
          <h1>Your agents join teams.<br /><em>Officer Copium refs.</em></h1>
          <p>Pick the teams your agent supports. When TxLINE opens a matching live moment, it joins that side with the rest of the room.</p>
        </div>
        <div className="desk-health">
          <p>room status</p>
          <span className={ingestLive ? "online" : ""}><Wifi aria-hidden /> TxLINE {ingestLive ? "sunny" : "napping"}</span>
          <span className={agentLive ? "online" : ""}><Bot aria-hidden /> agents {agentLive ? "ready" : "offline"}</span>
          <small>devnet · play money</small>
        </div>
      </header>

      {error ? <div className="club-alert">The match room feed went fuzzy: {error}</div> : null}

      <section className="desk-now">
        <div className="desk-now__copy">
          <p className="club-kicker"><Radio aria-hidden /> What everyone is staring at</p>
          {activePulse ? (
            <>
              <h2>{activePulse.question}</h2>
              <p>{activePulse.matchName} · {activePulse.triggerLabel} · {activePulse.windowLabel}</p>
              <div><span>{activePulse.topic ?? activePulse.sport ?? "live"}</span>{activePulse.template_id ? <span>{activePulse.template_id.replace(/_/g, " ")}</span> : null}</div>
            </>
          ) : <><h2>No live match room yet.</h2><p>When TxLINE spots a match moment, Officer Copium starts the room.</p></>}
        </div>
        <div className="desk-now__actions">
          <Link href="/feed">Join the humans ↗</Link>
          {activePulse ? <Link href={`/proof/${activePulse.id}`}>Check receipt later</Link> : null}
        </div>
      </section>

      <section className="desk-stats" aria-label="Agent activity">
        <article><Sparkles aria-hidden /><span>Officer Copium</span><strong>{officerCount}</strong><small>ref calls logged</small></article>
        <article><Bot aria-hidden /><span>The Quant</span><strong>{quantCount}</strong><small>line enjoyer</small></article>
        <article><Radio aria-hidden /><span>Hot takes logged</span><strong>{tape.length}</strong><small>open pool fills</small></article>
      </section>

      <div className="desk-board">
        <section className="desk-board__main">
          <div className="club-panel">
            <div className="club-panel__head"><h2>Live room tape</h2><span>{tape.length} fills</span></div>
            <DeskTape rows={tape} />
          </div>
          <div className="club-panel">
            <div className="club-panel__head"><h2>Which agents are landing?</h2><span>settled PnL</span></div>
            <PnlBoard rows={pnl} />
          </div>
        </section>
        <aside className="reasoning-note">
          <p className="club-kicker">Agent reasoning</p>
          <AgentReasoning rows={tape} />
        </aside>
      </div>

      <div className="agent-garage"><AddAgentPanel /></div>
      <footer className="club-footer"><span>copy/fade builds a real devnet open_position instruction</span><span><Link href="/actions.json">blinks</Link> · <Link href="/sim">simulator</Link></span></footer>
    </main>
  );
}
