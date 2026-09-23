-- Analytics v2. ADDITIVE ONLY: safe to apply while the previous release is live
-- (old tables/functions are untouched; they are removed later in 0005).
-- The whole file runs as one transaction: it either applies completely or not at all.

-- ---------------------------------------------------------------- page_views
alter table page_views
  add column if not exists view_id      uuid,
  add column if not exists session_id   uuid,
  add column if not exists ref          text,
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists region       text,
  add column if not exists city         text,
  add column if not exists timezone     text,
  add column if not exists local_hour   smallint,
  add column if not exists language     text,
  add column if not exists browser      text,
  add column if not exists os           text,
  add column if not exists viewport_w   integer,
  add column if not exists seconds      integer,
  add column if not exists max_scroll   smallint,
  add column if not exists lcp_ms       integer,
  add column if not exists cls          numeric(6,3),
  add column if not exists inp_ms       integer;

create unique index if not exists page_views_view_id_key on page_views (view_id) where view_id is not null;
create index if not exists page_views_ref_idx on page_views (ref) where ref is not null;
create index if not exists page_views_session_idx on page_views (session_id) where session_id is not null;

-- -------------------------------------------------------------------- events
-- Replaces cta_clicks with a generic event stream (contact clicks, project
-- card clicks, "projects section seen"). legacy_cta_id makes the backfill idempotent.
create table if not exists events (
  id            bigint generated always as identity primary key,
  ip_hash       text not null,
  name          text not null,
  path          text,
  ref           text,
  session_id    uuid,
  legacy_cta_id bigint unique,
  created_at    timestamptz not null default now()
);
create index if not exists events_created_at_idx on events (created_at);
create index if not exists events_name_idx on events (name, created_at);
create index if not exists events_ref_idx on events (ref) where ref is not null;

insert into events (ip_hash, name, created_at, legacy_cta_id)
select ip_hash, cta, created_at, id from cta_clicks
on conflict (legacy_cta_id) do nothing;

-- ------------------------------------------------------- panel login attempts
create table if not exists panel_login_attempts (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);
create index if not exists panel_login_attempts_idx on panel_login_attempts (created_at, ip_hash);

-- ------------------------------------------------------------------ lockdown
-- No client ever talks to these tables directly; only the server (service_role).
alter table events enable row level security;
alter table panel_login_attempts enable row level security;
revoke all on table page_views, cta_clicks, events, panel_login_attempts from anon, authenticated;

-- ------------------------------------------------------------------ helpers
-- Start of the period in the owner's timezone. p_days = 1 means "today".
create or replace function period_start(p_days int)
returns timestamptz
language sql stable set search_path = public
as $$
  select (date_trunc('day', now() at time zone 'America/Sao_Paulo') - make_interval(days => greatest(p_days, 1) - 1))
         at time zone 'America/Sao_Paulo';
$$;

-- ---------------------------------------------------------------- statistics
create or replace function stats_overview(p_days int)
returns table (
  unique_visitors bigint, pageviews bigint, new_visitors bigint, returning_visitors bigint,
  contact_clicks bigint, avg_seconds numeric, deep_scroll_pct numeric, pages_per_session numeric,
  last_view_at timestamptz, unique_all_time bigint
)
language sql stable set search_path = public
as $$
  with first_seen as (select ip_hash, min(created_at) as first_at from page_views group by ip_hash),
  v as (select * from page_views where created_at >= period_start(p_days)),
  u as (select distinct ip_hash from v)
  select
    (select count(*) from u),
    (select count(*) from v),
    (select count(*) from u join first_seen f using (ip_hash) where f.first_at >= period_start(p_days)),
    (select count(*) from u join first_seen f using (ip_hash) where f.first_at <  period_start(p_days)),
    (select count(*) from events where created_at >= period_start(p_days) and name in ('curriculo', 'whatsapp', 'email')),
    (select round(avg(seconds)) from v where seconds is not null),
    (select round(100.0 * count(*) filter (where max_scroll >= 75) / nullif(count(*) filter (where max_scroll is not null), 0)) from v),
    (select round(count(*)::numeric / nullif(count(distinct session_id), 0), 1) from v where session_id is not null),
    (select max(created_at) from page_views),
    (select count(*) from first_seen);
$$;

