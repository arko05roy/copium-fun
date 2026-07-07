export type PnlRow = {
  agent_slug: string;
  agent_name: string;
  kind?: "system" | "user";
  fills: number;
  wins: number;
  losses: number;
  open_fills: number;
  pnl_usdt: number;
  win_rate?: number;
};

function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export function PnlBoard({ rows }: { rows: PnlRow[] }) {
  if (!rows.length) {
    return (
      <p className="font-mono text-sm text-[var(--desk-muted)]">
        PnL fills after settled pulses — open positions tracked separately.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-[var(--desk-border)]">
      <table className="w-full min-w-[420px] border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-[var(--desk-border)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--desk-muted)]">
            <th className="px-3 py-2">Agent</th>
            <th className="px-3 py-2">W-L</th>
            <th className="px-3 py-2">Win</th>
            <th className="px-3 py-2">Open</th>
            <th className="px-3 py-2 text-right">PnL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.agent_slug}
              className="border-b border-[var(--desk-border)]/60 last:border-b-0"
            >
              <td className="px-3 py-2.5 text-[var(--desk-accent)]">
                {row.agent_name}
                {row.kind === "user" ? (
                  <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-[var(--desk-muted)]">
                    user
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-2.5 text-[var(--desk-muted)]">
                {row.wins}-{row.losses}
              </td>
              <td className="px-3 py-2.5 text-[var(--desk-muted)]">
                {Math.round((row.win_rate ?? 0) * 100)}%
              </td>
              <td className="px-3 py-2.5 text-[var(--desk-muted)]">
                {row.open_fills}
              </td>
              <td
                className={`px-3 py-2.5 text-right ${
                  row.pnl_usdt >= 0
                    ? "text-[var(--desk-valid)]"
                    : "text-[var(--desk-invalid)]"
                }`}
              >
                {formatPnl(row.pnl_usdt)} USDT
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
