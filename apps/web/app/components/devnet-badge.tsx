import { SOLANA_DEVNET } from "@copium/config";

export function DevnetBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded border border-[#2A4D38] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#9BB8A8] ${className}`}
    >
      {SOLANA_DEVNET.cluster} · no payment
    </span>
  );
}
