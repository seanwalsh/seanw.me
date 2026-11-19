import { SpaceScene } from "@/components/space-scene";

export default function Home() {
  return (
    <SpaceScene>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Nothing to see here.</h1>
      <p className="mt-3 max-w-sm text-balance text-zinc-400">
        Just a quiet crater on the far side of the internet. Move along, traveler.
      </p>
      <p className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-zinc-600">seanw.me</p>
    </SpaceScene>
  );
}
