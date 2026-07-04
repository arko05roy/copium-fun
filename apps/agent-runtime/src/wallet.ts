import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Keypair } from "@solana/web3.js";
import { loadEnv } from "@copium/txline";

const SLUG_FILES: Record<string, string> = {
  "officer-copium": "officer-copium-wallet.json",
  quant: "quant-wallet.json",
};

function envKeyForSlug(slug: string): string {
  return `AGENT_${slug.toUpperCase().replace(/-/g, "_")}_WALLET`;
}

export function loadAgentKeypair(slug: string): Keypair {
  loadEnv();
  const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  const candidates = [
    process.env[envKeyForSlug(slug)]?.trim(),
    SLUG_FILES[slug] ? join(root, SLUG_FILES[slug]) : undefined,
    process.env.AGENT_WALLET?.trim(),
    process.env.TXLINE_SERVICE_WALLET?.trim(),
    existsSync(join(root, "service-wallet.json"))
      ? join(root, "service-wallet.json")
      : undefined,
    process.env.ANCHOR_WALLET?.trim(),
    join(homedir(), ".config/solana/id.json"),
  ].filter(Boolean) as string[];

  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const secret = JSON.parse(readFileSync(path, "utf8")) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(secret));
  }

  throw new Error(
    `No wallet for agent ${slug}. Set ${envKeyForSlug(slug)} or create ${SLUG_FILES[slug] ?? "agent-wallet.json"}`,
  );
}
