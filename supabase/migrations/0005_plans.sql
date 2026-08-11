-- Entitlements core. Plans: free / basic / premium / ultimate
-- (انطلاق · أساسية 25,000 · تميز 35,000 · شاملة 50,000 د.ع شهرياً).
-- Limits here MUST mirror src/lib/plans.ts. Enforcement is in the DB because
-- restaurant accounts talk to PostgREST directly with their JWT.

-- ————— new columns —————
alter table public.restaurants
  add column if not exists plan text not null default 'free',
  add column if not exists apps text[] not null default '{}',
  add column if not exists template smallint not null default 1,
  add column if not exists tagline text,
  add column if not exists about text,
  add column if not exists socials jsonb not null default '{}',
  add column if not exists hours jsonb,
  add column if not exists languages text[] not null default '{ar}',
  add column if not exists i18n jsonb not null default '{}',
  add column if not exists seo jsonb not null default '{}',
  add column if not exists covers text[] not null default '{}',
  add column if not exists whatsapp_phone text,
  add column if not exists hide_branding boolean not null default false,
  add column if not exists health_cert text;

alter table public.categories
  add column if not exists image_url text,
  add column if not exists i18n jsonb not null default '{}';
alter table public.menu_items
  add column if not exists i18n jsonb not null default '{}';

-- ————— co-admins —————
create table if not exists public.restaurant_admins (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null,
  email text not null,
  role text not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (restaurant_id, user_id)
);
alter table public.restaurant_admins enable row level security;

-- owns(): owner OR co-admin. SECURITY DEFINER (definer = table owner → skips
-- RLS → no policy recursion). search_path pinned per Postgres guidance.
create or replace function public.owns(p_restaurant uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.restaurants r
                 where r.id = p_restaurant and r.owner = auth.uid())
      or exists (select 1 from public.restaurant_admins a
                 where a.restaurant_id = p_restaurant and a.user_id = auth.uid());
$$;
grant execute on function public.owns(uuid) to anon, authenticated;

-- admins table: anyone on the team can see the list; ONLY the owner manages it
-- (owns() here would let any admin add admins — privilege escalation).
drop policy if exists admins_read on public.restaurant_admins;
create policy admins_read on public.restaurant_admins for select using (public.owns(restaurant_id));
drop policy if exists admins_manage on public.restaurant_admins;
create policy admins_manage on public.restaurant_admins for all
  using (exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner = auth.uid()))
  with check (exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner = auth.uid()));

-- restaurants: co-admins need the row too (also lets limit-triggers read plan)
drop policy if exists own_restaurant_read on public.restaurants;
create policy own_restaurant_read on public.restaurants for select using (public.owns(id));
drop policy if exists own_restaurant_write on public.restaurants;
create policy own_restaurant_write on public.restaurants for update
  using (public.owns(id)) with check (public.owns(id));

-- ————— protected columns —————
-- PostgREST does SET ROLE anon/authenticated/service_role, so in a PLAIN (not
-- security definer!) trigger function current_user is exactly the caller role.
-- SQL editor / migrations run as postgres and pass through untouched.
create or replace function public.protect_restaurant_cols() returns trigger
language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.plan  := old.plan;
    new.apps  := old.apps;
    new.owner := old.owner;  -- policies use owns(); without this a co-admin could self-assign ownership
  end if;
  -- clamp on the (possibly service-role-updated) NEW row, unconditionally:
  if new.plan <> 'ultimate' then new.hide_branding := false; end if;
  if new.plan not in ('premium', 'ultimate') and coalesce(array_length(new.covers, 1), 0) > 1 then
    new.covers := new.covers[1:1];
  end if;
  if new.plan = 'free' then
    new.template := 1;
    new.languages := '{ar}';
  end if;
  return new;
end $$;

drop trigger if exists protect_restaurant_cols on public.restaurants;
create trigger protect_restaurant_cols before update on public.restaurants
for each row execute function public.protect_restaurant_cols();

-- ————— plan count limits —————
-- Counts run under the caller's RLS; the same owns() predicate governs both the
-- insert check and select, so the count is complete for that restaurant.
-- Counting includes hidden/inactive rows on purpose: hiding an item does not
-- free quota. Race window can slightly over-admit under concurrency — accepted.
create or replace function public.enforce_item_limit() returns trigger
language plpgsql as $$
declare v_max int;
begin
  select case plan when 'free' then 15 when 'basic' then 100 end
    into v_max from public.restaurants where id = new.restaurant_id;
  if v_max is not null and
     (select count(*) from public.menu_items where restaurant_id = new.restaurant_id) >= v_max then
    raise exception 'بلغت حدّ العناصر في باقتك — قم بالترقية لإضافة المزيد.';
  end if;
  return new;
