-- link_stats: 'bots' was always 0 because bot rows were filtered out before being counted.
create or replace function public.link_stats(
  p_link_id uuid default null,
  p_from timestamptz default null,
  p_to timestamptz default now(),
  p_tz text default 'UTC',
  p_include_bots boolean default false
)
returns jsonb
language sql stable security invoker set search_path = public as $$
with scoped as (
  select c.*
    from public.clicks c
    join public.links l on l.id = c.link_id
   where (p_link_id is null or c.link_id = p_link_id)
),
bounds as (
  select coalesce(p_from, (select min(clicked_at) from scoped where not is_bot), now()) as f, p_to as t
),
base as (
  select s.* from scoped s, bounds b
   where s.clicked_at >= b.f and s.clicked_at < b.t
     and (p_include_bots or not s.is_bot)
),
days as (
  select d::date as day
    from bounds b,
         generate_series((b.f at time zone p_tz)::date, (b.t at time zone p_tz)::date, interval '1 day') d
),
series as (
  select days.day, count(base.id) as clicks
    from days
    left join base on (base.clicked_at at time zone p_tz)::date = days.day
   group by days.day
)
select jsonb_build_object(
  'total',   (select count(*) from base),
  'qr',      (select count(*) from base where source = 'qr'),
  'bots',    (select count(*) from scoped s, bounds b where s.is_bot and s.clicked_at >= b.f and s.clicked_at < b.t),
  'series',  coalesce((select jsonb_agg(jsonb_build_object('day', day, 'clicks', clicks) order by day) from series), '[]'::jsonb),
  'referrers', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'clicks', n) order by n desc)
                 from (select coalesce(referrer_host, 'Direct') as name, count(*) as n from base group by 1 order by 2 desc limit 10) t), '[]'::jsonb),
  'countries', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'clicks', n) order by n desc)
                 from (select coalesce(country, 'Unknown') as name, count(*) as n from base group by 1 order by 2 desc limit 10) t), '[]'::jsonb),
  'cities',    coalesce((select jsonb_agg(jsonb_build_object('name', name, 'clicks', n) order by n desc)
                 from (select coalesce(city || coalesce(', ' || country, ''), 'Unknown') as name, count(*) as n from base group by 1 order by 2 desc limit 10) t), '[]'::jsonb),
  'devices',   coalesce((select jsonb_agg(jsonb_build_object('name', name, 'clicks', n) order by n desc)
                 from (select coalesce(device, 'Unknown') as name, count(*) as n from base group by 1 order by 2 desc limit 10) t), '[]'::jsonb),
  'browsers',  coalesce((select jsonb_agg(jsonb_build_object('name', name, 'clicks', n) order by n desc)
                 from (select coalesce(browser, 'Unknown') as name, count(*) as n from base group by 1 order by 2 desc limit 10) t), '[]'::jsonb),
  'os',        coalesce((select jsonb_agg(jsonb_build_object('name', name, 'clicks', n) order by n desc)
                 from (select coalesce(os, 'Unknown') as name, count(*) as n from base group by 1 order by 2 desc limit 10) t), '[]'::jsonb),
  'top_links', case when p_link_id is null then
                 coalesce((select jsonb_agg(jsonb_build_object('id', id, 'slug', slug, 'title', title, 'clicks', n) order by n desc)
                   from (select l.id, l.slug, l.title, count(*) as n
                           from base join public.links l on l.id = base.link_id
                          group by l.id, l.slug, l.title order by 4 desc limit 10) t), '[]'::jsonb)
               else '[]'::jsonb end
);
$$;
