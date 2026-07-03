import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const envPath = path.join(__dirname, "../../.env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i);
    if (key in process.env) continue;
    process.env[key] = trimmed.slice(i + 1);
  }
}

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "ws",
    "@coral-xyz/anchor",
    "@solana/web3.js",
    "@copium/settlement",
    "@copium/txline",
  ],
  transpilePackages: ["@copium/config", "@copium/db"],
};

export default nextConfig;
