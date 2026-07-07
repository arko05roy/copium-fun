import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";

type ServiceSpec = {
  name: string;
  color: string;
  command: string;
  args: string[];
  port?: number;
};

const REDIS_HOST = "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);

const SERVICES: ServiceSpec[] = [
  {
    name: "web",
    color: "\x1b[36m",
    command: "pnpm",
    args: ["--filter", "@copium/web", "dev"],
    port: Number(process.env.PORT ?? 3000),
  },
  {
    name: "orchestrator",
    color: "\x1b[35m",
    command: "pnpm",
    args: ["orchestrator:listen"],
    port: Number(process.env.PULSE_ORCHESTRATOR_PORT ?? 9091),
  },
  {
    name: "agent",
    color: "\x1b[33m",
    command: "pnpm",
    args: ["agent:listen"],
    port: Number(process.env.AGENT_RUNTIME_PORT ?? 9093),
  },
  {
    name: "settlement",
    color: "\x1b[32m",
    command: "pnpm",
    args: ["settlement:worker"],
    port: Number(process.env.SETTLEMENT_WORKER_PORT ?? 9092),
  },
];

const RESET = "\x1b[0m";
const children: ChildProcess[] = [];
let shuttingDown = false;

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

function prefixLines(chunk: Buffer | string, spec: ServiceSpec): string {
  const text = String(chunk);
  const prefix = `${spec.color}[${spec.name}]${RESET} `;
  return text
    .split(/\r?\n/)
    .filter((line, index, all) => line.length > 0 || index < all.length - 1)
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canReachRedis(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: REDIS_HOST, port: REDIS_PORT });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(1000);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

async function ensureRedis(): Promise<void> {
  if (await canReachRedis()) {
    log(`[dev:stack] Redis already reachable on ${REDIS_HOST}:${REDIS_PORT}`);
    return;
  }

  log("[dev:stack] Redis not reachable. Attempting `docker compose up -d redis`...");
  const result = await new Promise<number>((resolve) => {
    const child = spawn("docker", ["compose", "up", "-d", "redis"], {
      stdio: "inherit",
      env: process.env,
    });
    child.once("exit", (code) => resolve(code ?? 1));
    child.once("error", () => resolve(1));
  });

  if (result !== 0) {
    throw new Error(
      "Could not start Redis via docker compose. Start Redis manually, then rerun `pnpm dev:stack`.",
    );
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await canReachRedis()) {
      log(`[dev:stack] Redis is up on ${REDIS_HOST}:${REDIS_PORT}`);
      return;
    }
    await wait(500);
  }

  throw new Error("Redis still unreachable after docker compose startup.");
}

function canReachPort(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(1000);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

function shutdown(code = 0): void {
  if (shuttingDown) return;
  shuttingDown = true;
  log("[dev:stack] Shutting down services...");
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) child.kill("SIGKILL");
    }
    process.exit(code);
  }, 1500).unref();
}

function startService(spec: ServiceSpec): void {
  const child = spawn(spec.command, spec.args, {
    stdio: ["inherit", "pipe", "pipe"],
    env: process.env,
  });
  children.push(child);

  child.stdout?.on("data", (chunk) => {
    process.stdout.write(`${prefixLines(chunk, spec)}\n`);
  });
  child.stderr?.on("data", (chunk) => {
    process.stderr.write(`${prefixLines(chunk, spec)}\n`);
  });

  child.once("exit", (code, signal) => {
    if (shuttingDown) return;
    const why = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    log(`[dev:stack] ${spec.name} exited with ${why}`);
    shutdown(code ?? 1);
  });
}

async function main(): Promise<void> {
  await ensureRedis();
  log("[dev:stack] Starting web, orchestrator, agent, and settlement services...");
  let started = 0;
  for (const spec of SERVICES) {
    if (spec.port && (await canReachPort(spec.port))) {
      log(`[dev:stack] ${spec.name} already appears to be running on port ${spec.port}; skipping.`);
      continue;
    }
    startService(spec);
    started += 1;
  }
  if (started === 0) {
    log("[dev:stack] All services were already running. Nothing new started.");
    return;
  }
  log("[dev:stack] Stack is running. Press Ctrl+C to stop all services.");
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  log(`[dev:stack] ${message}`);
  process.exit(1);
});
