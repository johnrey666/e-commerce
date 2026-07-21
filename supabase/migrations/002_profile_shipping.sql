-- Profile shipping defaults + preferences.
-- Run in Supabase SQL Editor after prior migrations.

alter table public.profiles
  add column if not exists shipping jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;
