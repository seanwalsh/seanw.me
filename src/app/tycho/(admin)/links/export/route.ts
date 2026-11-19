import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { shortUrl } from "@/lib/format";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

/** Every link with its lifetime click count, as CSV. */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("links")
    .select("slug, destination, title, tags, click_count, archived, expires_at, max_clicks, created_at, last_clicked_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code ? 500 : 401 });

  const rows = data.map((l) => ({ short_url: shortUrl(l.slug), ...l, tags: l.tags.join("|") }));
  return new NextResponse(toCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="seanw.me-links.csv"`,
    },
  });
}
