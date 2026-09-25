-- Market Intelligence customer accounts (separate Supabase project; never the SoftMess project).
-- Auth users come from Supabase Auth (email + password, email confirmation on).

create table public.mi_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  organization text not null,
  work_email text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- One row per confirmed Stripe checkout. Written only by the verify-checkout function (service role).
create table public.mi_purchases (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_session_id text not null unique,
  stripe_payment_intent text,
  sku text not null check (sku in ('pack15','pack50','pack100','pack250','extra_poll','oneoff')),
  polls_granted int not null default 0,
  amount_cents int not null,
  tax_cents int not null default 0,
  specialty text,
  state text,
  created_at timestamptz not null default now()
);

-- One row per poll used (1 specialty x 1 state). Written only by the use-poll function.
create table public.mi_polls (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  specialty text not null,
  state text not null,
  created_at timestamptz not null default now(),
  unique (user_id, specialty, state)
);

create view public.mi_balance with (security_invoker = true) as
select c.user_id,
  coalesce((select sum(polls_granted) from public.mi_purchases p where p.user_id = c.user_id), 0)
  - coalesce((select count(*) from public.mi_polls u where u.user_id = c.user_id), 0) as polls_left
from public.mi_customers c;

alter table public.mi_customers enable row level security;
alter table public.mi_purchases enable row level security;
alter table public.mi_polls enable row level security;

-- Customers can read and edit only their own profile; read only their own purchases and polls.
create policy own_profile_read on public.mi_customers for select using (auth.uid() = user_id);
create policy own_profile_insert on public.mi_customers for insert with check (auth.uid() = user_id);
create policy own_profile_update on public.mi_customers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_purchases_read on public.mi_purchases for select using (auth.uid() = user_id);
create policy own_polls_read on public.mi_polls for select using (auth.uid() = user_id);
-- No insert/update/delete policies on purchases or polls: only the server functions (service role) write them.
