-- Undo 2311 promo codes
alter table public.mi_polls drop column if exists promo_code_id;  -- promo polls stay as plain poll rows; delete them first if wanted:
-- delete from public.mi_polls where promo_code_id is not null;  (run BEFORE the drop above)
drop table if exists public.mi_promo_codes;
drop table if exists public.mi_promo_admins;
