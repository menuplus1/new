-- Multi-tenant e-menu platform. Each restaurant is a tenant; every row carries a
-- restaurant_id and the public menu is readable by anon. Money is integer.
create extension if not exists pgcrypto;

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  logo_url text,
  primary_color text not null default '#d18b4a',
  currency text not null default 'د.ع',
  ordering boolean not null default true,
  owner uuid,                       -- auth.users id of the restaurant admin
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  sort int not null default 0,
  active boolean not null default true
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  price int not null default 0,
  sort int not null default 0,
  active boolean not null default true
);

create table public.item_variants (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null,
  price int not null
);

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  label text not null
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  order_seq int not null,
  table_label text,
  status text not null default 'pending',
  total int not null default 0,
  phone text,
  note text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  name text not null,
  qty int not null,
  unit_price int not null
);

create table public.order_counters (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  last_seq int not null default 0
);

-- RLS
alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.item_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- the public menu is readable by anyone (active rows only)
create policy read_restaurants on public.restaurants for select using (active);
create policy read_categories  on public.categories  for select using (active);
create policy read_items       on public.menu_items  for select using (active);
create policy read_variants    on public.item_variants for select using (true);

-- Orders are created ONLY through place_order (server action, service role) — no
-- direct anon insert, so prices/tenant can't be tampered with.
create or replace function public.place_order(
  p_restaurant uuid, p_table text, p_lines jsonb, p_total int, p_phone text, p_note text
) returns int language plpgsql security definer set search_path = public as $$
declare v_seq int; v_order uuid; ln jsonb;
begin
  insert into public.order_counters(restaurant_id, last_seq) values (p_restaurant, 1)
    on conflict (restaurant_id) do update set last_seq = order_counters.last_seq + 1
    returning last_seq into v_seq;
  insert into public.orders(restaurant_id, order_seq, table_label, total, phone, note)
    values (p_restaurant, v_seq, p_table, p_total, p_phone, p_note) returning id into v_order;
  for ln in select * from jsonb_array_elements(p_lines) loop
    insert into public.order_items(order_id, name, qty, unit_price)
      values (v_order, ln->>'name', (ln->>'qty')::int, (ln->>'unit_price')::int);
  end loop;
  return v_seq;
end $$;
