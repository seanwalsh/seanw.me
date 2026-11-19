"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/env";

export type SignInState = { error?: string; email?: string };

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/tycho") && !next.startsWith("//") ? next : "/tycho";
}

export async function signIn(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email address and password.", email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) console.error("[sign-in] Supabase rejected sign-in:", error.status, error.code, error.message);
  else if (!isAllowedAdmin(data.user?.email)) console.error("[sign-in] Signed in, but not in ADMIN_EMAILS");
  if (error || !isAllowedAdmin(data.user?.email)) {
    if (data?.user) await supabase.auth.signOut();
    return { error: "That email address and password don't match.", email };
  }
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/tycho/sign-in");
}
