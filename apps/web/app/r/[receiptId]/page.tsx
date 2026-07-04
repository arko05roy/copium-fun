import {
  getCrowdPosition,
  getPulse,
  getReceipt,
  loadEnv,
} from "@copium/db";
import { SOLANA_DEVNET } from "@copium/config";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { DevnetBadge } from "../../components/devnet-badge";
import { receiptLabelStyle, receiptOgContent } from "@/lib/receipt-og";

loadEnv();

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-receipt-display",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-receipt-body",
  display: "swap",
});

type PageProps = { params: Promise<{ receiptId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { receiptId } = await params;
  const receipt = await getReceipt(receiptId);
  if (!receipt) return { title: "Receipt not found · copium.fun" };
  return {
    title: `${receipt.label ?? "Receipt"} · copium.fun`,
    description: `Pulse receipt on Solana devnet — verified by TxLINE.`,
    openGraph: {
      images: [`/r/${receiptId}/opengraph-image`],
    },
  };
}

export default async function ReceiptPage({ params }: PageProps) {
  const { receiptId } = await params;
  const receipt = await getReceipt(receiptId);
  if (!receipt?.pulse_id) notFound();

  const pulse = await getPulse(receipt.pulse_id);
  const position = await getCrowdPosition(receipt.pulse_id, receipt.user_id ?? "");
  const content = receiptOgContent({
    receipt,
    pulse,
    side: position?.side ?? null,
  });
  const style = receiptLabelStyle(content.label);

  return (
    <div
      className={`${fraunces.variable} ${plexSans.variable} min-h-screen bg-[#071510] text-[#F4FFF7]`}
      style={{ fontFamily: "var(--font-receipt-body), system-ui, sans-serif" }}
    >
      <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-5 py-12">
        <header className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.2em] text-[#7CB892] hover:text-[#B8FF57]"
          >
            copium.fun
          </Link>
          <DevnetBadge />
        </header>

        <article className="flex flex-1 flex-col gap-6 border border-[#2A4D38] bg-[#122018] p-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl" aria-hidden>
              {style.emoji}
            </span>
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.18em]"
                style={{ color: style.accent }}
              >
                {style.sub}
              </p>
              <h1
                className="mt-2 text-2xl leading-snug"
                style={{ fontFamily: "var(--font-receipt-display), Georgia, serif" }}
              >
                {content.question}
              </h1>
            </div>
          </div>

          <dl className="grid gap-3 text-sm text-[#9BB8A8]">
            <div className="flex justify-between border-b border-[#2A4D38] py-2">
              <dt>Your pick</dt>
              <dd className="font-semibold text-[#B8FF57]">{content.side}</dd>
            </div>
            <div className="flex justify-between border-b border-[#2A4D38] py-2">
              <dt>Crowd YES</dt>
              <dd>{content.crowd}%</dd>
            </div>
            <div className="flex justify-between border-b border-[#2A4D38] py-2">
              <dt>The line</dt>
              <dd>{content.line}%</dd>
            </div>
            {content.winningSide ? (
              <div className="flex justify-between py-2">
                <dt>Settled</dt>
                <dd className="font-mono text-xs">{content.winningSide}</dd>
              </div>
            ) : null}
          </dl>

          <p className="text-xs leading-relaxed text-[#6E9080]">
            Verified by TxLINE · {SOLANA_DEVNET.cluster} · no payment required
          </p>
        </article>

        <div className="flex flex-col gap-3">
          <Link
            href={`/proof/${receipt.pulse_id}`}
            className="inline-flex items-center justify-center border border-[#2A4D38] bg-[#0B1F14] px-4 py-3 text-sm font-medium text-[#B8FF57] transition hover:border-[#B8FF57]"
          >
            View settlement proof
          </Link>
          <p className="text-center text-[10px] uppercase tracking-[0.14em] text-[#5A7A68]">
            Track 3 · share this URL on X
          </p>
        </div>
      </div>
    </div>
  );
}
