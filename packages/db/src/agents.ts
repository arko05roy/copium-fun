import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { createDbClient } from "./client.js";

const SUPPORTED_AGENT_PROVIDERS = ["openai", "anthropic", "groq"] as const;
export type AgentProvider = (typeof SUPPORTED_AGENT_PROVIDERS)[number];
export const AGENT_TOPIC_OPTIONS = [
  "soccer",
  "football",
  "basketball",
  "world-cup",
  "ncaa-football",
  "ncaa-basketball",
] as const;
export type AgentTopic = (typeof AGENT_TOPIC_OPTIONS)[number];

export const AGENT_MODEL_OPTIONS: {
  label: string;
  provider: AgentProvider;
  model: string;
  env: string;
}[] = [
  {
    label: "OpenAI · gpt-5",
    provider: "openai",
    model: "gpt-5",
    env: "OPENAI_API_KEY",
  },
  {
    label: "OpenAI · gpt-5-mini",
    provider: "openai",
    model: "gpt-5-mini",
    env: "OPENAI_API_KEY",
  },
  {
    label: "OpenAI · gpt-5-nano",
    provider: "openai",
    model: "gpt-5-nano",
    env: "OPENAI_API_KEY",
  },
  {
    label: "OpenAI · gpt-4.1",
    provider: "openai",
    model: "gpt-4.1",
    env: "OPENAI_API_KEY",
  },
  {
    label: "OpenAI · gpt-4.1-mini",
    provider: "openai",
    model: "gpt-4.1-mini",
    env: "OPENAI_API_KEY",
  },
  {
    label: "OpenAI · gpt-4.1-nano",
    provider: "openai",
    model: "gpt-4.1-nano",
    env: "OPENAI_API_KEY",
  },
  {
    label: "OpenAI · gpt-4o",
    provider: "openai",
    model: "gpt-4o",
    env: "OPENAI_API_KEY",
  },
  {
    label: "OpenAI · gpt-4o-mini",
    provider: "openai",
    model: "gpt-4o-mini",
    env: "OPENAI_API_KEY",
  },
  {
    label: "OpenAI · o3",
    provider: "openai",
    model: "o3",
    env: "OPENAI_API_KEY",
  },
  {
    label: "OpenAI · o3-mini",
    provider: "openai",
    model: "o3-mini",
    env: "OPENAI_API_KEY",
  },
  {
    label: "OpenAI · o4-mini",
    provider: "openai",
    model: "o4-mini",
    env: "OPENAI_API_KEY",
  },
  {
    label: "OpenAI · gpt-4-turbo",
    provider: "openai",
    model: "gpt-4-turbo",
    env: "OPENAI_API_KEY",
  },
  {
    label: "Claude · claude-opus-4-1",
    provider: "anthropic",
    model: "claude-opus-4-1",
    env: "ANTHROPIC_API_KEY",
  },
  {
    label: "Claude · claude-opus-4-0",
    provider: "anthropic",
    model: "claude-opus-4-0",
    env: "ANTHROPIC_API_KEY",
  },
  {
    label: "Claude · claude-sonnet-4-5",
    provider: "anthropic",
    model: "claude-sonnet-4-5",
    env: "ANTHROPIC_API_KEY",
  },
  {
    label: "Claude · claude-sonnet-4-0",
    provider: "anthropic",
    model: "claude-sonnet-4-0",
    env: "ANTHROPIC_API_KEY",
  },
  {
    label: "Claude · claude-3-7-sonnet-latest",
    provider: "anthropic",
    model: "claude-3-7-sonnet-latest",
    env: "ANTHROPIC_API_KEY",
  },
  {
    label: "Claude · claude-3-5-sonnet-latest",
    provider: "anthropic",
    model: "claude-3-5-sonnet-latest",
    env: "ANTHROPIC_API_KEY",
  },
  {
    label: "Claude · claude-3-5-haiku-latest",
    provider: "anthropic",
    model: "claude-3-5-haiku-latest",
    env: "ANTHROPIC_API_KEY",
  },
  {
    label: "Claude · claude-3-haiku-20240307",
    provider: "anthropic",
    model: "claude-3-haiku-20240307",
    env: "ANTHROPIC_API_KEY",
  },
  {
    label: "Groq · llama-3.3-70b-versatile",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    env: "GROQ_API_KEY",
  },
  {
    label: "Groq · llama-3.1-8b-instant",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    env: "GROQ_API_KEY",
  },
  {
    label: "Groq · meta-llama/llama-4-maverick-17b-128e-instruct",
    provider: "groq",
    model: "meta-llama/llama-4-maverick-17b-128e-instruct",
    env: "GROQ_API_KEY",
  },
  {
    label: "Groq · meta-llama/llama-4-scout-17b-16e-instruct",
    provider: "groq",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    env: "GROQ_API_KEY",
  },
  {
    label: "Groq · deepseek-r1-distill-llama-70b",
    provider: "groq",
    model: "deepseek-r1-distill-llama-70b",
    env: "GROQ_API_KEY",
  },
  {
    label: "Groq · qwen/qwen3-32b",
    provider: "groq",
    model: "qwen/qwen3-32b",
    env: "GROQ_API_KEY",
  },
  {
    label: "Groq · moonshotai/kimi-k2-instruct",
    provider: "groq",
    model: "moonshotai/kimi-k2-instruct",
    env: "GROQ_API_KEY",
  },
  {
    label: "Groq · openai/gpt-oss-120b",
    provider: "groq",
    model: "openai/gpt-oss-120b",
    env: "GROQ_API_KEY",
  },
  {
    label: "Groq · openai/gpt-oss-20b",
    provider: "groq",
    model: "openai/gpt-oss-20b",
    env: "GROQ_API_KEY",
  },
];

