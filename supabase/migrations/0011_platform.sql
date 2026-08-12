-- لوحة مدير المنصّة + سدّ ثغرة تمديد الاشتراك الذاتي.
--
-- ⚠️ يجب تشغيله بعد 0010: يعيد كتابة protect_restaurant_cols. تشغيل 0010 بعده
-- يُلغي التحصين أدناه.
--
-- جداول المنصّة كلها «RLS مفعّل بلا سياسات» = محجوبة عن أي JWT؛ الوصول حصراً
-- بمفتاح الخدمة من src/lib/platform.ts بعد التحقّق من العضوية في platform_admins.

-- ————— 1) حارس الأعمدة: الإصدار الثالث —————
-- قبل هذا الإصدار كان المطعم يستطيع من متصفّحه:
--   update restaurants set trial_ends = '2099-01-01'  → اشتراك أبدي مجاني
--   update restaurants set active = true              → إلغاء تعليق نفسه
-- (تحقّقنا من الثغرة عملياً على الإنتاج قبل إغلاقها.)
-- trial_ends صار يعني «مدفوع حتى»: بعد هذا التاريخ يتصرّف الحساب كباقة مجانية
-- في المنيو وفي place_order — فانتهاء الاشتراك يُطبَّق تلقائياً بلا مهمة مجدولة.
create or replace function public.protect_restaurant_cols() returns trigger
language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.plan       := old.plan;
    new.apps       := old.apps;
    new.owner      := old.owner;
    new.trial_ends := old.trial_ends;  -- «مدفوع حتى» بيد المنصّة وحدها
    new.active     := old.active;      -- التعليق/التفعيل بيد المنصّة وحدها
  end if;
  if new.plan <> 'ultimate' then new.hide_branding := false; end if;
  if new.plan not in ('premium', 'ultimate') and coalesce(array_length(new.covers, 1), 0) > 1 then
    new.covers := new.covers[1:1];
  end if;
  if new.plan = 'free' then
    new.languages := '{ar}';
  end if;
  return new;
end $$;

comment on column public.restaurants.trial_ends is
  'مدفوع حتى / نهاية التجربة — بعده يتصرّف الحساب كباقة مجانية (effectivePlan + place_order). تعديله بمفتاح الخدمة فقط.';

-- ————— 2) من هو مدير المنصّة —————
create table if not exists public.platform_admins (
  user_id uuid primary key,
  email text not null,
  role text not null default 'owner',
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;

-- ————— 3) كوبونات الخصم (تُطبَّق يدوياً عند تسجيل التجديد) —————
create table if not exists public.coupons (
  code text primary key,
  kind text not null check (kind in ('percent', 'amount')),
  value int not null check (value > 0),
  plans text[] not null default '{}',
  expires_at date,
  max_uses int,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100)
);
alter table public.coupons enable row level security;

-- ————— 4) الاشتراكات = دفتر الفواتير —————
-- restrict لا cascade: حذف مطعم يجب ألّا يمحو سجلّ إيراده (يُعلَّق ولا يُحذف).
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  plan text not null check (plan in ('free', 'basic', 'premium', 'ultimate')),
  period_start date not null default current_date,
  period_end date not null,
  months smallint not null default 1,
  amount int not null default 0,
  currency text not null default 'IQD',
  method text not null default 'cash' check (method in ('cash', 'transfer', 'zaincash', 'gift', 'trial')),
  status text not null default 'paid' check (status in ('paid', 'pending', 'refunded')),
  coupon_code text references public.coupons(code) on delete set null,
  discount int not null default 0,
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  check (period_end > period_start)
);
alter table public.subscriptions enable row level security;
create index if not exists subs_by_restaurant on public.subscriptions(restaurant_id, period_end desc);
create index if not exists subs_by_end on public.subscriptions(period_end desc);

-- ————— 5) ملاحظات المنصّة الخاصّة (لا يراها المطعم) —————
-- restaurant_id دائماً موجود، و order_id تضييق اختياري — فتُقرأ كل ملاحظات مطعم بفهرس واحد.
create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  body text not null,
  author uuid,
  created_at timestamptz not null default now()
);
alter table public.admin_notes enable row level security;
create index if not exists notes_by_restaurant on public.admin_notes(restaurant_id, created_at desc);

-- ————— 6) سجل نشاط اللوحة —————
create table if not exists public.platform_audit (
  id bigserial primary key,
  actor uuid,
  actor_email text,
  action text not null,
  target text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.platform_audit enable row level security;
create index if not exists audit_recent on public.platform_audit(created_at desc);

-- ————— 7) ترحيل أوّلي —————
-- مدير المنصّة (أنشئ المستخدم أولاً من Authentication → Add user):
insert into public.platform_admins (user_id, email)
select id, email from auth.users where email = 'admin@menuplus.rest'
on conflict (user_id) do nothing;

-- اشتراك أوّلي لكل مطعم مدفوع قائم حتى تبدأ قوائم «قرب الانتهاء» بأرقام حقيقية:
insert into public.subscriptions
  (restaurant_id, plan, period_start, period_end, amount, method, status, note)
select r.id, r.plan, r.created_at::date,
       coalesce(r.trial_ends::date, r.created_at::date + 30),
       0, 'trial', 'pending', 'ترحيل أوّلي عند إطلاق اللوحة'
from public.restaurants r
where r.plan <> 'free'
  and not exists (select 1 from public.subscriptions s where s.restaurant_id = r.id);
