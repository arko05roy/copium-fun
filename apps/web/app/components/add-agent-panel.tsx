"use client";

import { useWalletConnection } from "@solana/react-hooks";
import { useCallback, useEffect, useState } from "react";

type UserAgent = {
  id: string;
  slug: string;
  display_name: string;
  config: {
    kind?: string;
    provider?: string;
    model?: string;
    style?: string;
    permission?: { enabled?: boolean; maxStake?: number };
  } | null;
};

type ApiResponse = {
  ok?: boolean;
  error?: string;
  agent?: UserAgent;
  agents?: UserAgent[];
};

const MODEL_OPTIONS = [
  { label: "OpenAI · gpt-5", provider: "openai", model: "gpt-5" },
  { label: "OpenAI · gpt-5-mini", provider: "openai", model: "gpt-5-mini" },
  { label: "OpenAI · gpt-5-nano", provider: "openai", model: "gpt-5-nano" },
  { label: "OpenAI · gpt-4.1", provider: "openai", model: "gpt-4.1" },
  { label: "OpenAI · gpt-4.1-mini", provider: "openai", model: "gpt-4.1-mini" },
  { label: "OpenAI · gpt-4.1-nano", provider: "openai", model: "gpt-4.1-nano" },
  { label: "OpenAI · gpt-4o", provider: "openai", model: "gpt-4o" },
  { label: "OpenAI · gpt-4o-mini", provider: "openai", model: "gpt-4o-mini" },
  { label: "OpenAI · o3", provider: "openai", model: "o3" },
  { label: "OpenAI · o3-mini", provider: "openai", model: "o3-mini" },
  { label: "OpenAI · o4-mini", provider: "openai", model: "o4-mini" },
  { label: "OpenAI · gpt-4-turbo", provider: "openai", model: "gpt-4-turbo" },
  {
    label: "Claude · claude-opus-4-1",
    provider: "anthropic",
    model: "claude-opus-4-1",
  },
  {
    label: "Claude · claude-opus-4-0",
    provider: "anthropic",
    model: "claude-opus-4-0",
  },
  {
    label: "Claude · claude-sonnet-4-5",
    provider: "anthropic",
    model: "claude-sonnet-4-5",
  },
  {
    label: "Claude · claude-sonnet-4-0",
    provider: "anthropic",
    model: "claude-sonnet-4-0",
  },
  {
    label: "Claude · claude-3-7-sonnet-latest",
    provider: "anthropic",
    model: "claude-3-7-sonnet-latest",
  },
  {
    label: "Claude · claude-3-5-sonnet-latest",
    provider: "anthropic",
    model: "claude-3-5-sonnet-latest",
  },
  {
    label: "Claude · claude-3-5-haiku-latest",
    provider: "anthropic",
    model: "claude-3-5-haiku-latest",
  },
  {
    label: "Claude · claude-3-haiku-20240307",
    provider: "anthropic",
    model: "claude-3-haiku-20240307",
  },
  {
    label: "Groq · llama-3.3-70b-versatile",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
  },
  {
    label: "Groq · llama-3.1-8b-instant",
    provider: "groq",
    model: "llama-3.1-8b-instant",
  },
  {
    label: "Groq · meta-llama/llama-4-maverick-17b-128e-instruct",
    provider: "groq",
    model: "meta-llama/llama-4-maverick-17b-128e-instruct",
  },
  {
    label: "Groq · meta-llama/llama-4-scout-17b-16e-instruct",
    provider: "groq",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
  },
  {
    label: "Groq · deepseek-r1-distill-llama-70b",
    provider: "groq",
    model: "deepseek-r1-distill-llama-70b",
  },
  { label: "Groq · qwen/qwen3-32b", provider: "groq", model: "qwen/qwen3-32b" },
  {
    label: "Groq · moonshotai/kimi-k2-instruct",
    provider: "groq",
    model: "moonshotai/kimi-k2-instruct",
  },
  {
    label: "Groq · openai/gpt-oss-120b",
    provider: "groq",
    model: "openai/gpt-oss-120b",
  },
  {
    label: "Groq · openai/gpt-oss-20b",
    provider: "groq",
    model: "openai/gpt-oss-20b",
  },
];

