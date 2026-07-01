import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TXLINE_DEVNET } from "@copium/config";

export type { Txoracle } from "./txoracle.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export const TXORACLE_PROGRAM_ID = TXLINE_DEVNET.programId;

export const TXORACLE_IDL = JSON.parse(
  readFileSync(join(root, "idl/txoracle.json"), "utf8"),
) as { address: string; metadata?: { name?: string; version?: string } };

export function assertDevnetTxoracleIdl(): void {
  if (TXORACLE_IDL.address !== TXLINE_DEVNET.programId) {
    throw new Error(
      `txoracle IDL address ${TXORACLE_IDL.address} != devnet ${TXLINE_DEVNET.programId}`,
    );
  }
}

export { startGuestSession, txlineHeaders } from "./auth.js";
export type { GuestSession } from "./auth.js";
export { fetchFixturesSnapshot } from "./snapshot.js";
export type { FixturesSnapshotResult } from "./snapshot.js";
export { subscribeDevnet } from "./subscribe.js";
export type { SubscribeResult } from "./subscribe.js";
export {
  loadEnv,
  loadServiceKeypair,
  solanaRpcUrl,
  subscriptionTier,
  worldCupFreeServiceLevel,
  txlineApiOrigin,
  txlineGuestAuthUrl,
} from "./env.js";
export {
  parseSseBlock,
  readSseMessages,
  parseSseJson,
  openTxlineStream,
} from "./sse.js";
export type { SseMessage, TxlineStreamKind } from "./sse.js";
export {
  detectFromScoreUpdate,
  detectFromOddsUpdate,
} from "./detect.js";
export type {
  DetectedEvent,
  DetectedEventKind,
  FixtureDetectState,
  OddsUpdate,
  ScoreUpdate,
} from "./detect.js";
export {
  INGEST_META_KEY,
  oddsChannel,
  scoresChannel,
  eventChannel,
} from "./redis-channels.js";
