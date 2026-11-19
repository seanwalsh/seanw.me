"use client";

import Link from "next/link";
import { useActionState } from "react";
import { bulkCreate, type BulkState } from "@/app/tycho/actions";
import { CopyButton } from "./copy-button";

export function BulkForm({ host }: { host: string }) {
  const [state, action, pending] = useActionState<BulkState, FormData>(bulkCreate, {});
  const results = state.results ?? [];
  const created = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  return (
    <div className="space-y-6">
      {results.length > 0 && (
        <section role="status" className="card space-y-4 p-5">
          <h2 className="font-semibold">
            Created {created.length} of {results.length} {results.length === 1 ? "link" : "links"}
          </h2>
          {created.length > 0 && (
            <>
              <ul className="space-y-1 font-mono text-sm">
                {created.map((r) => (
                  <li key={r.line}>
                    {host}/{r.slug}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <CopyButton text={created.map((r) => `https://${host}/${r.slug}`).join("\n")} label="Copy all short links" />
                <Link href="/tycho/links" className="btn-ghost">
                  View links
                </Link>
              </div>
            </>
          )}
          {failed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-danger">These lines weren&apos;t created</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {failed.map((r) => (
                  <li key={r.line}>
                    Line {r.line}: <span className="font-mono">{r.input}</span> — {r.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <form action={action} className="card space-y-5 p-5">
        <div>
          <label htmlFor="lines" className="label">
            Links
          </label>
          <p className="hint mb-1.5 mt-0">
            One per line. Optionally add a back-half and a title, separated by commas:
            <br />
            <span className="font-mono">https://example.com/page, my-page, My page</span>
          </p>
          <textarea id="lines" name="lines" rows={10} required spellCheck={false} className="input font-mono" />
        </div>
        <div>
          <label htmlFor="tags" className="label">
            Tags for all of them <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="tags" name="tags" className="input" autoComplete="off" />
          <p className="hint">Separate tags with commas.</p>
        </div>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Creating links…" : "Create links"}
        </button>
      </form>
    </div>
  );
}
