import { getRoom, joinRoomMember, loadEnv } from "@copium/db";
import { SOLANA_DEVNET } from "@copium/config";
import type { ActionGetResponse } from "@solana/actions";

loadEnv();

export async function buildJoinRoomGet(
  roomId: string,
  baseUrl: string,
): Promise<ActionGetResponse | { error: string }> {
  const room = await getRoom(roomId);
  if (!room) return { error: "room not found" };

  return {
    type: "action",
    icon: new URL("/icon.svg", baseUrl).toString(),
    title: `Join ${room.slug}`,
    description: `Match duel room · fixture ${room.fixture_id ?? "—"} · ${SOLANA_DEVNET.cluster}`,
    label: "Join room",
  };
}

export async function buildJoinRoomPost(
  roomId: string,
  account: string,
): Promise<{ type: "message"; message: string } | { error: string }> {
  const room = await getRoom(roomId);
  if (!room) return { error: "room not found" };

  try {
    // validate base58-ish pubkey
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(account)) {
      return { error: "invalid account" };
    }
  } catch {
    return { error: "invalid account" };
  }

  await joinRoomMember(roomId, account);
  return {
    type: "message",
    message: `Joined ${room.slug} on ${SOLANA_DEVNET.cluster}`,
  };
}
