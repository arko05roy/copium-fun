"use client";

import { COPIUM_TAGLINE, SOLANA_DEVNET, TXLINE_DEVNET, TXLINE_WORLDCUP_FREE_TIER } from "@copium/config";
import { useWalletConnection } from "@solana/react-hooks";
import Link from "next/link";

import { DbStatus } from "./components/db-status";
import { DevnetBadge } from "./components/devnet-badge";

const JUDGE_PATHS = [
  {
    track: "Track 1",
    title: "Pulse Settlement",
    href: "/proof",
    blurb: "TxLINE proof bundle · permissionless crank · JSON export",
    video: "BRAND-DOC §17A",
  },
  {
    track: "Track 2",
    title: "Agent Desk",
    href: "/desk",
    blurb: "Live tape · Spawner · copy/fade Blinks · PnL board",
    video: "BRAND-DOC §17B",
  },
  {
    track: "Track 3",
    title: "Match Feed",
    href: "/room/demo",
    blurb: "Mobile feed · pulse swipe · duel room · receipt share",
    video: "BRAND-DOC §17C",
  },
] as const;

export default function Home() {
  const { connectors, connect, disconnect, wallet, status } =
    useWalletConnection();

  const address = wallet?.account.address.toString();

  return (
    <div className="relative min-h-screen overflow-x-clip bg-bg1 text-foreground">
      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col gap-10 border-x border-border-low px-6 py-16">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              copium.fun
            </p>
            <DevnetBadge className="!border-border-low !text-muted" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {COPIUM_TAGLINE}
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-muted">
            TxLINE World Cup Pulses on Solana. Feed (mobile), Agent Desk, Proof
            settlement — one engine, three surfaces.
          </p>
        </header>

        <section className="w-full max-w-3xl space-y-3 rounded-2xl border border-border-low bg-card p-6 text-sm">
          <p className="text-lg font-semibold">Locked environment</p>
          <dl className="grid gap-2 font-mono text-xs">
            <div className="flex justify-between gap-4 border-b border-border-low py-2">
              <dt className="text-muted">txoracle</dt>
              <dd className="text-right">{TXLINE_DEVNET.programId}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border-low py-2">
              <dt className="text-muted">TxLINE API</dt>
              <dd className="text-right">{TXLINE_DEVNET.apiHost}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-muted">TxLINE tier</dt>
              <dd className="text-right">
                WC free · level {TXLINE_DEVNET.worldCupFreeServiceLevel} ·{" "}
                {TXLINE_WORLDCUP_FREE_TIER.delayLabel}
              </dd>
            </div>
          </dl>
          <DbStatus />
        </section>

        <section className="w-full max-w-3xl space-y-4">
          <p className="text-lg font-semibold">Judge paths</p>
          <p className="text-sm text-muted">
            Three separate demos — full walkthrough in repo root <code className="text-xs">JUDGE.md</code>.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {JUDGE_PATHS.map((path) => (
              <Link
                key={path.track}
                href={path.href}
                className="group flex flex-col gap-2 rounded-2xl border border-border-low bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {path.track}
                </span>
                <span className="text-base font-semibold">{path.title}</span>
                <span className="text-xs leading-relaxed text-muted">{path.blurb}</span>
                <span className="mt-auto text-[10px] uppercase tracking-wide text-muted/80">
                  {path.video}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="w-full max-w-3xl space-y-4 rounded-2xl border border-border-low bg-card p-6 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.35)]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-lg font-semibold">Wallet</p>
              <p className="text-sm text-muted">
                Phantom devnet — judges test free, no payment.
              </p>
            </div>
            <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground/80">
              {status === "connected" ? "Connected" : "Not connected"}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => connect(connector.id)}
                disabled={status === "connecting"}
                className="group flex items-center justify-between rounded-xl border border-border-low bg-card px-4 py-3 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex flex-col">
                  <span className="text-base">{connector.name}</span>
                  <span className="text-xs text-muted">
                    {status === "connecting"
                      ? "Connecting…"
                      : status === "connected" &&
                          wallet?.connector.id === connector.id
                        ? "Active"
                        : "Tap to connect"}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full bg-border-low transition group-hover:bg-primary/80"
                />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border-low pt-4 text-sm">
            <span className="rounded-lg border border-border-low bg-cream px-3 py-2 font-mono text-xs">
              {address ?? "No wallet connected"}
            </span>
            <button
              onClick={() => disconnect()}
              disabled={status !== "connected"}
              className="inline-flex items-center gap-2 rounded-lg border border-border-low bg-card px-3 py-2 font-medium transition hover:-translate-y-0.5 hover:shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              Disconnect
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
