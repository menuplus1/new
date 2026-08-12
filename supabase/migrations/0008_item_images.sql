-- تعدد صور العناصر (باقة التميز فما فوق): صور إضافية للصنف تظهر كمصغّرات في
-- نافذة الصنف. عمود image_url يبقى الصورة الرئيسية — هذا العمود للصور الإضافية فقط.
alter table public.menu_items add column if not exists images text[] not null default '{}';
