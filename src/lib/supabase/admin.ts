import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/env";

let client: SupabaseClient | null = null;

/** Service-role client. Bypasses RLS — only use on the server for public redirect paths and cron. */
export function adminClient() {
  client ??= createClient(SUPABASE_URL(), SUPABASE_SERVICE_ROLE_KEY(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
