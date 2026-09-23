-- Aggregation functions backing the private dashboard. Called via the
-- service_role key (RPC), which bypasses RLS, so these stay simple
-- `security invoker` (the default) SQL functions.

create or replace function analytics_overview()
returns table (
  total_pageviews bigint,
  unique_total bigint,
  unique_today bigint,
  unique_7d bigint,
  unique_30d bigint,
  returning_visitors bigint
)
language sql stable
as $$
  select
    (select count(*) from page_views) as total_pageviews,
    (select count(distinct ip_hash) from page_views) as unique_total,
    (select count(distinct ip_hash) from page_views where created_at >= current_date) as unique_today,
    (select count(distinct ip_hash) from page_views where created_at >= now() - interval '7 days') as unique_7d,
    (select count(distinct ip_hash) from page_views where created_at >= now() - interval '30 days') as unique_30d,
    (select count(*) from (select ip_hash from page_views group by ip_hash having count(*) > 1) t) as returning_visitors;
$$;

create or replace function analytics_daily(days int default 30)
returns table (day date, pageviews bigint, unique_visitors bigint)
language sql stable
as $$
  select date_trunc('day', created_at)::date as day,
         count(*) as pageviews,
         count(distinct ip_hash) as unique_visitors
  from page_views
  where created_at >= now() - (days || ' days')::interval
  group by 1
  order by 1;
$$;

create or replace function analytics_top_paths(result_limit int default 10)
returns table (path text, count bigint)
language sql stable
as $$
  select path, count(*) as count
  from page_views
  group by path
  order by count desc
  limit result_limit;
$$;

create or replace function analytics_top_referrers(result_limit int default 10)
returns table (referrer text, count bigint)
language sql stable
as $$
  select coalesce(nullif(referrer, ''), '(direto)') as referrer, count(*) as count
  from page_views
  group by 1
  order by count desc
  limit result_limit;
$$;

create or replace function analytics_cta_counts()
returns table (cta text, count bigint)
language sql stable
as $$
  select cta, count(*) as count
  from cta_clicks
  group by cta
  order by count desc;
$$;

create or replace function analytics_countries(result_limit int default 10)
returns table (country text, count bigint)
language sql stable
as $$
  select coalesce(country, 'Desconhecido') as country, count(*) as count
  from page_views
  group by 1
  order by count desc
  limit result_limit;
$$;

create or replace function analytics_devices()
returns table (device text, count bigint)
language sql stable
as $$
  select coalesce(device, 'desconhecido') as device, count(*) as count
  from page_views
  group by 1
  order by count desc;
$$;

create or replace function analytics_recent(result_limit int default 50)
returns table (path text, referrer text, country text, device text, created_at timestamptz)
language sql stable
as $$
  select path, referrer, country, device, created_at
  from page_views
  order by created_at desc
  limit result_limit;
$$;
