import { Program, AnchorProvider, Wallet, type Idl } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import BN from "bn.js";
import { TXLINE_DEVNET } from "@copium/config";
import {
  COPIUM_PULSES_PROGRAM_ID,
  positionPda,
  vaultPda,
  winningSideCode,
} from "./index.js";
import { loadIdl, oddsMessageHash } from "./open-position.js";
import type { OpenPositionInput } from "./open-position.js";

export type BuildOpenPositionInput = Omit<OpenPositionInput, "owner"> & {
  feePayer: PublicKey;
};

/** Unsigned open_position tx for wallet / Blink signing. */
export async function buildOpenPositionTransaction(
  input: BuildOpenPositionInput,
): Promise<Transaction> {
  const stakeMint = input.stakeMint ?? new PublicKey(TXLINE_DEVNET.usdtMint);
  const connection = new Connection(
    input.rpcUrl ?? process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    "confirmed",
  );
  const poolKey = typeof input.pool === "string" ? new PublicKey(input.pool) : input.pool;
  const sideCode = winningSideCode(input.side);
  const position = positionPda(
    COPIUM_PULSES_PROGRAM_ID,
    poolKey,
    input.feePayer,
    sideCode,
  );
  const vault = vaultPda(COPIUM_PULSES_PROGRAM_ID, poolKey);
  const ownerTokenAccount = getAssociatedTokenAddressSync(stakeMint, input.feePayer);

  const tx = new Transaction();
  const ataInfo = await connection.getAccountInfo(ownerTokenAccount);
  if (!ataInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        input.feePayer,
        ownerTokenAccount,
        input.feePayer,
        stakeMint,
      ),
    );
  }

  const dummy = Keypair.generate();
  const provider = new AnchorProvider(connection, new Wallet(dummy), {
    commitment: "confirmed",
  });
  const program = new Program(loadIdl() as Idl & { address: string }, provider);

  const openIx = await program.methods
    .openPosition(
      sideCode,
      new BN(input.stake.toString()),
      oddsMessageHash(input.oddsMessageId),
    )
    .accountsPartial({
      owner: input.feePayer,
      pulsePool: poolKey,
      position,
      ownerTokenAccount,
      vault,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  tx.add(openIx);
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = input.feePayer;
  return tx;
}
