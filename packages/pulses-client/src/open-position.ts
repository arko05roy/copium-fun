import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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
  POSITION_SIDE,
  positionPda,
  vaultPda,
  winningSideCode,
} from "./index.js";

type CopiumPulsesIdl = Idl & { address: string };

export function loadIdl(): CopiumPulsesIdl {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  const path = join(root, "programs/copium-pulses/target/idl/copium_pulses.json");
  return JSON.parse(readFileSync(path, "utf8")) as CopiumPulsesIdl;
}

/** Anchor stores MessageId linkage on position — sha256(messageId). */
export function oddsMessageHash(messageId: string): number[] {
  return Array.from(createHash("sha256").update(messageId, "utf8").digest());
}

export type OpenPositionInput = {
  owner: Keypair;
  pool: PublicKey | string;
  side: "yes" | "no";
  stake: bigint;
  oddsMessageId: string;
  stakeMint?: PublicKey;
  rpcUrl?: string;
};

export type OpenPositionResult = {
  signature: string;
  position: PublicKey;
  ownerTokenAccount: PublicKey;
};

async function ensureOwnerAta(
  connection: Connection,
  payer: Keypair,
  owner: PublicKey,
  mint: PublicKey,
): Promise<PublicKey> {
  const ata = getAssociatedTokenAddressSync(mint, owner);
  const info = await connection.getAccountInfo(ata);
  if (info) return ata;

  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(payer.publicKey, ata, owner, mint),
  );
  const sig = await connection.sendTransaction(tx, [payer]);
  await connection.confirmTransaction(sig, "confirmed");
  return ata;
}

export async function openPositionOnChain(
  input: OpenPositionInput,
): Promise<OpenPositionResult> {
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
    input.owner.publicKey,
    sideCode,
  );
  const vault = vaultPda(COPIUM_PULSES_PROGRAM_ID, poolKey);
  const ownerTokenAccount = await ensureOwnerAta(
    connection,
    input.owner,
    input.owner.publicKey,
    stakeMint,
  );

  const provider = new AnchorProvider(connection, new Wallet(input.owner), {
    commitment: "confirmed",
  });
  const program = new Program(loadIdl(), provider);

  const signature = await program.methods
    .openPosition(
      sideCode,
      new BN(input.stake.toString()),
      oddsMessageHash(input.oddsMessageId),
    )
    .accountsPartial({
      owner: input.owner.publicKey,
      pulsePool: poolKey,
      position,
      ownerTokenAccount,
      vault,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return { signature, position, ownerTokenAccount };
}

export { POSITION_SIDE };
