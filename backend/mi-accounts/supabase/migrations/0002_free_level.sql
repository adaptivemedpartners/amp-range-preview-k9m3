-- 2219: remember the free level and the free-sample market on the account, not just in one browser.
alter table public.mi_customers
  add column if not exists free_level text not null default 'verified' check (free_level in ('demo','verified')),
  add column if not exists sample_specialty text,
  add column if not exists sample_state text;
-- David Fontenot signed up Sep 25 before this existed: he is a Verified sample (no market picked yet).
update public.mi_customers set free_level = 'verified' where work_email = 'david@amp-health.com';
