-- Product reviews from paid orders (1–5 stars, optional comment).
-- Run in Supabase SQL Editor after prior migrations.

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  product_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text,
  product_name text not null default '',
  reviewer_name text not null default 'Customer',
  created_at timestamptz not null default now(),
  unique (order_id, product_id, user_id)
);

create index if not exists product_reviews_product_id_idx
  on public.product_reviews (product_id, created_at desc);

create index if not exists product_reviews_rating_idx
  on public.product_reviews (rating desc, created_at desc);

create index if not exists product_reviews_order_id_idx
  on public.product_reviews (order_id);

alter table public.product_reviews enable row level security;

-- Public read — landing, product pages, consolidated reviews
drop policy if exists "Anyone can read reviews" on public.product_reviews;
create policy "Anyone can read reviews"
  on public.product_reviews for select
  to anon, authenticated
  using (true);

-- Customers rate items from their own paid orders
drop policy if exists "Customers insert own reviews" on public.product_reviews;
create policy "Customers insert own reviews"
  on public.product_reviews for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where o.id = order_id
        and o.user_id = auth.uid()
        and o.payment_status = 'Paid'
        and oi.product_id = product_id
    )
  );

drop policy if exists "Customers update own reviews" on public.product_reviews;
create policy "Customers update own reviews"
  on public.product_reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Customers delete own reviews" on public.product_reviews;
create policy "Customers delete own reviews"
  on public.product_reviews for delete
  to authenticated
  using (auth.uid() = user_id);
