import {
  buildSimBundle,
  loadEnv,
  startGuestSession,
} from "@copium/txline";
import {
  goalValidationTarget,
  htValidationTarget,
  predicateGoalScored,
  validatePulseFromBundle,
  validateStatOnChain,
  fetchStatValidation,
} from "@copium/settlement";

loadEnv();

const DEFAULT_FIXTURE = Number(process.env.VERIFY_D8_FIXTURE_ID ?? 17926704);

async function verifyGoalPulse(fixtureId: number): Promise<void> {
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) throw new Error("TXLINE_API_TOKEN missing");

  const { jwt, apiOrigin } = await startGuestSession();
  const bundle = await buildSimBundle(apiOrigin, jwt, apiToken, fixtureId);
  const target = goalValidationTarget(bundle);
  if (!target) {
    throw new Error(`fixture ${fixtureId}: no goal target in historical bundle`);
  }

  const checked = await validatePulseFromBundle(
    apiOrigin,
    jwt,
    apiToken,
    bundle,
    "next_goal",
  );

  if (!checked.result.valid) {
    throw new Error(
      `validate_stat returned false for goal stat ${target.statKey} (open ${target.openValue})`,
    );
  }

  console.log("goal validate_stat ok", {
    fixtureId,
    seq: target.seq,
    statKey: target.statKey,
    openValue: target.openValue,
    provedValue: target.provedValue,
    method: checked.result.method,
    dailyScoresPda: checked.result.dailyScoresPda,
  });
}

async function verifyHtPulse(fixtureId: number): Promise<void> {
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) throw new Error("TXLINE_API_TOKEN missing");

  const { jwt, apiOrigin } = await startGuestSession();
  const bundle = await buildSimBundle(apiOrigin, jwt, apiToken, fixtureId);
  const target = htValidationTarget(bundle);
  if (!target) {
    console.log("ht pulse: skip — no HT phase in bundle");
    return;
  }

  const checked = await validatePulseFromBundle(
    apiOrigin,
    jwt,
    apiToken,
    bundle,
    "over_under_ht",
  );

  if (!checked.result.valid) {
    throw new Error("validate_stat returned false for over_under_ht");
  }

  console.log("ht validate_stat ok", {
    fixtureId,
    seq: target.seq,
    method: checked.result.method,
  });
}

async function verifyDocsFixture(): Promise<void> {
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) throw new Error("TXLINE_API_TOKEN missing");

  const { jwt, apiOrigin } = await startGuestSession();
  const validation = await fetchStatValidation(apiOrigin, jwt, apiToken, {
    fixtureId: 17952170,
    seq: 941,
    statKey: 1002,
  });

  const result = await validateStatOnChain({
    validation,
    predicate: predicateGoalScored(0),
  });

  if (!result.valid) {
    throw new Error("docs fixture validate_stat returned false");
  }

  console.log("docs fixture validate_stat ok", {
    fixtureId: 17952170,
    method: result.method,
  });
}

async function main(): Promise<void> {
  if (!process.env.TXLINE_API_TOKEN?.trim()) {
    throw new Error("TXLINE_API_TOKEN missing — run pnpm txline:subscribe");
  }

  console.log("=== D8 txoracle.validate_stat spike ===");
  await verifyDocsFixture();
  await verifyGoalPulse(DEFAULT_FIXTURE);
  await verifyHtPulse(DEFAULT_FIXTURE);
  console.log("verify:d8 ok");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
