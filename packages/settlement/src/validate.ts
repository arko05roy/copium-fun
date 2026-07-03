import * as anchor from "@coral-xyz/anchor";
import { ComputeBudgetProgram, Connection, Keypair } from "@solana/web3.js";
import { TXORACLE_IDL } from "@copium/txline";
import type { Txoracle } from "@copium/txline";
import { loadServiceKeypair, solanaRpcUrl } from "@copium/txline";
import type { StatValidationPayload } from "./fetch.js";
import { toBytes32, toProofNodes } from "./merkle.js";
import { dailyScoresPda, epochDayFromTs } from "./pda.js";
import {
  COMPUTE_BUDGET_VALIDATE_STAT,
  type BinaryExpression,
  type TraderPredicate,
} from "./predicate.js";

export type ValidateStatInput = {
  validation: StatValidationPayload;
  predicate: TraderPredicate;
  statKey2?: number;
  op?: BinaryExpression | null;
};

export type ValidateStatResult = {
  valid: boolean;
  epochDay: number;
  dailyScoresPda: string;
  targetTs: number;
  method: "view" | "simulate";
};

function buildFixtureSummary(validation: StatValidationPayload) {
  return {
    fixtureId: new anchor.BN(validation.summary.fixtureId),
    updateStats: {
      updateCount: validation.summary.updateStats.updateCount,
      minTimestamp: new anchor.BN(validation.summary.updateStats.minTimestamp),
      maxTimestamp: new anchor.BN(validation.summary.updateStats.maxTimestamp),
    },
    eventsSubTreeRoot: toBytes32(validation.summary.eventStatsSubTreeRoot),
  };
}

function buildStatTerm(
  validation: StatValidationPayload,
  which: "a" | "b",
) {
  const statToProve =
    which === "a" ? validation.statToProve : validation.statToProve2;
  const statProof =
    which === "a" ? validation.statProof : validation.statProof2;
  if (!statToProve || !statProof) {
    throw new Error(`missing stat ${which} in validation payload`);
  }

  return {
    statToProve,
    eventStatRoot: toBytes32(validation.eventStatRoot),
    statProof: toProofNodes(statProof),
  };
}

function parseReturnBool(logs: readonly string[] | null | undefined): boolean | null {
  if (!logs?.length) return null;
  for (const line of logs) {
    const prefix = "Program return: ";
    const idx = line.indexOf(prefix);
    if (idx === -1) continue;
    const tail = line.slice(idx + prefix.length);
    const data = tail.split(" ")[1];
    if (!data) continue;
    const buf = Buffer.from(data, "base64");
    return buf.length > 0 && buf[0] === 1;
  }
  return null;
}

function txoracleProgram(connection: Connection, payer = loadServiceKeypair()) {
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(payer), {
    commitment: "confirmed",
  });
  return new anchor.Program<Txoracle>(TXORACLE_IDL as Txoracle, provider);
}

/**
 * txoracle.validate_stat on devnet — AGILE-PLAN D8 spike.
 * Requires funded devnet payer (service wallet). Compute budget 1_400_000.
 */
export async function validateStatOnChain(
  input: ValidateStatInput,
  opts?: { rpcUrl?: string; payer?: Keypair },
): Promise<ValidateStatResult> {
  const { validation, predicate, op = null } = input;
  const connection = new Connection(opts?.rpcUrl ?? solanaRpcUrl(), "confirmed");
  const program = txoracleProgram(connection, opts?.payer);

  const targetTs = validation.summary.updateStats.minTimestamp;
  const epochDay = epochDayFromTs(targetTs);
  const scoresPda = dailyScoresPda(epochDay);

  const statA = buildStatTerm(validation, "a");
  const statB =
    input.statKey2 !== undefined && validation.statToProve2
      ? buildStatTerm(validation, "b")
      : null;

  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: COMPUTE_BUDGET_VALIDATE_STAT,
  });

  const builder = program.methods
    .validateStat(
      new anchor.BN(targetTs),
      buildFixtureSummary(validation),
      toProofNodes(validation.subTreeProof),
      toProofNodes(validation.mainTreeProof),
      predicate,
      statA,
      statB,
      op,
    )
    .accounts({ dailyScoresMerkleRoots: scoresPda })
    .preInstructions([computeBudgetIx]);

  let valid: boolean;
  let method: ValidateStatResult["method"] = "view";

  try {
    valid = await builder.view();
  } catch {
    method = "simulate";
    const sim = await builder.simulate();
    const parsed = parseReturnBool(sim.raw);
    if (parsed === null) {
      throw new Error("validate_stat simulate missing Program return");
    }
    valid = parsed;
  }

  return {
    valid,
    epochDay,
    dailyScoresPda: scoresPda.toBase58(),
    targetTs,
    method,
  };
}
