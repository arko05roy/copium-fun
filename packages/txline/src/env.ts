import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Keypair } from "@solana/web3.js";
import { SOLANA_DEVNET, TXLINE_DEVNET } from "@copium/config";

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  loaded = true;
  const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  const envPath = join(root, ".env");
  if (existsSync(envPath)) config({ path: envPath });
}

export function txlineApiOrigin(): string {
  loadEnv();
  return (
    process.env.TXLINE_API_BASE?.replace(/\/$/, "") ?? TXLINE_DEVNET.apiHost
  );
}

export function txlineGuestAuthUrl(): string {
  loadEnv();
  return process.env.TXLINE_GUEST_AUTH ?? TXLINE_DEVNET.guestAuth;
}

export function solanaRpcUrl(): string {
  loadEnv();
  return process.env.SOLANA_RPC_URL ?? SOLANA_DEVNET.rpcUrl;
}

export function worldCupFreeServiceLevel(): number {
  loadEnv();
  const raw = process.env.TXLINE_SUBSCRIPTION_TIER?.trim();
  if (raw && Number(raw) !== TXLINE_DEVNET.worldCupFreeServiceLevel) {
    throw new Error(
      `TXLINE_SUBSCRIPTION_TIER=${raw} not allowed — copium uses World Cup free tier ${TXLINE_DEVNET.worldCupFreeServiceLevel} only (devnet)`,
    );
  }
  return TXLINE_DEVNET.worldCupFreeServiceLevel;
}

/** @deprecated use worldCupFreeServiceLevel */
export function subscriptionTier(): number {
  return worldCupFreeServiceLevel();
}

export function loadServiceKeypair(): Keypair {
  loadEnv();
  const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  const candidates = [
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
    "No service wallet found. Set TXLINE_SERVICE_WALLET or create service-wallet.json",
  );
}
