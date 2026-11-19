"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { saveLink, type SaveState } from "@/app/tycho/actions";
import type { Link as LinkRow } from "@/lib/types";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
type UtmKey = (typeof UTM_KEYS)[number];
const UTM_LABELS: Record<UtmKey, string> = {
  utm_source: "Source",
  utm_medium: "Medium",
  utm_campaign: "Campaign",
  utm_term: "Term",
  utm_content: "Content",
};
const UTM_HINTS: Partial<Record<UtmKey, string>> = {
  utm_source: "For example, newsletter or linkedin",
  utm_medium: "For example, email or social",
};

/** Split an existing destination into its base URL and any UTM values so they can be edited separately. */
function splitUtm(destination: string): { base: string; utm: Record<UtmKey, string> } {
  const utm = Object.fromEntries(UTM_KEYS.map((k) => [k, ""])) as Record<UtmKey, string>;
  try {
    const url = new URL(destination);
    for (const k of UTM_KEYS) {
      utm[k] = url.searchParams.get(k) ?? "";
      url.searchParams.delete(k);
    }
    return { base: url.toString(), utm };
  } catch {
    return { base: destination, utm };
  }
}

function joinUtm(base: string, utm: Record<UtmKey, string>) {
  const filled = UTM_KEYS.filter((k) => utm[k].trim());
  if (!filled.length || !base.trim()) return base;
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(base) ? base : `https://${base}`);
    for (const k of filled) url.searchParams.set(k, utm[k].trim());
    return url.toString();
  } catch {
    return base;
  }
}

/** `datetime-local` wants local "YYYY-MM-DDTHH:mm". */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mb-1.5 text-sm font-medium text-danger">
      {message}
    </p>
  );
}