export type UserAgentConfig = {
  kind: "user";
  ownerWallet?: string;
  provider: AgentProvider;
  model: string;
  style: string;
  topics?: string[];
  source: "cli" | "web";
  permission: {
    enabled: boolean;
    maxStake: number;
  };
};

export type AgentRow = {
  id: string;
  slug: string;
  display_name: string;
  wallet_pubkey: string;
  onchain_agent_pubkey: string | null;
  config: Record<string, unknown> | null;
};

export type AgentTradeRow = {
  id: string;
  agent_id: string;
  pulse_id: string;
  side: string | null;
  stake: number | null;
  reasoning: string | null;
  signature: string | null;
  execute_tx: string | null;
  created_at: string | null;
};

export type AgentTradeWithAgent = AgentTradeRow & {
  agent_slug: string;
  agent_name: string;
  agent_kind: "system" | "user";
  pulse_question: string;
};

export type AgentTradeDetail = AgentTradeWithAgent & {
  onchain_pool_pubkey: string | null;
  odds_message_id: string | null;
  pulse_status: string | null;
  winning_side: string | null;
};

export type AgentPnlRow = {
  agent_slug: string;
  agent_name: string;
  kind: "system" | "user";
  fills: number;
  wins: number;
  losses: number;
  open_fills: number;
  pnl_usdt: number;
  win_rate: number;
};

type AgentInsert = {
  slug: string;
  display_name: string;
  wallet_pubkey: string;
  config?: Record<string, unknown>;
};

type AgentUpdate = {
  display_name?: string;
  wallet_pubkey?: string;
  config?: Record<string, unknown>;
};

type TradeInsert = {
  agent_id: string;
  pulse_id: string;
  side: "yes" | "no";
  stake: number;
  reasoning: string;
  signature: string;
  execute_tx: string;
};

