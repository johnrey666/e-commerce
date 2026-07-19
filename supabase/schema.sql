-- Good Catch — admin profiles
-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Auto-create an admin profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'admin')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill admins created before this trigger was installed.
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where email is not null
on conflict (id) do nothing;

-- Shared authorization helper used by catalog and storage policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

-- Global catalog tables. Store visitors can read them; signed-in admins can
-- create and manage inventory from any device.
create table if not exists public.brands (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  name text not null,
  parent_id text references public.categories (id),
  created_at timestamptz not null default now()
);

-- Migrate databases created before categories became hierarchical.
alter table public.categories
  add column if not exists parent_id text references public.categories (id);

-- Subcategories under different departments may share a name (e.g. "Hoodies"
-- under both Men and Women), so uniqueness is scoped to the parent.
alter table public.categories drop constraint if exists categories_name_key;
create unique index if not exists categories_parent_name_idx
  on public.categories (parent_id, name);
create index if not exists categories_parent_id_idx
  on public.categories (parent_id);

-- Men and Women are fixed root departments — they can never be deleted.
create or replace function public.protect_root_categories()
returns trigger
language plpgsql
as $$
begin
  if old.id in ('men', 'women') then
    raise exception 'The % department cannot be deleted.', old.name;
  end if;
  return old;
end;
$$;

drop trigger if exists protect_root_categories on public.categories;
create trigger protect_root_categories
  before delete on public.categories
  for each row
  execute function public.protect_root_categories();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(12, 2) not null check (price >= 0),
  discount_price numeric(12, 2) check (
    discount_price is null or discount_price >= 0
  ),
  on_sale boolean not null default false,
  is_new_arrival boolean not null default false,
  category_id text not null references public.categories (id),
  category_ids text[] not null default '{}',
  brand_id text not null references public.brands (id),
  condition text not null check (
    condition in ('Brand New', 'Like New', 'Excellent', 'Good', 'Fair')
  ),
  images text[] not null default '{}',
  sizes text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Migrate the former single-category model. category_id remains as a
-- compatibility primary category while category_ids powers storefront filters.
alter table public.products
  add column if not exists category_ids text[] not null default '{}';
update public.products
set category_ids = array[category_id]
where cardinality(category_ids) = 0;

create index if not exists products_category_id_idx
  on public.products (category_id);
create index if not exists products_category_ids_idx
  on public.products using gin (category_ids);
create index if not exists products_brand_id_idx
  on public.products (brand_id);
create index if not exists products_created_at_idx
  on public.products (created_at desc);

alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "Anyone can read brands" on public.brands;
create policy "Anyone can read brands"
  on public.brands for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage brands" on public.brands;
create policy "Admins can manage brands"
  on public.brands for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Anyone can read categories" on public.categories;
create policy "Anyone can read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Editable landing-page media. A single row controls the storefront hero,
-- partner-brand images, and optional images for each subcategory.
create table if not exists public.site_content (
  id text primary key check (id = 'landing'),
  hero_video_url text not null default '/sample.mp4',
  brand_images text[] not null default '{}',
  category_images jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_content (id)
values ('landing')
on conflict (id) do nothing;

alter table public.site_content enable row level security;

drop policy if exists "Anyone can read site content" on public.site_content;
create policy "Anyone can read site content"
  on public.site_content for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage site content" on public.site_content;
create policy "Admins can manage site content"
  on public.site_content for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Keep the existing starter filters, but leave products empty for real stock.
-- Men and Women are the two root departments; everything else lives inside.
insert into public.categories (id, name, parent_id)
values
  ('men', 'Men', null),
  ('women', 'Women', null)
on conflict (id) do update set
  name = excluded.name,
  parent_id = null;

-- Databases created before the hierarchy had flat categories (shirts, pants,
-- …). Park them under Men so nothing is orphaned — reorganize in the admin.
update public.categories
set parent_id = 'men'
where parent_id is null
  and id not in ('men', 'women');

insert into public.categories (id, name, parent_id)
values
  ('men-shirts', 'Shirts', 'men'),
  ('men-shorts', 'Shorts', 'men'),
  ('men-pants', 'Pants', 'men'),
  ('men-hoodies', 'Hoodies', 'men'),
  ('men-others', 'Others', 'men'),
  ('women-shirts', 'Shirts', 'women'),
  ('women-shorts', 'Shorts', 'women'),
  ('women-pants', 'Pants', 'women'),
  ('women-hoodies', 'Hoodies', 'women'),
  ('women-others', 'Others', 'women')
on conflict do nothing;

insert into public.brands (id, name)
values
  ('nike', 'Nike'),
  ('adidas', 'Adidas'),
  ('uniqlo', 'Uniqlo'),
  ('carhartt', 'Carhartt')
on conflict (id) do update set name = excluded.name;

-- Push catalog changes to storefronts that are already open.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'brands'
  ) then
    alter publication supabase_realtime add table public.brands;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table public.categories;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'site_content'
  ) then
    alter publication supabase_realtime add table public.site_content;
  end if;
end
$$;

-- Public product image bucket. Downloads are public; only signed-in admins can
-- upload, replace, or delete files inside their own user folder.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_admin()
  );

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public landing-page media. Videos are capped at 100 MB; images and videos
-- are stored under the current admin's folder so replaced files can be removed.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'landing-media',
  'landing-media',
  true,
  104857600,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'video/mp4', 'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload landing media" on storage.objects;
create policy "Admins can upload landing media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'landing-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_admin()
  );

drop policy if exists "Admins can update landing media" on storage.objects;
create policy "Admins can update landing media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'landing-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_admin()
  )
  with check (
    bucket_id = 'landing-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_admin()
  );

drop policy if exists "Admins can delete landing media" on storage.objects;
create policy "Admins can delete landing media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'landing-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_admin()
  );
