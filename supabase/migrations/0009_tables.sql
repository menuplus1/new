-- إدارة الطاولات: public.tables shipped in 0001 without RLS — nobody could read
-- or write it through PostgREST. Same owns() pattern as the other tenant tables.
alter table public.tables enable row level security;
drop policy if exists own_tables on public.tables;
create policy own_tables on public.tables for all
  using (public.owns(restaurant_id)) with check (public.owns(restaurant_id));
