import type { Metadata } from "next";
import Link from "next/link";
import { SpaceScene } from "@/components/space-scene";

export const metadata: Metadata = { title: "Link not found · seanw.me" };

export default async function Gone({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const expired = (await searchParams).reason === "expired";
  return (
    <SpaceScene>
      <p className="font-mono text-sm text-indigo-300">{expired ? "410" : "404"}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {expired ? "This link has expired." : "This link doesn't exist."}
      </h1>
      <p className="mt-3 max-w-sm text-zinc-400">
        {expired
          ? "It had a good run. It's out there somewhere, orbiting quietly."
          : "Either it never existed or it drifted out of orbit."}
      </p>
      <Link href="/" className="mt-8 text-sm text-zinc-300 underline underline-offset-4 hover:text-white">
        Return to base
      </Link>
    </SpaceScene>
  );
}
