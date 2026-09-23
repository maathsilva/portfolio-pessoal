-- The ?ref / utm_* campaign tracking was removed from the site. Apply AFTER deploying the code
-- that no longer writes or reads these columns. The columns held no data.

-- The two functions that referenced them are rewritten first.
drop function if exists stats_recent(int);
create function stats_recent(p_limit int default 30)
returns table (created_at timestamptz, path text, referrer text, country text, region text, city text, device text, browser text, os text)
language sql stable set search_path = public
as $$
  select created_at, path, referrer, country, region, city, device, browser, os
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
    'top_project',    (select substring(name from 9) from events where name like 'projeto:%' and created_at >= now() - interval '7 days' group by 1 order by count(*) desc limit 1),
    'top_source',     (select regexp_replace(substring(referrer from '^https?://([^/?#]+)'), '^www\.', '')
                       from page_views
                       where referrer is not null and referrer not like '%matheussilvabaptista.%' and created_at >= now() - interval '7 days'
                       group by 1 order by count(*) desc limit 1)
  );
$$;

-- Dropping the columns also drops their partial indexes.
alter table page_views
  drop column if exists ref,
  drop column if exists utm_source,
  drop column if exists utm_medium,
  drop column if exists utm_campaign;
alter table events drop column if exists ref;

-- The recreated function must stay callable only by the server.
revoke all on function stats_recent(int) from public, anon, authenticated;
grant execute on function stats_recent(int) to service_role;
revoke all on function stats_weekly_digest() from public, anon, authenticated;
grant execute on function stats_weekly_digest() to service_role;
