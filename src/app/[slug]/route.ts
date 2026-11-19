import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { clickInfo } from "@/lib/click";
import { SLUG_PATTERN } from "@/lib/slug";

export const dynamic = "force-dynamic";

type Resolved = {
  id: string | null;
  destination: string | null;
  redirect_type: number | null;
  forward_params: boolean | null;
  expired_redirect: string | null;
  status: "ok" | "password" | "expired" | "missing";
};

const NO_STORE = { "cache-control": "private, no-store, max-age=0" };

function local(request: NextRequest, path: string, status = 302) {
  return NextResponse.redirect(new URL(path, request.url), { status, headers: NO_STORE });
}

/** Bitly-style query passthrough: seanw.me/x?ref=a → destination?ref=a (except our own `qr` marker). */
function withForwardedParams(destination: string, incoming: URLSearchParams) {
  const extra = [...incoming.entries()].filter(([k]) => k !== "qr");
  if (extra.length === 0) return destination;
  const url = new URL(destination);
  for (const [k, v] of extra) if (!url.searchParams.has(k)) url.searchParams.append(k, v);
  return url.toString();
}

async function handle(request: NextRequest, slugParam: string, log: boolean) {
  let slug = slugParam;
  try {
    slug = decodeURIComponent(slugParam);
  } catch {}

  // seanw.me/abc+ → public link info page, like Bitly.
  if (slug.endsWith("+")) return local(request, `/info/${encodeURIComponent(slug.slice(0, -1))}`);

  if (!SLUG_PATTERN.test(slug)) return local(request, "/gone?reason=missing");

  const params = request.nextUrl.searchParams;
  const source = params.has("qr") ? "qr" : "link";

  const { data, error } = await adminClient()
    .rpc("resolve_link", { p_slug: slug, p_click: clickInfo(request, source), p_log: log })
    .single<Resolved>();

  if (error || !data) {
    if (error) console.error("resolve_link failed", error.message);
    return local(request, "/gone?reason=missing");
  }

  switch (data.status) {
    case "ok": {
      const target = data.forward_params ? withForwardedParams(data.destination!, params) : data.destination!;
      const status = data.redirect_type ?? 302;
      const headers = status === 301 || status === 308 ? {} : NO_STORE;
      return NextResponse.redirect(target, { status, headers });
    }
    case "password": {
      const qs = new URLSearchParams();
      if (source === "qr") qs.set("qr", "1");
      const forwarded = [...params.entries()].filter(([k]) => k !== "qr");
      if (data.forward_params && forwarded.length) qs.set("fwd", new URLSearchParams(forwarded).toString());
      const q = qs.toString();
      return local(request, `/unlock/${encodeURIComponent(slug)}${q ? `?${q}` : ""}`);
    }
    case "expired":
      return data.expired_redirect
        ? NextResponse.redirect(data.expired_redirect, { status: 302, headers: NO_STORE })
        : local(request, "/gone?reason=expired");
    default:
      return local(request, "/gone?reason=missing");
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return handle(request, (await params).slug, true);
}

// HEAD requests (link checkers) follow the same path but are never counted.
export async function HEAD(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return handle(request, (await params).slug, false);
}
