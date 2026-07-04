import { SOLANA_DEVNET } from "@copium/config";

export type FeedPulse = {
  id: string;
  question: string;
  opens_at: string;
  closes_at: string;
  line_pct: number | null;
  crowd_yes_pct: number | null;
  status: string | null;
  onchain_pool_pubkey: string | null;
};

export type DuelScore = {
  you: number;
  them: number;
  memberCount: number;
  roomSlug: string;
};

export type WalletReceipt = {
  id: string;
  label: string | null;
  pulse_id: string;
  question: string;
  side: "yes" | "no" | null;
  result: string | null;
  winning_side: string | null;
  created_at: string | null;
  share_url: string;
};

export type FeedContext = {
  score: string;
  scoreHome: number;
  scoreAway: number;
  phase: string;
  minute: number | null;
  copiumGap: number;
  crowdYesPct: number;
  linePct: number;
  fixtureId: number | null;
  simSessionId: string | null;
  pulseQuestion: string | null;
};

export type AgentFlyby = {
  id: string;
  agentName: string;
  agentSlug: string;
  side: string | null;
  stake: number | null;
  reasoning: string | null;
  executeTx: string | null;
  pulseQuestion: string;
  createdAt: string | null;
};

const webBase = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";

export function webApiBase(): string {
  return webBase;
}

export async function fetchOpenPulses(): Promise<FeedPulse[]> {
  const res = await fetch(`${webBase}/api/feed/open?limit=5`);
  const json = (await res.json()) as { ok?: boolean; pulses?: FeedPulse[]; error?: string };
  if (!res.ok || !json.ok || !json.pulses) {
    throw new Error(json.error ?? "feed fetch failed");
  }
  return json.pulses;
}

export async function fetchFeedContext(): Promise<FeedContext | null> {
  const res = await fetch(`${webBase}/api/feed/context`);
  const json = (await res.json()) as { ok?: boolean; context?: FeedContext; error?: string };
  if (!res.ok || !json.ok || !json.context) return null;
  return json.context;
}

export async function fetchAgentFlyby(): Promise<AgentFlyby | null> {
  const res = await fetch(`${webBase}/api/feed/flyby`);
  const json = (await res.json()) as { ok?: boolean; flyby?: AgentFlyby | null; error?: string };
  if (!res.ok || !json.ok) return null;
  return json.flyby ?? null;
}

export async function fetchRoomDuel(roomId: string, wallet: string): Promise<DuelScore> {
  const res = await fetch(
    `${webBase}/api/rooms/${roomId}/duel?wallet=${encodeURIComponent(wallet)}`,
  );
  const json = (await res.json()) as { ok?: boolean; duel?: DuelScore; error?: string };
  if (!res.ok || !json.ok || !json.duel) {
    throw new Error(json.error ?? "duel fetch failed");
  }
  return json.duel;
}

export async function joinRoom(roomId: string, wallet: string): Promise<string> {
  const res = await fetch(`${webBase}/api/actions/join-room/${roomId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account: wallet }),
  });
  const json = (await res.json()) as { type?: string; message?: string };
  if (!res.ok) throw new Error(json.message ?? "join failed");
  return json.message ?? "Joined";
}

export async function fetchWalletReceipts(wallet: string): Promise<WalletReceipt[]> {
  const res = await fetch(
    `${webBase}/api/receipts/for-wallet?wallet=${encodeURIComponent(wallet)}&limit=5`,
  );
  const json = (await res.json()) as { ok?: boolean; receipts?: WalletReceipt[]; error?: string };
  if (!res.ok || !json.ok || !json.receipts) {
    throw new Error(json.error ?? "receipts fetch failed");
  }
  return json.receipts;
}

export function joinRoomBlinkUrl(roomId: string): string {
  const action = `${webBase}/api/actions/join-room/${roomId}`;
  return `https://dial.to/?action=${encodeURIComponent(action)}`;
}

export function pulsePickBlinkUrl(pulseId: string, side: "yes" | "no"): string {
  const action = `${webBase}/api/actions/pulse-pick/${pulseId}?side=${side}`;
  return `https://dial.to/?action=${encodeURIComponent(action)}`;
}

export { SOLANA_DEVNET };
