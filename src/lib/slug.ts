const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/l/I

export const SLUG_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Paths the app owns. A short link may never use one of these. */
export const RESERVED_SLUGS = new Set(
  [
    "tycho", "info", "unlock", "gone", "api", "_next", "static", "public",
    "favicon.ico", "robots.txt", "sitemap.xml", "icon", "apple-icon", "manifest",
    "admin", "login", "logout", "sign-in", "signin", "auth",
  ].map((s) => s.toLowerCase()),
);

export function randomSlug(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function validateSlug(slug: string): string | null {
  if (!SLUG_PATTERN.test(slug)) return "Use 1–64 letters, numbers, dashes or underscores.";
  if (RESERVED_SLUGS.has(slug.toLowerCase())) return `"${slug}" is reserved.`;
  return null;
}
