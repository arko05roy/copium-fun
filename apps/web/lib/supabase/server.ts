import { createDbClient } from "@copium/db";

export function createServerSupabase() {
  return createDbClient();
}
