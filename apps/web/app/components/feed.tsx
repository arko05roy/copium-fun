"use client";

import { Flame, RefreshCw, Waves } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { BetPanel } from "./bet-panel";
import { CardStack } from "./card-stack";
import type { FeedContext, FeedPulse } from "@/lib/feed-types";

export function Feed() {
  const [pulses, setPulses] = useState<FeedPulse[]>([]);
  const [context, setContext] = useState<FeedContext | null>(null);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [openRes, ctxRes] = await Promise.all([
        fetch(`/api/feed/open?limit=10${selectedTopic !== "all" ? `&topic=${encodeURIComponent(selectedTopic)}` : ""}`),
        fetch("/api/feed/context"),
      ]);
      const openJson = (await openRes.json()) as { ok?: boolean; pulses?: FeedPulse[]; error?: string };
      const ctxJson = (await ctxRes.json()) as { context?: FeedContext };
      if (!openRes.ok || !openJson.ok || !openJson.pulses) throw new Error(openJson.error ?? "feed fetch failed");
      setPulses(openJson.pulses); setContext(ctxJson.context ?? null);
      setIndex((i) => Math.min(i, Math.max(0, openJson.pulses!.length - 1))); setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : "feed load failed"); }
    finally { setLoading(false); }
  }, [selectedTopic]);

  useEffect(() => { const first = setTimeout(() => void load(), 0); const id = setInterval(() => void load(), 5000); return () => { clearTimeout(first); clearInterval(id); }; }, [load]);

  const current = pulses[index] ?? null;
  const topics = ["all", ...new Set(pulses.map((p) => p.topic ?? p.sport).filter((v): v is string => Boolean(v)))];
  const advance = () => setIndex((i) => i + 1);

  return (
    <main className="club-page feed-club">
      <header className="club-page-head feed-head">
        <div>
          <p className="club-kicker"><Waves aria-hidden /> The pulse pool</p>
          <h1>Fresh takes,<br /><em>still warm.</em></h1>
          <p>Swipe fast. These little markets evaporate in 90 seconds.</p>
        </div>
        <div className="match-bubble">
          <span>{context?.matchName ?? "Waiting for kickoff"}</span>
          <strong>{context?.score ?? "– : –"}</strong>
          <small>{context ? `${context.minute != null ? `${context.minute}'` : context.phase} · ${context.source === "sim" ? "SIM" : "TXLINE"}` : "warming up"}</small>
        </div>
      </header>

      <nav className="club-filters" aria-label="Market topics">
        <span><Flame aria-hidden /> open now</span>
        {topics.map((topic) => (
          <button key={topic} className={selectedTopic === topic ? "active" : ""} onClick={() => { setSelectedTopic(topic); setIndex(0); }}>
            {topic === "all" ? "everything" : topic}
          </button>
        ))}
        <small><RefreshCw aria-hidden /> every 5s</small>
      </nav>

      {error ? <div className="club-alert">Couldn’t refresh the pool: {error}</div> : null}
      {loading ? (
        <div className="club-empty"><span className="empty-orbit" /><h2>Skimming the pool…</h2></div>
      ) : pulses.length === 0 ? (
        <div className="club-empty"><span>nothing splashing rn</span><h2>The pool is suspiciously calm.</h2><p>Hang around. TxLINE will toss in the next match moment.</p></div>
      ) : index >= pulses.length ? (
        <div className="club-empty"><span>all caught up</span><h2>You cleared the pool.</h2><p>Fresh nonsense appears as the match moves.</p></div>
      ) : (
        <section className="feed-lounge">
          <aside className="pulse-queue">
            <div className="pulse-queue__head"><span>up next</span><strong>{pulses.length - index}</strong></div>
            {pulses.slice(index).map((pulse, i) => (
              <button key={pulse.id} className={i === 0 ? "selected" : ""} onClick={() => setIndex(index + i)}>
                <span className="queue-dot" />
                <span><b>{pulse.topic ?? pulse.sport ?? "match"}</b><small>{pulse.template_id?.replaceAll("_", " ") ?? "pulse"}</small></span>
                <strong>{pulse.line_pct?.toFixed(0) ?? "50"}%</strong>
              </button>
            ))}
          </aside>
          <div className="swipe-cabana">
            <div className="swipe-cabana__head"><span>grab + fling</span><span>{index + 1} / {pulses.length}</span></div>
            <CardStack pulses={pulses} currentIndex={index} onSwipe={(side) => document.getElementById(`bet-${side}`)?.click()} />
            <p>← no thanks · yeah sure →</p>
          </div>
          <BetPanel pulse={current} onSuccess={() => { advance(); void load(); }} onSkip={advance} />
        </section>
      )}

      <footer className="club-footer"><span>copium.fun · the takes are hot, the funds are fake</span><span>devnet · TxLINE · verified</span></footer>
    </main>
  );
}
