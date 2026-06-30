import { TXLINE_WORLDCUP_FREE_TIER } from "@copium/config";
import { fetchFixturesSnapshot } from "./snapshot.js";
import { subscribeDevnet } from "./subscribe.js";

async function main(): Promise<void> {
  console.log(
    `txline subscribe — World Cup free tier ${TXLINE_WORLDCUP_FREE_TIER.serviceLevelDelayed}`,
    `(${TXLINE_WORLDCUP_FREE_TIER.bundle}, ${TXLINE_WORLDCUP_FREE_TIER.delayLabel} delay)`,
  );

  const sub = await subscribeDevnet();
  console.log("wallet:", sub.wallet);
  console.log("subscribe tx:", sub.txSig);
  console.log(
    `explorer: https://explorer.solana.com/tx/${sub.txSig}?cluster=devnet`,
  );
  console.log("api token activated");
  console.log(`TXLINE_API_TOKEN=${sub.apiToken}`);

  const snap = await fetchFixturesSnapshot(sub.apiOrigin, sub.jwt, sub.apiToken);
  console.log(`fixtures snapshot: HTTP ${snap.status}, count ${snap.count}`);

  if (snap.status !== 200) {
    throw new Error(`expected snapshot HTTP 200, got ${snap.status}`);
  }

  if (snap.count === 0) {
    throw new Error("fixtures snapshot returned 0 rows — check subscription tier");
  }

  const first = snap.fixtures[0] as Record<string, unknown>;
  console.log("sample fixture:", {
    FixtureId: first.FixtureId,
    Participant1: first.Participant1,
    Participant2: first.Participant2,
    StartTime: first.StartTime,
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
