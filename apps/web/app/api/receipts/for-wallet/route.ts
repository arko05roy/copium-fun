import { getCrowdPosition, getPulse, listReceiptsForUser, loadEnv, walletToUserId } from "@copium/db";
import { NextResponse } from "next/server";

loadEnv();

export async function GET(req: Request) {
  const wallet = new URL(req.url).searchParams.get("wallet")?.trim();
  if (!wallet || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
    return NextResponse.json({ ok: false, error: "wallet query required" }, { status: 400 });
  }

  const limit = Math.min(20, Number(new URL(req.url).searchParams.get("limit") ?? 10));
  const userId = walletToUserId(wallet);
  const rows = await listReceiptsForUser(userId, limit);

  const receipts = await Promise.all(
    rows.map(async (row) => {
      if (!row.pulse_id) return null;
      const pulse = await getPulse(row.pulse_id);
      const position = await getCrowdPosition(row.pulse_id, userId);
      return {
        id: row.id,
        label: row.label,
        pulse_id: row.pulse_id,
        question: pulse.question,
        side: position?.side ?? null,
        result:
          position?.result ??
          (pulse.winning_side && position?.side
            ? position.side === pulse.winning_side
              ? "win"
              : "loss"
            : null),
        winning_side: pulse.winning_side,
        created_at: row.created_at,
        share_url: `/r/${row.id}`,
      };
    }),
  );

  return NextResponse.json({
    ok: true,
    receipts: receipts.filter(Boolean),
  });
}
