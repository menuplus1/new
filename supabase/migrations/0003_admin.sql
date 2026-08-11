-- Manager dashboard access. Each restaurant account (auth user) is the `owner`
-- of its row; every policy below routes through that column, so one account can
-- never read or touch another restaurant's orders, bookings, or settings.
create index if not exists restaurants_by_owner on public.restaurants(owner);

create or replace function public.owns(p_restaurant uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.restaurants r where r.id = p_restaurant and r.owner = auth.uid());
$$;

-- restaurants: the owner reads its own row (even when inactive) and edits it
drop policy if exists own_restaurant_read on public.restaurants;
drop policy if exists own_restaurant_write on public.restaurants;
create policy own_restaurant_read on public.restaurants for select using (owner = auth.uid());
create policy own_restaurant_write on public.restaurants for update
  using (owner = auth.uid()) with check (owner = auth.uid());

-- orders + their lines
drop policy if exists own_orders_read on public.orders;
drop policy if exists own_orders_write on public.orders;
create policy own_orders_read on public.orders for select using (public.owns(restaurant_id));
create policy own_orders_write on public.orders for update
  using (public.owns(restaurant_id)) with check (public.owns(restaurant_id));

drop policy if exists own_order_items_read on public.order_items;
create policy own_order_items_read on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_items.order_id and public.owns(o.restaurant_id))
);

-- reservations
drop policy if exists own_reservations_read on public.reservations;
drop policy if exists own_reservations_write on public.reservations;
create policy own_reservations_read on public.reservations for select using (public.owns(restaurant_id));
create policy own_reservations_write on public.reservations for update
  using (public.owns(restaurant_id)) with check (public.owns(restaurant_id));

-- Creating an account, per restaurant:
--   1. Supabase → Authentication → Add user (email + password).
--   2. link it:
--      update public.restaurants set owner = (select id from auth.users where email = 'owner@example.com')
--      where slug = 'sham';
