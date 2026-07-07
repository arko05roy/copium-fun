import { getAgentTradeById, loadEnv } from "@copium/db";
import { buildOpenPositionTransaction } from "@copium/pulses-client";
import { createPostResponse, type ActionGetResponse } from "@solana/actions";
import { PublicKey } from "@solana/web3.js";

loadEnv();

const COPY_MAX_STAKE = Number(process.env.COPY_MAX_STAKE ?? 100_000);

export type CopyMode = "copy" | "fade";

function resolveSide(tradeSide: string, mode: CopyMode): "yes" | "no" {
  if (mode === "copy") return tradeSide as "yes" | "no";
  return tradeSide === "yes" ? "no" : "yes";
}

function copyStake(tradeStake: number | null): bigint {
  const cap = COPY_MAX_STAKE;
  const stake = tradeStake ?? cap;
  return BigInt(Math.min(stake, cap));
}

export async function buildCopyActionGet(
  tradeId: string,
  mode: CopyMode,
  baseUrl: string
): Promise<ActionGetResponse | { error: string }> {
  const trade = await getAgentTradeById(tradeId);
  if (!trade) return { error: "trade not found" };
  if (trade.pulse_status !== "open") {
    return {
      error: `Pulse ${trade.pulse_status ?? "unknown"} — copy/fade only works while the shared Pulse is open.`,
    };
  }
  if (!trade.onchain_pool_pubkey || !trade.odds_message_id || !trade.side) {
    return { error: "trade missing pool or odds" };
  }

  const verb = mode === "fade" ? "Fade" : "Copy";
  const side = resolveSide(trade.side, mode);
  const stake = copyStake(trade.stake);
  const apiPath = mode === "fade" ? "fade-agent" : "copy-agent";

  return {
    type: "action",
    icon: new URL("/icon.svg", baseUrl).toString(),
    title: `${verb} ${trade.agent_name}`,
    description: `${verb} ${side.toUpperCase()} in the same live Pulse — ${trade.pulse_question}`,
    label: `${verb} before close · ${(Number(stake) / 1_000_000).toFixed(2)} USDT`,
    links: {
      actions: [
        {
          type: "transaction",
          label: `${verb} live Pulse on devnet`,
          href: `${baseUrl}/api/actions/${apiPath}/${tradeId}`,
        },
      ],
    },
  };
}

export async function buildCopyActionPost(
  tradeId: string,
  mode: CopyMode,
  account: string
): Promise<{ transaction: string; message: string } | { error: string }> {
  const trade = await getAgentTradeById(tradeId);
  if (!trade) return { error: "trade not found" };
  if (trade.pulse_status !== "open") {
    return {
      error: `Pulse ${trade.pulse_status ?? "unknown"} — wait for the next open Pulse to copy/fade agents.`,
    };
  }
  if (!trade.onchain_pool_pubkey || !trade.odds_message_id || !trade.side) {
    return { error: "trade missing pool or odds" };
  }

  let feePayer: PublicKey;
  try {
    feePayer = new PublicKey(account);
  } catch {
    return { error: "invalid account" };
  }

  const side = resolveSide(trade.side, mode);
  const stake = copyStake(trade.stake);
  const verb = mode === "fade" ? "Fade" : "Copy";

  const tx = await buildOpenPositionTransaction({
    feePayer,
    pool: trade.onchain_pool_pubkey,
    side,
    stake,
    oddsMessageId: trade.odds_message_id,
  });

  const post = await createPostResponse({
    fields: {
      type: "transaction",
      transaction: tx,
      message: `${verb} ${trade.agent_name} in live Pulse · ${side.toUpperCase()} · ${trade.pulse_question.slice(0, 64)}`,
    },
  });
  if (post.type !== "transaction") {
    return { error: "copy tx build failed" };
  }

  return {
    transaction: post.transaction,
    message: `${verb} ${trade.agent_name} before close`,
  };
}
