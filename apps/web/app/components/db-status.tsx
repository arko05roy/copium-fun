"use client";

import { useEffect, useState } from "react";

type Health = {
  ok: boolean;
  tableCount?: number;
  tables?: Record<string, number>;
  fixtures?: number;
  error?: string;
  hint?: string;
  table?: string;
};

export function DbStatus() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: Health) => setHealth(data))
      .catch(() => setHealth({ ok: false, error: "unreachable" }));
  }, []);

  if (!health) {
    return (
      <div className="border-t border-border-low pt-3 text-muted">
        Supabase — checking…
      </div>
    );
  }

  if (!health.ok) {
    return (
      <div className="space-y-2 border-t border-border-low pt-3">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Supabase</dt>
          <dd className="text-right text-muted">schema missing</dd>
        </div>
        <p className="text-[11px] text-muted">
          {health.table ? `${health.table}: ` : ""}
          {health.error}
        </p>
        {health.hint ? (
          <p className="text-[11px] text-foreground/80">{health.hint}</p>
        ) : null}
      </div>
    );
  }

  const entries = Object.entries(health.tables ?? {}).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <div className="space-y-2 border-t border-border-low pt-3">
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Supabase</dt>
        <dd className="text-right text-foreground">
          {health.tableCount ?? entries.length} tables · schema live
        </dd>
      </div>
      <div className="grid gap-1 rounded-lg border border-border-low bg-cream/40 p-3 font-mono text-[11px]">
        {entries.map(([name, count]) => (
          <div key={name} className="flex justify-between gap-3">
            <span className="text-muted">{name}</span>
            <span className={count > 0 ? "text-foreground" : "text-muted"}>
              {count} rows
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
