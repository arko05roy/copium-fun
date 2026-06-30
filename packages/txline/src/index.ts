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
