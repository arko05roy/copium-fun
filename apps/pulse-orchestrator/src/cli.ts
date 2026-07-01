import {
  getSimulatorSession,
  insertSimulatorSession,
  loadEnv as loadDbEnv,
  updateSimulatorCursor,
} from "@copium/db";
import { Redis } from "ioredis";
import {
  buildSimBundle,
  detectStateAtCursor,
  goalCursor,
  isSimBundle,
  loadEnv,
  replayStep,
  startGuestSession,
} from "@copium/txline";

loadEnv();
loadDbEnv();

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const DEFAULT_FIXTURE = 17926704;

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function buildSession(fixtureId: number): Promise<string> {
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) throw new Error("TXLINE_API_TOKEN missing");

  const { jwt, apiOrigin } = await startGuestSession();
  const bundle = await buildSimBundle(apiOrigin, jwt, apiToken, fixtureId);
  const goalAt = goalCursor(bundle);

  const row = await insertSimulatorSession(
    fixtureId,
    JSON.parse(JSON.stringify(bundle)),
  );

  console.log(
    JSON.stringify({
      sessionId: row.id,
      fixtureId,
      events: bundle.events.length,
      goalCursor: goalAt,
      scoresPath: bundle.source.scoresPath,
    }),
  );
  return row.id;
}

async function advanceSession(
  sessionId: string,
  opts: { untilGoal?: boolean; steps?: number },
): Promise<void> {
  const session = await getSimulatorSession(sessionId);
  if (!session.bundle || !isSimBundle(session.bundle)) {
    throw new Error("session bundle invalid");
  }

  const redis = new Redis(REDIS_URL);
  await redis.ping();

  const result = await replayStep(
    redis,
    session.bundle,
    session.cursor ?? 0,
    detectStateAtCursor(session.bundle, session.cursor ?? 0),
    {
      untilGoal: opts.untilGoal,
      maxEvents: opts.steps,
    },
  );

  redis.disconnect();
  await updateSimulatorCursor(sessionId, result.cursor);

  console.log(
    JSON.stringify({
      sessionId,
      cursor: result.cursor,
      emitted: result.emitted,
      detected: result.detected,
      done: result.done,
    }),
  );
}

async function main(): Promise<void> {
  const command = process.argv[2];
  if (command === "build-session") {
    const fixtureId = Number(argValue("--fixture") ?? DEFAULT_FIXTURE);
    await buildSession(fixtureId);
    return;
  }

  if (command === "advance") {
    const sessionId = argValue("--session");
    if (!sessionId) throw new Error("--session required");
    const untilGoal = process.argv.includes("--until-goal");
    const steps = Number(argValue("--steps") ?? (untilGoal ? "99999" : "1"));
    await advanceSession(sessionId, { untilGoal, steps });
    return;
  }

  throw new Error("usage: build-session [--fixture ID] | advance --session ID [--until-goal] [--steps N]");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
