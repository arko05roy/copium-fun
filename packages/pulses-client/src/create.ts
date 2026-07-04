import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Program, AnchorProvider, Wallet, type Idl } from "@coral-xyz/anchor";
import BN from "bn.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { TXLINE_DEVNET } from "@copium/config";
import {
  COPIUM_PULSES_PROGRAM_ID,
  pulsePoolPda,
  vaultPda,
} from "./index.js";

type CopiumPulsesIdl = Idl & { address: string };

function loadIdl(): CopiumPulsesIdl {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  const path = join(root, "programs/copium-pulses/target/idl/copium_pulses.json");
  return JSON.parse(readFileSync(path, "utf8")) as CopiumPulsesIdl;
}

export type CreatePulseInput = {
  authority: Keypair;
  fixtureId: bigint;
  pulseTypeCode: number;
  opensAt: bigint;
  closesAt: bigint;
  oddsLockRoot: number[];
  stakeMint?: PublicKey;
  rpcUrl?: string;
};

export type CreatePulseResult = {
  signature: string;
  pool: PublicKey;
  vault: PublicKey;
};

export async function accountExists(
  pubkey: PublicKey | string,
  rpcUrl?: string,
): Promise<boolean> {
  const connection = new Connection(
    rpcUrl ?? process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    "confirmed",
  );
  const key = typeof pubkey === "string" ? new PublicKey(pubkey) : pubkey;
  const info = await connection.getAccountInfo(key);
  return info !== null;
}

export async function createPulseOnChain(
  input: CreatePulseInput,
): Promise<CreatePulseResult> {
  const stakeMint = input.stakeMint ?? new PublicKey(TXLINE_DEVNET.usdtMint);
  const connection = new Connection(
    input.rpcUrl ?? process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    "confirmed",
  );

  const provider = new AnchorProvider(
    connection,
    new Wallet(input.authority),
    { commitment: "confirmed" },
  );

  const program = new Program(loadIdl(), provider);
  const pool = pulsePoolPda(
    COPIUM_PULSES_PROGRAM_ID,
    input.authority.publicKey,
    input.fixtureId,
    input.pulseTypeCode,
    input.opensAt,
  );
  const vault = vaultPda(COPIUM_PULSES_PROGRAM_ID, pool);

  const existing = await connection.getAccountInfo(pool);
  if (existing) {
    return { signature: "existing", pool, vault };
  }

  const signature = await program.methods
    .createPulse(
      new BN(input.fixtureId.toString()),
      input.pulseTypeCode,
      new BN(input.opensAt.toString()),
      new BN(input.closesAt.toString()),
      input.oddsLockRoot,
    )
    .accountsPartial({
      authority: input.authority.publicKey,
      pulsePool: pool,
      stakeMint,
      vault,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return { signature, pool, vault };
}