create or replace function stats_series(p_days int)
returns table (bucket text, pageviews bigint, unique_visitors bigint)
language sql stable set search_path = public
as $$
  with grid as (
    select g as b from generate_series(
      date_trunc(case when p_days = 1 then 'hour' else 'day' end, period_start(p_days) at time zone 'America/Sao_Paulo'),
      date_trunc(case when p_days = 1 then 'hour' else 'day' end, now() at time zone 'America/Sao_Paulo'),
      case when p_days = 1 then interval '1 hour' else interval '1 day' end
    ) g
  ),
  counts as (
    select date_trunc(case when p_days = 1 then 'hour' else 'day' end, created_at at time zone 'America/Sao_Paulo') as b,
           count(*) as pv, count(distinct ip_hash) as uv
    from page_views
    where created_at >= period_start(p_days)
    group by 1
  )
  select to_char(grid.b, case when p_days = 1 then 'HH24"h"' else 'DD/MM' end),
         coalesce(counts.pv, 0), coalesce(counts.uv, 0)
  from grid left join counts on counts.b = grid.b
  order by grid.b;
$$;

-- One function for every "top N" ranking; p_dim picks the dimension.
create or replace function stats_top(p_days int, p_dim text, p_limit int default 8)
returns table (label text, hits bigint, visitors bigint)
language sql stable set search_path = public
as $$
  select label, hits, visitors from (
    select coalesce(x.label, 'Desconhecido') as label, count(*) as hits, count(distinct x.ip_hash) as visitors
    from (
      select ip_hash,
        case p_dim
          when 'path'       then path
          when 'referrer'   then coalesce(nullif(regexp_replace(substring(referrer from '^https?://([^/?#]+)'), '^www\.', ''), ''), '(direto)')
          when 'country'    then country
          when 'city'       then nullif(concat_ws(', ', city, region), '')
          when 'device'     then device
          when 'browser'    then browser
          when 'os'         then os
          when 'language'   then language
          when 'local_hour' then lpad(local_hour::text, 2, '0') || 'h'
        end as label
      from page_views
      where created_at >= period_start(p_days)
    ) x
    where not (p_dim = 'referrer' and x.label like '%matheussilvabaptista.%')
    group by 1
  ) t
  order by case when p_dim = 'local_hour' then label end asc nulls last, hits desc
  limit p_limit;
$$;

create or replace function stats_events(p_days int, p_names text[])
returns table (label text, hits bigint, visitors bigint)
language sql stable set search_path = public
as $$
  select name, count(*), count(distinct ip_hash)
  from events
  where created_at >= period_start(p_days) and name = any(p_names)
  group by name
  order by 2 desc;
$$;

create or replace function stats_campaigns(p_days int)
returns table (ref text, visitors bigint, pageviews bigint, contact_clicks bigint, avg_seconds numeric, last_seen timestamptz)
language sql stable set search_path = public
as $$
  with pv as (
    select ref, count(*) as pageviews, count(distinct ip_hash) as visitors, round(avg(seconds)) as avg_seconds, max(created_at) as last_seen
    from page_views
    where ref is not null and created_at >= period_start(p_days)
    group by ref
  ), ev as (
    select ref, count(*) filter (where name in ('curriculo', 'whatsapp', 'email')) as contact_clicks
    from events
    where ref is not null and created_at >= period_start(p_days)
    group by ref
  )
  select pv.ref, pv.visitors, pv.pageviews, coalesce(ev.contact_clicks, 0), pv.avg_seconds, pv.last_seen
  from pv left join ev using (ref)
  order by pv.last_seen desc;
$$;

create or replace function stats_projects(p_days int)
returns table (slug text, clicks bigint, click_visitors bigint, page_views bigint, avg_seconds numeric)
language sql stable set search_path = public
as $$
  with c as (
    select substring(name from 9) as slug, count(*) as clicks, count(distinct ip_hash) as click_visitors
    from events
    where name like 'projeto:%' and created_at >= period_start(p_days)
    group by 1
  ), p as (
    select substring(path from '^/projetos/([a-z0-9-]+)') as slug, count(*) as page_views, round(avg(seconds)) as avg_seconds
    from page_views
    where path like '/projetos/%' and created_at >= period_start(p_days)
    group by 1
  )
  select coalesce(c.slug, p.slug), coalesce(c.clicks, 0), coalesce(c.click_visitors, 0), coalesce(p.page_views, 0), p.avg_seconds
  from c full join p on p.slug = c.slug
  where coalesce(c.slug, p.slug) is not null
  order by 2 desc, 4 desc;
$$;

