import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/env";

/** Returns an RLS-scoped Supabase client for the signed-in admin, or bounces to sign-in. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAllowedAdmin(user.email)) redirect("/tycho/sign-in");
  return { supabase, user };
}
