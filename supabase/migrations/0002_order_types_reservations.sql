-- Order type (صالة / دلفري / سفري) + table reservations. Both switchable per
-- tenant: the manager edits restaurants.order_types / restaurants.reservations.
alter table public.restaurants
  add column if not exists order_types text[] not null default '{dine_in,delivery,takeaway}',
  add column if not exists reservations boolean not null default true;

alter table public.orders
  add column if not exists order_type text not null default 'dine_in',
  add column if not exists customer_name text,
  add column if not exists address text;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  phone text not null,
  res_date date not null,
  res_time time not null,
  guests int not null,
  note text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
-- RLS on with no anon policy: reservations are written by the server action
-- (service role) and read only by the restaurant's own dashboard later.
alter table public.reservations enable row level security;
create index if not exists reservations_by_day on public.reservations(restaurant_id, res_date);

-- place_order gains the order type + customer name/address.
drop function if exists public.place_order(uuid, text, jsonb, int, text, text);
create or replace function public.place_order(
  p_restaurant uuid, p_table text, p_lines jsonb, p_total int, p_phone text, p_note text,
  p_type text default 'dine_in', p_name text default null, p_address text default null
) returns int language plpgsql security definer set search_path = public as $$
declare v_seq int; v_order uuid; ln jsonb;
begin
  insert into public.order_counters(restaurant_id, last_seq) values (p_restaurant, 1)
    on conflict (restaurant_id) do update set last_seq = order_counters.last_seq + 1
    returning last_seq into v_seq;
  insert into public.orders(restaurant_id, order_seq, table_label, total, phone, note, order_type, customer_name, address)
    values (p_restaurant, v_seq, p_table, p_total, p_phone, p_note, p_type, p_name, p_address) returning id into v_order;
  for ln in select * from jsonb_array_elements(p_lines) loop
    insert into public.order_items(order_id, name, qty, unit_price)
      values (v_order, ln->>'name', (ln->>'qty')::int, (ln->>'unit_price')::int);
  end loop;
  return v_seq;
end $$;
