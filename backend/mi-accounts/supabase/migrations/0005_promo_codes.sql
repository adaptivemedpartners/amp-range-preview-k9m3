-- 2311: Promo codes for free MI sample polls (no card). Additive only.
create table if not exists public.mi_promo_admins (
  email text primary key,
  name text not null,
  added_at timestamptz not null default now()
);
insert into public.mi_promo_admins (email, name) values
  ('mfreeman@adaptivemedicalpartners.com','Mike Freeman'),
  ('mfreeman@amp-health.com','Mike Freeman'),
  ('rkeeth@amp-health.com','Randy Keeth'),
  ('rkeeth@adaptivemedicalpartners.com','Randy Keeth'),
  ('david@amp-health.com','David Fontenot')
on conflict do nothing;

create table if not exists public.mi_promo_codes (
  id bigserial primary key,
  code text not null unique,
  email text not null,                       -- lower-cased; only this email can redeem
  allowance int not null default 5 check (allowance in (5,7,9)),
  expires_at timestamptz,
  note text,
  created_by text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  redeemed_by uuid unique references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  state text                                 -- locked at redemption (2-letter, lower)
);
create index if not exists mi_promo_codes_email on public.mi_promo_codes (email);

alter table public.mi_polls add column if not exists promo_code_id bigint references public.mi_promo_codes(id);

alter table public.mi_promo_admins enable row level security;
alter table public.mi_promo_codes enable row level security;
-- Redeemer may read their own code row; all writes go through edge functions (service role).
drop policy if exists own_promo_read on public.mi_promo_codes;
create policy own_promo_read on public.mi_promo_codes for select using (auth.uid() = redeemed_by);
