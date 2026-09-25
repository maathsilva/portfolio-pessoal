-- "Probable bot" scoring. Nothing is deleted or altered: every visit is still stored, and a view
-- computes a score + human-readable reasons on the fly (always fresh, no backfill needed).
-- All statistics gain `p_hide_bots boolean default true`, so calls that omit it (the previous
-- release of the panel) keep working and simply get the bot-filtered numbers.
--
-- Score (>= 3 means "probable bot"):
--   3  measured active time under 3 seconds (nobody evaluating a portfolio leaves that fast)
--   2  timezone is UTC / Etc/Unknown (servers and sandboxes, rare for people)
--   2  city is a well-known cloud data-center town
--   1  no engagement data even 10 minutes after the visit (a real browser reports it on exit)
--   1  language tag without a region ("en" instead of "en-US")

create or replace view visits with (security_invoker = true) as
select pv.*, s.score, s.reasons, (s.score >= 3) as probable_bot
from page_views pv
cross join lateral (
  select
    coalesce(pv.seconds is not null and pv.seconds < 3, false) as f_short,
    coalesce(pv.timezone in ('UTC', 'Etc/UTC', 'Etc/GMT', 'GMT', 'Etc/Unknown'), false) as f_tz,
    coalesce(pv.city in ('Council Bluffs', 'Ashburn', 'Boardman', 'The Dalles', 'Tukwila', 'Hillsboro', 'Quincy', 'Moses Lake', 'Changhua'), false) as f_dc,
    coalesce(pv.seconds is null and pv.view_id is not null and pv.created_at < now() - interval '10 minutes', false) as f_nopulse,
    coalesce(pv.language is not null and pv.language !~ '-', false) as f_lang
) f
cross join lateral (
  select
    (case when f.f_short then 3 else 0 end) + (case when f.f_tz then 2 else 0 end) + (case when f.f_dc then 2 else 0 end)
      + (case when f.f_nopulse then 1 else 0 end) + (case when f.f_lang then 1 else 0 end) as score,
    nullif(concat_ws(', ',
      case when f.f_short then 'visita de menos de 3s' end,
      case when f.f_tz then 'fuso UTC/desconhecido' end,
      case when f.f_dc then 'data center' end,
      case when f.f_nopulse then 'sem medição de engajamento' end,
      case when f.f_lang then 'idioma sem região' end), '') as reasons
) s;

revoke all on table visits from anon, authenticated;

-- Events belong to a bot when any page view of the same session was flagged.
create or replace function is_bot_session(p_session uuid)
returns boolean
language sql stable set search_path = public
as $$
  select p_session is not null and exists (select 1 from visits where session_id = p_session and probable_bot);
$$;

-- ------------------------------------------------------------------ statistics
drop function if exists stats_overview(int);
create function stats_overview(p_days int, p_hide_bots boolean default true)
returns table (
  unique_visitors bigint, pageviews bigint, new_visitors bigint, returning_visitors bigint,
  contact_clicks bigint, avg_seconds numeric, deep_scroll_pct numeric, pages_per_session numeric,
  last_view_at timestamptz, unique_all_time bigint
)
language sql stable set search_path = public
as $$
  with vv as (select * from visits where not (p_hide_bots and probable_bot)),
  first_seen as (select ip_hash, min(created_at) as first_at from vv group by ip_hash),
  v as (select * from vv where created_at >= period_start(p_days)),
  u as (select distinct ip_hash from v)
  select
    (select count(*) from u),
    (select count(*) from v),
    (select count(*) from u join first_seen f using (ip_hash) where f.first_at >= period_start(p_days)),
    (select count(*) from u join first_seen f using (ip_hash) where f.first_at <  period_start(p_days)),
    (select count(*) from events e
       where e.created_at >= period_start(p_days) and e.name in ('curriculo', 'whatsapp', 'email')
         and not (p_hide_bots and is_bot_session(e.session_id))),
    (select round(avg(seconds)) from v where seconds is not null),
    (select round(100.0 * count(*) filter (where max_scroll >= 75) / nullif(count(*) filter (where max_scroll is not null), 0)) from v),
    (select round(count(*)::numeric / nullif(count(distinct session_id), 0), 1) from v where session_id is not null),
    (select max(created_at) from page_views),
    (select count(*) from first_seen);
$$;

drop function if exists stats_series(int);
create function stats_series(p_days int, p_hide_bots boolean default true)
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
    from visits
    where created_at >= period_start(p_days) and not (p_hide_bots and probable_bot)
    group by 1
  )
  select to_char(grid.b, case when p_days = 1 then 'HH24"h"' else 'DD/MM' end),
         coalesce(counts.pv, 0), coalesce(counts.uv, 0)
  from grid left join counts on counts.b = grid.b
  order by grid.b;
$$;

drop function if exists stats_top(int, text, int);
create function stats_top(p_days int, p_dim text, p_limit int default 8, p_hide_bots boolean default true)
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
      from visits
      where created_at >= period_start(p_days) and not (p_hide_bots and probable_bot)
    ) x
    where not (p_dim = 'referrer' and x.label like '%matheussilvabaptista.%')
    group by 1
  ) t
  order by case when p_dim = 'local_hour' then label end asc nulls last, hits desc
  limit p_limit;
$$;

