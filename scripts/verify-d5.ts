import { insertSimulatorSession, loadEnv as loadDbEnv, updateSimulatorCursor } from "@copium/db";
import {
  buildSimBundle,
  goalCursor,
  loadEnv,
  replayStep,
  startGuestSession,
} from "@copium/txline";
import { Redis } from "ioredis";

loadEnv();
loadDbEnv();

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const DEFAULT_FIXTURE = Number(process.env.VERIFY_D5_FIXTURE_ID ?? 17926704);

async function waitForGoal(
  fixtureId: number,
  timeoutMs: number,
): Promise<{ kind: string; fixtureId: number }> {
  const sub = new Redis(REDIS_URL);
  const channel = `event:${fixtureId}`;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      sub.disconnect();
      reject(new Error(`no goal on ${channel} within ${timeoutMs}ms`));
    }, timeoutMs);

    void sub.subscribe(channel, (err) => {
      if (err) {
        clearTimeout(timer);
        sub.disconnect();
        reject(err);
      }
    });

    sub.on("message", (_ch, message) => {
      try {
        const parsed = JSON.parse(message) as { kind?: string; fixtureId?: number; sim?: boolean };
        if (parsed.kind === "goal" && parsed.sim) {
          clearTimeout(timer);
          sub.disconnect();
          resolve({ kind: parsed.kind, fixtureId: parsed.fixtureId ?? fixtureId });
        }
      } catch {
        // skip
      }
    });
  });
}

async function main(): Promise<void> {
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) throw new Error("TXLINE_API_TOKEN missing");

  const redis = new Redis(REDIS_URL);
  await redis.ping();
  redis.disconnect();

  const { jwt, apiOrigin } = await startGuestSession();
  const bundle = await buildSimBundle(apiOrigin, jwt, apiToken, DEFAULT_FIXTURE);
  const injectAt = goalCursor(bundle);
  if (injectAt === undefined) {
    throw new Error(`fixture ${DEFAULT_FIXTURE} has no goal in historical bundle`);
  }

  const row = await insertSimulatorSession(
    DEFAULT_FIXTURE,
    JSON.parse(JSON.stringify(bundle)),
  );

  const goalPromise = waitForGoal(DEFAULT_FIXTURE, 30_000);
  const pub = new Redis(REDIS_URL);
  const result = await replayStep(pub, bundle, 0, { goals: {} }, { untilGoal: true });
  pub.disconnect();

  const goal = await goalPromise;
  await updateSimulatorCursor(row.id, result.cursor);

  console.log("verify:d5 ok");
  console.log({
    sessionId: row.id,
    fixtureId: DEFAULT_FIXTURE,
    events: bundle.events.length,
    goalCursor: injectAt,
    emitted: result.emitted,
    goal,
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
