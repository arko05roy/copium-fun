"use client";

import { Activity, Bot, FileCheck, Radio } from "lucide-react";
import Link from "next/link";

import { DevnetBadge } from "./devnet-badge";

const views = [
  {
    href: "/feed",
    title: "Live Feed",
    description:
      "Watch the active match Pulse, see the crowd vs TxLINE, and swipe before the 90-second window closes.",
    kicker: "Fan view",
    icon: Radio,
  },
  {
    href: "/desk",
    title: "Agent Desk",
    description:
      "See public agents trading the same Pulse, then copy or fade their position while the pool is open.",
    kicker: "Strategy view",
    icon: Bot,
  },
  {
    href: "/proof",
    title: "Proof",
    description:
      "After the window closes, TxLINE verification settles the Pulse and leaves a public bundle.",
    kicker: "Settlement view",
    icon: FileCheck,
  },
  {
    href: "/room/demo",
    title: "Duel Room",
    description:
      "Join friends around the same match and score each settled Pulse head-to-head.",
    kicker: "Social view",
    icon: Activity,
  },
] as const;

const steps = [
  "TxLINE sees a live match event",
  "A 90-second Pulse opens",
  "Crowd and agents take YES/NO positions",
  "TxLINE proof settles receipts, PnL, and duels",
] as const;

export function Landing() {
  return (
    <div className="landing-surface min-h-screen bg-[var(--landing-bg)] px-5 py-8 text-[var(--landing-fg)] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--landing-muted)]"
          >
            copium.fun
          </Link>
          <DevnetBadge className="!border-[var(--landing-border)] !text-[var(--landing-muted)]" />
        </header>

        <main className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1fr_28rem]">
          <section className="max-w-3xl space-y-8">
            <div className="space-y-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--landing-pulse)]">
                One Pulse · Feed, agents, proof
              </p>
              <h1 className="text-5xl font-semibold leading-none tracking-[-0.04em] sm:text-7xl">
                Every match moment becomes a market.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--landing-muted)]">
                TxLINE spots the live event. A 90-second YES/NO Pulse opens. The
                crowd swipes, agents trade the same pool, and TxLINE settles the
                outcome with proof.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-4"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--landing-pulse)]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 text-sm leading-5 text-[var(--landing-fg)]">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="rounded-xl bg-[var(--landing-pulse)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#071510]"
              >
                Enter live feed
              </Link>
              <Link
                href="/desk"
                className="rounded-xl border border-[var(--landing-border)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[var(--landing-fg)] hover:border-[var(--landing-pulse)]"
              >
                Watch agents
              </Link>
            </div>
          </section>

          <aside className="space-y-3">
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <Link
                  key={view.href}
                  href={view.href}
                  className="group block rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-5 transition hover:border-[var(--landing-pulse)] hover:bg-[#0c1410]"
                >
                  <div className="flex items-start gap-4">
                    <span className="rounded-xl border border-[var(--landing-border)] p-2 text-[var(--landing-pulse)]">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--landing-muted)]">
                        {view.kicker}
                      </p>
                      <p className="mt-1 text-xl font-semibold">
                        {view.title} →
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--landing-muted)]">
                        {view.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </aside>
        </main>

        <footer className="border-t border-[var(--landing-border)] py-5 text-xs text-[var(--landing-muted)]">
          Present for the window? Swipe. Missed it? Copy or fade an agent next
          time, then inspect the proof and receipt after settlement.
        </footer>
      </div>
    </div>
  );
}
