import { getCrowdPosition, getPulse, getReceipt, loadEnv } from "@copium/db";
import { ImageResponse } from "next/og";

import { receiptLabelStyle, receiptOgContent } from "@/lib/receipt-og";

loadEnv();

export const runtime = "nodejs";
export const alt = "copium.fun receipt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ receiptId: string }> };

export default async function ReceiptOgImage({ params }: Props) {
  const { receiptId } = await params;
  const receipt = await getReceipt(receiptId);
  if (!receipt?.pulse_id) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#071510",
            color: "#9BB8A8",
            fontSize: 32,
          }}
        >
          Receipt not found
        </div>
      ),
      { ...size },
    );
  }

  const pulse = await getPulse(receipt.pulse_id);
  const position = await getCrowdPosition(receipt.pulse_id, receipt.user_id ?? "");
  const content = receiptOgContent({
    receipt,
    pulse,
    side: position?.side ?? null,
  });
  const style = receiptLabelStyle(content.label);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(145deg, #071510 0%, #122018 55%, #1a2f22 100%)",
          color: "#F4FFF7",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 22, letterSpacing: 6, color: "#7CB892", textTransform: "uppercase" }}>
            copium.fun
          </span>
          <span
            style={{
              fontSize: 16,
              padding: "8px 16px",
              border: "1px solid #2A4D38",
              color: "#9BB8A8",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            devnet · TxLINE
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 56, color: style.accent }}>{style.emoji}</span>
            <span
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: style.accent,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {style.sub}
            </span>
          </div>
          <p style={{ fontSize: 36, lineHeight: 1.25, margin: 0, maxWidth: 1000 }}>{content.question}</p>
          <div style={{ display: "flex", gap: 32, fontSize: 24, color: "#9BB8A8" }}>
            <span>
              Swiped <span style={{ color: "#B8FF57" }}>{content.side}</span>
            </span>
            <span>Crowd {content.crowd}%</span>
            <span>Line {content.line}%</span>
            {content.winningSide ? <span>Won {content.winningSide}</span> : null}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "#5A7A68" }}>
          <span>Verified by TxLINE</span>
          <span>copium.fun/r/{receiptId.slice(0, 8)}…</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
