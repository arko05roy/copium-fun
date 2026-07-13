"use client";

import { useState } from "react";

type CrankStatusProps = {
  pulse: {
    status: string | null;
    closes_at: string;
    odds_message_id: string | null;
    onchain_pool_pubkey: string | null;
    settlement_root: string | null;
    winning_side: string | null;
  };
  proofReady: boolean;
  validateValid: boolean | null;
  verifyTx: string | null;
};

type Step = {
  label: string;
  detail: string;
  done: boolean;
  pending?: boolean;
};

export function CrankStatus({
  pulse,
  proofReady,
  validateValid,
  verifyTx,
}: CrankStatusProps) {
  const [now] = useState(() => Date.now());
  const closed = new Date(pulse.closes_at).getTime() <= now;
  const steps: Step[] = [
    {
      label: "Pulse window closed",
      detail: pulse.closes_at,
      done: closed || pulse.status !== "open",
    },
    {
      label: "TxLINE odds locked",
      detail: pulse.odds_message_id ?? "waiting for messageId",
      done: Boolean(pulse.odds_message_id),
    },
    {
      label: "txoracle validate_stat",
      detail:
        validateValid === null
          ? "not validated yet"
          : validateValid
            ? "predicate satisfied on devnet"
            : "predicate failed",
      done: validateValid === true,
    },
    {
      label: "Proof bundle stored",
      detail: proofReady ? "truth + settlement JSON in DB" : "Phase A pending",
      done: proofReady,
    },
    {
      label: "Pulse marked settled",
      detail: pulse.winning_side
        ? `winner: ${pulse.winning_side.toUpperCase()}`
        : (pulse.status ?? "open"),
      done: pulse.status === "settled" && Boolean(pulse.winning_side),
    },
    {
      label: "On-chain crank (Phase B)",
      detail: verifyTx ?? "post_settlement + settle_pulse — D12",
      done: Boolean(verifyTx),
      pending: !verifyTx,
    },
  ];

  return (
    <ol className="space-y-0 border border-[var(--proof-border)]">
      {steps.map((step, index) => (
        <li
          key={step.label}
          className="grid grid-cols-[2.5rem_1fr] border-b border-[var(--proof-border)] last:border-b-0"
        >
          <span
            className="flex items-center justify-center border-r border-[var(--proof-border)] font-mono text-xs text-[var(--proof-muted)]"
            aria-hidden
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
            <div className="space-y-0.5">
              <p className="font-mono text-sm text-[var(--proof-fg)]">
                {step.label}
              </p>
              <p className="font-mono text-xs text-[var(--proof-muted)] break-all">
                {step.detail}
              </p>
            </div>
            <span
              className={`shrink-0 font-mono text-xs uppercase tracking-wider ${
                step.done
                  ? "text-[var(--proof-valid)]"
                  : step.pending
                    ? "text-[var(--proof-muted)]"
                    : "text-[var(--proof-invalid)]"
              }`}
            >
              {step.done ? "done" : step.pending ? "pending" : "waiting"}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
