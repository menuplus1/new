-- Engagement: visit stats, reviews, promotions.

-- ————— visit counters —————
create table if not exists public.visits (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('menu', 'cat', 'item')),
  ref text not null default '',
  hits int not null default 0,
  primary key (restaurant_id, day, kind, ref)
);
alter table public.visits enable row level security;
drop policy if exists visits_read on public.visits;
create policy visits_read on public.visits for select using (public.owns(restaurant_id));
-- no write policies: the definer rpc below is the only writer

create or replace function public.track_visit(p_restaurant uuid, p_kind text, p_ref text)
returns void language sql security definer set search_path = public, pg_temp as $$
  insert into public.visits(restaurant_id, day, kind, ref, hits)
  select p_restaurant, current_date, p_kind, left(coalesce(p_ref, ''), 40), 1
  where p_kind in ('menu', 'cat', 'item')
  on conflict (restaurant_id, day, kind, ref) do update set hits = visits.hits + 1;
$$;
-- server-only: kills the PostgREST spam surface. All tracking flows through
-- server actions using the service key.
-- ponytail: if the menu page ever gets cached/ISR, server-side tracking
-- undercounts — that's the moment to reconsider an anon grant, not before.
revoke execute on function public.track_visit(uuid, text, text) from public, anon, authenticated;

-- ————— reviews —————
-- Inserted only via the server action (service role — no insert policy).
-- Integrity is cosmetic by design: unauthenticated submit + owner moderation.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  name text not null,
  comment text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews for select using (approved);
drop policy if exists reviews_own on public.reviews;
create policy reviews_own on public.reviews for all
  using (public.owns(restaurant_id)) with check (public.owns(restaurant_id));
create index if not exists reviews_by_restaurant on public.reviews(restaurant_id, approved);

-- ————— promotions (تطبيق العروض الترويجية) —————
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.promotions enable row level security;
drop policy if exists promos_public_read on public.promotions;
create policy promos_public_read on public.promotions for select using (active);
drop policy if exists promos_own on public.promotions;
create policy promos_own on public.promotions for all
  using (public.owns(restaurant_id)) with check (public.owns(restaurant_id));
