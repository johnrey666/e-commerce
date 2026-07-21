-- Performance indexes + shop rating aggregate for large catalogs.

-- Sale / new-arrival filters on shop & home
create index if not exists products_on_sale_idx
  on public.products (created_at desc)
  where on_sale = true;

create index if not exists products_new_arrival_active_idx
  on public.products (created_at desc)
  where is_new_arrival = true;

create index if not exists products_new_arrival_until_idx
  on public.products (new_arrival_until)
  where is_new_arrival = true and new_arrival_until is not null;

create index if not exists products_low_stock_idx
  on public.products (stock)
  where stock <= 1;

-- Admin paid orders ledger
create index if not exists orders_payment_created_idx
  on public.orders (payment_status, created_at desc);

create index if not exists orders_inventory_pending_idx
  on public.orders (created_at)
  where payment_status = 'Paid' and inventory_applied = false;

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

-- Shop-wide average without shipping every review row
create or replace function public.shop_rating_summary()
returns table (average numeric, count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    avg(rating)::numeric as average,
    count(*)::bigint as count
  from public.product_reviews;
$$;

grant execute on function public.shop_rating_summary() to anon, authenticated;
