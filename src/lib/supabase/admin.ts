import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SECRET_KEY, SUPABASE_URL } from "@/lib/env";

let client: SupabaseClient | null = null;

/** Secret-key client. Bypasses RLS — only use on the server for public redirect paths and cron. */
export function adminClient() {
  client ??= createClient(SUPABASE_URL(), SUPABASE_SECRET_KEY(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
