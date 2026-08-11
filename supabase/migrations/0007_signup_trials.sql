-- Self-signup with plan choice: paid plans start as a 7-day trial
-- (trial_ends set by the signup action). An expired trial behaves as 'free'
-- wherever it matters: the menu (app-side effectivePlan) and place_order here.
alter table public.restaurants add column if not exists trial_ends timestamptz;

create or replace function public.place_order(
  p_restaurant uuid, p_table text, p_lines jsonb, p_phone text, p_note text,
  p_type text default 'dine_in', p_name text default null, p_address text default null
) returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v record; v_plan text; v_seq int; v_order uuid; ln jsonb;
  v_item record; v_var record; v_name text; v_price int; v_qty int; v_total int := 0;
begin
  select active, ordering, plan, order_types, trial_ends into v from public.restaurants where id = p_restaurant;
  if not found or not v.active then raise exception 'المطعم غير متاح حالياً.'; end if;
  if not v.ordering then raise exception 'استقبال الطلبات متوقف حالياً.'; end if;
  v_plan := case when v.trial_ends is not null and v.trial_ends < now() then 'free' else v.plan end;
  if v_plan not in ('premium', 'ultimate') then raise exception 'الطلبات غير متاحة في باقة هذا المطعم.'; end if;
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
