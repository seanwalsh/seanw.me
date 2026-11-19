import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Daily keep-alive: writes a row to Supabase so the free-tier project is never paused for inactivity.
 * Called by .github/workflows/keepalive.yml with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = adminClient();
  const source = request.nextUrl.searchParams.get("source") ?? "cron";
  const { data, error } = await db.from("heartbeat").insert({ source }).select("id, pinged_at").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Keep the table tiny.
  const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString();
  await db.from("heartbeat").delete().lt("pinged_at", cutoff);

  return NextResponse.json({ ok: true, ...data });
}

export const POST = GET;
