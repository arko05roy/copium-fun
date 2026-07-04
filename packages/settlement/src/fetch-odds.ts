import { txlineHeaders } from "@copium/txline";
import type { ProofNodeWire } from "./merkle.js";

export type OddsValidationPayload = {
  odds: {
    FixtureId: number;
    MessageId: string;
    Ts: number;
    Bookmaker?: string;
    BookmakerId?: number;
    SuperOddsType?: string;
    GameState?: string | null;
    InRunning?: boolean;
    MarketParameters?: string | null;
    MarketPeriod?: string | null;
    PriceNames?: string[];
    Prices?: number[];
    Pct?: string[];
  };
  summary: {
    fixtureId: number;
    updateStats: {
      updateCount: number;
      minTimestamp: number;
      maxTimestamp: number;
    };
    oddsSubTreeRoot: number[];
  };
  subTreeProof: ProofNodeWire[];
  mainTreeProof: ProofNodeWire[];
};

/** TxLINE GET /api/odds/validation — real Merkle proof for messageId + ts. */
export async function fetchOddsValidation(
  apiOrigin: string,
  jwt: string,
  apiToken: string,
  messageId: string,
  ts: number,
): Promise<OddsValidationPayload> {
  const url = new URL("/api/odds/validation", apiOrigin);
  url.searchParams.set("messageId", messageId);
  url.searchParams.set("ts", String(ts));

  const res = await fetch(url, { headers: txlineHeaders(jwt, apiToken) });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`odds-validation ${res.status}: ${text.slice(0, 200)}`);
  }

  return JSON.parse(text) as OddsValidationPayload;
}
