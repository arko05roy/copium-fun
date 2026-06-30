import { createAnonDbClient } from "@copium/db";

export function createBrowserSupabase() {
  return createAnonDbClient();
}
