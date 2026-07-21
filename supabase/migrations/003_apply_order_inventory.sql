-- Decrement product stock when an order is paid (once per order).
-- Run in Supabase SQL Editor.

alter table public.orders
  add column if not exists inventory_applied boolean not null default false;

create or replace function public.apply_order_inventory(p_order_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
  item record;
  pid uuid;
begin
  select * into o
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return false;
  end if;

  -- Only apply after successful payment, and only once.
  if o.payment_status is distinct from 'Paid' then
    return false;
  end if;

  if o.inventory_applied then
    return true;
  end if;

  for item in
    select product_id, quantity
    from public.order_items
    where order_id = p_order_id
  loop
    begin
      pid := item.product_id::uuid;
    exception
      when others then
        continue;
    end;

    update public.products
    set stock = greatest(0, stock - item.quantity)
    where id = pid;
  end loop;

  update public.orders
  set inventory_applied = true,
      updated_at = now()
  where id = p_order_id;

  return true;
end;
$$;

revoke all on function public.apply_order_inventory(text) from public;
grant execute on function public.apply_order_inventory(text) to authenticated;
grant execute on function public.apply_order_inventory(text) to service_role;
