import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "../sign-in/actions";
import { NavLinks } from "@/components/admin/nav-links";

export const metadata: Metadata = { title: { default: "Tycho", template: "%s · Tycho" } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link href="/tycho" className="flex items-center gap-2 font-semibold">
            <span aria-hidden>🌑</span> Tycho
          </Link>
          <NavLinks />
          <div className="ml-auto flex items-center gap-3">
            <Link href="/tycho/links/new" className="btn-primary hidden sm:inline-flex">
              Create link
            </Link>
            <form action={signOut}>
              <button type="submit" className="btn-ghost" title={user.email ?? undefined}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
