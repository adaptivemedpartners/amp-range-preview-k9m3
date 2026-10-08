-- 2302 (Oct 8 2026, Mike approved 3:40 PM CT "Let's get this thing wired"): AMP Social click + sign-up attribution.
-- Additive only. Every new column is nullable (or has a default), so existing rows and the current site keep working.
alter table public.site_visits
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content  text,
  add column if not exists utm_term     text,
  add column if not exists landing_url  text,
  add column if not exists is_entry     boolean not null default false;  -- true = first page of a tagged arrival (the click)
create index if not exists site_visits_utm on public.site_visits (utm_campaign, utm_term, utm_source, at desc) where utm_source is not null;

alter table public.mi_customers
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content  text,
  add column if not exists utm_term     text,
  add column if not exists landing_url  text,
  add column if not exists landed_at    timestamptz;
create index if not exists mi_customers_utm on public.mi_customers (utm_campaign, utm_term, utm_source) where utm_source is not null;

-- Safety net: if a sign-up row arrives without tags (older cached page), copy them from the tags the sign-up form
-- stored on the auth account (user metadata). Never overwrites tags the page already sent.
create or replace function public.mi_customers_fill_utm() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare m jsonb;
begin
  if new.utm_source is not null then return new; end if;
  select raw_user_meta_data into m from auth.users where id = new.user_id;
  if m is null or coalesce(m->>'utm_source', '') = '' then return new; end if;
  new.utm_source   := left(m->>'utm_source', 100);
  new.utm_medium   := left(nullif(m->>'utm_medium', ''), 100);
  new.utm_campaign := left(nullif(m->>'utm_campaign', ''), 100);
  new.utm_content  := left(nullif(m->>'utm_content', ''), 150);
  new.utm_term     := left(nullif(m->>'utm_term', ''), 100);
  new.landing_url  := left(nullif(m->>'landing_url', ''), 600);
  begin new.landed_at := nullif(m->>'landed_at', '')::timestamptz; exception when others then new.landed_at := null; end;
  return new;
exception when others then
  return new;  -- never block a sign-up because of tagging
end $$;
revoke all on function public.mi_customers_fill_utm() from public, anon, authenticated;
drop trigger if exists mi_customers_fill_utm on public.mi_customers;
create trigger mi_customers_fill_utm before insert on public.mi_customers
  for each row execute function public.mi_customers_fill_utm();
