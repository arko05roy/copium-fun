/** AGILE-PLAN §5.1 — |Crowd % − Line %|. */
export function copiumGap(crowdYesPct: number, linePct: number): number {
  return Math.abs(crowdYesPct - linePct);
}
