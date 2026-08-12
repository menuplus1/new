-- كل القوالب صارت مجانية: الباقة تبيع المميزات (طلبات، إحصائيات، لغات…) لا شكل
-- المنيو. نعيد كتابة حارس الأعمدة بلا قصّ القالب للباقة المجانية — تبقى بقية
-- الحمايات كما هي (plan/apps/owner، إخفاء الحقوق، الأغلفة، اللغات).
create or replace function public.protect_restaurant_cols() returns trigger
language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.plan  := old.plan;
    new.apps  := old.apps;
    new.owner := old.owner;
  end if;
  if new.plan <> 'ultimate' then new.hide_branding := false; end if;
  if new.plan not in ('premium', 'ultimate') and coalesce(array_length(new.covers, 1), 0) > 1 then
    new.covers := new.covers[1:1];
  end if;
  if new.plan = 'free' then
    new.languages := '{ar}';   -- تعدد اللغات يبقى ميزة مدفوعة
  end if;
  return new;
end $$;
