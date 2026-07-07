import { createUserAgent, listUserAgents, loadEnv } from "@copium/db";
import { Keypair } from "@solana/web3.js";
import { NextResponse } from "next/server";

loadEnv();

const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: Request) {
  const owner = new URL(req.url).searchParams.get("owner")?.trim();
  if (!owner) return jsonError("owner required");
  try {
    const agents = await listUserAgents(owner);
    return NextResponse.json({ ok: true, agents });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "agents failed", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      owner?: string;
      name?: string;
      provider?: string;
      model?: string;
      style?: string;
      apiKey?: string;
      permissionEnabled?: boolean;
      maxStake?: number;
    };
    const owner = body.owner?.trim();
    const name = body.name?.trim();
    const model = body.model?.trim() || "gpt-4o-mini";
    const style = body.style?.trim();
    const apiKey = body.apiKey?.trim();
    if (!owner) return jsonError("owner required");
    if (!name) return jsonError("name required");
    if (!style) return jsonError("one-line style required");
    if (style.length > 120)
      return jsonError("style must stay under 120 characters");
    if (body.provider && body.provider !== "openai")
      return jsonError("only openai is supported");
    if (!ALLOWED_MODELS.has(model)) return jsonError("unsupported model");
    if (!apiKey) return jsonError("apiKey required for web-created agents");

    const keypair = Keypair.generate();
    const agent = await createUserAgent({
      name,
      ownerWallet: owner,
      walletPubkey: keypair.publicKey.toBase58(),
      walletSecret: Array.from(keypair.secretKey),
      provider: "openai",
      model,
      style,
      source: "web",
      apiKey,
      permissionEnabled: Boolean(body.permissionEnabled),
      maxStake: body.maxStake,
    });
    return NextResponse.json({ ok: true, agent });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "agent create failed",
      500
    );
  }
}
