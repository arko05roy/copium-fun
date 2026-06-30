import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.js";
import { supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } from "./env.js";

export function createDbClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createAnonDbClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type { Database } from "./database.js";
