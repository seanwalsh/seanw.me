import { APP_TIMEZONE, SITE_URL } from "@/lib/env";

export const shortUrl = (slug: string) => `${SITE_URL}/${slug}`;
export const shortDisplay = (slug: string) => `${new URL(SITE_URL).host}/${slug}`;

export function formatDate(iso: string | null, withTime = false) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(iso));
}

export const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);
