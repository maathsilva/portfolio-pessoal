-- Analytics schema for the private dashboard.
-- No raw IP addresses are ever stored — only a salted hash (see IP_HASH_SALT).

create table if not exists page_views (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  path text not null,
  referrer text,
  country text,
  device text,
  created_at timestamptz not null default now()
);

create index if not exists page_views_ip_hash_idx on page_views (ip_hash);
create index if not exists page_views_created_at_idx on page_views (created_at);
create index if not exists page_views_path_idx on page_views (path);

create table if not exists cta_clicks (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  cta text not null,
  created_at timestamptz not null default now()
);

create index if not exists cta_clicks_created_at_idx on cta_clicks (created_at);
create index if not exists cta_clicks_cta_idx on cta_clicks (cta);

-- Row Level Security: no client ever talks to Supabase directly (all access
-- goes through our own server-side API routes using the service_role key,
-- which bypasses RLS). We still enable RLS with no policies, so that if the
-- publishable/anon key were ever used against this project by mistake, it
-- has zero access to these tables.
alter table page_views enable row level security;
alter table cta_clicks enable row level security;
