import Link from "next/link";
import { RANGES, type RangeKey } from "@/lib/stats";

export function RangePicker({ current, basePath }: { current: RangeKey; basePath: string }) {
  return (
    <nav aria-label="Date range" className="inline-flex rounded-lg border border-border bg-card p-0.5 text-sm">
      {(Object.keys(RANGES) as RangeKey[]).map((key) => (
        <Link
          key={key}
          href={`${basePath}?range=${key}`}
          aria-current={key === current ? "page" : undefined}
          className={`rounded-md px-2.5 py-1 transition ${
            key === current ? "bg-subtle font-medium text-fg" : "text-muted hover:text-fg"
          }`}
          scroll={false}
        >
          {RANGES[key].label}
        </Link>
      ))}
    </nav>
  );
}
