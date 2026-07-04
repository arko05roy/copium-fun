import { getCrowdPosition, getPulse, getReceipt, loadEnv } from "@copium/db";
import { NextResponse } from "next/server";

import { receiptOgContent } from "@/lib/receipt-og";

loadEnv();

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ receiptId: string }> },
) {
  const { receiptId } = await ctx.params;
  const receipt = await getReceipt(receiptId);
  if (!receipt?.pulse_id) {
    return NextResponse.json({ ok: false, error: "receipt not found" }, { status: 404 });
  }

  const pulse = await getPulse(receipt.pulse_id);
  const position = await getCrowdPosition(receipt.pulse_id, receipt.user_id ?? "");
  const content = receiptOgContent({
    receipt,
    pulse,
    side: position?.side ?? null,
  });

  return NextResponse.json({
    ok: true,
    receipt: {
      id: receipt.id,
      label: receipt.label,
      pulse_id: receipt.pulse_id,
      og_image_url: receipt.og_image_url,
      created_at: receipt.created_at,
      side: content.side,
      question: content.question,
      crowd_yes_pct: content.crowd,
      line_pct: content.line,
      winning_side: pulse.winning_side,
      proof_url: `/proof/${receipt.pulse_id}`,
    },
  });
}
