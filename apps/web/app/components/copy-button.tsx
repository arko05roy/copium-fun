"use client";

import { useWalletConnection } from "@solana/react-hooks";
import { Transaction } from "@solana/web3.js";
import { useState } from "react";

type CopyButtonProps = {
  tradeId: string;
  agentName: string;
  side: string | null;
  mode: "copy" | "fade";
};

export function CopyButton({ tradeId, agentName, side, mode }: CopyButtonProps) {
  const { wallet, status, connect, connectors } = useWalletConnection();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verb = mode === "fade" ? "Fade" : "Copy";
  const mirrorSide =
    side == null
      ? "—"
      : mode === "fade"
        ? side === "yes"
          ? "NO"
          : "YES"
        : side.toUpperCase();

  async function handleClick() {
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
      const apiPath = mode === "fade" ? "fade-agent" : "copy-agent";
      const res = await fetch(`/api/actions/${apiPath}/${tradeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account }),
      });
      const json = (await res.json()) as {
        transaction?: string;
        message?: string;
      };
      if (!res.ok || !json.transaction) {
        throw new Error(json.message ?? `${verb} tx build failed`);
      }

      const tx = Transaction.from(Buffer.from(json.transaction, "base64"));
      type LegacyWallet = {
        sendTransaction?(signed: Transaction): Promise<string>;
        signTransaction?(unsigned: Transaction): Promise<Transaction>;
      };
      const legacy = wallet as unknown as LegacyWallet;
      const sig = legacy.sendTransaction
        ? await legacy.sendTransaction(tx)
        : legacy.signTransaction
          ? await legacy.signTransaction(tx).then((signed) => {
              if (!legacy.sendTransaction) throw new Error("wallet cannot send");
              return legacy.sendTransaction(signed);
            })
          : null;
      if (!sig) throw new Error("wallet cannot sign devnet tx");
      setResult(typeof sig === "string" ? sig : String(sig));
    } catch (e) {
      setError(e instanceof Error ? e.message : `${verb} failed`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={pending || side == null}
        className="rounded border border-[var(--desk-accent)]/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--desk-accent)] transition hover:bg-[var(--desk-accent)]/10 disabled:cursor-not-allowed disabled:opacity-40"
        title={`${verb} ${agentName} · ${mirrorSide}`}
      >
        {pending ? "…" : verb}
      </button>
      {result ? (
        <a
          href={`https://solscan.io/tx/${result}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate font-mono text-[9px] text-[var(--desk-link)] underline"
        >
          {result.slice(0, 8)}…
        </a>
      ) : null}
      {error ? (
        <span className="font-mono text-[9px] text-[var(--desk-invalid)]">{error}</span>
      ) : null}
    </div>
  );
}
