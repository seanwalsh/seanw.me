"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { clickInfo } from "@/lib/click";
import { SITE_URL } from "@/lib/env";

export type UnlockState = { error?: string };

export async function unlock(_prev: UnlockState, form: FormData): Promise<UnlockState> {
  const slug = String(form.get("slug") ?? "");
  const password = String(form.get("password") ?? "");
  const source = form.get("qr") ? "qr" : "link";
  const fwd = String(form.get("fwd") ?? "");

  const db = adminClient();
  const { data: link } = await db
    .from("links")
    .select("id, destination, password_hash, forward_params, archived, expires_at, max_clicks, click_count")
    .eq("slug", slug)
    .maybeSingle();

  if (!link || link.archived || !link.password_hash) redirect("/gone?reason=missing");
  const expired =
    (link.expires_at && new Date(link.expires_at) <= new Date()) ||
    (link.max_clicks != null && link.click_count >= link.max_clicks);
  if (expired) redirect("/gone?reason=expired");

  // Small constant delay blunts brute-forcing.
  await new Promise((r) => setTimeout(r, 400));
  if (!(await bcrypt.compare(password, link.password_hash))) return { error: "That password isn't right." };

  const req = new Request(SITE_URL, { headers: await headers() });
  const info = clickInfo(req, source);
  await db.from("clicks").insert({ link_id: link.id, ...info });

  let target = link.destination as string;
  if (link.forward_params && fwd) {
    const url = new URL(target);
    for (const [k, v] of new URLSearchParams(fwd)) if (!url.searchParams.has(k)) url.searchParams.append(k, v);
    target = url.toString();
  }
  redirect(target);
}
