-- seanw.me URL shortener schema
-- Run this in the Supabase SQL editor (or `supabase db push`).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.links (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug            text not null unique check (slug ~ '^[A-Za-z0-9_-]{1,64}$'),
  destination     text not null check (destination ~* '^https?://'),
  title           text,
  notes           text,
  tags            text[] not null default '{}',
  redirect_type   smallint not null default 302 check (redirect_type in (301, 302, 307, 308)),
  password_hash   text,
  expires_at      timestamptz,
  max_clicks      integer check (max_clicks is null or max_clicks > 0),
  expired_redirect text check (expired_redirect is null or expired_redirect ~* '^https?://'),
  forward_params  boolean not null default true,
  archived        boolean not null default false,
  click_count     integer not null default 0,
  last_clicked_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists links_user_created_idx on public.links (user_id, created_at desc);
create index if not exists links_tags_idx on public.links using gin (tags);

create table if not exists public.clicks (
  id            bigint generated always as identity primary key,
  link_id       uuid not null references public.links (id) on delete cascade,
  clicked_at    timestamptz not null default now(),
  source        text not null default 'link' check (source in ('link', 'qr')),
  referrer      text,
  referrer_host text,
  country       text,
  region        text,
  city          text,
  device        text,
  browser       text,
  os            text,
  is_bot        boolean not null default false
);

create index if not exists clicks_link_time_idx on public.clicks (link_id, clicked_at desc);
create index if not exists clicks_time_idx on public.clicks (clicked_at desc);

-- Written daily by the keep-alive job so the free-tier project never pauses.
create table if not exists public.heartbeat (
  id        bigint generated always as identity primary key,
  pinged_at timestamptz not null default now(),
  source    text
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists links_touch_updated_at on public.links;
create trigger links_touch_updated_at
  before update on public.links
  for each row execute function public.touch_updated_at();

create or replace function public.bump_click_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not new.is_bot then
    update public.links
       set click_count = click_count + 1,
           last_clicked_at = new.clicked_at
     where id = new.link_id;
  end if;
  return new;
end $$;

drop trigger if exists clicks_bump_count on public.clicks;
create trigger clicks_bump_count
  after insert on public.clicks
  for each row execute function public.bump_click_count();

-- ---------------------------------------------------------------------------
-- Row level security (single owner: you only ever see your own rows)
-- ---------------------------------------------------------------------------

alter table public.links enable row level security;
alter table public.clicks enable row level security;
alter table public.heartbeat enable row level security; -- service role only

drop policy if exists "owner manages links" on public.links;
create policy "owner manages links" on public.links
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "owner reads clicks" on public.clicks;
create policy "owner reads clicks" on public.clicks
  for select to authenticated
  using (exists (select 1 from public.links l where l.id = link_id and l.user_id = (select auth.uid())));

drop policy if exists "owner deletes clicks" on public.clicks;
create policy "owner deletes clicks" on public.clicks
  for delete to authenticated
  using (exists (select 1 from public.links l where l.id = link_id and l.user_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- resolve_link: one round trip for the redirect hot path.
-- Looks up a slug, decides what should happen, and logs the click when allowed.
-- Called only with the service role key from the server.
-- ---------------------------------------------------------------------------

create or replace function public.resolve_link(p_slug text, p_click jsonb, p_log boolean default true)
returns table (
  id uuid,
  destination text,
  redirect_type smallint,
  forward_params boolean,
  expired_redirect text,
  status text
)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  l public.links%rowtype;
  v_status text;
begin
  select * into l from public.links where links.slug = p_slug;

  if not found or l.archived then
    return query select null::uuid, null::text, null::smallint, null::boolean, null::text, 'missing'::text;
    return;
  end if;

  if (l.expires_at is not null and l.expires_at <= now())
     or (l.max_clicks is not null and l.click_count >= l.max_clicks) then
    v_status := 'expired';
  elsif l.password_hash is not null then
    v_status := 'password';
  else
    v_status := 'ok';
  end if;

  if v_status = 'ok' and p_log then
    insert into public.clicks (link_id, source, referrer, referrer_host, country, region, city, device, browser, os, is_bot)
    values (
      l.id,
      coalesce(p_click->>'source', 'link'),
      p_click->>'referrer',
      p_click->>'referrer_host',
      p_click->>'country',
      p_click->>'region',
      p_click->>'city',
      p_click->>'device',
      p_click->>'browser',
      p_click->>'os',
      coalesce((p_click->>'is_bot')::boolean, false)
    );
  end if;

  return query select l.id, l.destination, l.redirect_type, l.forward_params, l.expired_redirect, v_status;
end $$;

revoke all on function public.resolve_link(text, jsonb, boolean) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- link_stats: analytics for one link (p_link_id) or every link (null).
-- security invoker, so RLS applies and you only see your own data.
-- p_from null = since the first click.
-- ---------------------------------------------------------------------------

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
     and (p_include_bots or not c.is_bot)
),
bounds as (
  select coalesce(p_from, (select min(clicked_at) from scoped), now()) as f, p_to as t
),
base as (
  select s.* from scoped s, bounds b where s.clicked_at >= b.f and s.clicked_at < b.t
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

grant execute on function public.link_stats(uuid, timestamptz, timestamptz, text, boolean) to authenticated;
revoke execute on function public.link_stats(uuid, timestamptz, timestamptz, text, boolean) from anon;
