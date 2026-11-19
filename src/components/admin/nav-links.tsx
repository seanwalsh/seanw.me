"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/tycho", label: "Dashboard", match: (p: string) => p === "/tycho" },
  { href: "/tycho/links", label: "Links", match: (p: string) => p.startsWith("/tycho/links") && !p.startsWith("/tycho/links/import") },
  { href: "/tycho/links/import", label: "Bulk create", match: (p: string) => p.startsWith("/tycho/links/import") },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 text-sm">
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-2.5 py-1.5 ${active ? "bg-subtle font-medium text-fg" : "text-muted hover:text-fg"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
