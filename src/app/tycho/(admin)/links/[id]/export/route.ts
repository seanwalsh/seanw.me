import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

/** Raw click log for one link as CSV. RLS limits it to the signed-in owner. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: link } = await supabase.from("links").select("slug").eq("id", id).maybeSingle();
  if (!link) return NextResponse.json({ error: "not found" }, { status: 404 });

  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("clicks")
      .select("clicked_at, source, referrer, referrer_host, country, region, city, device, browser, os, is_bot")
      .eq("link_id", id)
      .order("clicked_at", { ascending: false })
      .range(from, from + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows.push(...data);
    if (data.length < 1000) break;
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="seanw.me-${link.slug}-clicks.csv"`,
    },
  });
}
