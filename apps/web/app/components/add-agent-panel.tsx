"use client";

import { useWalletConnection } from "@solana/react-hooks";
import type { AgentTeam } from "@copium/db/teams";
import { Check } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type UserAgent = {
  id: string;
  slug: string;
  display_name: string;
  config: {
    kind?: string;
    provider?: string;
    model?: string;
    style?: string;
    topics?: string[];
    teams?: AgentTeam[];
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

const TOPIC_OPTIONS = [
  { id: "soccer", label: "Soccer" },
  { id: "football", label: "Football" },
  { id: "basketball", label: "Basketball" },
  { id: "valorant", label: "Valorant" },
  { id: "world-cup", label: "World Cup" },
  { id: "ncaa-football", label: "NCAA football" },
  { id: "ncaa-basketball", label: "NCAA basketball" },
] as const;

function inferTopics(name: string, style: string): string[] {
  const text = `${name} ${style}`.toLowerCase();
  if (/(world\s*cup|fifa|wc\b|international friendl)/i.test(text)) {
    return ["world-cup"];
  }
  if (/ncaa/.test(text) && /basketball|hoops/.test(text)) {
    return ["ncaa-basketball", "basketball"];
  }
  if (/ncaa/.test(text) && /football|cfb/.test(text)) {
    return ["ncaa-football", "football"];
  }
  if (/basketball|nba|hoops/.test(text)) return ["basketball"];
  if (/\bfootball\b|nfl|touchdown|quarterback|field goal/.test(text)) {
    return ["football"];
  }
  if (/soccer|goal|futbol|world cup|international/.test(text)) {
    return ["soccer"];
  }
  return ["soccer"];
}

export function AddAgentPanel() {
  const { wallet, status, connect, connectors } = useWalletConnection();
  const [agents, setAgents] = useState<UserAgent[]>([]);
  const [claimCode, setClaimCode] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [style, setStyle] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [teams, setTeams] = useState<AgentTeam[]>([]);
  const [teamOptions, setTeamOptions] = useState<AgentTeam[]>([]);
  const [teamQuery, setTeamQuery] = useState("");
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [permissionEnabled, setPermissionEnabled] = useState(false);
  const [maxStake, setMaxStake] = useState(100_000);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const owner = wallet?.account.address.toString();
  const selectedModel =
    MODEL_OPTIONS.find((option) => option.model === model) ?? MODEL_OPTIONS[0]!;
  const suggestedTopics = useMemo(
    () => inferTopics(name, style),
    [name, style]
  );
  const activeTopics = topics;
  const teamTopicKey = activeTopics.slice().sort().join(",");
  const visibleTeams = useMemo(
    () => teamOptions.filter((team) => activeTopics.includes(team.topic)),
    [activeTopics, teamOptions]
  );
  const filteredTeams = useMemo(() => {
    const query = teamQuery.trim().toLowerCase();
    const matches = query
      ? visibleTeams.filter((team) => {
          const haystack =
            `${team.name} ${team.aliases.join(" ")}`.toLowerCase();
          return haystack.includes(query);
        })
      : visibleTeams;
    return matches.slice(0, query ? 24 : 10);
  }, [teamQuery, visibleTeams]);

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

  useEffect(() => {
    let cancelled = false;
    async function loadTeamOptions() {
      if (activeTopics.length === 0) {
        await Promise.resolve();
        if (!cancelled) {
          setTeamOptions([]);
          setTeamsLoading(false);
        }
        return;
      }
      setTeamsLoading(true);
      try {
        const res = await fetch(
          `/api/teams?topics=${encodeURIComponent(teamTopicKey)}`
        );
        const json = (await res.json()) as {
          ok?: boolean;
          teams?: AgentTeam[];
        };
        if (!cancelled && json.ok) setTeamOptions(json.teams ?? []);
      } finally {
        if (!cancelled) setTeamsLoading(false);
      }
    }
    void loadTeamOptions();
    return () => {
      cancelled = true;
    };
  }, [activeTopics.length, teamTopicKey]);

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
    if (!activeTopics.length) {
      setError("pick at least one topic");
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
          topics: activeTopics,
          teams,
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
      setTopics([]);
      setTeams([]);
      setTeamQuery("");
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

  function toggleTopic(topic: string) {
    setTopics((current) => {
      const base = current;
      const next = base.includes(topic)
        ? base.filter((value) => value !== topic)
        : [...base, topic];
      setTeams((currentTeams) =>
        currentTeams.filter((team) => next.includes(team.topic))
      );
      setTeamQuery("");
      return next;
    });
  }

  function toggleTeam(team: AgentTeam) {
    setTeams((current) => {
      const active = current.some(
        (value) => value.topic === team.topic && value.slug === team.slug
      );
      return active
        ? current.filter(
            (value) => value.topic !== team.topic || value.slug !== team.slug
          )
        : [...current, team];
    });
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
          <div className="space-y-2 border border-[var(--desk-border)] bg-[var(--desk-bg)] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--desk-muted)]">
                Topics
              </p>
              <p className="text-[11px] text-[var(--desk-muted)]">
                Pick sports first.
              </p>
            </div>
            <p className="text-[11px] text-[var(--desk-muted)]">
              Suggested from name/style: {suggestedTopics.join(", ")}
            </p>
            <div className="flex flex-wrap gap-2">
              {TOPIC_OPTIONS.map((topic) => {
                const active = activeTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    aria-pressed={active}
                    className={
                      active
                        ? "inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--desk-link)] bg-[var(--desk-link)] px-3 py-2 text-[11px] font-medium text-black transition"
                        : "inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--desk-border)] px-3 py-2 text-[11px] text-[var(--desk-muted)] transition hover:border-[var(--desk-link)] hover:text-[var(--desk-fg)]"
                    }
                  >
                    <span
                      className={
                        active
                          ? "inline-flex h-4 w-4 items-center justify-center rounded-full border border-black/25 bg-black/10"
                          : "inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--desk-border)]"
                      }
                    >
                      {active ? <Check size={12} strokeWidth={3} /> : null}
                    </span>
                    {topic.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2 border border-[var(--desk-border)] bg-[var(--desk-bg)] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--desk-muted)]">
                Teams
              </p>
              <p className="text-[11px] text-[var(--desk-muted)]">
                Search, then choose.
              </p>
            </div>
            {teams.length ? (
              <div className="flex flex-wrap gap-2">
                {teams.map((team) => (
                  <button
                    key={`selected-${team.topic}:${team.slug}`}
                    type="button"
                    onClick={() => toggleTeam(team)}
                    className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--desk-link)] bg-[var(--desk-link)] px-3 py-2 text-[11px] font-medium text-black transition"
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-black/25 bg-black/10">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {team.name}
                  </button>
                ))}
              </div>
            ) : null}
            <input
              value={teamQuery}
              onChange={(e) => setTeamQuery(e.target.value)}
              placeholder={
                activeTopics.length ? "Search teams" : "Pick a topic first"
              }
              disabled={!activeTopics.length || teamsLoading}
              className="w-full border border-[var(--desk-border)] bg-[var(--desk-bg)] px-3 py-2 font-mono text-xs outline-none disabled:opacity-50"
            />
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {teamsLoading ? (
                <span className="block text-[11px] text-[var(--desk-muted)]">
                  Loading teams...
                </span>
              ) : null}
              {!teamsLoading && !visibleTeams.length ? (
                <span className="block text-[11px] text-[var(--desk-muted)]">
                  No team source yet for this topic.
                </span>
              ) : null}
              {!teamsLoading &&
              visibleTeams.length > 0 &&
              !filteredTeams.length ? (
                <span className="block text-[11px] text-[var(--desk-muted)]">
                  No teams match that search.
                </span>
              ) : null}
              {filteredTeams.map((team) => {
                const active = teams.some(
                  (value) =>
                    value.topic === team.topic && value.slug === team.slug
                );
                return (
                  <button
                    key={`${team.topic}:${team.slug}`}
                    type="button"
                    onClick={() => toggleTeam(team)}
                    aria-pressed={active}
                    className={
                      active
                        ? "flex w-full items-center justify-between gap-3 border border-[var(--desk-link)] bg-[var(--desk-link)] px-3 py-2 text-left text-[11px] font-medium text-black transition"
                        : "flex w-full items-center justify-between gap-3 border border-[var(--desk-border)] px-3 py-2 text-left text-[11px] text-[var(--desk-muted)] transition hover:border-[var(--desk-link)] hover:text-[var(--desk-fg)]"
                    }
                  >
                    <span>{team.name}</span>
                    <span
                      className={
                        active
                          ? "inline-flex h-4 w-4 items-center justify-center rounded-full border border-black/25 bg-black/10"
                          : "inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--desk-border)]"
                      }
                    >
                      {active ? <Check size={12} strokeWidth={3} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
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
                {agent.config?.topics?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {agent.config.topics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border border-[var(--desk-border)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--desk-muted)]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : null}
                {agent.config?.teams?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {agent.config.teams.map((team) => (
                      <span
                        key={`${team.topic}:${team.slug}`}
                        className="rounded-full border border-[var(--desk-link)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--desk-link)]"
                      >
                        {team.name}
                      </span>
                    ))}
                  </div>
                ) : null}
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
