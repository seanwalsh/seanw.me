export type Link = {
  id: string;
  slug: string;
  destination: string;
  title: string | null;
  notes: string | null;
  tags: string[];
  redirect_type: 301 | 302 | 307 | 308;
  password_hash: string | null;
  expires_at: string | null;
  max_clicks: number | null;
  expired_redirect: string | null;
  forward_params: boolean;
  archived: boolean;
  click_count: number;
  last_clicked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Breakdown = { name: string; clicks: number }[];

export type Stats = {
  total: number;
  qr: number;
  bots: number;
  series: { day: string; clicks: number }[];
  referrers: Breakdown;
  countries: Breakdown;
  cities: Breakdown;
  devices: Breakdown;
  browsers: Breakdown;
  os: Breakdown;
  top_links: { id: string; slug: string; title: string | null; clicks: number }[];
};
