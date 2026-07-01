import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const HEALTH_URL =
  process.env.TXLINE_INGEST_HEALTH ?? "http://127.0.0.1:9090/health";
const WAIT_MS = Number(process.env.VERIFY_D4_WAIT_MS ?? 90_000);

async function waitForHealth(): Promise<Response> {
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(HEALTH_URL);
      if (res.ok) return res;
    } catch {
      // ingest still booting
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`ingest health not ready within ${WAIT_MS}ms (${HEALTH_URL})`);
}

async function waitForRedisOdds(): Promise<{ fixtureId: number; messageId: string }> {
  const sub = new Redis(REDIS_URL);
  const deadline = Date.now() + WAIT_MS;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      sub.disconnect();
      reject(new Error(`no odds Redis message within ${WAIT_MS}ms`));
    }, WAIT_MS);

    sub.on("pmessage", (_pattern, channel, message) => {
      if (!channel.startsWith("odds:")) return;
      try {
        const parsed = JSON.parse(message) as {
          payload?: { FixtureId?: number; MessageId?: string };
        };
        const fixtureId = parsed.payload?.FixtureId;
        const messageId = parsed.payload?.MessageId;
        if (fixtureId && messageId) {
          clearTimeout(timer);
          sub.disconnect();
          resolve({ fixtureId, messageId });
        }
      } catch {
        // skip malformed
      }
    });

    void sub.psubscribe("odds:*").catch((err: unknown) => {
      clearTimeout(timer);
      sub.disconnect();
      reject(err);
    });

    if (Date.now() >= deadline) {
      clearTimeout(timer);
      sub.disconnect();
      reject(new Error("redis subscribe timed out"));
    }
  });
}

async function main(): Promise<void> {
  const oddsPromise = waitForRedisOdds();
  const health = await waitForHealth();
  const body = (await health.json()) as {
    ok: boolean;
    counters?: { oddsMessages: number; detectedEvents: number };
  };
  if (!body.ok) {
    throw new Error(`health ok=false: ${JSON.stringify(body)}`);
  }
  if (!body.counters?.oddsMessages) {
    throw new Error("health shows zero odds messages");
  }

  const sample = await oddsPromise;
  console.log("verify:d4 ok");
  console.log("health counters:", body.counters);
  console.log("redis odds sample:", sample);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
