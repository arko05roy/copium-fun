import {
  addRoomMemberDuelPoints,
  listCrowdPositionsForPulse,
  listRoomMembers,
  listRoomsForFixture,
  type PulseRow,
} from "@copium/db";
import { duelPoints } from "@copium/pulse-engine/duel-points";
import { receiptLabel } from "@copium/pulse-engine/labels";

export async function scoreRoomDuelsForPulse(
  pulse: PulseRow,
  winningSide: "yes" | "no",
): Promise<number> {
  if (!pulse.fixture_id) return 0;

  const posRows = await listCrowdPositionsForPulse(pulse.id);
  if (!posRows.length) return 0;

  const rooms = await listRoomsForFixture(pulse.fixture_id);
  if (!rooms.length) return 0;

  const opensSec = Math.floor(new Date(pulse.opens_at).getTime() / 1000);
  let scored = 0;

  for (const pos of posRows) {
    if (!pos.user_id || !pos.side) continue;
    const result = pos.side === winningSide ? "win" : "loss";
    const label = receiptLabel({
      side: pos.side,
      result,
      crowdYesPctAtPick: pulse.crowd_yes_pct ?? 50,
      linePctAtPick: pulse.line_pct ?? 50,
      opensAt: opensSec,
    });
    const pts = duelPoints(result, label);

    for (const room of rooms) {
      const members = await listRoomMembers(room.id);
      if (!members.some((m) => m.user_id === pos.user_id)) continue;
      await addRoomMemberDuelPoints(room.id, pos.user_id, pts);
      scored += 1;
    }
  }
  return scored;
}
