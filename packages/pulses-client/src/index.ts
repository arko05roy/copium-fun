import { PublicKey } from "@solana/web3.js";

/** Anchor.toml devnet program id — deploy with `anchor deploy`. */
export const COPIUM_PULSES_PROGRAM_ID = new PublicKey(
  "GqXTpX5Z2YVSi4R96W61znGaCoN8Mf6N2pet77EWa8Mr",
);

export const PULSE_POOL_SEED = "pulse";
export const POSITION_SEED = "position";
export const VAULT_SEED = "vault";

export const POOL_STATUS = {
  open: 0,
  locked: 1,
  settled: 2,
  cancelled: 3,
} as const;

export const POSITION_SIDE = {
  yes: 0,
  no: 1,
} as const;

export function pulsePoolPda(
  programId: PublicKey,
  authority: PublicKey,
  fixtureId: bigint,
  pulseType: number,
  opensAt: bigint,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PULSE_POOL_SEED),
      authority.toBuffer(),
      u64LE(fixtureId),
      Buffer.from([pulseType]),
      i64LE(opensAt),
    ],
    programId,
  )[0];
}

export function vaultPda(programId: PublicKey, pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_SEED), pool.toBuffer()],
    programId,
  )[0];
}

export function positionPda(
  programId: PublicKey,
  pool: PublicKey,
  owner: PublicKey,
  side: number,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(POSITION_SEED),
      pool.toBuffer(),
      owner.toBuffer(),
      Buffer.from([side]),
    ],
    programId,
  )[0];
}

function u64LE(value: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value);
  return buf;
}

function i64LE(value: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(value);
  return buf;
}

export { TXLINE_DEVNET } from "@copium/config";
export { createPulseOnChain, accountExists } from "./create.js";
export type { CreatePulseInput, CreatePulseResult } from "./create.js";
export {
  openPositionOnChain,
  oddsMessageHash,
  loadIdl,
} from "./open-position.js";
export type { OpenPositionInput, OpenPositionResult } from "./open-position.js";
export { buildOpenPositionTransaction } from "./build-open-position-tx.js";
export type { BuildOpenPositionInput } from "./build-open-position-tx.js";
export {
  crankPulseOnChain,
  withdrawPositionOnChain,
  fetchPoolStatus,
  settlementRootFromHex,
  winningSideCode,
} from "./crank.js";
export type { CrankPulseInput, CrankPulseResult, WithdrawPositionInput } from "./crank.js";
