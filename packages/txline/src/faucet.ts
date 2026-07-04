import * as anchor from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { TXLINE_DEVNET } from "@copium/config";
import { TXORACLE_IDL } from "./index.js";
import type { Txoracle } from "./txoracle.js";
import { loadEnv, loadServiceKeypair, solanaRpcUrl } from "./env.js";

function usdtTreasuryPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("usdt_treasury")], programId)[0];
}

function faucetTrackerPda(programId: PublicKey, user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("faucet_tracker"), user.toBuffer()],
    programId,
  )[0];
}

async function ensureLegacyUsdtAta(
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
  await sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
  return ata;
}

/** txoracle.request_devnet_faucet — real devnet USDT (TxLINE docs). */
export async function requestDevnetUsdtFaucet(
  user: Keypair = loadServiceKeypair(),
): Promise<string> {
  loadEnv();
  const connection = new Connection(solanaRpcUrl(), "confirmed");
  const programId = new PublicKey(TXLINE_DEVNET.programId);
  const usdtMint = new PublicKey(TXLINE_DEVNET.usdtMint);
  const wallet = new anchor.Wallet(user);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new anchor.Program<Txoracle>(TXORACLE_IDL as Txoracle, provider);

  const userUsdtAta = await ensureLegacyUsdtAta(connection, user, user.publicKey, usdtMint);
  const usdtTreasuryPdaKey = usdtTreasuryPda(programId);
  const faucetTracker = faucetTrackerPda(programId, user.publicKey);

  return program.methods
    .requestDevnetFaucet()
    .accounts({
      user: user.publicKey,
      faucetTracker,
      usdtMint,
      userUsdtAta,
      usdtTreasuryPda: usdtTreasuryPdaKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}
