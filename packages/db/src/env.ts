import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  loaded = true;

  const here = dirname(fileURLToPath(import.meta.url));
  const root = join(here, "../../..");
  const envPath = join(root, ".env");
  if (existsSync(envPath)) config({ path: envPath });
}

function pick(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
}

export function supabaseUrl(): string {
  loadEnv();
  const value = pick("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  if (!value) throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required");
  return value;
}

export function supabaseAnonKey(): string {
  loadEnv();
  const value = pick(
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
  if (!value) {
    throw new Error(
      "SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required",
    );
  }
  return value;
}

export function supabaseServiceRoleKey(): string {
  loadEnv();
  const value = pick("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");
  if (!value) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  return value;
}

export function databaseUrl(): string {
  loadEnv();
  const value = pick("DATABASE_URL", "SUPABASE_DATABASE_URL");
  if (!value) throw new Error("DATABASE_URL is required");
  return value;
}
