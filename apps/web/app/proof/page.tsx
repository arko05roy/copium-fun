import { listSettledProofPulses, loadEnv } from "@copium/db";
import { COPIUM_TAGLINE } from "@copium/config";
import { DM_Mono, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import type { Metadata } from "next";

import { DevnetBadge } from "../components/devnet-badge";

loadEnv();

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-proof-mono",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-proof-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proof index · copium.fun",
  description: "Settled Pulse proofs — TxLINE-attested bundles on Solana devnet.",
};

function oddsRootHex(oddsProof: unknown): string | null {
  if (!oddsProof || typeof oddsProof !== "object") return null;
  const summary = (oddsProof as { summary?: { oddsSubTreeRoot?: number[] } }).summary;
  const root = summary?.oddsSubTreeRoot;
  if (!root?.length) return null;
  return root.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default async function ProofIndexPage() {
  const pulses = await listSettledProofPulses(24);

  return (
    <div
      className={`${dmMono.variable} ${sourceSerif.variable} proof-surface min-h-screen bg-[var(--proof-bg)] text-[var(--proof-fg)]`}
      style={{ fontFamily: "var(--font-proof-mono), ui-monospace, monospace" }}
    >
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-12 space-y-6 border-b border-[var(--proof-border)] pb-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--proof-muted)] hover:text-[var(--proof-accent)]"
            >
              copium.fun
            </Link>
            <DevnetBadge className="!border-[var(--proof-border)] !text-[var(--proof-muted)]" />
          </div>
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--proof-accent)]">
              §17A recordable surface
            </p>
            <h1
              className="text-balance text-3xl leading-tight sm:text-4xl"
              style={{ fontFamily: "var(--font-proof-display), Georgia, serif" }}
            >
              Pulse settlement proofs
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--proof-muted)]">
              {COPIUM_TAGLINE} Settled pulses with downloadable TxLINE bundles — no mock rows.
            </p>
          </div>
          <Link
            href="/sim"
            className="inline-block font-mono text-xs uppercase tracking-[0.14em] text-[var(--proof-accent)] underline underline-offset-4"
          >
            Fixture simulator admin →
          </Link>
        </header>

        {pulses.length === 0 ? (
          <p className="font-mono text-sm text-[var(--proof-muted)]">
            No settled proofs yet — run settlement pipeline (verify:d11 → d12).
          </p>
        ) : (
          <ol className="space-y-0 border border-[var(--proof-border)]">
            {pulses.map((pulse, index) => {
              const root = oddsRootHex(pulse.odds_proof);
              return (
                <li
                  key={pulse.id}
                  className="border-b border-[var(--proof-border)] last:border-b-0"
                >
                  <Link
                    href={`/proof/${pulse.id}`}
                    className="grid gap-3 px-4 py-5 transition hover:bg-[var(--proof-border)]/30 sm:grid-cols-[2.5rem_1fr]"
                  >
                    <span className="font-mono text-xs text-[var(--proof-muted)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="space-y-2">
                      <p
                        className="text-lg leading-snug"
                        style={{ fontFamily: "var(--font-proof-display), Georgia, serif" }}
                      >
                        {pulse.question}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-[var(--proof-muted)]">
                        <span>{pulse.pulse_type}</span>
                        {pulse.winning_side ? (
                          <span className="text-[var(--proof-valid)]">
                            {pulse.winning_side}
                          </span>
                        ) : null}
                        {pulse.verify_tx ? <span>cranked</span> : <span>phase B pending</span>}
                      </div>
                      {pulse.onchain_pool_pubkey ? (
                        <p className="truncate font-mono text-[10px] text-[var(--proof-muted)]">
                          pool {pulse.onchain_pool_pubkey}
                        </p>
                      ) : null}
                      {pulse.odds_message_id ? (
                        <p className="truncate font-mono text-[10px] text-[var(--proof-muted)]">
                          messageId {pulse.odds_message_id}
                          {root ? ` · odds root ${root.slice(0, 16)}…` : null}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