drop function if exists stats_events(int, text[]);
create function stats_events(p_days int, p_names text[], p_hide_bots boolean default true)
returns table (label text, hits bigint, visitors bigint)
language sql stable set search_path = public
as $$
  select e.name, count(*), count(distinct e.ip_hash)
  from events e
  where e.created_at >= period_start(p_days) and e.name = any(p_names)
    and not (p_hide_bots and is_bot_session(e.session_id))
  group by e.name
  order by 2 desc;
$$;

drop function if exists stats_projects(int);
create function stats_projects(p_days int, p_hide_bots boolean default true)
returns table (slug text, clicks bigint, click_visitors bigint, page_views bigint, avg_seconds numeric)
language sql stable set search_path = public
as $$
  with c as (
    select substring(e.name from 9) as slug, count(*) as clicks, count(distinct e.ip_hash) as click_visitors
    from events e
    where e.name like 'projeto:%' and e.created_at >= period_start(p_days)
      and not (p_hide_bots and is_bot_session(e.session_id))
    group by 1
  ), p as (
    select substring(path from '^/projetos/([a-z0-9-]+)') as slug, count(*) as page_views, round(avg(seconds)) as avg_seconds
    from visits
    where path like '/projetos/%' and created_at >= period_start(p_days) and not (p_hide_bots and probable_bot)
    group by 1
  )
  select coalesce(c.slug, p.slug), coalesce(c.clicks, 0), coalesce(c.click_visitors, 0), coalesce(p.page_views, 0), p.avg_seconds
  from c full join p on p.slug = c.slug
  where coalesce(c.slug, p.slug) is not null
  order by 2 desc, 4 desc;
$$;

drop function if exists stats_section_visitors(int);
create function stats_section_visitors(p_days int, p_hide_bots boolean default true)
returns bigint
language sql stable set search_path = public
as $$
  select count(distinct e.ip_hash)
  from events e
  where e.name = 'secao:projetos' and e.created_at >= period_start(p_days)
    and not (p_hide_bots and is_bot_session(e.session_id));
$$;

drop function if exists stats_engagement(int, int);
create function stats_engagement(p_days int, p_limit int default 8, p_hide_bots boolean default true)
returns table (path text, views bigint, avg_seconds numeric, avg_scroll numeric, deep_pct numeric)
language sql stable set search_path = public
as $$
  select path, count(*), round(avg(seconds)), round(avg(max_scroll)),
         round(100.0 * count(*) filter (where max_scroll >= 75) / nullif(count(*) filter (where max_scroll is not null), 0))
  from visits
  where created_at >= period_start(p_days) and not (p_hide_bots and probable_bot)
  group by path
  order by 2 desc
  limit p_limit;
$$;

drop function if exists stats_vitals(int);
create function stats_vitals(p_days int, p_hide_bots boolean default true)
returns table (samples bigint, lcp_p75 double precision, cls_p75 double precision, inp_p75 double precision)
language sql stable set search_path = public
as $$
  select count(*) filter (where lcp_ms is not null),
         percentile_cont(0.75) within group (order by lcp_ms::float8),
         percentile_cont(0.75) within group (order by cls::float8),
         percentile_cont(0.75) within group (order by inp_ms::float8)
  from visits
  where created_at >= period_start(p_days) and not (p_hide_bots and probable_bot);
$$;

drop function if exists stats_recent(int);
create function stats_recent(p_limit int default 30, p_hide_bots boolean default true)
returns table (
  created_at timestamptz, path text, referrer text, country text, region text, city text,
  device text, browser text, os text, probable_bot boolean, bot_reasons text
)
language sql stable set search_path = public
as $$
  select created_at, path, referrer, country, region, city, device, browser, os, probable_bot, reasons
  from visits
  where not (p_hide_bots and probable_bot)
  order by created_at desc
  limit p_limit;
$$;

create function stats_bot_count(p_days int)
returns bigint
language sql stable set search_path = public
as $$
  select count(*) from visits where probable_bot and created_at >= period_start(p_days);
$$;

-- The weekly summary always excludes probable bots.
create or replace function stats_weekly_digest()
returns jsonb
language sql stable set search_path = public
as $$
  select jsonb_build_object(
    'visitors',       (select count(distinct ip_hash) from visits where created_at >= now() - interval '7 days' and not probable_bot),
    'visitors_prev',  (select count(distinct ip_hash) from visits where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days' and not probable_bot),
    'pageviews',      (select count(*) from visits where created_at >= now() - interval '7 days' and not probable_bot),
    'contact_clicks', (select count(*) from events e where e.created_at >= now() - interval '7 days' and e.name in ('curriculo', 'whatsapp', 'email') and not is_bot_session(e.session_id)),
    'top_project',    (select substring(e.name from 9) from events e where e.name like 'projeto:%' and e.created_at >= now() - interval '7 days' and not is_bot_session(e.session_id) group by 1 order by count(*) desc limit 1),
    'top_source',     (select regexp_replace(substring(referrer from '^https?://([^/?#]+)'), '^www\.', '')
                       from visits
                       where referrer is not null and referrer not like '%matheussilvabaptista.%' and created_at >= now() - interval '7 days' and not probable_bot
                       group by 1 order by count(*) desc limit 1)
  );
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
           or p.proname in ('record_pulse', 'purge_old_data', 'period_start', 'is_bot_session'))
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;
