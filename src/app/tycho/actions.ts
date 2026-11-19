"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { randomSlug, validateSlug } from "@/lib/slug";
import { fetchPageTitle, normalizeDestination } from "@/lib/url";

export type FieldErrors = Partial<
  Record<"destination" | "slug" | "max_clicks" | "expires_at" | "expired_redirect" | "form", string>
>;
export type SaveState = { errors?: FieldErrors };

const REDIRECT_TYPES = new Set([301, 302, 307, 308]);

function parseTags(raw: string): string[] {
  return [...new Set(raw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 20);
}

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

/** Insert with a random slug, retrying on the rare collision. */
async function insertWithRandomSlug(supabase: Supabase, row: Record<string, unknown>) {
  for (let i = 0; i < 5; i++) {
    const result = await supabase
      .from("links")
      .insert({ ...row, slug: randomSlug(i < 3 ? 6 : 8) })
      .select("id")
      .single();
    if (result.error?.code !== "23505") return result;
  }
  return { data: null, error: { message: "Couldn't find a free short code. Try again.", code: "slug" } };
}

export async function saveLink(_prev: SaveState, form: FormData): Promise<SaveState> {
  const { supabase } = await requireAdmin();
  const id = String(form.get("id") ?? "") || null;
  const errors: FieldErrors = {};

  const destination = normalizeDestination(String(form.get("destination") ?? ""));
  if (!destination) errors.destination = "Enter a web address, like https://example.com.";

  const slug = String(form.get("slug") ?? "").trim();
  if (slug) {
    const problem = validateSlug(slug);
    if (problem) errors.slug = problem;
  }

  const maxClicksRaw = String(form.get("max_clicks") ?? "").trim();
  const maxClicks = maxClicksRaw ? Number(maxClicksRaw) : null;
  if (maxClicks !== null && (!Number.isInteger(maxClicks) || maxClicks < 1)) {
    errors.max_clicks = "Enter a whole number of 1 or more, or leave it blank.";
  }

  const expiresRaw = String(form.get("expires_at") ?? "").trim();
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) errors.expires_at = "Enter a valid date and time.";

  const expiredRedirectRaw = String(form.get("expired_redirect") ?? "").trim();
  const expiredRedirect = expiredRedirectRaw ? normalizeDestination(expiredRedirectRaw) : null;
  if (expiredRedirectRaw && !expiredRedirect) errors.expired_redirect = "Enter a web address, or leave it blank.";

  if (Object.keys(errors).length) return { errors };

  const redirectType = Number(form.get("redirect_type") ?? 302);
  let title = String(form.get("title") ?? "").trim() || null;
  if (!title && !id) title = await fetchPageTitle(destination!);

  const row: Record<string, unknown> = {
    destination,
    title,
    notes: String(form.get("notes") ?? "").trim() || null,
    tags: parseTags(String(form.get("tags") ?? "")),
    redirect_type: REDIRECT_TYPES.has(redirectType) ? redirectType : 302,
    expires_at: expiresAt?.toISOString() ?? null,
    max_clicks: maxClicks,
    expired_redirect: expiredRedirect,
    forward_params: form.get("forward_params") === "on",
  };

  const password = String(form.get("password") ?? "");
  if (form.get("remove_password") === "on") row.password_hash = null;
  else if (password) row.password_hash = await bcrypt.hash(password, 10);

  let savedId = id;
  if (id) {
    if (slug) row.slug = slug;
    const { error } = await supabase.from("links").update(row).eq("id", id);
    if (error) {
      if (error.code === "23505") return { errors: { slug: `seanw.me/${slug} is already taken.` } };
      return { errors: { form: error.message } };
    }
  } else {
    const result = slug
      ? await supabase.from("links").insert({ ...row, slug }).select("id").single()
      : await insertWithRandomSlug(supabase, row);
    if (result.error) {
      if (result.error.code === "23505") return { errors: { slug: `seanw.me/${slug} is already taken.` } };
      return { errors: { form: result.error.message } };
    }
    savedId = result.data!.id;
  }

  revalidatePath("/tycho", "layout");
  redirect(`/tycho/links/${savedId}${id ? "?saved=1" : "?created=1"}`);
}

export async function setArchived(id: string, archived: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from("links").update({ archived }).eq("id", id);
  revalidatePath("/tycho", "layout");
}

export async function deleteLink(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("links").delete().eq("id", id);
  revalidatePath("/tycho", "layout");
  redirect("/tycho/links?deleted=1");
}

export async function resetClicks(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("clicks").delete().eq("link_id", id);
  await supabase.from("links").update({ click_count: 0, last_clicked_at: null }).eq("id", id);
  revalidatePath("/tycho", "layout");
}

export type BulkResult = { line: number; input: string; ok: boolean; slug?: string; error?: string };
export type BulkState = { results?: BulkResult[] };

/** Bulk shorten: one link per line as `url[, back-half][, title]`. */
export async function bulkCreate(_prev: BulkState, form: FormData): Promise<BulkState> {
  const { supabase } = await requireAdmin();
  const tags = parseTags(String(form.get("tags") ?? ""));
  const lines = String(form.get("lines") ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 200);

  const results: BulkResult[] = [];
  for (const [i, input] of lines.entries()) {
    const [rawUrl, rawSlug = "", ...titleParts] = input.split(",").map((p) => p.trim());
    const destination = normalizeDestination(rawUrl);
    if (!destination) {
      results.push({ line: i + 1, input, ok: false, error: "Not a valid web address" });
      continue;
    }
    const slugProblem = rawSlug ? validateSlug(rawSlug) : null;
    if (slugProblem) {
      results.push({ line: i + 1, input, ok: false, error: slugProblem });
      continue;
    }
    const title = titleParts.join(",").trim() || (await fetchPageTitle(destination));
    const row = { destination, title, tags };
    const result = rawSlug
      ? await supabase.from("links").insert({ ...row, slug: rawSlug }).select("slug").single()
      : await insertWithRandomSlug(supabase, row).then(async (r) =>
          r.data ? await supabase.from("links").select("slug").eq("id", r.data.id).single() : r,
        );
    if (result.error || !result.data) {
      const taken = result.error?.code === "23505";
      results.push({ line: i + 1, input, ok: false, error: taken ? `${rawSlug} is already taken` : result.error?.message });
    } else {
      results.push({ line: i + 1, input, ok: true, slug: (result.data as { slug: string }).slug });
    }
  }

  revalidatePath("/tycho", "layout");
  return { results };
}
