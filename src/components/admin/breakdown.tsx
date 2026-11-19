import type { Breakdown as BreakdownData } from "@/lib/types";
import { formatNumber } from "@/lib/format";

const FLAG_BASE = 0x1f1e6 - 65;
function flag(code: string) {
  return /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => FLAG_BASE + c.charCodeAt(0))) : "";
}

let regionNames: Intl.DisplayNames | null = null;
function countryName(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
  return regionNames.of(code) ?? code;
}

export function Breakdown({ title, data, kind }: { title: string; data: BreakdownData; kind?: "country" }) {
  const max = Math.max(1, ...data.map((d) => d.clicks));
  return (
    <section className="card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {data.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No clicks yet.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {data.map((row) => (
            <li key={row.name} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate">
                  {kind === "country" ? `${flag(row.name)} ${countryName(row.name)}`.trim() : row.name}
                </span>
                <span className="tabular-nums text-muted">{formatNumber(row.clicks)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-subtle">
                <div className="h-1.5 rounded-full bg-accent/70" style={{ width: `${(row.clicks / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
