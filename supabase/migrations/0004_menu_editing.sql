-- The manager edits their own menu from /admin. `for all` covers select (incl.
-- rows they hid), insert, update and delete — always fenced by owns().
alter table public.item_variants enable row level security;

drop policy if exists own_categories on public.categories;
create policy own_categories on public.categories for all
  using (public.owns(restaurant_id)) with check (public.owns(restaurant_id));

drop policy if exists own_menu_items on public.menu_items;
create policy own_menu_items on public.menu_items for all
  using (public.owns(restaurant_id)) with check (public.owns(restaurant_id));

drop policy if exists own_item_variants on public.item_variants;
create policy own_item_variants on public.item_variants for all
  using (public.owns(restaurant_id)) with check (public.owns(restaurant_id));
