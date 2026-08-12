-- الدعم الفني · الإعلانات · إدارة القوالب من لوحة المنصّة.
-- ما يراه المطعم له سياسات owns()، وما يخصّ المنصّة بلا سياسات (مفتاح الخدمة فقط).

-- ————— تذاكر الدعم —————
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'pending', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  unread_platform boolean not null default true,  -- وصل جديد من المطعم
  unread_restaurant boolean not null default false, -- ردّ جديد من المنصّة
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
drop policy if exists own_tickets on public.support_tickets;
create policy own_tickets on public.support_tickets for all
  using (public.owns(restaurant_id)) with check (public.owns(restaurant_id));
create index if not exists tickets_by_status on public.support_tickets(status, updated_at desc);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender text not null check (sender in ('restaurant', 'platform')),
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.ticket_messages enable row level security;
drop policy if exists own_ticket_messages on public.ticket_messages;
create policy own_ticket_messages on public.ticket_messages for all
  using (exists (select 1 from public.support_tickets t where t.id = ticket_id and public.owns(t.restaurant_id)))
  with check (exists (select 1 from public.support_tickets t where t.id = ticket_id and public.owns(t.restaurant_id)));
create index if not exists messages_by_ticket on public.ticket_messages(ticket_id, created_at);

-- ————— الإعلانات (تظهر داخل لوحة المطعم) —————
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  kind text not null default 'info' check (kind in ('info', 'offer', 'warning')),
  audience text not null default 'all' check (audience in ('all', 'plan', 'one')),
  plan text,                       -- عند audience='plan'
  restaurant_id uuid references public.restaurants(id) on delete cascade, -- عند audience='one'
  cta_label text,
  cta_url text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
-- القراءة للمصادَقين ضمن الفترة فقط؛ الاستهداف يُرشَّح في الخادم
drop policy if exists read_live_announcements on public.announcements;
create policy read_live_announcements on public.announcements for select
  to authenticated
  using (active and now() >= starts_at and (ends_at is null or now() <= ends_at));

-- من أغلق أي إعلان — حتى لا يعود بعد إغلاقه
create table if not exists public.announcement_reads (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);
alter table public.announcement_reads enable row level security;
drop policy if exists own_reads on public.announcement_reads;
create policy own_reads on public.announcement_reads for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ————— القوالب: طبقة فوق قائمة الشيفرة —————
-- التخطيط (Layout) شيفرة ولا يُضاف من اللوحة؛ ما يُدار هنا: الإظهار/الإخفاء،
-- الاسم والوصف واللون والترتيب — ويُدمج مع src/lib/templates.ts بالرقم.
create table if not exists public.platform_templates (
  n int primary key,
  name text,
  description text,
  accent text,
  sort int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.platform_templates enable row level security;
drop policy if exists read_templates on public.platform_templates;
create policy read_templates on public.platform_templates for select using (true);
