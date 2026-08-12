-- إغلاق تسريبين في الجداول العامة.
--
-- 1) order_counters نُسي بلا RLS منذ 0001 — يكشف عدد طلبات كل مطعم.
alter table public.order_counters enable row level security;
drop policy if exists own_counters on public.order_counters;
create policy own_counters on public.order_counters for select using (public.owns(restaurant_id));

-- 2) سياسة read_restaurants تجعل كل صفوف المطاعم مقروءة لأي حامل لمفتاح anon
--    (وهو منشور في المتصفّح)، بما فيها owner (معرّف المستخدم) ورقم واتساب.
--    الصفوف نفسها يحتاجها المنيو العام، لذلك نحصر الأعمدة بدل حجب الصفوف:
--    RLS يتحكّم بالصفوف، وصلاحيات الأعمدة تتحكّم بما يُقرأ منها.
revoke select on public.restaurants from anon;
grant select (
  id, slug, name, logo_url, primary_color, currency, ordering, order_types, reservations,
  plan, apps, trial_ends, template, tagline, about, socials, hours, languages, i18n, seo,
  covers, hide_branding, health_cert, active
) on public.restaurants to anon;

-- ملاحظة: authenticated يبقى بصلاحية كاملة لأن سياسة owns() تحصره بصفوف مطعمه،
-- ولوحة المطعم تحتاج owner و whatsapp_phone.
