import {
  insertCrowdPosition,
  loadEnv,
  refreshPulseCrowdFromPositions,
} from "@copium/db";
import { SOLANA_DEVNET } from "@copium/config";
import { buildOpenPositionTransaction } from "@copium/pulses-client";
import { createPostResponse, type ActionGetResponse } from "@solana/actions";
import { PublicKey } from "@solana/web3.js";

import { ensurePulsePool } from "./ensure-pulse-pool";

loadEnv();

const PULSE_PICK_STAKE = Number(process.env.PULSE_PICK_STAKE ?? 50_000);
const ALLOWED_STAKES = new Set([1_000_000, 5_000_000, 10_000_000]);

function parseSide(raw: string | null): "yes" | "no" | null {
  const s = raw?.trim().toLowerCase();
  if (s === "yes" || s === "no") return s;
  return null;
}

function parseStake(raw: string | null): number {
  const n = Number(raw);
  if (ALLOWED_STAKES.has(n)) return n;
  return PULSE_PICK_STAKE;
}

export async function buildPulsePickGet(
  pulseId: string,
  baseUrl: string
): Promise<ActionGetResponse | { error: string }> {
  const pulse = await ensurePulsePool(pulseId);
  if (pulse.status !== "open") {
    return {
      error: `Pulse ${pulse.status ?? "closed"} — voting only works during the 90-second window.`,
    };
  }
  if (!pulse.onchain_pool_pubkey || !pulse.odds_message_id) {
    return { error: "pulse missing on-chain pool" };
  }

  const stakeUsdt = (PULSE_PICK_STAKE / 1_000_000).toFixed(2);
  const line = pulse.line_pct != null ? `${pulse.line_pct}%` : "—";
  const crowd = pulse.crowd_yes_pct != null ? `${pulse.crowd_yes_pct}%` : "50%";

  return {
    type: "action",
    icon: new URL("/icon.svg", baseUrl).toString(),
    title: pulse.question,
    description: `Live Pulse only · Line ${line} · Crowd ${crowd} YES · ${SOLANA_DEVNET.cluster}`,
    label: "Pick before close",
    links: {
      actions: [
        {
          type: "transaction",
          label: `YES · ${stakeUsdt} USDT`,
          href: `${baseUrl}/api/actions/pulse-pick/${pulseId}?side=yes`,
        },
        {
          type: "transaction",
          label: `NO · ${stakeUsdt} USDT`,
          href: `${baseUrl}/api/actions/pulse-pick/${pulseId}?side=no`,
        },
      ],
    },
  };
}

export async function buildPulsePickPost(
  pulseId: string,
  account: string,
  sideRaw: string | null,
  stakeRaw: string | null = null
): Promise<{ transaction: string; message: string } | { error: string }> {
  const side = parseSide(sideRaw);
  if (!side) return { error: "side=yes|no required" };
  const stake = parseStake(stakeRaw);

  const pulse = await ensurePulsePool(pulseId);
  if (pulse.status !== "open") {
    return {
      error: `Pulse ${pulse.status ?? "closed"} — wait for the next open Pulse or inspect proof after settlement.`,
    };
  }
  if (!pulse.onchain_pool_pubkey || !pulse.odds_message_id) {
    return { error: "pulse missing on-chain pool" };
  }

  let feePayer: PublicKey;
  try {
    feePayer = new PublicKey(account);
  } catch {
    return { error: "invalid account" };
  }

  const tx = await buildOpenPositionTransaction({
    feePayer,
    pool: pulse.onchain_pool_pubkey,
    side,
    stake: BigInt(stake),
    oddsMessageId: pulse.odds_message_id,
  });

  await insertCrowdPosition({
    pulseId,
    walletPubkey: account,
    side,
    stake,
  });
  await refreshPulseCrowdFromPositions(pulseId);

  const post = await createPostResponse({
    fields: {
      type: "transaction",
      transaction: tx,
      message: `${side.toUpperCase()} on live Pulse · ${pulse.question.slice(0, 64)} · devnet`,
    },
  });
  if (post.type !== "transaction")
    return { error: "pulse-pick tx build failed" };

  return {
    transaction: post.transaction,
    message: `Picked ${side.toUpperCase()} before close`,
  };
}
