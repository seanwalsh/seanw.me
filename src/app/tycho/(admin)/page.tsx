import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getStats, parseRange, RANGES } from "@/lib/stats";
import { formatNumber, shortDisplay } from "@/lib/format";
import { Analytics } from "@/components/admin/analytics";
import { RangePicker } from "@/components/admin/range-picker";
import { Stat } from "@/components/admin/stat";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const range = parseRange((await searchParams).range);
  const { supabase } = await requireAdmin();

  const [stats, all, active] = await Promise.all([
    getStats(range),
    supabase.from("links").select("id", { count: "exact", head: true }),
    supabase.from("links").select("id", { count: "exact", head: true }).eq("archived", false),
  ]);

  const totalLinks = all.count ?? 0;

  if (totalLinks === 0) {
    return (
      <div className="card mx-auto mt-10 max-w-md p-10 text-center">
        <p className="text-4xl" aria-hidden>
          🔭
        </p>
        <h1 className="mt-4 text-xl font-semibold">No links yet</h1>
        <p className="mt-2 text-sm text-muted">Shorten your first link and its clicks will show up here.</p>
        <Link href="/tycho/links/new" className="btn-primary mt-6">
          Create your first link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <RangePicker current={range} basePath="/tycho" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Clicks" value={formatNumber(stats.total)} hint={RANGES[range].label} />
        <Stat label="QR scans" value={formatNumber(stats.qr)} hint={RANGES[range].label} />
        <Stat label="Active links" value={formatNumber(active.count ?? 0)} hint={`${formatNumber(totalLinks)} total`} />
        <Stat label="Bot visits filtered" value={formatNumber(stats.bots)} hint="Link previews and crawlers" />
      </div>

      <Analytics stats={stats} />

      <section className="card p-5">
        <h3 className="text-sm font-semibold">Top links</h3>
        {stats.top_links.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No clicks in this range.</p>
        ) : (
          <ol className="mt-3 divide-y divide-border">
            {stats.top_links.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <Link href={`/tycho/links/${l.id}`} className="min-w-0 hover:underline">
                  <span className="block truncate font-medium">{l.title || shortDisplay(l.slug)}</span>
                  <span className="block truncate font-mono text-xs text-accent">{shortDisplay(l.slug)}</span>
                </Link>
                <span className="tabular-nums text-muted">{formatNumber(l.clicks)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
