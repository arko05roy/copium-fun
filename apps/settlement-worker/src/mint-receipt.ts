import {
  getReceiptForPulseUser,
  insertReceipt,
  listPositionsForPulse,
  updateReceiptOgUrl,
  type PulseRow,
} from "@copium/db";
import { receiptLabel } from "@copium/pulse-engine/labels";

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";
}

export async function mintReceiptsForPulse(
  pulse: PulseRow,
  winningSide: "yes" | "no",
): Promise<number> {
  const positions = await listPositionsForPulse(pulse.id);
  if (!positions.length) return 0;

  const opensSec = Math.floor(new Date(pulse.opens_at).getTime() / 1000);
  const base = siteBase();
  let minted = 0;

  for (const pos of positions) {
    if (!pos.user_id || !pos.side) continue;

    const existing = await getReceiptForPulseUser(pulse.id, pos.user_id);
    if (existing) continue;

    const result = pos.side === winningSide ? "win" : "loss";
    const pickSec = pos.created_at
      ? Math.floor(new Date(pos.created_at).getTime() / 1000)
      : undefined;
    const label = receiptLabel({
      side: pos.side,
      result,
      crowdYesPctAtPick: pulse.crowd_yes_pct ?? 50,
      linePctAtPick: pulse.line_pct ?? 50,
      pickTimestamp: pickSec,
      opensAt: opensSec,
    });

    const row = await insertReceipt({ userId: pos.user_id, pulseId: pulse.id, label });
    await updateReceiptOgUrl(row.id, `${base}/r/${row.id}/opengraph-image`);
    minted += 1;
  }
  return minted;
}
