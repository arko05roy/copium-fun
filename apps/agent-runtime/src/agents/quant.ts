export type QuantDecision = {
  side: "yes" | "no";
  reasoning: string;
};

/** The Quant — lean toward TxLINE line when crowd is neutral (AGILE-PLAN §10.2). */
export function quantDecision(linePct: number, crowdYesPct = 50): QuantDecision | null {
  const edge = linePct - crowdYesPct;
  if (Math.abs(edge) < 1) return null;

  const side: "yes" | "no" = edge > 0 ? "yes" : "no";
  return {
    side,
    reasoning: `Line ${linePct.toFixed(1)}% vs crowd ${crowdYesPct}% — Quant with the line`,
  };
}

function demo(): void {
  const yes = quantDecision(57.5);
  console.assert(yes?.side === "yes");
  const skip = quantDecision(50.5);
  console.assert(skip === null);
  console.log("quant demo ok");
}

import { pathToFileURL } from "node:url";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  demo();
}
