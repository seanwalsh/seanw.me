import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { formatDate, formatNumber, shortDisplay, shortUrl } from "@/lib/format";
import { SLUG_PATTERN } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Link info · seanw.me" };

type Row = {
  slug: string;
  title: string | null;
  destination: string;
  created_at: string;
  click_count: number;
  password_hash: string | null;
  expires_at: string | null;
};

/** Public preview page reached by appending "+" to any short link (Bitly-style). */
export default async function LinkInfo({ params }: { params: Promise<{ slug: string }> }) {
  const slug = decodeURIComponent((await params).slug);
  if (!SLUG_PATTERN.test(slug)) notFound();

  const { data } = await adminClient()
    .from("links")
    .select("slug, title, destination, created_at, click_count, password_hash, expires_at")
    .eq("slug", slug)
    .eq("archived", false)
    .maybeSingle<Row>();
  if (!data) notFound();

  const locked = !!data.password_hash;
  const expired = !!data.expires_at && new Date(data.expires_at) <= new Date();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="card w-full max-w-lg p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Link preview</p>
        <h1 className="mt-2 break-words text-xl font-semibold">{data.title || shortDisplay(data.slug)}</h1>
        <a href={shortUrl(data.slug)} className="mt-1 block font-mono text-sm text-accent">
          {shortDisplay(data.slug)}
        </a>

        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-muted">Goes to</dt>
            <dd className="mt-0.5 break-all">{locked ? "🔒 Password protected" : data.destination}</dd>
          </div>
          <div className="flex gap-10">
            <div>
              <dt className="text-muted">Created</dt>
              <dd className="mt-0.5">{formatDate(data.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted">Clicks</dt>
              <dd className="mt-0.5 tabular-nums">{formatNumber(data.click_count)}</dd>
            </div>
            {data.expires_at && (
              <div>
                <dt className="text-muted">{expired ? "Expired" : "Expires"}</dt>
                <dd className="mt-0.5">{formatDate(data.expires_at)}</dd>
              </div>
            )}
          </div>
        </dl>

        {!expired && (
          <a href={shortUrl(data.slug)} className="btn-primary mt-8 w-full">
            Continue
          </a>
        )}
      </div>
    </main>
  );
}
