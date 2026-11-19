import "server-only";
import { APP_TIMEZONE } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Stats } from "@/lib/types";

export const RANGES = {
  "7d": { label: "7 days", days: 7 },
  "30d": { label: "30 days", days: 30 },
  "90d": { label: "90 days", days: 90 },
  "365d": { label: "1 year", days: 365 },
  all: { label: "All time", days: null },
} as const;

export type RangeKey = keyof typeof RANGES;

export function parseRange(value: string | string[] | undefined): RangeKey {
  return typeof value === "string" && value in RANGES ? (value as RangeKey) : "30d";
}

export async function getStats(range: RangeKey, linkId: string | null = null): Promise<Stats> {
  const days = RANGES[range].days;
  const from = days ? new Date(Date.now() - (days - 1) * 86_400_000) : null;
  if (from) from.setUTCHours(0, 0, 0, 0);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("link_stats", {
    p_link_id: linkId,
    p_from: from?.toISOString() ?? null,
    p_to: new Date().toISOString(),
    p_tz: APP_TIMEZONE,
  });
  if (error) throw new Error(error.message);
  return data as Stats;
}
