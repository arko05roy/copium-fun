"use client";

import { useEffect, useMemo, useState } from "react";

import { CardStack as AceternityCardStack } from "@/components/ui/card-stack";
import type { FeedPulse } from "@/lib/feed-types";

type PulseCardStackProps = {
  pulses: FeedPulse[];
  currentIndex: number;
  onSwipe: (side: "yes" | "no") => void;
};

function secondsLeft(closesAt: string): number {
  return Math.max(
    0,
    Math.floor((new Date(closesAt).getTime() - Date.now()) / 1000)
  );
}

function formatRemaining(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function PulseCardBody({ pulse, live }: { pulse: FeedPulse; live?: boolean }) {
  const [remaining, setRemaining] = useState(() =>
    secondsLeft(pulse.closes_at)
  );

  useEffect(() => {
    if (!live) return;
    const tick = () => setRemaining(secondsLeft(pulse.closes_at));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [live, pulse.closes_at]);

  const crowdYes = pulse.crowd_yes_pct ?? 50;
  const line = pulse.line_pct ?? 50;
  const gap = Math.abs(crowdYes - line);

  return (
    <div className="flex h-full flex-col gap-5 text-[var(--feed-fg)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.22em] text-[var(--feed-kicker)]">Window remaining</p>
          <span className="feed-display text-5xl tabular-nums">{live ? formatRemaining(remaining) : "—"}</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--feed-kicker)]">
          gap {gap.toFixed(0)}pp
        </span>
      </div>

      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--feed-kicker)]">
          {pulse.matchName}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--feed-muted)]">
          {pulse.triggerLabel} · Spawner-created
        </p>
      </div>

        <p className="feed-display text-2xl leading-snug line-clamp-6">{pulse.question}</p>

      <div className="mt-auto space-y-3">
        <div className="relative h-3 overflow-hidden rounded-sm bg-[#0b1f14]">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--feed-accent)] opacity-85"
            style={{ width: `${crowdYes}%` }}
          />
          <div
            className="absolute top-[-2px] h-4 w-0.5 bg-[var(--feed-line)]"
            style={{ left: `${line}%` }}
          />
        </div>
        <div className="flex justify-between text-xs font-semibold tracking-wide">
          <span className="text-[var(--feed-muted)]">
            Crowd {crowdYes.toFixed(0)}% YES
          </span>
          <span className="text-[var(--feed-line)]">
            Line {line.toFixed(0)}%
          </span>
        </div>
        {live ? (
          <div className="flex justify-between text-xs font-semibold tracking-wide">
            <span className="text-[var(--feed-no)]">← NO</span>
            <span className="text-[var(--feed-accent)]">YES →</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CardStack({
  pulses,
  currentIndex,
  onSwipe,
}: PulseCardStackProps) {
  const visible = pulses.slice(currentIndex, currentIndex + 3);

  const items = useMemo(
    () =>
      visible.map((pulse, i) => ({
        id: pulse.id,
        content: <PulseCardBody pulse={pulse} live={i === 0} />,
      })),
    [visible]
  );

  if (visible.length === 0) {
    return (
      <div className="flex h-[32rem] items-center justify-center rounded-3xl border border-[var(--feed-border)] bg-[var(--feed-card)] text-sm text-[var(--feed-muted)]">
        No more pulses
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <AceternityCardStack
        items={items}
        offset={14}
        scaleFactor={0.04}
        onSwipe={onSwipe}
        cardClassName="cursor-grab border-[var(--feed-border)] bg-[var(--feed-card)] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)] active:cursor-grabbing"
      />
    </div>
  );
}
