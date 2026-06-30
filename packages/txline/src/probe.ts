import { fetchFixturesSnapshot } from "./snapshot.js";
import { startGuestSession } from "./auth.js";
import { loadEnv } from "./env.js";

async function main(): Promise<void> {
  loadEnv();
  const apiToken = process.env.TXLINE_API_TOKEN?.trim();
  if (!apiToken) {
    throw new Error("TXLINE_API_TOKEN missing — run pnpm txline:subscribe and add token to .env");
  }

  const { jwt, apiOrigin } = await startGuestSession();
  const snap = await fetchFixturesSnapshot(apiOrigin, jwt, apiToken);

  if (snap.status !== 200) {
    throw new Error(`fixtures snapshot expected HTTP 200, got ${snap.status}`);
  }
  if (snap.count === 0) {
    throw new Error("fixtures snapshot returned 0 rows");
  }

  const first = snap.fixtures[0] as Record<string, unknown>;
  console.log(`txline probe ok — HTTP ${snap.status}, ${snap.count} fixtures`);
  console.log("sample:", {
    FixtureId: first.FixtureId,
    Participant1: first.Participant1,
    Participant2: first.Participant2,
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
