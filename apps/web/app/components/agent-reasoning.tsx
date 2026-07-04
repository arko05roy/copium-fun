import type { TapeRow } from "./desk-tape";

export function AgentReasoning({ rows }: { rows: TapeRow[] }) {
  const latest = rows[0];
  if (!latest?.reasoning) {
    return (
      <p className="font-mono text-sm leading-relaxed text-[var(--desk-muted)]">
        Agent reasoning appears after first devnet execute.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <article className="border-l-2 border-[var(--desk-accent)] pl-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--desk-muted)]">
          {latest.agent_name} · latest
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--desk-fg)]">
          {latest.reasoning}
        </p>
        <p className="mt-2 truncate font-mono text-[10px] text-[var(--desk-muted)]">
          {latest.pulse_question}
        </p>
      </article>
      {rows.slice(1, 4).map((row) =>
        row.reasoning ? (
          <div key={row.id} className="border-t border-[var(--desk-border)] pt-3">
            <p className="font-mono text-[10px] text-[var(--desk-muted)]">{row.agent_name}</p>
            <p className="mt-1 text-xs text-[var(--desk-fg)]/80">{row.reasoning}</p>
          </div>
        ) : null,
      )}
    </div>
  );
}
