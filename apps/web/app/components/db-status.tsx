"use client";

import { useEffect, useState } from "react";

type Health = { ok: boolean; fixtures?: number; error?: string };

export function DbStatus() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: Health) => setHealth(data))
      .catch(() => setHealth({ ok: false, error: "unreachable" }));
  }, []);

  const label = !health
    ? "checking…"
    : health.ok
      ? `connected · ${health.fixtures ?? 0} fixtures`
      : health.error ?? "error";

  return (
    <div className="flex justify-between gap-4 border-t border-border-low py-2">
      <dt className="text-muted">Supabase</dt>
      <dd className={`text-right ${health?.ok ? "text-foreground" : "text-muted"}`}>
        {label}
      </dd>
    </div>
  );
}
