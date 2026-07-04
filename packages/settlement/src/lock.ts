import { fetchOddsValidation, type OddsValidationPayload } from "./fetch-odds.js";
import { toBytes32 } from "./merkle.js";

export type LockedOddsSnapshot = {
  messageId: string;
  oddsTs: number;
  linePct?: number;
  oddsLockRoot: number[];
  proof: OddsValidationPayload;
};

function linePctFromOdds(odds: OddsValidationPayload["odds"]): number | undefined {
  for (const entry of odds.Pct ?? []) {
    if (entry === "NA") continue;
    const n = Number(entry);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Lock TxLINE odds at spawn — oddsSubTreeRoot becomes pool odds_lock_root. */
export async function lockOddsSnapshot(
  apiOrigin: string,
  jwt: string,
  apiToken: string,
  messageId: string,
  ts: number,
  fallbackLinePct?: number,
): Promise<LockedOddsSnapshot> {
  const proof = await fetchOddsValidation(apiOrigin, jwt, apiToken, messageId, ts);
  const oddsLockRoot = toBytes32(proof.summary.oddsSubTreeRoot);

  return {
    messageId: proof.odds.MessageId,
    oddsTs: proof.odds.Ts,
    linePct: linePctFromOdds(proof.odds) ?? fallbackLinePct,
    oddsLockRoot,
    proof,
  };
}
