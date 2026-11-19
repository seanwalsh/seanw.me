import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteLink, resetClicks, setArchived } from "@/app/tycho/actions";
import { ActionButton } from "@/components/admin/action-button";
import { Analytics } from "@/components/admin/analytics";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { CopyButton } from "@/components/admin/copy-button";
import { QrPanel } from "@/components/admin/qr-panel";
import { RangePicker } from "@/components/admin/range-picker";
import { Stat } from "@/components/admin/stat";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatNumber, shortDisplay, shortUrl } from "@/lib/format";
import { getStats, parseRange, RANGES } from "@/lib/stats";
import type { Link as LinkRow } from "@/lib/types";

export const metadata: Metadata = { title: "Link" };

function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "warn" | "danger" }) {
  const tones = {
    muted: "border-border text-muted",
    warn: "border-amber-500/40 text-amber-600 dark:text-amber-400",
    danger: "border-danger/40 text-danger",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${tones[tone]}`}>{children}</span>;
}

export default async function LinkDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string; created?: string; saved?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const { supabase } = await requireAdmin();

  const { data: link } = await supabase.from("links").select("*").eq("id", id).maybeSingle<LinkRow>();
  if (!link) notFound();
  const stats = await getStats(range, link.id);

  const url = shortUrl(link.slug);
  const expired =
    (link.expires_at && new Date(link.expires_at) <= new Date()) ||
    (link.max_clicks != null && link.click_count >= link.max_clicks);

  return (
    <div className="space-y-6">
      {(sp.created || sp.saved) && (
        <div role="status" className="rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm">
          {sp.created ? (
            <>
              <strong>Link created.</strong> {shortDisplay(link.slug)} is live.
            </>
          ) : (
            <strong>Changes saved.</strong>
          )}
        </div>
      )}

      <div>
        <Link href="/tycho/links" className="text-sm text-muted hover:text-fg">
          ← All links
        </Link>
      </div>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-xl font-semibold">{link.title || shortDisplay(link.slug)}</h1>
            <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-block font-mono text-accent hover:underline">
              {shortDisplay(link.slug)}
            </a>
            <p className="mt-1 break-all text-sm text-muted">↳ {link.destination}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {link.archived && <Badge tone="warn">Archived</Badge>}
              {expired && <Badge tone="danger">Expired</Badge>}
              {link.password_hash && <Badge>🔒 Password</Badge>}
              {link.expires_at && <Badge>Expires {formatDate(link.expires_at, true)}</Badge>}
              {link.max_clicks && <Badge>Limit {formatNumber(link.max_clicks)} clicks</Badge>}
              {link.redirect_type !== 302 && <Badge>{link.redirect_type}</Badge>}
              {link.tags.map((t) => (
                <Link key={t} href={`/tycho/links?tag=${encodeURIComponent(t)}`}>
                  <Badge>#{t}</Badge>
                </Link>
              ))}
            </div>
            {link.notes && <p className="mt-3 whitespace-pre-wrap text-sm">{link.notes}</p>}
            <p className="mt-3 text-xs text-muted">
              Created {formatDate(link.created_at, true)} · Last click {formatDate(link.last_clicked_at, true)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={url} />
            <Link href={`/tycho/links/${link.id}/edit`} className="btn-secondary">
              Edit
            </Link>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Analytics</h2>
        <div className="flex flex-wrap items-center gap-2">
          <RangePicker current={range} basePath={`/tycho/links/${link.id}`} />
          <a href={`/tycho/links/${link.id}/export`} className="btn-ghost">
            Export CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Clicks" value={formatNumber(stats.total)} hint={RANGES[range].label} />
        <Stat label="QR scans" value={formatNumber(stats.qr)} hint={RANGES[range].label} />
        <Stat label="All-time clicks" value={formatNumber(link.click_count)} />
        <Stat label="Bot visits filtered" value={formatNumber(stats.bots)} hint={RANGES[range].label} />
      </div>

      <Analytics stats={stats} />

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">QR code</h2>
        <QrPanel url={url} filename={`seanw.me-${link.slug}`} />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Manage</h2>
        <p className="mt-1 text-sm text-muted">
          Archived links stop redirecting and drop out of your main list. You can bring them back any time.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton action={setArchived.bind(null, link.id, !link.archived)}>
            {link.archived ? "Unarchive" : "Archive"}
          </ActionButton>
          <ConfirmAction action={resetClicks.bind(null, link.id)} label="Reset analytics" confirmLabel="Yes, delete all clicks" className="btn-secondary" />
          <ConfirmAction action={deleteLink.bind(null, link.id)} label="Delete link" confirmLabel="Yes, delete forever" />
        </div>
      </section>
    </div>
  );
}
