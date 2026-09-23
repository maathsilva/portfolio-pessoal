-- Job applications tracker. ADDITIVE ONLY (safe while the previous release is live).
-- Each application owns a unique `ref`: the tag used in the portfolio link sent for that job.

create table if not exists applications (
  id         bigint generated always as identity primary key,
  company    text not null,
  title      text not null,
  platform   text not null,
  job_url    text not null,
  ref        text not null unique,
  status     text not null default 'enviada',
  applied_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint applications_status_check check (status in ('enviada', 'entrevista', 'oferta', 'recusada')),
  constraint applications_ref_check check (ref ~ '^[a-z0-9][a-z0-9_-]{0,39}$')
);
create index if not exists applications_applied_at_idx on applications (applied_at desc);

alter table applications enable row level security;
revoke all on table applications from anon, authenticated;

-- Applications joined with what the portfolio recorded for each ref.
create or replace function stats_applications()
returns table (
  id bigint, company text, title text, platform text, job_url text, ref text, status text, applied_at timestamptz,
  visitors bigint, pageviews bigint, contact_clicks bigint, first_visit_at timestamptz, last_visit_at timestamptz, avg_seconds numeric
)
language sql stable set search_path = public
as $$
  select a.id, a.company, a.title, a.platform, a.job_url, a.ref, a.status, a.applied_at,
         coalesce(v.visitors, 0), coalesce(v.pageviews, 0), coalesce(e.contact_clicks, 0),
         v.first_visit_at, v.last_visit_at, v.avg_seconds
  from applications a
  left join (
    select ref, count(distinct ip_hash) as visitors, count(*) as pageviews,
           min(created_at) as first_visit_at, max(created_at) as last_visit_at, round(avg(seconds)) as avg_seconds
    from page_views where ref is not null group by ref
  ) v on v.ref = a.ref
  left join (
    select ref, count(*) filter (where name in ('curriculo', 'whatsapp', 'email')) as contact_clicks
    from events where ref is not null group by ref
  ) e on e.ref = a.ref
  order by a.applied_at desc;
$$;

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'stats_applications'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;
