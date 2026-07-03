import { txlineHeaders } from "@copium/txline";
import type { ProofNodeWire } from "./merkle.js";

export type StatValidationParams = {
  fixtureId: number;
  seq: number;
  statKey: number;
  statKey2?: number;
};

export type StatValidationPayload = {
  ts?: number;
  statToProve: { key: number; value: number; period: number };
  statToProve2?: { key: number; value: number; period: number };
  eventStatRoot: number[];
  summary: {
    fixtureId: number;
    updateStats: {
      updateCount: number;
      minTimestamp: number;
      maxTimestamp: number;
    };
    eventStatsSubTreeRoot: number[];
  };
  statProof: ProofNodeWire[];
  statProof2?: ProofNodeWire[];
  subTreeProof: ProofNodeWire[];
  mainTreeProof: ProofNodeWire[];
};

export async function fetchStatValidation(
  apiOrigin: string,
  jwt: string,
  apiToken: string,
  params: StatValidationParams,
): Promise<StatValidationPayload> {
  const url = new URL("/api/scores/stat-validation", apiOrigin);
  url.searchParams.set("fixtureId", String(params.fixtureId));
  url.searchParams.set("seq", String(params.seq));
  url.searchParams.set("statKey", String(params.statKey));
  if (params.statKey2 !== undefined) {
    url.searchParams.set("statKey2", String(params.statKey2));
  }

  const res = await fetch(url, { headers: txlineHeaders(jwt, apiToken) });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`stat-validation ${res.status}: ${text.slice(0, 200)}`);
  }

  return JSON.parse(text) as StatValidationPayload;
}
