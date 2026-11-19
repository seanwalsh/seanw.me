import { userAgent, type NextRequest } from "next/server";
import { SITE_HOST } from "@/lib/env";

export type ClickInfo = {
  source: "link" | "qr";
  referrer: string | null;
  referrer_host: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device: string;
  browser: string | null;
  os: string | null;
  is_bot: boolean;
};

// Link unfurlers and crawlers that next/server's isBot can miss.
const EXTRA_BOTS =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora link|whatsapp|telegram|skype|discord|slack|vkshare|w3c_validator|curl|wget|python-requests|httpclient|headless/i;

function header(h: Headers, ...names: string[]): string | null {
  for (const n of names) {
    const v = h.get(n);
    if (v) {
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    }
  }
  return null;
}

function referrerHost(ref: string | null): string | null {
  if (!ref) return null;
  try {
    const host = new URL(ref).host.replace(/^www\./, "");
    return host === SITE_HOST ? null : host;
  } catch {
    return null;
  }
}

/**
 * Geo headers depend on the host. Amplify/CloudFront, Vercel and Cloudflare are all covered;
 * whichever is present wins. Missing headers simply show as "Unknown" in analytics.
 */
export function clickInfo(request: NextRequest | Request, source: "link" | "qr"): ClickInfo {
  const h = request.headers;
  const ua = userAgent(request as NextRequest);
  const rawUa = h.get("user-agent") ?? "";
  const referrer = h.get("referer");

  const deviceType = ua.device.type;
  const device =
    deviceType === "mobile" ? "Mobile" : deviceType === "tablet" ? "Tablet" : deviceType ? deviceType[0].toUpperCase() + deviceType.slice(1) : "Desktop";

  return {
    source,
    referrer: referrer?.slice(0, 1000) ?? null,
    referrer_host: referrerHost(referrer),
    country: header(h, "cloudfront-viewer-country", "x-vercel-ip-country", "cf-ipcountry"),
    region: header(h, "cloudfront-viewer-country-region-name", "cloudfront-viewer-country-region", "x-vercel-ip-country-region"),
    city: header(h, "cloudfront-viewer-city", "x-vercel-ip-city", "cf-ipcity"),
    device,
    browser: ua.browser.name ?? null,
    os: ua.os.name ?? null,
    is_bot: ua.isBot || !rawUa || EXTRA_BOTS.test(rawUa),
  };
}
