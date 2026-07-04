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

export type AgentTradeDetail = AgentTradeWithAgent & {
  onchain_pool_pubkey: string | null;
  odds_message_id: string | null;
  pulse_status: string | null;
  winning_side: string | null;
};

export type AgentPnlRow = {
  agent_slug: string;
  agent_name: string;
  fills: number;
  wins: number;
  losses: number;
  open_fills: number;
  pnl_usdt: number;
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

type PulseMeta = {
  question: string;
  status: string | null;
  onchain_pool_pubkey: string | null;
  odds_message_id: string | null;
  winning_side: string | null;
};

async function fetchPulseMeta(pulseId: string): Promise<PulseMeta | null> {
  const { data } = await (createDbClient().from("pulses") as unknown as {
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
  })
    .select(
      "question, status, onchain_pool_pubkey, odds_message_id, winning_side",
    )
    .eq("id", pulseId)
    .single();
  return data;
}

/** Copy/fade Blink — trade + open pulse pool. */
export async function getAgentTradeById(tradeId: string): Promise<AgentTradeDetail | null> {
  const { data: trade, error } = await (createDbClient().from("agent_trades") as unknown as {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        single: () => Promise<{ data: AgentTradeRow | null; error: { message: string } | null }>;
      };
    };
  })
    .select("id, agent_id, pulse_id, side, stake, reasoning, signature, execute_tx, created_at")
    .eq("id", tradeId)
    .single();
  if (error || !trade) return null;

  const { data: agent } = await agents()
    .select("id, slug, display_name, wallet_pubkey, onchain_agent_pubkey, config")
    .eq("id", trade.agent_id)
    .single();
  const pulse = await fetchPulseMeta(trade.pulse_id);
  if (!agent || !pulse) return null;

  return {
    ...trade,
    agent_slug: agent.slug,
    agent_name: agent.display_name,
    pulse_question: pulse.question,
    onchain_pool_pubkey: pulse.onchain_pool_pubkey,
    odds_message_id: pulse.odds_message_id,
    pulse_status: pulse.status,
    winning_side: pulse.winning_side,
  };
}

/** Settled pulse PnL — wins/losses from real winning_side only. */
export async function listAgentPnl(): Promise<AgentPnlRow[]> {
  const { data: trades, error } = await (createDbClient().from("agent_trades") as unknown as {
    select: (cols: string) => {
      order: (
        col: string,
        opts: { ascending: boolean },
      ) => Promise<{ data: AgentTradeRow[] | null; error: { message: string } | null }>;
    };
  })
    .select("id, agent_id, pulse_id, side, stake, reasoning, signature, execute_tx, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  if (!trades?.length) return [];

  const agentIds = [...new Set(trades.map((t) => t.agent_id))];
  const pulseIds = [...new Set(trades.map((t) => t.pulse_id))];

  const agentsById = new Map<string, AgentRow>();
  for (const id of agentIds) {
    const { data } = await agents()
      .select("id, slug, display_name, wallet_pubkey, onchain_agent_pubkey, config")
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
        fills: 0,
        wins: 0,
        losses: 0,
        open_fills: 0,
        pnl_usdt: 0,
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
    board.set(slug, row);
  }

  return [...board.values()].sort((a, b) => b.pnl_usdt - a.pnl_usdt);
}
