import { copiumGap } from "@copium/pulse-engine/copium-gap";

const GAP_THRESHOLD_PP = 20;
const DEFAULT_CROWD_YES = 50;

export type OfficerDecision = {
  side: "yes" | "no";
  gap: number;
  reasoning: string;
};

/** Officer Copium — fade crowd when copium gap > 20pp (AGILE-PLAN §10.2). */
export function officerDecision(
  linePct: number,
  crowdYesPct = DEFAULT_CROWD_YES,
): OfficerDecision | null {
  const gap = copiumGap(crowdYesPct, linePct);
  if (gap <= GAP_THRESHOLD_PP) return null;

  const side: "yes" | "no" = crowdYesPct > linePct ? "no" : "yes";
  return {
    side,
    gap,
    reasoning: `Copium gap ${gap.toFixed(1)}pp — fading crowd ${crowdYesPct}% vs TxLINE line ${linePct}%`,
  };
}

function demo(): void {
  const fade = officerDecision(25, 50);
  console.assert(fade?.side === "yes");
  const skip = officerDecision(45, 50);
  console.assert(skip === null);
  console.log("officer demo ok");
}

import { pathToFileURL } from "node:url";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  demo();
}
