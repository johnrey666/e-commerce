-- Customer accounts, orders, payments, and seller chat.
-- Run this in the Supabase SQL Editor after the base schema.sql.

-- Allow customer (user) profiles alongside admins.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'user'));

alter table public.profiles
  alter column role set default 'user';

-- New signups default to customer; admin signup passes role=admin in user metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'user');
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when requested_role = 'admin' then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.is_customer()
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
      and profiles.role = 'user'
  );
$$;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- Orders
create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  total numeric(12, 2) not null check (total >= 0),
  status text not null default 'Pending'
    check (status in ('Pending', 'Out for Delivery', 'Delivered')),
  payment_status text not null default 'Pending'
    check (payment_status in ('Pending', 'Paid')),
  payment_method text not null default 'paymongo',
  shipping_carrier text not null
    check (shipping_carrier in ('JNT', 'DHL', 'LBC')),
  first_name text not null,
  last_name text not null,
  contact_number text not null,
  email text not null,
  country text not null default 'Philippines',
  region text not null,
  postal_code text not null,
  barangay text not null,
  city text not null,
  pinned_location text,
  notes text,
  paymongo_checkout_id text,
  paymongo_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  product_id text not null,
  name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  image text not null default '',
  size text,
  quantity integer not null check (quantity > 0)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- Buyer ↔ seller chat (scoped to an order)
create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'admin')),
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists order_messages_order_id_idx
  on public.order_messages (order_id, created_at);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_messages enable row level security;

-- Orders policies
drop policy if exists "Customers read own orders" on public.orders;
create policy "Customers read own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Customers insert own orders" on public.orders;
create policy "Customers insert own orders"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Customers update own payment fields" on public.orders;
create policy "Customers update own payment fields"
  on public.orders for update
  to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Order items
drop policy if exists "Read order items for accessible orders" on public.order_items;
create policy "Read order items for accessible orders"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Customers insert own order items" on public.order_items;
create policy "Customers insert own order items"
  on public.order_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.user_id = auth.uid()
    )
  );

-- Messages
drop policy if exists "Read messages for accessible orders" on public.order_messages;
create policy "Read messages for accessible orders"
  on public.order_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Send messages on accessible orders" on public.order_messages;
create policy "Send messages on accessible orders"
  on public.order_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          (o.user_id = auth.uid() and sender_role = 'user')
          or (public.is_admin() and sender_role = 'admin')
        )
    )
  );

-- Realtime for chat
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'order_messages'
  ) then
    alter publication supabase_realtime add table public.order_messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end
$$;
