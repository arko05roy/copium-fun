import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Program, AnchorProvider, Wallet, type Idl } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  COPIUM_PULSES_PROGRAM_ID,
  POOL_STATUS,
  POSITION_SIDE,
  vaultPda,
  positionPda,
} from "./index.js";

type CopiumPulsesIdl = Idl & { address: string };

function loadIdl(): CopiumPulsesIdl {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  const path = join(root, "programs/copium-pulses/target/idl/copium_pulses.json");
  return JSON.parse(readFileSync(path, "utf8")) as CopiumPulsesIdl;
}

type PoolAccount = {
  status: number;
  settlementRoot: number[];
  winningSide: number;
};

async function fetchPoolAccount(
  program: Program<Idl>,
  pool: PublicKey,
): Promise<PoolAccount> {
  const acct = await (program.account as { pulsePool: { fetch: (k: PublicKey) => Promise<PoolAccount> } })
    .pulsePool.fetch(pool);
  return acct;
}

function programFor(connection: Connection, payer: Keypair) {
  const provider = new AnchorProvider(connection, new Wallet(payer), {
    commitment: "confirmed",
  });
  return new Program(loadIdl(), provider);
}

export type CrankPulseInput = {
  crank: Keypair;
  pool: PublicKey | string;
  settlementRoot: number[];
  winningSide: "yes" | "no";
  rpcUrl?: string;
};

export type CrankPulseResult = {
  signature: string;
  steps: string[];
};

export type WithdrawPositionInput = {
  owner: Keypair;
  pool: PublicKey;
  side: "yes" | "no";
  ownerTokenAccount: PublicKey;
  rpcUrl?: string;
};

export function winningSideCode(side: "yes" | "no"): number {
  return side === "yes" ? POSITION_SIDE.yes : POSITION_SIDE.no;
}

export function settlementRootFromHex(hex: string): number[] {
  const clean = hex.startsWith("\\x") ? hex.slice(2) : hex.replace(/^0x/, "");
  const bytes = Buffer.from(clean, "hex");
  if (bytes.length !== 32) {
    throw new Error(`expected 32-byte settlement root, got ${bytes.length}`);
  }
  return Array.from(bytes);
}

/** Phase B — permissionless lock → post_settlement → settle_pulse. */
export async function crankPulseOnChain(
  input: CrankPulseInput,
): Promise<CrankPulseResult> {
  if (input.settlementRoot.length !== 32) {
    throw new Error("settlementRoot must be 32 bytes");
  }

  const connection = new Connection(
    input.rpcUrl ?? process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    "confirmed",
  );
  const poolKey = typeof input.pool === "string" ? new PublicKey(input.pool) : input.pool;
  const program = programFor(connection, input.crank);
  const poolAcct = await fetchPoolAccount(program, poolKey);
  const steps: string[] = [];

  if (poolAcct.status === POOL_STATUS.settled) {
    return { signature: "already_settled", steps: ["already_settled"] };
  }

  const builder = program.methods;
  const ixs: TransactionInstruction[] = [];

  if (poolAcct.status === POOL_STATUS.open) {
    const ix = await builder
      .lockPulse()
      .accountsPartial({
        crank: input.crank.publicKey,
        pulsePool: poolKey,
      })
      .instruction();
    ixs.push(ix);
    steps.push("lock_pulse");
  }

  const rootPosted = poolAcct.settlementRoot.some((b: number) => b !== 0);
  if (!rootPosted) {
    const ix = await builder
      .postSettlement(input.settlementRoot)
      .accountsPartial({
        crank: input.crank.publicKey,
        pulsePool: poolKey,
      })
      .instruction();
    ixs.push(ix);
    steps.push("post_settlement");
  }

  if (poolAcct.status !== POOL_STATUS.settled) {
    const ix = await builder
      .settlePulse(winningSideCode(input.winningSide))
      .accountsPartial({
        crank: input.crank.publicKey,
        pulsePool: poolKey,
      })
      .instruction();
    ixs.push(ix);
    steps.push("settle_pulse");
  }

  if (ixs.length === 0) {
    return { signature: "noop", steps: ["noop"] };
  }

  const txBuilder = new Transaction();
  for (const ix of ixs) txBuilder.add(ix);

  const signature = await connection.sendTransaction(txBuilder, [input.crank], {
    skipPreflight: false,
  });
  await connection.confirmTransaction(signature, "confirmed");

  return { signature, steps };
}

export async function withdrawPositionOnChain(
  input: WithdrawPositionInput,
): Promise<string> {
  const connection = new Connection(
    input.rpcUrl ?? process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    "confirmed",
  );
  const program = programFor(connection, input.owner);
  const vault = vaultPda(COPIUM_PULSES_PROGRAM_ID, input.pool);
  const position = positionPda(
    COPIUM_PULSES_PROGRAM_ID,
    input.pool,
    input.owner.publicKey,
    winningSideCode(input.side),
  );

  const signature = await program.methods
    .withdraw()
    .accountsPartial({
      owner: input.owner.publicKey,
      pulsePool: input.pool,
      position,
      ownerTokenAccount: input.ownerTokenAccount,
      vault,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return signature;
}

export async function fetchPoolStatus(
  pool: PublicKey | string,
  rpcUrl?: string,
): Promise<{ status: number; winningSide: number }> {
  const key = typeof pool === "string" ? new PublicKey(pool) : pool;
  const connection = new Connection(
    rpcUrl ?? process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    "confirmed",
  );
  const program = programFor(connection, Keypair.generate());
  const acct = await fetchPoolAccount(program, key);
  return { status: acct.status, winningSide: acct.winningSide };
}
