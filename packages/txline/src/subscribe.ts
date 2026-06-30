import * as anchor from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
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
import nacl from "tweetnacl";
import { TXLINE_DEVNET, TXLINE_WORLDCUP_FREE_TIER } from "@copium/config";
import { TXORACLE_IDL } from "./index.js";
import type { Txoracle } from "./txoracle.js";
import { startGuestSession } from "./auth.js";
import {
  loadServiceKeypair,
  solanaRpcUrl,
  worldCupFreeServiceLevel,
  txlineApiOrigin,
} from "./env.js";

const SELECTED_LEAGUES = [...TXLINE_WORLDCUP_FREE_TIER.selectedLeagues];

export type SubscribeResult = {
  wallet: string;
  txSig: string;
  jwt: string;
  apiToken: string;
  apiOrigin: string;
  serviceLevel: number;
};

async function ensureTokenAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey,
): Promise<PublicKey> {
  const ata = getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  try {
    await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
  } catch {
    const ix = createAssociatedTokenAccountInstruction(
      payer.publicKey,
      ata,
      owner,
      mint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    await sendAndConfirmTransaction(
      connection,
      new Transaction().add(ix),
      [payer],
      { commitment: "confirmed" },
    );
  }
  return ata;
}

export async function subscribeDevnet(
  keypair: Keypair = loadServiceKeypair(),
): Promise<SubscribeResult> {
  const apiOrigin = txlineApiOrigin();
  const serviceLevel = worldCupFreeServiceLevel();
  const durationWeeks = TXLINE_WORLDCUP_FREE_TIER.durationWeeks;
  const connection = new Connection(solanaRpcUrl(), "confirmed");
  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = new anchor.Program<Txoracle>(
    TXORACLE_IDL as Txoracle,
    provider,
  );

  if (program.programId.toBase58() !== TXLINE_DEVNET.programId) {
    throw new Error(
      `IDL program ${program.programId.toBase58()} != devnet ${TXLINE_DEVNET.programId}`,
    );
  }

  const txlMint = new PublicKey(TXLINE_DEVNET.txlTokenMint);
  const userTokenAccount = await ensureTokenAccount(
    connection,
    keypair,
    txlMint,
    keypair.publicKey,
  );

  const [pricingMatrixPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pricing_matrix")],
    program.programId,
  );
  const [tokenTreasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_treasury_v2")],
    program.programId,
  );
  const tokenTreasuryVault = getAssociatedTokenAddressSync(
    txlMint,
    tokenTreasuryPda,
    true,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const { jwt } = await startGuestSession();

  const txSig = await program.methods
    .subscribe(serviceLevel, durationWeeks)
    .accounts({
      user: keypair.publicKey,
      pricingMatrix: pricingMatrixPda,
      tokenMint: txlMint,
      userTokenAccount,
      tokenTreasuryVault,
      tokenTreasuryPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const messageString = `${txSig}:${SELECTED_LEAGUES.join(",")}:${jwt}`;
  const signatureBytes = nacl.sign.detached(
    new TextEncoder().encode(messageString),
    keypair.secretKey,
  );
  const walletSignature = Buffer.from(signatureBytes).toString("base64");

  const activateRes = await fetch(`${apiOrigin}/api/token/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      txSig,
      walletSignature,
      leagues: SELECTED_LEAGUES,
    }),
  });

  const activateBody = await activateRes.text();
  if (!activateRes.ok) {
    throw new Error(
      `token activate failed ${activateRes.status}: ${activateBody}`,
    );
  }

  let apiToken = activateBody.trim();
  try {
    const parsed = JSON.parse(activateBody) as { token?: string };
    if (parsed.token) apiToken = parsed.token;
  } catch {
    apiToken = activateBody.replace(/^"|"$/g, "").trim();
  }

  if (!apiToken) throw new Error("token activate response missing api token");

  return {
    wallet: keypair.publicKey.toBase58(),
    txSig,
    jwt,
    apiToken,
    apiOrigin,
    serviceLevel,
  };
}
