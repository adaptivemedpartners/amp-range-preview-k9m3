-- 2220: in-house website visitor log (free version: public IP ownership records via RDAP, no paid lookup).
create table if not exists public.ip_orgs (
  ip text primary key,
  org text,            -- registrant / organization on the public ownership record
  netname text,        -- network name on the record
  cidr text,
  kind text not null default 'unknown' check (kind in ('health','isp','cloud','company','unknown')),
  looked_up_at timestamptz not null default now()
);
create table if not exists public.site_visits (
  id bigserial primary key,
  at timestamptz not null default now(),
  ip text not null,
  path text not null,
  title text,
  referrer text,
  user_agent text,
  site text,
  org text,
  kind text not null default 'unknown',
  alerted boolean not null default false
);
create index if not exists site_visits_at on public.site_visits (at desc);
create index if not exists site_visits_kind on public.site_visits (kind, at desc);
-- Locked down: only the server function (service role) reads or writes.
alter table public.ip_orgs enable row level security;
alter table public.site_visits enable row level security;
