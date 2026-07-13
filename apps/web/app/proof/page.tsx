import { listSettledProofPulses, loadEnv } from "@copium/db";
import { CheckCircle2, FileCheck2, Fingerprint } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

loadEnv();

export const metadata: Metadata = {
  title: "Proof index · copium.fun",
  description: "Settled Pulse proofs — TxLINE-attested bundles on Solana devnet.",
};

// This authenticated product surface is protected by the waitlist proxy. Keep
// it request-time only so a marketing deployment never queries Supabase while
// generating static pages.
export const dynamic = "force-dynamic";

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
    <main className="club-page proof-surface proof-club">
      <header className="club-page-head proof-head">
        <div>
          <p className="club-kicker"><Fingerprint aria-hidden /> The receipts hut</p>
          <h1>Okay, but did it<br /><em>actually happen?</em></h1>
          <p>Every settled pulse leaves a TxLINE bundle and an onchain trail. Boring enough to trust, friendly enough to read.</p>
        </div>
        <div className="proof-stamp">
          <FileCheck2 aria-hidden />
          <strong>receipts<br />kept</strong>
          <span>solana devnet</span>
        </div>
      </header>

      <div className="proof-toolbar">
        <span><CheckCircle2 aria-hidden /> {pulses.length} settled pulses on the shelf</span>
        <Link href="/sim">fixture simulator ↗</Link>
      </div>

        {pulses.length === 0 ? (
          <div className="club-empty"><span>empty shelf</span><h2>No receipts yet.</h2><p>Settle a pulse and its proof will land here, nice and tidy.</p></div>
        ) : (
          <ol className="proof-grid">
            {pulses.map((pulse, index) => {
              const root = oddsRootHex(pulse.odds_proof);
              return (
                <li key={pulse.id}>
                  <Link href={`/proof/${pulse.id}`} className="proof-ticket">
                    <div className="proof-ticket__top"><span>RECEIPT #{String(index + 1).padStart(3, "0")}</span><span>{pulse.verify_tx ? "VERIFIED ✓" : "CRANKING…"}</span></div>
                    <p>{pulse.question}</p>
                    <div className="proof-ticket__result"><small>winning side</small><strong>{pulse.winning_side ?? "pending"}</strong></div>
                    <div className="proof-ticket__meta"><span>{pulse.pulse_type}</span><span>{pulse.onchain_pool_pubkey ? `pool ${pulse.onchain_pool_pubkey.slice(0, 8)}…` : "pool pending"}</span></div>
                    {pulse.odds_message_id ? <code>msg {pulse.odds_message_id.slice(0, 12)}… {root ? `· root ${root.slice(0, 10)}…` : ""}</code> : null}
                    <span className="proof-ticket__open">open the whole receipt ↗</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      <footer className="club-footer"><span>proofs from real settled rows · no mock confetti</span><span>TxLINE + Solana devnet</span></footer>
    </main>
  );
}
