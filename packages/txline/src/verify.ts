import { assertDevnetTxoracleIdl, TXORACLE_IDL, TXORACLE_PROGRAM_ID } from "./index.js";
import { TXLINE_DEVNET } from "@copium/config";

assertDevnetTxoracleIdl();

if (TXORACLE_IDL.metadata?.name !== "txoracle") {
  throw new Error("unexpected txoracle IDL metadata");
}

console.log(`txoracle devnet ok — ${TXORACLE_PROGRAM_ID}`);
console.log(`idl version ${TXORACLE_IDL.metadata?.version ?? "unknown"}`);
console.log(`api ${TXLINE_DEVNET.apiHost}`);
