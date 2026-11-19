/** Accepts "example.com/x" or a full URL; returns a normalised http(s) URL or null. */
export function normalizeDestination(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.toString();
  } catch {
    return null;
  }
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

/** Best-effort page title lookup, like Bitly does when you paste a link. */
export async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; seanw.me link preview)", accept: "text/html" },
    });
    if (!res.ok || !res.headers.get("content-type")?.includes("text/html")) return null;
    const html = (await res.text()).slice(0, 200_000);
    const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
    const title = og ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const clean = title ? decodeEntities(title).replace(/\s+/g, " ").trim() : "";
    return clean ? clean.slice(0, 200) : null;
  } catch {
    return null;
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
