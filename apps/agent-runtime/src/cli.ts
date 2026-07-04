import { loadEnv } from "@copium/txline";

loadEnv();

async function main(): Promise<void> {
  const command = process.argv[2];
  if (command === "listen") {
    const { startAgentRuntime } = await import("./listen.js");
    await startAgentRuntime();
    return;
  }

  if (command === "execute-officer") {
    const pulseId = process.argv[3];
    if (!pulseId) throw new Error("usage: execute-officer <pulseId>");
    const { executeFirstAgentOnPulse } = await import("./executor.js");
    const result = await executeFirstAgentOnPulse(pulseId);
    console.log(JSON.stringify(result));
    if (result.skipped && !result.reason?.includes("already")) {
      process.exit(1);
    }
    return;
  }

  throw new Error("usage: listen | execute-officer <pulseId>");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
