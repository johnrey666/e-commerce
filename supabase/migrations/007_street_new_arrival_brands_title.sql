-- brands_title / store_info (safe if 004 already ran), street address,
-- and timed new-arrival expiry.
-- Run in Supabase SQL Editor.

alter table public.site_content
  add column if not exists brands_title text not null
  default 'Sourced from the world''s finest brands';

alter table public.site_content
  add column if not exists store_info jsonb not null default '{}'::jsonb;

alter table public.orders
  add column if not exists street text not null default '';

alter table public.products
  add column if not exists new_arrival_until timestamptz;

-- Existing flagged new arrivals get a 10-day window from now if unset.
update public.products
set new_arrival_until = now() + interval '10 days'
where is_new_arrival = true
  and new_arrival_until is null;
