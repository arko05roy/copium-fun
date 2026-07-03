import { SPAWN_LOG_KEY } from "@copium/txline/redis";
import { Redis } from "ioredis";
import { NextResponse } from "next/server";

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

export async function GET(req: Request) {
  const limit = Math.min(
    50,
    Math.max(1, Number(new URL(req.url).searchParams.get("limit") ?? 20)),
  );

  const redis = new Redis(REDIS_URL);
  try {
    if ((await redis.ping()) !== "PONG") {
      return NextResponse.json({ ok: false, error: "redis down" }, { status: 503 });
    }

    const rows = await redis.lrange(SPAWN_LOG_KEY, 0, limit - 1);
    const entries = rows
      .map((row) => {
        try {
          return JSON.parse(row) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter((row): row is Record<string, unknown> => row !== null);

    return NextResponse.json({ ok: true, count: entries.length, entries });
  } finally {
    redis.disconnect();
  }
}
