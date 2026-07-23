-- Campaign lookbook images for the storefront homepage.
-- Run in Supabase SQL Editor.

alter table public.site_content
  add column if not exists lookbook_images text[] not null default '{}';

alter table public.site_content
  add column if not exists lookbook_title text not null default 'The look';
