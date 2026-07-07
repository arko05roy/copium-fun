"use client";

import { useWalletConnection } from "@solana/react-hooks";
import { useState } from "react";

import type { FeedPulse } from "@/lib/feed-types";
import { STAKE_OPTIONS } from "@/lib/feed-types";
import { signAndSendActionTx } from "@/lib/sign-action-tx";

type BetPanelProps = {
  pulse: FeedPulse | null;
  onSuccess: () => void;
  onSkip: () => void;
};

export function BetPanel({ pulse, onSuccess, onSkip }: BetPanelProps) {
  const { wallet, status, connect, connectors } = useWalletConnection();
  const [stake, setStake] = useState<number>(STAKE_OPTIONS[1].micro);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(side: "yes" | "no") {
    if (!pulse || pending) return;
    setError(null);
    setResult(null);

    if (status !== "connected" || !wallet) {
      const phantom = connectors.find((c) => /phantom/i.test(c.name));
      await connect(phantom?.id ?? connectors[0]?.id ?? "");
      return;
    }

    setPending(true);
    try {
      const account = wallet.account.address.toString();
      const res = await fetch(
        `/api/actions/pulse-pick/${pulse.id}?side=${side}&stake=${stake}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account }),
        }
      );
      const json = (await res.json()) as {
        transaction?: string;
        message?: string;
      };
      if (!res.ok || !json.transaction) {
        throw new Error(json.message ?? "pick tx build failed");
      }

      const sig = await signAndSendActionTx(wallet, json.transaction);
      setResult(sig);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "pick failed");
    } finally {
      setPending(false);
    }
  }

  if (!pulse) {
    return (
      <div className="flex h-full min-h-[32rem] flex-col items-center justify-center rounded-2xl border border-[var(--feed-border)] bg-[var(--feed-card)] p-8 text-center text-sm text-[var(--feed-muted)]">
        Waiting for the next pulse…
      </div>
    );
  }

  const crowdYes = pulse.crowd_yes_pct ?? 50;
  const line = pulse.line_pct ?? 50;
  const closesAt = new Date(pulse.closes_at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex min-h-[32rem] flex-col gap-8 rounded-2xl border border-[var(--feed-border)] bg-[var(--feed-card)] p-8">
      <div className="space-y-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--feed-kicker)]">
          Current Pulse · {pulse.matchName}
        </p>
        <h2 className="text-2xl leading-snug text-[var(--feed-fg)] sm:text-3xl">
          {pulse.question}
        </h2>
        <div className="grid gap-2 rounded-xl border border-[var(--feed-border)] bg-[#0b1f14] p-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--feed-muted)]">
          <span>{pulse.triggerLabel}</span>
          <span>{pulse.createdBy}</span>
          <span>
            {pulse.windowLabel} · locks at {closesAt}
          </span>
        </div>
        <div className="flex gap-4 text-xs text-[var(--feed-muted)]">
          <span className="text-[var(--feed-accent)]">
            Crowd {crowdYes.toFixed(0)}% YES
          </span>
          <span className="text-[var(--feed-line)]">
            Line {line.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          id="bet-yes"
          type="button"
          disabled={pending}
          onClick={() => void handlePick("yes")}
          className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--feed-accent)] bg-[var(--feed-accent)]/10 text-3xl text-[var(--feed-accent)] transition hover:scale-105 hover:bg-[var(--feed-accent)]/20 disabled:opacity-40"
          aria-label="Yes"
        >
          ✓
        </button>
        <button
          id="bet-no"
          type="button"
          disabled={pending}
          onClick={() => void handlePick("no")}
          className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--feed-no)] bg-[var(--feed-no)]/10 text-3xl text-[var(--feed-no)] transition hover:scale-105 hover:bg-[var(--feed-no)]/20 disabled:opacity-40"
          aria-label="No"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--feed-kicker)]">
          Amount
        </p>
        <div className="grid grid-cols-3 gap-3">
          {STAKE_OPTIONS.map((opt) => (
            <button
              key={opt.micro}
              type="button"
              onClick={() => setStake(opt.micro)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                stake === opt.micro
                  ? "border-[var(--feed-accent)] bg-[var(--feed-accent)] text-[#071510]"
                  : "border-[var(--feed-border)] text-[var(--feed-fg)] hover:border-[var(--feed-accent)]/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={onSkip}
        className="rounded-xl border border-[var(--feed-border)] px-4 py-3 text-sm text-[var(--feed-muted)] transition hover:border-[var(--feed-muted)] hover:text-[var(--feed-fg)] disabled:opacity-40"
      >
        Skip pulse
      </button>

      <p className="text-center text-xs leading-5 text-[var(--feed-muted)]">
        {pulse.missedWindowCopy}
      </p>

      {pending ? (
        <p className="text-center text-xs text-[var(--feed-accent)]">
          Signing on devnet…
        </p>
      ) : null}
      {result ? (
        <a
          href={`https://solscan.io/tx/${result}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-center font-mono text-xs text-[var(--feed-kicker)] underline"
        >
          {result.slice(0, 12)}…
        </a>
      ) : null}
      {error ? (
        <p className="text-center text-xs text-[var(--feed-no)]">{error}</p>
      ) : null}
    </div>
  );
}
