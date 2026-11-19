import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/admin/copy-button";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatNumber, shortDisplay, shortUrl } from "@/lib/format";
import { hostOf } from "@/lib/url";
import type { Link as LinkRow } from "@/lib/types";

export const metadata: Metadata = { title: "Links" };

const PAGE_SIZE = 25;
const SORTS = {
  created: { label: "Newest", column: "created_at" },
  clicks: { label: "Most clicks", column: "click_count" },
  recent: { label: "Recently clicked", column: "last_clicked_at" },
} as const;
type SortKey = keyof typeof SORTS;

type Search = { q?: string; tag?: string; archived?: string; sort?: string; page?: string; deleted?: string };

function hrefWith(sp: Search, patch: Partial<Search>) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v && k !== "deleted") next.set(k, v);
  const s = next.toString();
  return `/tycho/links${s ? `?${s}` : ""}`;
}

export default async function Links({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();

  const sort: SortKey = sp.sort && sp.sort in SORTS ? (sp.sort as SortKey) : "created";
  const page = Math.max(1, Number(sp.page) || 1);
  const showArchived = sp.archived === "1";
  const q = sp.q?.trim() ?? "";

  let query = supabase
    .from("links")
    .select("*", { count: "exact" })
    .eq("archived", showArchived)
    .order(SORTS[sort].column, { ascending: false, nullsFirst: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) {
    const term = q.replace(/[%,()]/g, " ");
    query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%,destination.ilike.%${term}%,notes.ilike.%${term}%`);
  }
  if (sp.tag) query = query.contains("tags", [sp.tag]);

  const [{ data, count, error }, tagRows] = await Promise.all([query, supabase.from("links").select("tags")]);
  const links = (data ?? []) as LinkRow[];
  const allTags = [...new Set((tagRows.data ?? []).flatMap((r) => r.tags as string[]))].sort();
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {sp.deleted && (
        <div role="status" className="rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm">
          <strong>Link deleted.</strong>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{showArchived ? "Archived links" : "Links"}</h1>
        <div className="flex gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download route */}
          <a href="/tycho/links/export" className="btn-ghost">
            Export CSV
          </a>
          <Link href="/tycho/links/new" className="btn-primary">
            Create link
          </Link>
        </div>
      </div>

      <search>
        <form className="flex flex-wrap items-end gap-3" action="/tycho/links">
          <div className="min-w-56 flex-1">
            <label htmlFor="q" className="label">
              Search links
            </label>
            <input id="q" name="q" type="search" defaultValue={q} className="input" />
          </div>
          <div>
            <label htmlFor="tag" className="label">
              Tag
            </label>
            <select id="tag" name="tag" defaultValue={sp.tag ?? ""} className="input">
              <option value="">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort" className="label">
              Sort by
            </label>
            <select id="sort" name="sort" defaultValue={sort} className="input">
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          {showArchived && <input type="hidden" name="archived" value="1" />}
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>
      </search>

      <div className="flex items-center justify-between text-sm text-muted">
        <p>
          {formatNumber(count ?? 0)} {count === 1 ? "link" : "links"}
          {q && <> matching “{q}”</>}
          {sp.tag && <> tagged #{sp.tag}</>}
        </p>
        <Link href={hrefWith(sp, { archived: showArchived ? undefined : "1", page: undefined })} className="hover:text-fg">
          {showArchived ? "Show active links" : "Show archived links"}
        </Link>
      </div>

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {links.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">
          {q || sp.tag ? "No links match. Try a different search." : showArchived ? "Nothing archived." : "No links yet."}
        </div>
      ) : (
        <ul className="space-y-3">
          {links.map((l) => (
            <li key={l.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/tycho/links/${l.id}`} className="block truncate font-medium hover:underline">
                  {l.title || hostOf(l.destination)}
                </Link>
                <p className="truncate font-mono text-sm text-accent">{shortDisplay(l.slug)}</p>
                <p className="truncate text-xs text-muted">{l.destination}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span>{formatDate(l.created_at)}</span>
                  {l.password_hash && <span>🔒</span>}
                  {l.expires_at && <span>⏳ {formatDate(l.expires_at)}</span>}
                  {l.tags.map((t) => (
                    <Link key={t} href={hrefWith(sp, { tag: t, page: undefined })} className="hover:text-fg">
                      #{t}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold tabular-nums">{formatNumber(l.click_count)}</p>
                <p className="text-xs text-muted">clicks</p>
              </div>
              <CopyButton text={shortUrl(l.slug)} />
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link className="btn-secondary" href={hrefWith(sp, { page: String(page - 1) })}>
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link className="btn-secondary" href={hrefWith(sp, { page: String(page + 1) })}>
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
