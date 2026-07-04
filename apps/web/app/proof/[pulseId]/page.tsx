import { getProofBundle, getPulse, loadEnv } from "@copium/db";
import { COPIUM_TAGLINE, TXLINE_DEVNET } from "@copium/config";
import { DM_Mono, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { BundleDownload } from "../../components/bundle-download";
import { DevnetBadge } from "../../components/devnet-badge";
import { ProofSheet } from "../../components/proof-sheet";

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

type PageProps = { params: Promise<{ pulseId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pulseId } = await params;
  try {
    const pulse = await getPulse(pulseId);
    return {
      title: `Proof · ${pulse.question.slice(0, 48)} · copium.fun`,
      description: `TxLINE-attested settlement proof for pulse ${pulseId} on Solana devnet.`,
    };
  } catch {
    return { title: "Proof not found · copium.fun" };
  }
}

export default async function ProofPage({ params }: PageProps) {
  const { pulseId } = await params;

  let pulse;
  try {
    pulse = await getPulse(pulseId);
  } catch {
    notFound();
  }

  const proof = await getProofBundle(pulseId);
  const truth = (proof?.truth_json ?? null) as Parameters<typeof ProofSheet>[0]["truth"];
  const settlement = (proof?.settlement_json ?? null) as Parameters<typeof ProofSheet>[0]["settlement"];
  const bundle = (proof?.bundle_json ?? null) as Record<string, unknown> | null;
  const proofReady = Boolean(proof?.bundle_json && proof.truth_json && proof.settlement_json);

  return (
    <div
      className={`${dmMono.variable} ${sourceSerif.variable} proof-surface min-h-screen bg-[var(--proof-bg)] text-[var(--proof-fg)]`}
      style={{
        fontFamily: "var(--font-proof-mono), ui-monospace, monospace",
      }}
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
              Pulse settlement proof
            </p>
            <h1
              className="text-balance text-3xl leading-tight sm:text-4xl"
              style={{ fontFamily: "var(--font-proof-display), Georgia, serif" }}
            >
              {pulse.question}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--proof-muted)]">
              {COPIUM_TAGLINE} Public audit surface — TxLINE odds lock,{" "}
              <code className="text-[var(--proof-fg)]">validate_stat</code> on{" "}
              <span className="text-[var(--proof-fg)]">{TXLINE_DEVNET.programId.slice(0, 8)}…</span>
              , downloadable bundle JSON.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {bundle ? (
              <BundleDownload pulseId={pulseId} bundle={bundle} />
            ) : (
              <p className="font-mono text-sm text-[var(--proof-muted)]">
                Bundle not ready — pulse closed, Phase A settlement pending.
              </p>
            )}
            {pulse.winning_side ? (
              <span className="font-mono text-sm text-[var(--proof-valid)]">
                Winner · {pulse.winning_side.toUpperCase()}
              </span>
            ) : null}
          </div>
        </header>

        <ProofSheet
          pulse={pulse}
          truth={truth}
          settlement={settlement}
          verifyTx={proof?.verify_tx ?? null}
          proofReady={proofReady}
        />

        <footer className="mt-16 border-t border-[var(--proof-border)] pt-8 font-mono text-xs text-[var(--proof-muted)]">
          <p>TxLINE API · {TXLINE_DEVNET.apiHost}</p>
          <p className="mt-1">No mock data — rows from proof_bundles + pulses tables.</p>
        </footer>
      </div>
    </div>
  );
}
