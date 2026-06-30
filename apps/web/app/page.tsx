"use client";

import { COPIUM_TAGLINE, SOLANA_DEVNET, TXLINE_DEVNET, TXLINE_WORLDCUP_FREE_TIER } from "@copium/config";
import { useWalletConnection } from "@solana/react-hooks";

import { DbStatus } from "./components/db-status";

export default function Home() {
  const { connectors, connect, disconnect, wallet, status } =
    useWalletConnection();

  const address = wallet?.account.address.toString();

  return (
    <div className="relative min-h-screen overflow-x-clip bg-bg1 text-foreground">
      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col gap-10 border-x border-border-low px-6 py-16">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            copium.fun · {SOLANA_DEVNET.cluster}
          </p>
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
            <DbStatus />
          </dl>
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
