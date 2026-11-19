/** Shared starfield + moon used by the homepage, 404 and expired pages. Pure CSS, no JS. */
export function SpaceScene({ children }: { children: React.ReactNode }) {
  return (
    <main className="space relative flex min-h-screen items-center justify-center overflow-hidden px-4 text-zinc-100">
      <div className="stars" aria-hidden />
      <div className="relative flex flex-col items-center text-center">
        <div className="drift relative mb-10 h-40 w-40" aria-hidden>
          <div className="moon absolute inset-0 rounded-full">
            <span className="crater" style={{ top: "22%", left: "28%", width: 26, height: 26 }} />
            <span className="crater" style={{ top: "55%", left: "52%", width: 34, height: 34 }} />
            <span className="crater" style={{ top: "62%", left: "22%", width: 14, height: 14 }} />
            <span className="crater" style={{ top: "30%", left: "64%", width: 12, height: 12 }} />
          </div>
          <div className="absolute left-1/2 top-1/2 -ml-2 -mt-2">
            <div className="orbit text-base" style={{ ["--r" as string]: "112px" }}>
              🛰️
            </div>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
