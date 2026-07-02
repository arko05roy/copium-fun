import { FEE_BPS } from "./calibration.js";

export type PoolSide = "yes" | "no";

/** Crowd YES % from on-chain pool totals (AGILE-PLAN §6.1). */
export function crowdYesPct(yesTotal: bigint, noTotal: bigint): number {
  const total = yesTotal + noTotal;
  if (total === 0n) return 50;
  return Number((yesTotal * 10_000n) / total) / 100;
}

/** Binary YES/NO parimutuel payout after optional room fee. */
export function positionPayout(opts: {
  stake: bigint;
  side: PoolSide;
  yesTotal: bigint;
  noTotal: bigint;
  winningSide: PoolSide;
  feeBps?: number;
}): bigint {
  const { stake, side, yesTotal, noTotal, winningSide, feeBps = FEE_BPS } =
    opts;
  if (side !== winningSide) return 0n;

  const winnerTotal = winningSide === "yes" ? yesTotal : noTotal;
  if (winnerTotal === 0n) return 0n;

  const pool = yesTotal + noTotal;
  const prize = (pool * BigInt(10_000 - feeBps)) / 10_000n;
  return (stake * prize) / winnerTotal;
}

/** Implied pool split before settlement. */
export function poolSplit(yesTotal: bigint, noTotal: bigint): {
  yesPct: number;
  noPct: number;
} {
  const yesPct = crowdYesPct(yesTotal, noTotal);
  return { yesPct, noPct: 100 - yesPct };
}

export function prizePool(
  yesTotal: bigint,
  noTotal: bigint,
  feeBps: number = FEE_BPS,
): bigint {
  return ((yesTotal + noTotal) * BigInt(10_000 - feeBps)) / 10_000n;
}

export function positionResult(
  side: PoolSide,
  winningSide: PoolSide,
): "win" | "loss" {
  return side === winningSide ? "win" : "loss";
}

/** Sum winner payouts — must equal prizePool when stakes cover the pool. */
export function sumWinnerPayouts(opts: {
  positions: readonly { side: PoolSide; stake: bigint }[];
  yesTotal: bigint;
  noTotal: bigint;
  winningSide: PoolSide;
  feeBps?: number;
}): bigint {
  const { positions, yesTotal, noTotal, winningSide, feeBps } = opts;
  return positions.reduce(
    (sum, pos) =>
      sum +
      positionPayout({
        stake: pos.stake,
        side: pos.side,
        yesTotal,
        noTotal,
        winningSide,
        feeBps,
      }),
    0n,
  );
}