end $$;
drop trigger if exists enforce_item_limit on public.menu_items;
create trigger enforce_item_limit before insert on public.menu_items
for each row execute function public.enforce_item_limit();

create or replace function public.enforce_category_limit() returns trigger
language plpgsql as $$
declare v_max int;
begin
  select case plan when 'free' then 5 when 'basic' then 15 end
    into v_max from public.restaurants where id = new.restaurant_id;
  if v_max is not null and
     (select count(*) from public.categories where restaurant_id = new.restaurant_id) >= v_max then
    raise exception 'بلغت حدّ الأقسام في باقتك — قم بالترقية لإضافة المزيد.';
  end if;
  return new;
end $$;
drop trigger if exists enforce_category_limit on public.categories;
create trigger enforce_category_limit before insert on public.categories
for each row execute function public.enforce_category_limit();

create or replace function public.enforce_admin_limit() returns trigger
language plpgsql as $$
declare v_max int;
begin
  select case plan when 'premium' then 3 when 'ultimate' then 10 else 1 end
    into v_max from public.restaurants where id = new.restaurant_id;
  -- owner counts as the first supervisor
  if (select count(*) from public.restaurant_admins where restaurant_id = new.restaurant_id) + 1 >= v_max then
    raise exception 'ADMIN_LIMIT: بلغت حدّ المشرفين في باقتك.';
  end if;
  return new;
end $$;
drop trigger if exists enforce_admin_limit on public.restaurant_admins;
create trigger enforce_admin_limit before insert on public.restaurant_admins
for each row execute function public.enforce_admin_limit();

-- ————— place_order: plan gates + server-resolved prices —————
-- Fixes the price-trust hole: lines are {item_id, variant_id, qty} and prices
-- come from the menu tables, never from the client.
drop function if exists public.place_order(uuid, text, jsonb, int, text, text);
drop function if exists public.place_order(uuid, text, jsonb, int, text, text, text, text, text);
create or replace function public.place_order(
  p_restaurant uuid, p_table text, p_lines jsonb, p_phone text, p_note text,
  p_type text default 'dine_in', p_name text default null, p_address text default null
) returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v record; v_seq int; v_order uuid; ln jsonb;
  v_item record; v_var record; v_name text; v_price int; v_qty int; v_total int := 0;
begin
  select active, ordering, plan, order_types into v from public.restaurants where id = p_restaurant;
  if not found or not v.active then raise exception 'المطعم غير متاح حالياً.'; end if;
  if not v.ordering then raise exception 'استقبال الطلبات متوقف حالياً.'; end if;
  if v.plan not in ('premium', 'ultimate') then raise exception 'الطلبات غير متاحة في باقة هذا المطعم.'; end if;
  if not (p_type = any(v.order_types)) then raise exception 'طريقة الطلب هذه غير متاحة.'; end if;

  insert into public.order_counters(restaurant_id, last_seq) values (p_restaurant, 1)
    on conflict (restaurant_id) do update set last_seq = order_counters.last_seq + 1
    returning last_seq into v_seq;
  insert into public.orders(restaurant_id, order_seq, table_label, total, phone, note, order_type, customer_name, address)
    values (p_restaurant, v_seq, p_table, 0, p_phone, p_note, p_type, p_name, p_address) returning id into v_order;

  for ln in select * from jsonb_array_elements(p_lines) loop
    select name, price into v_item from public.menu_items
      where id = (ln->>'item_id')::uuid and restaurant_id = p_restaurant and active;
    if not found then raise exception 'صنف غير متاح.'; end if;
    v_name := v_item.name; v_price := v_item.price;
    if coalesce(ln->>'variant_id', '') <> '' then
      select name, price into v_var from public.item_variants
        where id = (ln->>'variant_id')::uuid and item_id = (ln->>'item_id')::uuid;
      if not found then raise exception 'حجم غير متاح.'; end if;
      v_name := v_item.name || ' — ' || v_var.name; v_price := v_var.price;
    end if;
    v_qty := greatest(1, least(99, coalesce((ln->>'qty')::int, 1)));
    insert into public.order_items(order_id, name, qty, unit_price) values (v_order, v_name, v_qty, v_price);
    v_total := v_total + v_price * v_qty;
  end loop;

  update public.orders set total = v_total where id = v_order;
  return v_seq;
end $$;

-- ————— live dashboard —————
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.reservations;
exception when duplicate_object then null; end $$;
