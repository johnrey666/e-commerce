-- Editable store info + brands headline on landing content.
-- Run in Supabase SQL Editor.

alter table public.site_content
  add column if not exists brands_title text not null
    default 'Sourced from the world''s finest brands';

alter table public.site_content
  add column if not exists store_info jsonb not null default '{}'::jsonb;

update public.site_content
set
  brands_title = coalesce(nullif(brands_title, ''), 'Sourced from the world''s finest brands'),
  store_info = case
    when store_info = '{}'::jsonb or store_info is null then
      '{
        "eyebrow": "Visit Us",
        "title": "Store Info",
        "subtitle": "Cool people like thrifting — step through the door and see the floor.",
        "tagline": "Buy · Sell · Trade · Consign",
        "exteriorUrl": "",
        "interiorUrls": [],
        "details": [
          {"label": "Hours", "value": "Mon – Sun", "detail": "10:00 AM – 8:00 PM"},
          {"label": "Location", "value": "Legazpi City", "detail": "Peñaranda St, Albay", "href": "https://maps.app.goo.gl/WoB33D1QXzXSSpdH6"},
          {"label": "Social", "value": "@goodcatch", "detail": "Instagram & Facebook", "href": "https://www.facebook.com/goodcatch.ph"}
        ]
      }'::jsonb
    else store_info
  end
where id = 'landing';
