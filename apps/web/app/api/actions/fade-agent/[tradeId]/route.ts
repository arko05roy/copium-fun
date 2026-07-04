import { actionJson, actionOptions } from "@/lib/action-cors";
import { buildCopyActionGet, buildCopyActionPost } from "@/lib/copy-action";

function baseUrl(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://127.0.0.1:3000";
}

export async function OPTIONS() {
  return actionOptions();
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ tradeId: string }> },
) {
  const { tradeId } = await ctx.params;
  const payload = await buildCopyActionGet(tradeId, "fade", baseUrl(req));
  if ("error" in payload) {
    return actionJson({ type: "action", title: "Unavailable", description: payload.error }, { status: 400 });
  }
  return actionJson(payload);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ tradeId: string }> },
) {
  const { tradeId } = await ctx.params;
  let account: string | undefined;
  try {
    const body = (await req.json()) as { account?: string };
    account = body.account?.trim();
  } catch {
    return actionJson({ message: "invalid JSON body" }, { status: 400 });
  }
  if (!account) {
    return actionJson({ message: "account required" }, { status: 400 });
  }

  const payload = await buildCopyActionPost(tradeId, "fade", account);
  if ("error" in payload) {
    return actionJson({ message: payload.error }, { status: 400 });
  }
  return actionJson({ type: "transaction", ...payload });
}
