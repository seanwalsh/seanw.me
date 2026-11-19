import Link from "next/link";
import { SpaceScene } from "@/components/space-scene";

export default function NotFound() {
  return (
    <SpaceScene>
      <p className="font-mono text-sm text-indigo-300">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Lost in space.</h1>
      <p className="mt-3 max-w-sm text-zinc-400">Whatever you were looking for drifted out of orbit.</p>
      <Link href="/" className="mt-8 text-sm text-zinc-300 underline underline-offset-4 hover:text-white">
        Return to base
      </Link>
    </SpaceScene>
  );
}
