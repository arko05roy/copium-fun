import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { TXLINE_DEVNET } from "@copium/config";

const TXORACLE = new PublicKey(TXLINE_DEVNET.programId);
const BN = anchor.default.BN;

export function epochDayFromTs(tsMs: number): number {
  return Math.floor(tsMs / 86_400_000);
}

export function dailyScoresPda(epochDay: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("daily_scores_roots"),
      new BN(epochDay).toArrayLike(Buffer, "le", 2),
    ],
    TXORACLE,
  );
  return pda;
}

export function dailyOddsPda(epochDay: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("daily_batch_roots"),
      new BN(epochDay).toArrayLike(Buffer, "le", 2),
    ],
    TXORACLE,
  );
  return pda;
}