create or replace function stats_section_visitors(p_days int)
returns bigint
language sql stable set search_path = public
as $$
  select count(distinct ip_hash) from events where name = 'secao:projetos' and created_at >= period_start(p_days);
$$;

create or replace function stats_engagement(p_days int, p_limit int default 8)
returns table (path text, views bigint, avg_seconds numeric, avg_scroll numeric, deep_pct numeric)
language sql stable set search_path = public
as $$
  select path, count(*), round(avg(seconds)), round(avg(max_scroll)),
         round(100.0 * count(*) filter (where max_scroll >= 75) / nullif(count(*) filter (where max_scroll is not null), 0))
  from page_views
  where created_at >= period_start(p_days)
  group by path
  order by 2 desc
  limit p_limit;
$$;

create or replace function stats_vitals(p_days int)
returns table (samples bigint, lcp_p75 double precision, cls_p75 double precision, inp_p75 double precision)
language sql stable set search_path = public
as $$
  select count(*) filter (where lcp_ms is not null),
         percentile_cont(0.75) within group (order by lcp_ms::float8),
         percentile_cont(0.75) within group (order by cls::float8),
         percentile_cont(0.75) within group (order by inp_ms::float8)
  from page_views
  where created_at >= period_start(p_days);
$$;

create or replace function stats_recent(p_limit int default 30)
returns table (created_at timestamptz, path text, ref text, referrer text, country text, region text, city text, device text, browser text, os text)
language sql stable set search_path = public
as $$
  select created_at, path, ref, referrer, country, region, city, device, browser, os
  from page_views
  order by created_at desc
  limit p_limit;
$$;

create or replace function stats_weekly_digest()
returns jsonb
language sql stable set search_path = public
as $$
  select jsonb_build_object(
    'visitors',       (select count(distinct ip_hash) from page_views where created_at >= now() - interval '7 days'),
    'visitors_prev',  (select count(distinct ip_hash) from page_views where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days'),
    'pageviews',      (select count(*) from page_views where created_at >= now() - interval '7 days'),
    'contact_clicks', (select count(*) from events where created_at >= now() - interval '7 days' and name in ('curriculo', 'whatsapp', 'email')),
    'top_ref',        (select ref from page_views where ref is not null and created_at >= now() - interval '7 days' group by ref order by count(distinct ip_hash) desc limit 1),
    'top_project',    (select substring(name from 9) from events where name like 'projeto:%' and created_at >= now() - interval '7 days' group by 1 order by count(*) desc limit 1),
    'top_source',     (select regexp_replace(substring(referrer from '^https?://([^/?#]+)'), '^www\.', '')
                       from page_views
                       where referrer is not null and referrer not like '%matheussilvabaptista.%' and created_at >= now() - interval '7 days'
                       group by 1 order by count(*) desc limit 1)
  );
$$;

-- ------------------------------------------------------- write-side helpers
-- Engagement beacon: values are untrusted, so they are clamped and only ever grow.
create or replace function record_pulse(p_view_id uuid, p_seconds int, p_scroll int, p_lcp int, p_cls numeric, p_inp int)
returns void
language sql set search_path = public
as $$
  update page_views set
    seconds    = greatest(coalesce(seconds, 0), least(greatest(coalesce(p_seconds, 0), 0), 3600)),
    max_scroll = greatest(coalesce(max_scroll, 0), least(greatest(coalesce(p_scroll, 0), 0), 100)),
    lcp_ms     = coalesce(least(greatest(p_lcp, 0), 120000), lcp_ms),
    cls        = coalesce(least(greatest(p_cls, 0), 99.999), cls),
    inp_ms     = coalesce(least(greatest(p_inp, 0), 60000), inp_ms)
  where view_id = p_view_id;
$$;

create or replace function purge_old_data(p_months int default 12)
returns jsonb
language plpgsql set search_path = public
as $$
declare pv bigint; ev bigint; la bigint;
begin
  delete from page_views where created_at < now() - make_interval(months => p_months);
  get diagnostics pv = row_count;
  delete from events where created_at < now() - make_interval(months => p_months);
  get diagnostics ev = row_count;
  delete from panel_login_attempts where created_at < now() - interval '30 days';
  get diagnostics la = row_count;
  return jsonb_build_object('page_views', pv, 'events', ev, 'login_attempts', la);
end;
$$;

-- Only the server (service_role) may execute any analytics function.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname like 'stats\_%' or p.proname like 'analytics\_%'
           or p.proname in ('record_pulse', 'purge_old_data', 'period_start'))
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;
