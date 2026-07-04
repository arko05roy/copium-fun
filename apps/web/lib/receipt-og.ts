import type { ReceiptRow } from "@copium/db";
import type { PulseRow } from "@copium/db";

export type ReceiptOgInput = {
  receipt: ReceiptRow;
  pulse: Pick<PulseRow, "question" | "line_pct" | "crowd_yes_pct" | "winning_side">;
  side: "yes" | "no" | null;
};

const LABEL_STYLE: Record<string, { accent: string; sub: string; emoji: string }> = {
  CERTIFIED: { accent: "#FF5C5C", sub: "CERTIFIED COPIUM", emoji: "☠" },
  PROPHETIC: { accent: "#FFD166", sub: "PROPHETIC COPIUM", emoji: "★" },
  BASED: { accent: "#B8FF57", sub: "BASED RECEIPT", emoji: "✓" },
  WIN: { accent: "#B8FF57", sub: "WIN", emoji: "✓" },
  LOSS: { accent: "#9BB8A8", sub: "LOSS", emoji: "—" },
};

export function receiptLabelStyle(label: string | null) {
  return LABEL_STYLE[label ?? "LOSS"] ?? LABEL_STYLE.LOSS;
}

/** Shared layout for OG ImageResponse + receipt page hero. */
export function receiptOgContent(input: ReceiptOgInput) {
  const label = input.receipt.label ?? "LOSS";
  const style = receiptLabelStyle(label);
  const crowd = input.pulse.crowd_yes_pct ?? 50;
  const line = input.pulse.line_pct ?? 50;
  const side = input.side?.toUpperCase() ?? "—";

  return {
    label,
    style,
    crowd,
    line,
    side,
    question: input.pulse.question,
    winningSide: input.pulse.winning_side?.toUpperCase() ?? null,
  };
}

export function receiptShareText(input: ReceiptOgInput, url: string): string {
  const { label, style, side, crowd, line } = receiptOgContent(input);
  if (label === "CERTIFIED") {
    return `Swiped ${side}. Crowd ${crowd}% · Line ${line}%. ${style.sub}. ${url}`;
  }
  if (label === "PROPHETIC") {
    return `Early ${side} @ ${crowd}% crowd. ${style.sub}. ${url}`;
  }
  return `${style.sub} · ${side} on copium.fun. ${url}`;
}
