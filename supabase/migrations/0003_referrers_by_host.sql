-- Group referrers by hostname (without "www.") instead of by full URL, and
-- ignore navigation inside the portfolio itself.
create or replace function analytics_top_referrers(result_limit int default 10)
returns table (referrer text, count bigint)
language sql stable
as $$
  with hosts as (
    select coalesce(
             nullif(regexp_replace(substring(referrer from '^https?://([^/?#]+)'), '^www\.', ''), ''),
             '(direto)'
           ) as host
    from page_views
  )
  select host as referrer, count(*) as count
  from hosts
  where host not like '%matheussilvabaptista.%'
  group by host
  order by count desc
  limit result_limit;
$$;
