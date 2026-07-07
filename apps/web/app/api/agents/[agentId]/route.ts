import {
  AGENT_TOPIC_OPTIONS,
  getAgentById,
  isUserAgentConfig,
  loadEnv,
  normalizeAgentTopics,
  updateAgentConfig,
} from "@copium/db";
import { NextResponse } from "next/server";

loadEnv();

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await ctx.params;
    const body = (await req.json()) as {
      owner?: string;
      permissionEnabled?: boolean;
      maxStake?: number;
      topics?: string[];
    };
    const owner = body.owner?.trim();
    if (!owner)
      return NextResponse.json(
        { ok: false, error: "owner required" },
        { status: 400 }
      );
    const agent = await getAgentById(agentId);
    if (!agent || !isUserAgentConfig(agent.config)) {
      return NextResponse.json(
        { ok: false, error: "agent not found" },
        { status: 404 }
      );
    }
    if (agent.config.ownerWallet !== owner) {
      return NextResponse.json(
        { ok: false, error: "not owner" },
        { status: 403 }
      );
    }
    const topics = normalizeAgentTopics(body.topics ?? agent.config.topics);
    if ((body.topics?.length ?? 0) > 0 && topics.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `topics must be one of: ${AGENT_TOPIC_OPTIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }
    const updated = await updateAgentConfig(agent.id, {
      ...agent.config,
      topics,
      permission: {
        enabled: Boolean(body.permissionEnabled),
        maxStake: body.maxStake ?? agent.config.permission.maxStake,
      },
    });
    return NextResponse.json({ ok: true, agent: updated });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "agent update failed",
      },
      { status: 500 }
    );
  }
}
