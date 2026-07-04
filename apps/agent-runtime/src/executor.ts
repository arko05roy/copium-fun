import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  transfer,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { TXLINE_DEVNET } from "@copium/config";
import {
  ensureAgent,
  getPulse,
  insertAgentTrade,
  listAgentTape,
  loadEnv as loadDbEnv,
} from "@copium/db";
import { openPositionOnChain } from "@copium/pulses-client";
import { loadEnv, loadServiceKeypair, requestDevnetUsdtFaucet, solanaRpcUrl } from "@copium/txline";
import { officerDecision } from "./agents/officer.js";
import { quantDecision } from "./agents/quant.js";
import { loadAgentKeypair } from "./wallet.js";

loadEnv();
loadDbEnv();

const DEFAULT_STAKE = 100_000n;

type AgentSpec = {
  slug: string;
  name: string;
  decide: (linePct: number, crowdYes: number) => { side: "yes" | "no"; reasoning: string } | null;
};

const AGENTS: AgentSpec[] = [
  {
    slug: "officer-copium",
    name: "Officer Copium",
    decide: (line, crowd) => officerDecision(line, crowd),
  },
  {
    slug: "quant",
    name: "The Quant",
    decide: (line, crowd) => quantDecision(line, crowd),
  },
];

async function ensureUsdtBalance(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey,
  minAmount: bigint,
  funder: Keypair,
): Promise<PublicKey> {
  const ata = getAssociatedTokenAddressSync(mint, owner);
  const info = await connection.getAccountInfo(ata);

  if (owner.equals(funder.publicKey)) {
    if (!info) {
      const tx = new Transaction().add(
        createAssociatedTokenAccountInstruction(funder.publicKey, ata, owner, mint),
      );
      const sig = await connection.sendTransaction(tx, [funder]);
      await connection.confirmTransaction(sig, "confirmed");
    }
    const bal = await connection.getTokenAccountBalance(ata);
    if (BigInt(bal.value.amount) < minAmount) {
      try {
        await requestDevnetUsdtFaucet(funder);
      } catch {
        // ponytail: faucet may be rate-limited; re-check balance below
      }
      const after = await connection.getTokenAccountBalance(ata);
      if (BigInt(after.value.amount) < minAmount) {
        throw new Error(
          `agent wallet USDT ${after.value.amount} < ${minAmount} — run txoracle faucet or fund ${mint.toBase58()}`,
        );
      }
    }
    return ata;
  }

  if (!info) {
    const funderAta = getAssociatedTokenAddressSync(mint, funder.publicKey);
    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(funder.publicKey, ata, owner, mint),
    );
    const sig = await connection.sendTransaction(tx, [funder]);
    await connection.confirmTransaction(sig, "confirmed");
    await transfer(connection, funder, funderAta, ata, funder, Number(minAmount));
    return ata;
  }

  const bal = await connection.getTokenAccountBalance(ata);
  const current = BigInt(bal.value.amount);
  if (current < minAmount) {
    const funderAta = getAssociatedTokenAddressSync(mint, funder.publicKey);
    await transfer(
      connection,
      funder,
      funderAta,
      ata,
      funder,
      Number(minAmount - current),
    );
  }
  return ata;
}

async function ensureSol(
  connection: Connection,
  target: PublicKey,
  funder: Keypair,
  lamports = 200_000_000,
): Promise<void> {
  const bal = await connection.getBalance(target);
  if (bal >= lamports) return;
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: funder.publicKey,
      toPubkey: target,
      lamports: lamports - bal,
    }),
  );
  const sig = await connection.sendTransaction(tx, [funder]);
  await connection.confirmTransaction(sig, "confirmed");
}

export type ExecuteAgentResult = {
  skipped: boolean;
  reason?: string;
  agentSlug?: string;
  tradeId?: string;
  executeTx?: string;
  side?: "yes" | "no";
};

async function alreadyTraded(pulseId: string, slug: string): Promise<boolean> {
  const tape = await listAgentTape(50);
  return tape.some((t) => t.pulse_id === pulseId && t.agent_slug === slug);
}

export async function executeAgentTrade(
  pulseId: string,
  agent: AgentSpec,
): Promise<ExecuteAgentResult> {
  const pulse = await getPulse(pulseId);
  if (pulse.status !== "open") {
    return { skipped: true, reason: `pulse status ${pulse.status}` };
  }
  if (!pulse.onchain_pool_pubkey || !pulse.odds_message_id) {
    return { skipped: true, reason: "pulse missing pool or odds messageId" };
  }
  if (pulse.line_pct == null) {
    return { skipped: true, reason: "pulse missing line_pct" };
  }

  if (await alreadyTraded(pulseId, agent.slug)) {
    return { skipped: true, reason: `${agent.slug} already traded this pulse` };
  }

  const linePct = Number(pulse.line_pct);
  const crowdYes = pulse.crowd_yes_pct != null ? Number(pulse.crowd_yes_pct) : 50;
  const decision = agent.decide(linePct, crowdYes);
  if (!decision) {
    return { skipped: true, reason: `${agent.slug} no signal at line ${linePct}%` };
  }

  const agentKey = loadAgentKeypair(agent.slug);
  const row = await ensureAgent({
    slug: agent.slug,
    display_name: agent.name,
    wallet_pubkey: agentKey.publicKey.toBase58(),
  });

  const connection = new Connection(solanaRpcUrl(), "confirmed");
  const mint = new PublicKey(TXLINE_DEVNET.usdtMint);
  const funder = loadServiceKeypair();
  await ensureSol(connection, agentKey.publicKey, funder);
  await ensureUsdtBalance(connection, agentKey.publicKey, mint, DEFAULT_STAKE, funder);

  const onchain = await openPositionOnChain({
    owner: agentKey,
    pool: pulse.onchain_pool_pubkey,
    side: decision.side,
    stake: DEFAULT_STAKE,
    oddsMessageId: pulse.odds_message_id,
  });

  const trade = await insertAgentTrade({
    agent_id: row.id,
    pulse_id: pulseId,
    side: decision.side,
    stake: Number(DEFAULT_STAKE),
    reasoning: decision.reasoning,
    signature: onchain.signature,
    execute_tx: onchain.signature,
  });

  return {
    skipped: false,
    agentSlug: agent.slug,
    tradeId: trade.id,
    executeTx: onchain.signature,
    side: decision.side,
  };
}

/** D15 — first devnet fill: Officer if gap>20pp, else Quant toward line. */
export async function executeFirstAgentOnPulse(pulseId: string): Promise<ExecuteAgentResult> {
  for (const agent of AGENTS) {
    const result = await executeAgentTrade(pulseId, agent);
    if (!result.skipped) return result;
  }
  return { skipped: true, reason: "no agent signal for pulse" };
}

export async function executeOfficerTrade(pulseId: string): Promise<ExecuteAgentResult> {
  return executeAgentTrade(pulseId, AGENTS[0]!);
}