function agents() {
  return createDbClient().from("agents") as unknown as {
    upsert: (
      row: AgentInsert,
      opts: { onConflict: string },
    ) => {
      select: (cols: string) => {
        single: () => Promise<{
          data: AgentRow | null;
          error: { message: string } | null;
        }>;
      };
    };
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        single: () => Promise<{
          data: AgentRow | null;
          error: { message: string } | null;
        }>;
      };
    };
    update: (row: AgentUpdate) => {
      eq: (
        col: string,
        val: string,
      ) => {
        select: (cols: string) => {
          single: () => Promise<{
            data: AgentRow | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
}

function agentSecrets() {
  return createDbClient().from("agent_secrets") as unknown as {
    upsert: (
      row: {
        agent_id: string;
        provider: string;
        encrypted_api_key: string;
        encrypted_wallet_secret?: string | null;
        updated_at?: string;
      },
      opts: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>;
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        single: () => Promise<{
          data: {
            agent_id: string;
            provider: string;
            encrypted_api_key: string;
            encrypted_wallet_secret: string | null;
          } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

function agentClaimCodes() {
  return createDbClient().from("agent_claim_codes") as unknown as {
    insert: (row: {
      code: string;
      agent_id: string;
      expires_at: string;
    }) => Promise<{
      error: { message: string } | null;
    }>;
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        single: () => Promise<{
          data: {
            code: string;
            agent_id: string | null;
            expires_at: string;
            claimed_at: string | null;
            claimed_by_wallet: string | null;
          } | null;
          error: { message: string } | null;
        }>;
      };
    };
    update: (row: { claimed_at: string; claimed_by_wallet: string }) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
}

function agentTrades() {
  return createDbClient().from("agent_trades") as unknown as {
    insert: (row: TradeInsert) => {
      select: (cols: string) => {
        single: () => Promise<{
          data: AgentTradeRow | null;
          error: { message: string } | null;
        }>;
      };
    };
    select: (cols: string) => {
      order: (
        col: string,
        opts: { ascending: boolean },
      ) => {
        limit: (n: number) => Promise<{
          data: AgentTradeRow[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

export async function ensureAgent(row: AgentInsert): Promise<AgentRow> {
  const { data, error } = await agents()
    .upsert(row, { onConflict: "slug" })
    .select(
      "id, slug, display_name, wallet_pubkey, onchain_agent_pubkey, config",
    )
    .single();
  if (error || !data) throw new Error(error?.message ?? "agent upsert failed");
  return data;
}

export async function getAgentBySlug(slug: string): Promise<AgentRow | null> {
  const { data, error } = await agents()
    .select(
      "id, slug, display_name, wallet_pubkey, onchain_agent_pubkey, config",
    )
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data;
}

function encryptionKey(): Buffer {
  const seed =
    process.env.AGENT_SECRET_KEY?.trim() ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    "copium-devnet-agent-secret";
  return createHash("sha256").update(seed).digest();
}

export function encryptAgentApiKey(apiKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptAgentApiKey(payload: string): string {
  const [ivRaw, tagRaw, encryptedRaw] = payload.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw)
    throw new Error("invalid agent secret");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivRaw, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function isUserAgentConfig(config: unknown): config is UserAgentConfig {
  if (!config || typeof config !== "object") return false;
  const c = config as Partial<UserAgentConfig>;
  return (
    c.kind === "user" &&
    c.provider !== undefined &&
    SUPPORTED_AGENT_PROVIDERS.includes(c.provider) &&
    typeof c.style === "string"
  );
}

export function normalizeAgentStyle(style: string): string {
  return style.trim().replace(/\s+/g, " ").slice(0, 120);
}

export function normalizeAgentTopics(topics?: string[]): string[] {
  const unique = new Set<string>();
  for (const topic of topics ?? []) {
    const value = topic.trim().toLowerCase();
    if (!value) continue;
    if ((AGENT_TOPIC_OPTIONS as readonly string[]).includes(value)) {
      unique.add(value);
    }
  }
  return [...unique];
}

export function normalizeAgentSlug(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return `user-${base || "agent"}-${randomBytes(3).toString("hex")}`;
}

export function generateAgentClaimCode(): string {
  return randomBytes(5).toString("base64url").toUpperCase();
}

export async function createUserAgent(input: {
  name: string;
  ownerWallet?: string;
  walletPubkey: string;
  provider: AgentProvider;
  model: string;
  style: string;
  topics?: string[];
  source: "cli" | "web";
  apiKey?: string;
  walletSecret?: number[];
  permissionEnabled?: boolean;
  maxStake?: number;
}): Promise<AgentRow> {
  const style = normalizeAgentStyle(input.style);
  const topics = normalizeAgentTopics(input.topics);
  if (!style) throw new Error("agent style required");
  if (!SUPPORTED_AGENT_PROVIDERS.includes(input.provider))
    throw new Error("unsupported provider");
  const agent = await ensureAgent({
    slug: normalizeAgentSlug(input.name),
    display_name: input.name.trim().slice(0, 48) || "User Agent",
    wallet_pubkey: input.walletPubkey,
    config: {
      kind: "user",
      ownerWallet: input.ownerWallet,
      provider: input.provider,
      model: input.model.trim(),
      style,
      topics,
      source: input.source,
      permission: {
        enabled: Boolean(input.permissionEnabled),
        maxStake: input.maxStake ?? 100_000,
      },
    } satisfies UserAgentConfig,
  });
  await storeAgentSecrets(agent.id, input.provider, {
    apiKey: input.apiKey?.trim(),
    walletSecret: input.walletSecret,
  });
  return agent;
}

export async function updateAgentConfig(
  agentId: string,
  config: UserAgentConfig,
): Promise<AgentRow> {
  const { data, error } = await agents()
    .update({ config: config as unknown as Record<string, unknown> })
    .eq("id", agentId)
    .select(
      "id, slug, display_name, wallet_pubkey, onchain_agent_pubkey, config",
    )
    .single();
  if (error || !data) throw new Error(error?.message ?? "agent update failed");
  return data;
}

export async function listUserAgents(
  ownerWallet?: string,
): Promise<AgentRow[]> {
  const { data, error } = await (
    createDbClient().from("agents") as unknown as {
      select: (cols: string) => Promise<{
        data: AgentRow[] | null;
        error: { message: string } | null;
      }>;
    }
  ).select(
    "id, slug, display_name, wallet_pubkey, onchain_agent_pubkey, config",
  );
  if (error) throw new Error(error.message);
  return (data ?? []).filter((agent) => {
    if (!isUserAgentConfig(agent.config)) return false;
    return !ownerWallet || agent.config.ownerWallet === ownerWallet;
  });
}

export async function storeAgentSecrets(
  agentId: string,
  provider: AgentProvider,
  secrets: { apiKey?: string; walletSecret?: number[] },
): Promise<void> {
  if (!secrets.apiKey && !secrets.walletSecret) return;
  const { error } = await agentSecrets().upsert(
    {
      agent_id: agentId,
      provider,
      encrypted_api_key: encryptAgentApiKey(secrets.apiKey ?? ""),
      encrypted_wallet_secret: secrets.walletSecret
        ? encryptAgentApiKey(JSON.stringify(secrets.walletSecret))
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "agent_id" },
  );
  if (error) throw new Error(error.message);
}

export async function storeAgentApiKey(
  agentId: string,
  provider: AgentProvider,
  apiKey: string,
): Promise<void> {
  await storeAgentSecrets(agentId, provider, { apiKey });
}

export async function getAgentApiKey(agentId: string): Promise<string | null> {
  const { data, error } = await agentSecrets()
    .select("agent_id, provider, encrypted_api_key, encrypted_wallet_secret")
    .eq("agent_id", agentId)
    .single();
  if (error || !data) return null;
  return decryptAgentApiKey(data.encrypted_api_key);
}

export async function getAgentWalletSecret(
  agentId: string,
): Promise<number[] | null> {
  const { data, error } = await agentSecrets()
    .select("agent_id, provider, encrypted_api_key, encrypted_wallet_secret")
    .eq("agent_id", agentId)
    .single();
  if (error || !data?.encrypted_wallet_secret) return null;
  return JSON.parse(
    decryptAgentApiKey(data.encrypted_wallet_secret),
  ) as number[];
}

export async function createAgentClaimCode(agentId: string): Promise<string> {
  const code = generateAgentClaimCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
  const { error } = await agentClaimCodes().insert({
    code,
    agent_id: agentId,
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);
  return code;
}

export async function redeemAgentClaimCode(
  codeRaw: string,
  wallet: string,
): Promise<AgentRow> {
  const code = codeRaw.trim().toUpperCase();
  const { data, error } = await agentClaimCodes()
    .select("code, agent_id, expires_at, claimed_at, claimed_by_wallet")
    .eq("code", code)
    .single();
  if (error || !data?.agent_id) throw new Error("claim code not found");
  if (data.claimed_at) throw new Error("claim code already used");
  if (new Date(data.expires_at).getTime() < Date.now())
    throw new Error("claim code expired");
  const agent = await getAgentById(data.agent_id);
  if (!agent || !isUserAgentConfig(agent.config))
    throw new Error("agent not found");
  const nextConfig: UserAgentConfig = {
    ...agent.config,
    ownerWallet: wallet,
  };
  const updated = await updateAgentConfig(agent.id, nextConfig);
  const update = await agentClaimCodes()
    .update({ claimed_at: new Date().toISOString(), claimed_by_wallet: wallet })
    .eq("code", code);
  if (update.error) throw new Error(update.error.message);
  return updated;
}

export async function getAgentById(agentId: string): Promise<AgentRow | null> {
  const { data, error } = await (
    createDbClient().from("agents") as unknown as {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string,
        ) => {
          single: () => Promise<{
            data: AgentRow | null;
            error: { message: string } | null;
          }>;
        };
      };
    }
  )
    .select(
      "id, slug, display_name, wallet_pubkey, onchain_agent_pubkey, config",
    )
    .eq("id", agentId)
    .single();
  if (error) return null;
  return data;
}

export async function insertAgentTrade(
  row: TradeInsert,
): Promise<AgentTradeRow> {
  const { data, error } = await agentTrades()
    .insert(row)
    .select(
      "id, agent_id, pulse_id, side, stake, reasoning, signature, execute_tx, created_at",
    )
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "agent_trades insert failed");
  return data;
}

/** Desk tape — newest trades with agent + pulse question. */
export async function listAgentTape(
  limit = 40,
): Promise<AgentTradeWithAgent[]> {
  const { data: trades, error: tradeErr } = await (
    createDbClient().from("agent_trades") as unknown as {
      select: (cols: string) => {
        order: (
          col: string,
          opts: { ascending: boolean },
        ) => {
          limit: (n: number) => Promise<{
            data: AgentTradeRow[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    }
  )
    .select(
      "id, agent_id, pulse_id, side, stake, reasoning, signature, execute_tx, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (tradeErr) throw new Error(tradeErr.message);
  if (!trades?.length) return [];

  const agentIds = [...new Set(trades.map((t) => t.agent_id))];
  const pulseIds = [...new Set(trades.map((t) => t.pulse_id))];

  const agentsById = new Map<string, AgentRow>();
  for (const id of agentIds) {
    const { data } = await (
      createDbClient().from("agents") as unknown as {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string,
          ) => {
            single: () => Promise<{ data: AgentRow | null; error: unknown }>;
          };
        };
      }
    )
      .select(
        "id, slug, display_name, wallet_pubkey, onchain_agent_pubkey, config",
      )
      .eq("id", id)
      .single();
    if (data) agentsById.set(id, data);
  }

  const pulsesById = new Map<string, string>();
  for (const id of pulseIds) {
    const { data } = await (
      createDbClient().from("pulses") as unknown as {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string,
          ) => {
            single: () => Promise<{
              data: { question: string } | null;
              error: unknown;
            }>;
          };
        };
      }
    )
      .select("question")
      .eq("id", id)
      .single();
    if (data?.question) pulsesById.set(id, data.question);
  }

  return trades.map((row) => {
    const agent = agentsById.get(row.agent_id);
    return {
      ...row,
      agent_slug: agent?.slug ?? "unknown",
      agent_name: agent?.display_name ?? "Agent",
      agent_kind: isUserAgentConfig(agent?.config) ? "user" : "system",
      pulse_question: pulsesById.get(row.pulse_id) ?? "",
    };
  });
}

type PulseMeta = {
  question: string;
  status: string | null;
  onchain_pool_pubkey: string | null;
  odds_message_id: string | null;
  winning_side: string | null;
};

async function fetchPulseMeta(pulseId: string): Promise<PulseMeta | null> {
  const { data } = await (
    createDbClient().from("pulses") as unknown as {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string,
        ) => {
          single: () => Promise<{
            data: {
              question: string;
              status: string | null;
              onchain_pool_pubkey: string | null;
              odds_message_id: string | null;
              winning_side: string | null;
            } | null;
            error: unknown;
          }>;
        };
      };
    }
  )
    .select(
      "question, status, onchain_pool_pubkey, odds_message_id, winning_side",
    )
    .eq("id", pulseId)
    .single();
  return data;
}

/** Copy/fade Blink — trade + open pulse pool. */
export async function getAgentTradeById(
  tradeId: string,
): Promise<AgentTradeDetail | null> {
  const { data: trade, error } = await (
    createDbClient().from("agent_trades") as unknown as {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string,
        ) => {
          single: () => Promise<{
            data: AgentTradeRow | null;
            error: { message: string } | null;
          }>;
        };
      };
    }
  )
    .select(
      "id, agent_id, pulse_id, side, stake, reasoning, signature, execute_tx, created_at",
    )
    .eq("id", tradeId)
    .single();
  if (error || !trade) return null;

  const { data: agent } = await agents()
    .select(
      "id, slug, display_name, wallet_pubkey, onchain_agent_pubkey, config",
    )
    .eq("id", trade.agent_id)
    .single();
  const pulse = await fetchPulseMeta(trade.pulse_id);
  if (!agent || !pulse) return null;

  return {
    ...trade,
    agent_slug: agent.slug,
    agent_name: agent.display_name,
    agent_kind: isUserAgentConfig(agent.config) ? "user" : "system",
    pulse_question: pulse.question,
    onchain_pool_pubkey: pulse.onchain_pool_pubkey,
    odds_message_id: pulse.odds_message_id,
    pulse_status: pulse.status,
    winning_side: pulse.winning_side,
  };
}

/** Settled pulse PnL — wins/losses from real winning_side only. */
export async function listAgentPnl(): Promise<AgentPnlRow[]> {
  const { data: trades, error } = await (
    createDbClient().from("agent_trades") as unknown as {
      select: (cols: string) => {
        order: (
          col: string,
          opts: { ascending: boolean },
        ) => Promise<{
          data: AgentTradeRow[] | null;
          error: { message: string } | null;
        }>;
      };
    }
  )
    .select(
      "id, agent_id, pulse_id, side, stake, reasoning, signature, execute_tx, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  if (!trades?.length) return [];

  const agentIds = [...new Set(trades.map((t) => t.agent_id))];
  const pulseIds = [...new Set(trades.map((t) => t.pulse_id))];

  const agentsById = new Map<string, AgentRow>();
  for (const id of agentIds) {
    const { data } = await agents()
      .select(
        "id, slug, display_name, wallet_pubkey, onchain_agent_pubkey, config",
      )
      .eq("id", id)
      .single();
    if (data) agentsById.set(id, data);
  }

  const pulsesById = new Map<string, PulseMeta>();
  for (const id of pulseIds) {
    const meta = await fetchPulseMeta(id);
    if (meta) pulsesById.set(id, meta);
  }

  const board = new Map<string, AgentPnlRow>();
  for (const trade of trades) {
    const agent = agentsById.get(trade.agent_id);
    const slug = agent?.slug ?? "unknown";
    const row =
      board.get(slug) ??
      ({
        agent_slug: slug,
        agent_name: agent?.display_name ?? "Agent",
        kind: isUserAgentConfig(agent?.config) ? "user" : "system",
        fills: 0,
        wins: 0,
        losses: 0,
        open_fills: 0,
        pnl_usdt: 0,
        win_rate: 0,
      } satisfies AgentPnlRow);
    row.fills += 1;

    const pulse = pulsesById.get(trade.pulse_id);
    const stakeUsdt = (trade.stake ?? 0) / 1_000_000;
    if (!pulse?.winning_side || !trade.side) {
      row.open_fills += 1;
    } else if (trade.side === pulse.winning_side) {
      row.wins += 1;
      row.pnl_usdt += stakeUsdt;
    } else {
      row.losses += 1;
      row.pnl_usdt -= stakeUsdt;
    }
    const closed = row.wins + row.losses;
    row.win_rate = closed > 0 ? row.wins / closed : 0;
    board.set(slug, row);
  }

  return [...board.values()].sort((a, b) => b.pnl_usdt - a.pnl_usdt);
}

function demo(): void {
  const topics = normalizeAgentTopics([
    "Soccer",
    "world-cup",
    "unknown",
    "soccer",
  ]);
  console.assert(topics.length === 2);
  console.assert(topics[0] === "soccer");
  console.assert(topics[1] === "world-cup");
}

import { pathToFileURL } from "node:url";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  demo();
}