export function LinkForm({ link, host }: { link?: LinkRow; host: string }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveLink, {});
  const errors = state.errors ?? {};

  const initial = useMemo(() => splitUtm(link?.destination ?? ""), [link?.destination]);
  const [base, setBase] = useState(initial.base);
  const [utm, setUtm] = useState(initial.utm);
  const [expiresLocal, setExpiresLocal] = useState(toLocalInput(link?.expires_at ?? null));
  const hasUtm = UTM_KEYS.some((k) => initial.utm[k]);
  const hasAdvanced =
    !!link && (!!link.password_hash || !!link.expires_at || !!link.max_clicks || link.redirect_type !== 302 || !link.forward_params);

  const destination = joinUtm(base, utm);
  const expiresIso = expiresLocal ? new Date(expiresLocal).toISOString() : "";
  const errorCount = Object.keys(errors).length;

  return (
    <form action={action} className="space-y-6" noValidate>
      {errorCount > 0 && (
        <div role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger" tabIndex={-1}>
          <p className="font-semibold">There {errorCount === 1 ? "is a problem" : "are problems"}</p>
          <ul className="mt-1 list-disc pl-5">
            {Object.entries(errors).map(([k, v]) => (
              <li key={k}>{k === "form" ? v : <a href={`#${k === "destination" ? "base" : k}`} className="underline">{v}</a>}</li>
            ))}
          </ul>
        </div>
      )}

      {link && <input type="hidden" name="id" value={link.id} />}
      <input type="hidden" name="destination" value={destination} />
      <input type="hidden" name="expires_at" value={expiresIso} />

      <section className="card space-y-5 p-5">
        <div>
          <label htmlFor="base" className="label">
            Destination
          </label>
          <FieldError id="base-error" message={errors.destination} />
          <input
            id="base"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            required
            value={base}
            onChange={(e) => setBase(e.target.value)}
            aria-invalid={!!errors.destination}
            aria-describedby={errors.destination ? "base-error" : undefined}
            className="input"
            placeholder="https://example.com/a-very-long-link"
          />
        </div>

        <details className="group rounded-lg border border-border" open={hasUtm}>
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">UTM parameters</summary>
          <div className="space-y-4 border-t border-border p-3">
            <div className="grid gap-4 sm:grid-cols-2">
              {UTM_KEYS.map((k) => (
                <div key={k}>
                  <label htmlFor={k} className="label">
                    {UTM_LABELS[k]} <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <input
                    id={k}
                    value={utm[k]}
                    onChange={(e) => setUtm((u) => ({ ...u, [k]: e.target.value }))}
                    className="input"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {UTM_HINTS[k] && <p className="hint">{UTM_HINTS[k]}</p>}
                </div>
              ))}
            </div>
            {destination !== base && (
              <p className="break-all rounded-md bg-subtle p-2 font-mono text-xs text-muted">{destination}</p>
            )}
          </div>
        </details>

        <div>
          <label htmlFor="slug" className="label">
            Back-half <span className="font-normal text-muted">(optional)</span>
          </label>
          <p className="hint mb-1.5 mt-0">Leave blank for a random one. Letters, numbers, dashes and underscores.</p>
          <FieldError id="slug-error" message={errors.slug} />
          <div className="flex items-stretch">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-border bg-subtle px-3 font-mono text-sm text-muted">
              {host}/
            </span>
            <input
              id="slug"
              name="slug"
              defaultValue={link?.slug}
              autoComplete="off"
              spellCheck={false}
              maxLength={64}
              aria-invalid={!!errors.slug}
              aria-describedby={errors.slug ? "slug-error" : undefined}
              className="input rounded-l-none font-mono"
            />
          </div>
        </div>

        <div>
          <label htmlFor="title" className="label">
            Title <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="title" name="title" defaultValue={link?.title ?? ""} className="input" maxLength={200} />
          {!link && <p className="hint">If left blank, it&apos;s taken from the page.</p>}
        </div>

        <div>
          <label htmlFor="tags" className="label">
            Tags <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="tags" name="tags" defaultValue={link?.tags.join(", ")} className="input" autoComplete="off" />
          <p className="hint">Separate tags with commas.</p>
        </div>

        <div>
          <label htmlFor="notes" className="label">
            Notes <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea id="notes" name="notes" defaultValue={link?.notes ?? ""} rows={2} className="input" />
        </div>
      </section>

      <details className="card group" open={hasAdvanced || errors.max_clicks != null || errors.expires_at != null || errors.expired_redirect != null}>
        <summary className="cursor-pointer select-none p-5 text-sm font-semibold">Advanced settings</summary>
        <div className="space-y-5 border-t border-border p-5">
          <fieldset>
            <legend className="label">Redirect type</legend>
            <div className="space-y-2 text-sm">
              {[
                [302, "302 Temporary", "Recommended. Every click is counted and edits apply immediately."],
                [301, "301 Permanent", "Browsers cache it, so repeat clicks may not be counted."],
                [307, "307 Temporary (keeps method)", ""],
                [308, "308 Permanent (keeps method)", ""],
              ].map(([value, label, hint]) => (
                <label key={value} className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="redirect_type"
                    value={value}
                    defaultChecked={(link?.redirect_type ?? 302) === value}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <span>
                    {label}
                    {hint && <span className="block text-xs text-muted">{hint}</span>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="forward_params" defaultChecked={link?.forward_params ?? true} className="mt-0.5 accent-[var(--accent)]" />
            <span>
              Pass query parameters through
              <span className="block text-xs text-muted">{host}/abc?ref=x sends ?ref=x on to the destination.</span>
            </span>
          </label>

          <div>
            <label htmlFor="password" className="label">
              Password <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="password" name="password" type="password" autoComplete="new-password" className="input" />
            <p className="hint">
              {link?.password_hash ? "This link has a password. Enter a new one to change it." : "Visitors must enter it before being redirected."}
            </p>
            {link?.password_hash && (
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" name="remove_password" className="accent-[var(--accent)]" /> Remove password
              </label>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="expires_at" className="label">
                Expires <span className="font-normal text-muted">(optional)</span>
              </label>
              <FieldError id="expires_at-error" message={errors.expires_at} />
              <input
                id="expires_at"
                type="datetime-local"
                value={expiresLocal}
                onChange={(e) => setExpiresLocal(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="max_clicks" className="label">
                Click limit <span className="font-normal text-muted">(optional)</span>
              </label>
              <FieldError id="max_clicks-error" message={errors.max_clicks} />
              <input
                id="max_clicks"
                name="max_clicks"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={link?.max_clicks ?? ""}
                aria-invalid={!!errors.max_clicks}
                className="input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="expired_redirect" className="label">
              After it expires, send visitors to <span className="font-normal text-muted">(optional)</span>
            </label>
            <FieldError id="expired_redirect-error" message={errors.expired_redirect} />
            <input
              id="expired_redirect"
              name="expired_redirect"
              type="url"
              inputMode="url"
              defaultValue={link?.expired_redirect ?? ""}
              className="input"
              placeholder="Leave blank to show an expired page"
            />
          </div>
        </div>
      </details>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : link ? "Save changes" : "Create link"}
        </button>
        <Link href={link ? `/tycho/links/${link.id}` : "/tycho/links"} className="btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