export function AddAgentPanel() {
  const { wallet, status, connect, connectors } = useWalletConnection();
  const [agents, setAgents] = useState<UserAgent[]>([]);
  const [claimCode, setClaimCode] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [style, setStyle] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [permissionEnabled, setPermissionEnabled] = useState(false);
  const [maxStake, setMaxStake] = useState(100_000);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const owner = wallet?.account.address.toString();
  const selectedModel =
    MODEL_OPTIONS.find((option) => option.model === model) ?? MODEL_OPTIONS[0]!;

  const ensureWallet = useCallback(async () => {
    if (status === "connected" && owner) return owner;
    const phantom = connectors.find((c) => /phantom/i.test(c.name));
    await connect(phantom?.id ?? connectors[0]?.id ?? "");
    return null;
  }, [connect, connectors, owner, status]);

  const loadAgents = useCallback(async () => {
    if (!owner) return;
    const res = await fetch(`/api/agents?owner=${encodeURIComponent(owner)}`);
    const json = (await res.json()) as ApiResponse;
    if (json.ok) setAgents(json.agents ?? []);
  }, [owner]);

  useEffect(() => {
    const id = setTimeout(() => void loadAgents(), 0);
    return () => clearTimeout(id);
  }, [loadAgents]);

  async function submitClaim() {
    if (!claimCode.trim()) {
      setError("claim code required");
      return;
    }
    const walletOwner = await ensureWallet();
    if (!walletOwner || pending) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/agents/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: claimCode, owner: walletOwner }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!res.ok || !json.ok) throw new Error(json.error ?? "claim failed");
      setClaimCode("");
      setMessage(`Added ${json.agent?.display_name ?? "agent"}`);
      await loadAgents();
    } catch (e) {
      setError(e instanceof Error ? e.message : "claim failed");
    } finally {
      setPending(false);
    }
  }

  async function submitCreate() {
    if (!name.trim() || !style.trim() || !apiKey.trim()) {
      setError("name, one-line style, and API key are required");
      return;
    }
    const walletOwner = await ensureWallet();
    if (!walletOwner || pending) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: walletOwner,
          name,
          provider: selectedModel.provider,
          model,
          style,
          apiKey,
          permissionEnabled,
          maxStake,
        }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!res.ok || !json.ok) throw new Error(json.error ?? "create failed");
      setName("");
      setStyle("");
      setApiKey("");
      setPermissionEnabled(false);
      setMessage(`Created ${json.agent?.display_name ?? "agent"}`);
      await loadAgents();
    } catch (e) {
      setError(e instanceof Error ? e.message : "create failed");
    } finally {
      setPending(false);
    }
  }

  async function toggleAgent(agent: UserAgent) {
    if (!owner || pending) return;
    const enabled = !agent.config?.permission?.enabled;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          permissionEnabled: enabled,
          maxStake: agent.config?.permission?.maxStake ?? maxStake,
        }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!res.ok || !json.ok) throw new Error(json.error ?? "update failed");
      await loadAgents();
    } catch (e) {
      setError(e instanceof Error ? e.message : "update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mb-8 border border-[var(--desk-border)] bg-[var(--desk-surface)] p-4">
      <div className="mb-4 space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--desk-muted)]">
          Add Agent
        </p>
        <p className="text-sm leading-6 text-[var(--desk-muted)]">
          BYOK agents use one-line trading styles. Permission is off unless you
          explicitly enable it.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <input
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value)}
            placeholder="Paste CLI claim code"
            className="w-full border border-[var(--desk-border)] bg-[var(--desk-bg)] px-3 py-2 font-mono text-xs outline-none"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => void submitClaim()}
            className="w-full border border-[var(--desk-border)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--desk-link)] disabled:opacity-40"
          >
            Claim CLI Agent
          </button>
        </div>

        <div className="grid gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Agent name"
            className="border border-[var(--desk-border)] bg-[var(--desk-bg)] px-3 py-2 font-mono text-xs outline-none"
          />
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="border border-[var(--desk-border)] bg-[var(--desk-bg)] px-3 py-2 font-mono text-xs outline-none"
          >
            {MODEL_OPTIONS.map((option) => (
              <option key={option.model} value={option.model}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder='One-line style, e.g. "fade crowd when gap is huge"'
            maxLength={120}
            className="border border-[var(--desk-border)] bg-[var(--desk-bg)] px-3 py-2 font-mono text-xs outline-none"
          />
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`${selectedModel.label.split(" · ")[0]} API key`}
            type="password"
            className="border border-[var(--desk-border)] bg-[var(--desk-bg)] px-3 py-2 font-mono text-xs outline-none"
          />
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--desk-muted)]">
            <input
              type="checkbox"
              checked={permissionEnabled}
              onChange={(e) => setPermissionEnabled(e.target.checked)}
            />
            Allow autonomous devnet positions
          </label>
          <input
            value={maxStake}
            onChange={(e) => setMaxStake(Number(e.target.value))}
            type="number"
            min={1}
            className="border border-[var(--desk-border)] bg-[var(--desk-bg)] px-3 py-2 font-mono text-xs outline-none"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => void submitCreate()}
            className="border border-[var(--desk-border)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--desk-link)] disabled:opacity-40"
          >
            Create Web Agent
          </button>
        </div>
      </div>

      {message ? (
        <p className="mt-3 text-xs text-[var(--desk-valid)]">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-xs text-[var(--desk-invalid)]">{error}</p>
      ) : null}

      {agents.length ? (
        <div className="mt-5 space-y-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-[var(--desk-border)] p-3"
            >
              <div>
                <p className="text-sm text-[var(--desk-fg)]">
                  {agent.display_name}
                </p>
                <p className="font-mono text-[10px] text-[var(--desk-muted)]">
                  {agent.config?.model} · {agent.config?.style}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => void toggleAgent(agent)}
                className="border border-[var(--desk-border)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--desk-link)] disabled:opacity-40"
              >
                {agent.config?.permission?.enabled
                  ? "Disable trading"
                  : "Enable trading"}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
