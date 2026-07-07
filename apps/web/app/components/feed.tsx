"use client";

import { COPIUM_TAGLINE } from "@copium/config";
import { useWalletConnection } from "@solana/react-hooks";
import { Fraunces } from "next/font/google";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { BetPanel } from "./bet-panel";
import { CardStack } from "./card-stack";
import { DevnetBadge } from "./devnet-badge";
import type { FeedContext, FeedPulse } from "@/lib/feed-types";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-feed-display",
  display: "swap",
});

export function Feed() {
  const { wallet, status, connect, connectors, disconnect } =
    useWalletConnection();
  const [pulses, setPulses] = useState<FeedPulse[]>([]);
  const [context, setContext] = useState<FeedContext | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [openRes, ctxRes] = await Promise.all([
        fetch(
          `/api/feed/open?limit=10${
            selectedTopic !== "all"
              ? `&topic=${encodeURIComponent(selectedTopic)}`
              : ""
          }`
        ),
        fetch("/api/feed/context"),
      ]);
      const openJson = (await openRes.json()) as {
        ok?: boolean;
        pulses?: FeedPulse[];
        error?: string;
      };
      const ctxJson = (await ctxRes.json()) as {
        ok?: boolean;
        context?: FeedContext;
      };
      if (!openRes.ok || !openJson.ok || !openJson.pulses) {
        throw new Error(openJson.error ?? "feed fetch failed");
      }
      setPulses(openJson.pulses);
      setContext(ctxJson.context ?? null);
      setIndex((i) => Math.min(i, Math.max(0, openJson.pulses!.length - 1)));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "feed load failed");
    } finally {
      setLoading(false);
    }
  }, [selectedTopic]);

  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const id = setInterval(() => void load(), 5000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  const current = pulses[index] ?? null;
  const topicOptions = [
    "all",
    ...new Set(
      pulses
        .map((pulse) => pulse.topic ?? pulse.sport)
        .filter((value): value is string => Boolean(value))
    ),
  ];

  function advance() {
    setIndex((i) => i + 1);
  }

  async function handleSwipe(side: "yes" | "no") {
    document.getElementById(`bet-${side}`)?.click();
  }

  const address = wallet?.account.address.toString();

  return (
    <div
      className={`feed-surface ${fraunces.variable} min-h-screen bg-[var(--feed-bg)] text-[var(--feed-fg)]`}
      style={{ fontFamily: "var(--font-feed-display), Georgia, serif" }}
    >
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-[10px] uppercase tracking-[0.2em] text-[var(--feed-kicker)] hover:text-[var(--feed-accent)]"
              >
                copium.fun
              </Link>
              <DevnetBadge />
            </div>
            <h1 className="text-2xl text-[var(--feed-fg)] sm:text-3xl">
              {COPIUM_TAGLINE}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--feed-muted)]">
              One live Pulse per match moment: TxLINE triggers it, the crowd and
              agents take sides, then proof settles it.
            </p>
            {current ? (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <div className="mr-2 flex flex-wrap items-center gap-2">
                  {topicOptions.map((topic) => {
                    const active = selectedTopic === topic;
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => {
                          setSelectedTopic(topic);
                          setIndex(0);
                        }}
                        className={
                          active
                            ? "rounded-full bg-[var(--feed-accent)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#071510]"
                            : "rounded-full border border-[var(--feed-border)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--feed-kicker)]"
                        }
                      >
                        {topic === "all" ? "all live" : topic}
                      </button>
                    );
                  })}
                </div>
                <span className="rounded-full border border-[var(--feed-border)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--feed-kicker)]">
                  {current.topic ?? current.sport ?? "live"}
                </span>
                {current.template_id ? (
                  <span className="rounded-full border border-[var(--feed-border)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--feed-muted)]">
                    {current.template_id.replace(/_/g, " ")}
                  </span>
                ) : null}
                <span className="text-xs text-[var(--feed-muted)]">
                  {current.settlementLabel}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {context ? (
              <div className="rounded-xl border border-[var(--feed-border)] bg-[#0b1f14] px-4 py-2 text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--feed-kicker)]">
                  {context.matchName}
                </p>
                <p className="text-xl tabular-nums">{context.score}</p>
                <p className="font-mono text-xs text-[var(--feed-accent)]">
                  {context.minute != null
                    ? `${context.minute}'`
                    : context.phase}
                  {context.source === "txline"
                    ? " · TxLINE"
                    : context.source === "sim"
                      ? " · sim"
                      : null}
                </p>
              </div>
            ) : null}

            {status === "connected" && address ? (
              <div className="flex items-center gap-2">
                <span className="max-w-[140px] truncate rounded-lg border border-[var(--feed-border)] px-3 py-2 font-mono text-[10px]">
                  {address.slice(0, 4)}…{address.slice(-4)}
                </span>
                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="rounded-lg border border-[var(--feed-border)] px-3 py-2 text-xs text-[var(--feed-muted)] hover:text-[var(--feed-fg)]"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const phantom = connectors.find((c) =>
                    /phantom/i.test(c.name)
                  );
                  void connect(phantom?.id ?? connectors[0]?.id ?? "");
                }}
                className="rounded-lg bg-[var(--feed-accent)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#071510]"
              >
                Connect wallet
              </button>
            )}
          </div>
        </header>

        {error ? (
          <p className="text-sm text-[var(--feed-no)]">{error}</p>
        ) : null}

        {loading ? (
          <p className="py-20 text-center text-sm text-[var(--feed-muted)]">
            Loading pulses…
          </p>
        ) : pulses.length === 0 ? (
          <p className="py-20 text-center text-sm text-[var(--feed-muted)]">
            No open pulses — run the simulator or orchestrator to spawn one.
          </p>
        ) : index >= pulses.length ? (
          <p className="py-20 text-center text-sm text-[var(--feed-muted)]">
            You&apos;re through the deck. Closed Pulses cannot be voted on; copy
            or fade an agent when the next TxLINE-triggered Pulse opens.
          </p>
        ) : (
          <div className="grid flex-1 items-start gap-8 lg:grid-cols-2">
            <CardStack
              pulses={pulses}
              currentIndex={index}
              onSwipe={handleSwipe}
            />
            <BetPanel
              pulse={current}
              onSuccess={() => {
                advance();
                void load();
              }}
              onSkip={advance}
            />
          </div>
        )}
      </div>
    </div>
  );
}
