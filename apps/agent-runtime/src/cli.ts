import { createInterface } from "node:readline/promises";
import { readFileSync } from "node:fs";
import { stdin as input, stdout as output } from "node:process";
import { loadEnv } from "@copium/txline";
import {
  AGENT_MODEL_OPTIONS,
  AGENT_TOPIC_OPTIONS,
  type AgentProvider,
  createAgentClaimCode,
  createUserAgent,
  loadEnv as loadDbEnv,
} from "@copium/db";
import { Keypair } from "@solana/web3.js";

loadEnv();
loadDbEnv();

const MODEL_OPTIONS = AGENT_MODEL_OPTIONS;
const DEFAULT_MODEL =
  MODEL_OPTIONS.find((option) => option.model === "gpt-4o-mini") ??
  MODEL_OPTIONS[0]!;

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function parseTopics(raw?: string): string[] | undefined {
  if (!raw) return undefined;
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => AGENT_TOPIC_OPTIONS.includes(value as never));
}

async function askMissingAgentFields(defaults: {
  name?: string;
  provider?: AgentProvider;
  model?: string;
  style?: string;
  apiKey?: string;
  maxStake?: number;
  enabled?: boolean;
  topics?: string[];
}): Promise<{
  name: string;
  provider: AgentProvider;
  model: string;
  style: string;
  apiKey?: string;
  maxStake: number;
  enabled: boolean;
  topics: string[];
}> {
  const pipedAnswers = input.isTTY
    ? []
    : readFileSync(0, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim());
  let pipedIndex = 0;
  const rl = createInterface({ input, output });
  const ask = async (question: string): Promise<string> => {
    if (pipedAnswers.length) {
      output.write(question);
      const answer = pipedAnswers[pipedIndex++] ?? "";
      output.write(`${answer ? "******" : ""}\n`);
      return answer;
    }
    return rl.question(question);
  };
  try {
    const name = defaults.name ?? (await ask("Agent name: ")).trim();
    const defaultOption =
      MODEL_OPTIONS.find(
        (option) =>
          option.provider === defaults.provider &&
          option.model === defaults.model,
      ) ??
      MODEL_OPTIONS.find((option) => option.provider === defaults.provider) ??
      MODEL_OPTIONS.find((option) => option.model === defaults.model) ??
      DEFAULT_MODEL;
    const defaultOptionNumber = MODEL_OPTIONS.indexOf(defaultOption) + 1;
    const selectedOption = defaults.model
      ? defaultOption
      : (MODEL_OPTIONS[
          Number(
            (
              await ask(
                [
                  "Model:",
                  ...MODEL_OPTIONS.map(
                    (option, index) =>
                      `  ${index + 1}. ${option.label}${option === defaultOption ? " (default)" : ""}`,
                  ),
                  `Choose model [${defaultOptionNumber}]: `,
                ].join("\n"),
              )
            ).trim() || defaultOptionNumber,
          ) - 1
        ] ?? defaultOption);
    const style =
      defaults.style ?? (await ask("One-line trading style: ")).trim();
    const topics =
      defaults.topics ??
      (
        await ask(
          `Topics [${AGENT_TOPIC_OPTIONS.join(", ")}] (${["soccer"].join(", ")}): `,
        )
      )
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter((value) => AGENT_TOPIC_OPTIONS.includes(value as never));
    const apiKey =
      defaults.apiKey ??
      (
        await ask(
          `${selectedOption.label.split(" · ")[0]} API key [uses ${selectedOption.env} if blank]: `,
        )
      ).trim() ??
      undefined;
    const maxStakeRaw = await ask(
      `Max devnet stake in micro-USDT [${defaults.maxStake ?? 100_000}]: `,
    );
    const enabledRaw = await ask(
      `Allow autonomous devnet positions now? [${defaults.enabled ? "Y/n" : "y/N"}]: `,
    );
    const enabledAnswer = enabledRaw.trim().toLowerCase();
    const enabled =
      enabledAnswer === ""
        ? Boolean(defaults.enabled)
        : enabledAnswer === "y" || enabledAnswer === "yes";
    if (!name) throw new Error("agent name required");
    if (!style) throw new Error("one-line trading style required");
    return {
      name,
      provider: selectedOption.provider,
      model: selectedOption.model,
      style,
      topics: topics.length ? topics : ["soccer"],
      apiKey: apiKey || process.env[selectedOption.env]?.trim(),
      maxStake: Number(maxStakeRaw || defaults.maxStake || 100_000),
      enabled,
    };
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const command = process.argv[2];
  if (command === "create-agent") {
    const answers = await askMissingAgentFields({
      name: argValue("--name"),
      provider: MODEL_OPTIONS.find(
        (option) => option.provider === argValue("--provider"),
      )?.provider,
      model: argValue("--model"),
      style: argValue("--style"),
      apiKey: argValue("--api-key"),
      maxStake: Number(argValue("--max-stake") ?? 100_000),
      enabled: hasFlag("--enable"),
      topics: parseTopics(argValue("--topics")),
    });
    const keypair = Keypair.generate();
    const agent = await createUserAgent({
      name: answers.name,
      walletPubkey: keypair.publicKey.toBase58(),
      walletSecret: Array.from(keypair.secretKey),
      provider: answers.provider,
      model: answers.model,
      style: answers.style,
      topics: answers.topics,
      source: "cli",
      apiKey: answers.apiKey,
      permissionEnabled: answers.enabled,
      maxStake: answers.maxStake,
    });
    const code = await createAgentClaimCode(agent.id);
    const payload = {
      ok: true,
      agent: {
        id: agent.id,
        slug: agent.slug,
        name: agent.display_name,
        wallet: agent.wallet_pubkey,
      },
      claimCode: code,
      permission: answers.enabled ? "enabled" : "off",
      next: "Open /desk, click Add Agent, paste this code.",
    };
    if (hasFlag("--json")) {
      console.log(JSON.stringify(payload));
    } else {
      console.log("");
      console.log("Agent created");
      console.log(`Name:       ${payload.agent.name}`);
      console.log(`Provider:   ${answers.provider}`);
      console.log(`Model:      ${answers.model}`);
      console.log(`Style:      ${answers.style}`);
      console.log(`Topics:     ${answers.topics.join(", ")}`);
      console.log(`Permission: ${payload.permission}`);
      console.log("");
      console.log(`Claim code: ${payload.claimCode}`);
      console.log(payload.next);
    }
    return;
  }

  if (command === "listen") {
    const { startAgentRuntime } = await import("./listen.js");
    await startAgentRuntime();
    return;
  }

  if (command === "execute-officer") {
    const pulseId = process.argv[3];
    if (!pulseId) throw new Error("usage: execute-officer <pulseId>");
    const { executeFirstAgentOnPulse } = await import("./executor.js");
    const result = await executeFirstAgentOnPulse(pulseId);
    console.log(JSON.stringify(result));
    if (result.skipped && !result.reason?.includes("already")) {
      process.exit(1);
    }
    return;
  }

  throw new Error(
    "usage: listen | execute-officer <pulseId> | create-agent --name <name> --style <one-line> [--topics soccer,world-cup]",
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
