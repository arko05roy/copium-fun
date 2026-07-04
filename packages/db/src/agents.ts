import { createDbClient } from "./client.js";

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
  pulse_question: string;
};

type AgentInsert = {
  slug: string;
  display_name: string;
  wallet_pubkey: string;
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
        single: () => Promise<{ data: AgentRow | null; error: { message: string } | null }>;
      };
    };
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        single: () => Promise<{ data: AgentRow | null; error: { message: string } | null }>;
      };
    };
  };
}

function agentTrades() {
  return createDbClient().from("agent_trades") as unknown as {
    insert: (row: TradeInsert) => {
      select: (cols: string) => {
        single: () => Promise<{ data: AgentTradeRow | null; error: { message: string } | null }>;
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
    .select("id, slug, display_name, wallet_pubkey, onchain_agent_pubkey, config")
    .single();
  if (error || !data) throw new Error(error?.message ?? "agent upsert failed");
  return data;
}

export async function getAgentBySlug(slug: string): Promise<AgentRow | null> {
  const { data, error } = await agents()
    .select("id, slug, display_name, wallet_pubkey, onchain_agent_pubkey, config")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data;
}

export async function insertAgentTrade(row: TradeInsert): Promise<AgentTradeRow> {
  const { data, error } = await agentTrades()
    .insert(row)
    .select("id, agent_id, pulse_id, side, stake, reasoning, signature, execute_tx, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "agent_trades insert failed");
  return data;
}

/** Desk tape — newest trades with agent + pulse question. */
export async function listAgentTape(limit = 40): Promise<AgentTradeWithAgent[]> {
  const { data: trades, error: tradeErr } = await (createDbClient().from(
    "agent_trades",
  ) as unknown as {
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
  })
    .select("id, agent_id, pulse_id, side, stake, reasoning, signature, execute_tx, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (tradeErr) throw new Error(tradeErr.message);
  if (!trades?.length) return [];

  const agentIds = [...new Set(trades.map((t) => t.agent_id))];
  const pulseIds = [...new Set(trades.map((t) => t.pulse_id))];

  const agentsById = new Map<string, AgentRow>();
  for (const id of agentIds) {
    const { data } = await (createDbClient().from("agents") as unknown as {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string,
        ) => {
          single: () => Promise<{ data: AgentRow | null; error: unknown }>;
        };
      };
    })
      .select("id, slug, display_name, wallet_pubkey, onchain_agent_pubkey, config")
      .eq("id", id)
      .single();
    if (data) agentsById.set(id, data);
  }

  const pulsesById = new Map<string, string>();
  for (const id of pulseIds) {
    const { data } = await (createDbClient().from("pulses") as unknown as {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string,
        ) => {
          single: () => Promise<{ data: { question: string } | null; error: unknown }>;
        };
      };
    })
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
      pulse_question: pulsesById.get(row.pulse_id) ?? "",
    };
  });
}
