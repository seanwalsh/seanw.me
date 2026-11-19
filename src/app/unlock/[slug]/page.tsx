import type { Metadata } from "next";
import { shortDisplay } from "@/lib/format";
import { UnlockForm } from "./unlock-form";

export const metadata: Metadata = { title: "Password required · seanw.me" };

export default async function Unlock({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ qr?: string; fwd?: string }>;
}) {
  const slug = decodeURIComponent((await params).slug);
  const { qr, fwd } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-6">
        <p className="text-2xl" aria-hidden>
          🔒
        </p>
        <h1 className="mt-3 text-lg font-semibold">This link is password protected</h1>
        <p className="mt-1 font-mono text-sm text-muted">{shortDisplay(slug)}</p>
        <UnlockForm slug={slug} qr={!!qr} fwd={fwd ?? ""} />
      </div>
    </main>
  );
}
