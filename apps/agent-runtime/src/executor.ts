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
  getAgentApiKey,
  getAgentWalletSecret,
  getPulse,
  insertAgentTrade,
  isUserAgentConfig,
  listAgentTape,
  listUserAgents,
  loadEnv as loadDbEnv,
  type AgentRow,
  type UserAgentConfig,
} from "@copium/db";
import { openPositionOnChain } from "@copium/pulses-client";
import {
  loadEnv,
  loadServiceKeypair,
  requestDevnetUsdtFaucet,
  solanaRpcUrl,
} from "@copium/txline";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { officerDecision } from "./agents/officer.js";
import { quantDecision } from "./agents/quant.js";
import { loadAgentKeypair } from "./wallet.js";

loadEnv();
loadDbEnv();

const DEFAULT_STAKE = 100_000n;

type AgentSpec = {
  slug: string;
  name: string;
  row?: AgentRow;
  config?: UserAgentConfig;
  decide: (
    linePct: number,
    crowdYes: number,
  ) => { side: "yes" | "no"; reasoning: string } | null;
  decideAsync?: () => Promise<{ side: "yes" | "no"; reasoning: string } | null>;
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

const userAgentDecisionSchema = z.object({
  side: z.enum(["yes", "no", "skip"]),
  reason: z.string().max(160),
  confidence: z.number().min(0).max(1),
});

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
        createAssociatedTokenAccountInstruction(
          funder.publicKey,
          ata,
          owner,
          mint,
        ),
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
      createAssociatedTokenAccountInstruction(
        funder.publicKey,
        ata,
        owner,
        mint,
      ),
    );
    const sig = await connection.sendTransaction(tx, [funder]);
    await connection.confirmTransaction(sig, "confirmed");
    await transfer(
      connection,
      funder,
      funderAta,
      ata,
      funder,
      Number(minAmount),
    );
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

async function userAgentDecision(input: {
  agent: AgentRow;
  config: UserAgentConfig;
  question: string;
  linePct: number;
  crowdYes: number;
}): Promise<{ side: "yes" | "no"; reasoning: string } | null> {
  if (!input.config.permission.enabled) return null;
  const apiKey = await getAgentApiKey(input.agent.id);
  if (!apiKey) return null;
  let object: z.infer<typeof userAgentDecisionSchema>;
  try {
    const openai = createOpenAI({ apiKey });
    const result = await generateObject({
      model: openai(input.config.model),
      schema: userAgentDecisionSchema,
      prompt: [
        "You are a devnet sports Pulse trading agent.",
        "Return skip unless the one-line style gives a clear YES or NO lean.",
        `Style: ${input.config.style}`,
        `Pulse: ${input.question}`,
        `TxLINE line YES probability: ${input.linePct}%`,
        `Crowd YES probability: ${input.crowdYes}%`,
      ].join("\n"),
    });
    object = result.object;
  } catch (err) {
    console.warn(
      JSON.stringify({
        action: "user_agent_skip",
        agent: input.agent.slug,
        reason: err instanceof Error ? err.message : "model call failed",
      }),
    );
    return null;
  }
  if (object.side === "skip") return null;
  return {
    side: object.side,
    reasoning: `${input.config.style} — ${object.reason} (${Math.round(object.confidence * 100)}%)`,
  };
}

async function loadExecutableAgents(pulse: {
  question: string;
  line_pct: number | null;
  crowd_yes_pct: number | null;
}): Promise<AgentSpec[]> {
  const linePct = Number(pulse.line_pct);
  const crowdYes =
    pulse.crowd_yes_pct != null ? Number(pulse.crowd_yes_pct) : 50;
  const userAgents = await listUserAgents();
  return [
    ...AGENTS,
    ...userAgents
      .filter((agent) => isUserAgentConfig(agent.config))
      .map((agent) => {
        const config = agent.config as UserAgentConfig;
        return {
          slug: agent.slug,
          name: agent.display_name,
          row: agent,
          config,
          decide: () => {
            throw new Error("user agent decisions are async");
          },
          decideAsync: () =>
            userAgentDecision({
              agent,
              config,
              question: pulse.question,
              linePct,
              crowdYes,
            }),
        };
      }),
  ] as AgentSpec[];
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
  const crowdYes =
    pulse.crowd_yes_pct != null ? Number(pulse.crowd_yes_pct) : 50;
  if (agent.config && !agent.config.permission.enabled) {
    return { skipped: true, reason: `${agent.slug} permission off` };
  }

  const decision =
    "decideAsync" in agent && typeof agent.decideAsync === "function"
      ? await agent.decideAsync()
      : agent.decide(linePct, crowdYes);
  if (!decision) {
    return {
      skipped: true,
      reason: `${agent.slug} no signal at line ${linePct}%`,
    };
  }

  const stake = BigInt(
    Math.max(
      1,
      Math.min(
        Number(DEFAULT_STAKE),
        agent.config?.permission.maxStake ?? Number(DEFAULT_STAKE),
      ),
    ),
  );
  const storedSecret = agent.row
    ? await getAgentWalletSecret(agent.row.id)
    : null;
  const agentKey = storedSecret
    ? Keypair.fromSecretKey(Uint8Array.from(storedSecret))
    : loadAgentKeypair(agent.slug);
  const row =
    agent.row ??
    (await ensureAgent({
      slug: agent.slug,
      display_name: agent.name,
      wallet_pubkey: agentKey.publicKey.toBase58(),
    }));

  const connection = new Connection(solanaRpcUrl(), "confirmed");
  const mint = new PublicKey(TXLINE_DEVNET.usdtMint);
  const funder = loadServiceKeypair();
  await ensureSol(connection, agentKey.publicKey, funder);
  await ensureUsdtBalance(connection, agentKey.publicKey, mint, stake, funder);

  const onchain = await openPositionOnChain({
    owner: agentKey,
    pool: pulse.onchain_pool_pubkey,
    side: decision.side,
    stake,
    oddsMessageId: pulse.odds_message_id,
  });

  const trade = await insertAgentTrade({
    agent_id: row.id,
    pulse_id: pulseId,
    side: decision.side,
    stake: Number(stake),
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

/** D16 — Officer + Quant both evaluate; return all fills. */
export async function executeAllAgentsOnPulse(
  pulseId: string,
): Promise<ExecuteAgentResult[]> {
  const results: ExecuteAgentResult[] = [];
  const pulse = await getPulse(pulseId);
  const agents = await loadExecutableAgents(pulse);
  for (const agent of agents) {
    try {
      results.push(await executeAgentTrade(pulseId, agent));
    } catch (err) {
      results.push({
        skipped: true,
        agentSlug: agent.slug,
        reason: err instanceof Error ? err.message : "agent execution failed",
      });
    }
  }
  return results;
}

/** D15 — first devnet fill: Officer if gap>20pp, else Quant toward line. */
export async function executeFirstAgentOnPulse(
  pulseId: string,
): Promise<ExecuteAgentResult> {
  for (const agent of AGENTS) {
    const result = await executeAgentTrade(pulseId, agent);
    if (!result.skipped) return result;
  }
  return { skipped: true, reason: "no agent signal for pulse" };
}

export async function executeOfficerTrade(
  pulseId: string,
): Promise<ExecuteAgentResult> {
  return executeAgentTrade(pulseId, AGENTS[0]!);
}
