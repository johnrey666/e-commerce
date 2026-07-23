-- Protect catch-all "Others" categories (cannot delete or rename).
-- Also ensure both department catch-alls exist.

insert into public.categories (id, name, parent_id)
values
  ('men-others', 'Others', 'men'),
  ('women-others', 'Others', 'women')
on conflict (id) do update
set
  name = excluded.name,
  parent_id = excluded.parent_id;

create or replace function public.protect_root_categories()
returns trigger
language plpgsql
as $$
begin
  if old.id in ('men', 'women') then
    raise exception 'The % department cannot be deleted.', old.name;
  end if;
  if old.id in ('men-others', 'women-others') then
    raise exception 'The Others catch-all category cannot be deleted.';
  end if;
  return old;
end;
$$;

create or replace function public.protect_others_category_rename()
returns trigger
language plpgsql
as $$
begin
  if old.id in ('men-others', 'women-others') and new.name is distinct from old.name then
    raise exception 'The Others catch-all category cannot be renamed.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_others_category_rename on public.categories;
create trigger protect_others_category_rename
  before update of name on public.categories
  for each row
  execute function public.protect_others_category_rename();
