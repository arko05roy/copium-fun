import { createHash } from "node:crypto";
import { createDbClient } from "./client.js";
import { updatePulseCrowdPct } from "./pulses.js";

export type RoomRow = {
  id: string;
  slug: string;
  fixture_id: number | null;
  owner_id: string | null;
  created_at: string | null;
};

export type RoomMemberRow = {
  room_id: string;
  user_id: string;
  duel_points: number | null;
};

/** Stable UUID-shaped id from wallet pubkey — no users table in P0. */
export function walletToUserId(walletPubkey: string): string {
  const hash = createHash("sha256").update(walletPubkey, "utf8").digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function rooms() {
  return createDbClient().from("rooms") as unknown as {
    insert: (row: { slug: string; fixture_id: number; owner_id?: string | null }) => {
      select: (cols: string) => {
        single: () => Promise<{ data: RoomRow | null; error: { message: string } | null }>;
      };
    };
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        single: () => Promise<{ data: RoomRow | null; error: { message: string } | null }>;
      };
    };
  };
}

function roomMembers() {
  return createDbClient().from("room_members") as unknown as {
    upsert: (
      row: { room_id: string; user_id: string; duel_points?: number },
      opts: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>;
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{ data: RoomMemberRow[] | null; error: { message: string } | null }>;
    };
    update: (row: { duel_points: number }) => {
      eq: (col: string, val: string) => {
        eq: (col2: string, val2: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  };
}

function positionsForDuel() {
  return createDbClient().from("positions") as unknown as {
    insert: (row: {
      pulse_id: string;
      user_id: string;
      side: "yes" | "no";
      stake: number;
    }) => Promise<{ error: { message: string } | null }>;
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{
        data: {
          id: string;
          user_id: string | null;
          side: "yes" | "no" | null;
          result: string | null;
        }[] | null;
        error: { message: string } | null;
      }>;
    };
  };
}

export async function getRoom(roomId: string): Promise<RoomRow | null> {
  const { data, error } = await rooms()
    .select("id, slug, fixture_id, owner_id, created_at")
    .eq("id", roomId)
    .single();
  if (error) return null;
  return data;
}

export async function getRoomBySlug(slug: string): Promise<RoomRow | null> {
  const { data, error } = await (createDbClient().from("rooms") as unknown as {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        single: () => Promise<{ data: RoomRow | null; error: { message: string } | null }>;
      };
    };
  })
    .select("id, slug, fixture_id, owner_id, created_at")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data;
}

export async function ensureRoom(slug: string, fixtureId: number): Promise<RoomRow> {
  const existing = await (createDbClient().from("rooms") as unknown as {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        single: () => Promise<{ data: RoomRow | null; error: { message: string } | null }>;
      };
    };
  })
    .select("id, slug, fixture_id, owner_id, created_at")
    .eq("slug", slug)
    .single();
  if (existing.data) return existing.data;

  const { data, error } = await rooms()
    .insert({ slug, fixture_id: fixtureId })
    .select("id, slug, fixture_id, owner_id, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "room insert failed");
  return data;
}

export async function joinRoomMember(roomId: string, walletPubkey: string): Promise<void> {
  const userId = walletToUserId(walletPubkey);
  const { error } = await roomMembers().upsert(
    { room_id: roomId, user_id: userId, duel_points: 0 },
    { onConflict: "room_id,user_id" },
  );
  if (error) throw new Error(error.message);
}

export async function listRoomMembers(roomId: string): Promise<RoomMemberRow[]> {
  const { data, error } = await roomMembers()
    .select("room_id, user_id, duel_points")
    .eq("room_id", roomId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type RoomDuelScore = {
  you: number;
  them: number;
  memberCount: number;
  roomSlug: string;
};

export async function getRoomDuel(roomId: string, walletPubkey: string): Promise<RoomDuelScore> {
  const room = await getRoom(roomId);
  if (!room) throw new Error("room not found");
  const userId = walletToUserId(walletPubkey);
  const members = await listRoomMembers(roomId);
  const youRow = members.find((m) => m.user_id === userId);
  const rivals = members
    .filter((m) => m.user_id !== userId)
    .sort((a, b) => (b.duel_points ?? 0) - (a.duel_points ?? 0));
  return {
    you: youRow?.duel_points ?? 0,
    them: rivals[0]?.duel_points ?? 0,
    memberCount: members.length,
    roomSlug: room.slug,
  };
}

export async function insertCrowdPosition(input: {
  pulseId: string;
  walletPubkey: string;
  side: "yes" | "no";
  stake: number;
}): Promise<void> {
  const { error } = await positionsForDuel().insert({
    pulse_id: input.pulseId,
    user_id: walletToUserId(input.walletPubkey),
    side: input.side,
    stake: input.stake,
  });
  if (error) throw new Error(error.message);
}

export async function listCrowdPositionsForPulse(pulseId: string): Promise<
  {
    id: string;
    user_id: string | null;
    side: "yes" | "no" | null;
    result: string | null;
  }[]
> {
  const { data, error } = await positionsForDuel()
    .select("id, user_id, side, result")
    .eq("pulse_id", pulseId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

function crowdYesFromPositions(
  positions: { side: "yes" | "no" | null }[],
): number {
  let yes = 0;
  let no = 0;
  for (const p of positions) {
    if (p.side === "yes") yes += 1;
    else if (p.side === "no") no += 1;
  }
  const total = yes + no;
  if (total === 0) return 50;
  return Math.round((yes / total) * 10_000) / 100;
}

/** Recompute pulses.crowd_yes_pct from position vote counts. */
export async function refreshPulseCrowdFromPositions(
  pulseId: string,
): Promise<{ crowdYesPct: number }> {
  const positions = await listCrowdPositionsForPulse(pulseId);
  const crowdYesPct = crowdYesFromPositions(positions);
  await updatePulseCrowdPct(pulseId, crowdYesPct);
  return { crowdYesPct };
}

export async function listRoomsForFixture(fixtureId: number): Promise<RoomRow[]> {
  const { data, error } = await (createDbClient().from("rooms") as unknown as {
    select: (cols: string) => {
      eq: (
        col: string,
        val: number,
      ) => Promise<{ data: RoomRow[] | null; error: { message: string } | null }>;
    };
  })
    .select("id, slug, fixture_id, owner_id, created_at")
    .eq("fixture_id", fixtureId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addRoomMemberDuelPoints(
  roomId: string,
  userId: string,
  delta: number,
): Promise<void> {
  const members = await listRoomMembers(roomId);
  const current = members.find((m) => m.user_id === userId)?.duel_points ?? 0;
  const { error } = await roomMembers()
    .update({ duel_points: current + delta })
    .eq("room_id", roomId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
