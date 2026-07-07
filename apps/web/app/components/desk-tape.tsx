import { SOLANA_DEVNET } from "@copium/config";

import { CopyButton } from "./copy-button";

export type TapeRow = {
  id: string;
  agent_slug: string;
  agent_name: string;
  agent_kind?: "system" | "user";
  pulse_question: string;
  pulse_topic?: string | null;
  pulse_sport?: string | null;
  pulse_competition_name?: string | null;
  side: string | null;
  stake: number | null;
  reasoning: string | null;
  execute_tx: string | null;
  created_at: string | null;
};

function solscanTx(signature: string): string {
  return `https://solscan.io/tx/${signature}?cluster=${SOLANA_DEVNET.cluster}`;
}

function formatStake(stake: number | null): string {
  if (stake == null) return "—";
  return `${(stake / 1_000_000).toFixed(2)} USDT`;
}

export function DeskTape({ rows }: { rows: TapeRow[] }) {
  if (!rows.length) {
    return (
      <p className="font-mono text-sm text-[var(--desk-muted)]">
        No agent positions yet. Spawn a Pulse from TxLINE, then the agents trade
        the same pool the Feed shows.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-[var(--desk-border)]">
      <table className="w-full min-w-[640px] border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-[var(--desk-border)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--desk-muted)]">
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">Agent</th>
            <th className="px-3 py-2">Coverage</th>
            <th className="px-3 py-2">Side</th>
            <th className="px-3 py-2">Stake</th>
            <th className="px-3 py-2">Tx</th>
            <th className="px-3 py-2">Same pool</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[var(--desk-border)]/60 last:border-b-0 hover:bg-[var(--desk-surface)]"
            >
              <td className="whitespace-nowrap px-3 py-2.5 text-[var(--desk-muted)]">
                {row.created_at
                  ? new Date(row.created_at).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "—"}
              </td>
              <td className="px-3 py-2.5">
                <span className="text-[var(--desk-accent)]">
                  {row.agent_name}
                </span>
                {row.agent_kind === "user" ? (
                  <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-[var(--desk-muted)]">
                    user
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-2.5">
                <div className="space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--desk-muted)]">
                    {row.pulse_topic ?? row.pulse_sport ?? "live"}
                  </p>
                  {row.pulse_competition_name ? (
                    <p className="max-w-[11rem] truncate text-[11px] text-[var(--desk-fg)]/70">
                      {row.pulse_competition_name}
                    </p>
                  ) : null}
                </div>
              </td>
              <td className="px-3 py-2.5 uppercase">{row.side ?? "—"}</td>
              <td className="px-3 py-2.5">{formatStake(row.stake)}</td>
              <td className="max-w-[8rem] truncate px-3 py-2.5">
                {row.execute_tx ? (
                  <a
                    href={solscanTx(row.execute_tx)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--desk-link)] underline underline-offset-2"
                  >
                    {row.execute_tx.slice(0, 8)}…
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex gap-2">
                  <CopyButton
                    tradeId={row.id}
                    agentName={row.agent_name}
                    side={row.side}
                    mode="copy"
                  />
                  <CopyButton
                    tradeId={row.id}
                    agentName={row.agent_name}
                    side={row.side}
                    mode="fade"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
