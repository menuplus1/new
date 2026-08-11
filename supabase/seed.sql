-- Seed: the two showcase restaurants (mirrors src/lib/demo.ts).
-- Safe to re-run: wipes and re-inserts only these two slugs.
delete from public.restaurants where slug in ('dallah', 'sham');

with r as (
  insert into public.restaurants
    (slug, name, primary_color, currency, ordering, order_types, reservations, plan, template,
     tagline, about, socials, hours, languages, i18n, seo, covers, health_cert)
  values
  ('dallah', 'قهوة الدلّة', '#d18b4a', 'د.ع', true, '{dine_in,takeaway}', false, 'basic', 5,
   'قهوة مختصة وحلويات بيتية',
   'مقهى صغير في قلب بغداد — نحمّص قهوتنا أسبوعياً ونخبز حلوياتنا كل صباح.',
   '{"instagram":"https://instagram.com/dallah","whatsapp":"https://wa.me/9647700000000"}',
   '[{"closed":false,"open":"08:00","close":"23:00"},{"closed":false,"open":"08:00","close":"23:00"},{"closed":false,"open":"08:00","close":"23:00"},{"closed":false,"open":"08:00","close":"23:00"},{"closed":false,"open":"08:00","close":"23:00"},{"closed":false,"open":"08:00","close":"23:00"},{"closed":false,"open":"08:00","close":"23:00"}]',
   '{ar,en}',
   '{"en":{"name":"Dallah Coffee","tagline":"Specialty coffee & homemade sweets"}}',
   '{}',
   array['linear-gradient(120deg,#d18b4a,#8a5526)'],
   null),
  ('sham', 'مطعم بيت الشام', '#2f9e7a', 'د.ع', true, '{dine_in,delivery,takeaway}', true, 'ultimate', 1,
   'مأكولات شامية أصيلة منذ ١٩٨٨',
   'مطبخ شامي عريق — مشاوي على الفحم، مقبلات طازجة يومياً، وجلسات عائلية.',
   '{"instagram":"https://instagram.com/sham","facebook":"https://facebook.com/sham","whatsapp":"https://wa.me/9647711111111"}',
   '[{"closed":false,"open":"11:00","close":"01:00"},{"closed":true,"open":"11:00","close":"01:00"},{"closed":false,"open":"11:00","close":"01:00"},{"closed":false,"open":"11:00","close":"01:00"},{"closed":false,"open":"11:00","close":"01:00"},{"closed":false,"open":"11:00","close":"01:00"},{"closed":false,"open":"11:00","close":"01:00"}]',
   '{ar,en,ckb}',
   '{"en":{"name":"Bait Al-Sham","tagline":"Authentic Levantine cuisine since 1988"},"ckb":{"name":"ماڵی شام","tagline":"خواردنی شامی ڕەسەن لە ١٩٨٨ەوە"}}',
   '{"title":"بيت الشام — مشاوي ومأكولات شامية في بغداد","description":"منيو مطعم بيت الشام: مشاوي على الفحم، مقبلات، وأطباق شامية أصيلة."}',
   array['linear-gradient(120deg,#2f9e7a,#14523d)','linear-gradient(120deg,#c98a2b,#7a4d0e)'],
   'إجازة صحية رقم 4821 — بغداد')
  returning id, slug
),
cats as (
  insert into public.categories (restaurant_id, name, image_url, i18n, sort)
  select r.id, c.name, c.image_url, c.i18n::jsonb, c.sort
  from r join (values
    ('dallah', 'المشروبات الساخنة', 'linear-gradient(135deg,#6b4226,#3c2415)', '{"en":{"name":"Hot Drinks"}}', 0),
    ('dallah', 'المشروبات الباردة', 'linear-gradient(135deg,#3b6ea5,#1d3a57)', '{"en":{"name":"Cold Drinks"}}', 1),
    ('dallah', 'الحلويات', 'linear-gradient(135deg,#a05a7c,#5c2e47)', '{"en":{"name":"Desserts"}}', 2),
    ('sham', 'المقبلات', 'linear-gradient(135deg,#7aa953,#3f6428)', '{"en":{"name":"Starters"}}', 0),
    ('sham', 'المشاوي', 'linear-gradient(135deg,#b3542e,#66290f)', '{"en":{"name":"Grills"}}', 1),
    ('sham', 'الأطباق الرئيسية', 'linear-gradient(135deg,#8c7a3f,#4d421d)', '{"en":{"name":"Mains"}}', 2),
    ('sham', 'المشروبات', 'linear-gradient(135deg,#3b8ea5,#1c4d5c)', '{"en":{"name":"Drinks"}}', 3)
  ) as c(slug, name, image_url, i18n, sort) on c.slug = r.slug
  returning id, restaurant_id, name
)
insert into public.menu_items (restaurant_id, category_id, name, description, price, i18n, sort)
select cats.restaurant_id, cats.id, i.name, i.description, i.price, i.i18n::jsonb, i.sort
from cats join (values
  ('المشروبات الساخنة', 'إسبريسو', null, 2500, '{"en":{"name":"Espresso"}}', 0),
  ('المشروبات الساخنة', 'لاتيه', null, 3000, '{"en":{"name":"Latte"}}', 1),
  ('المشروبات الساخنة', 'كابتشينو', null, 3000, '{"en":{"name":"Cappuccino"}}', 2),
  ('المشروبات الساخنة', 'موكا', null, 3500, '{"en":{"name":"Mocha"}}', 3),
  ('المشروبات الساخنة', 'قهوة تركية', null, 2500, '{"en":{"name":"Turkish Coffee"}}', 4),
  ('المشروبات الساخنة', 'شاي كرك', null, 1500, '{"en":{"name":"Karak Tea"}}', 5),
  ('المشروبات الباردة', 'آيس لاتيه', null, 3500, '{"en":{"name":"Iced Latte"}}', 0),
  ('المشروبات الباردة', 'آيس أمريكانو', null, 3000, '{"en":{"name":"Iced Americano"}}', 1),
  ('المشروبات الباردة', 'فرابتشينو', null, 4000, '{"en":{"name":"Frappuccino"}}', 2),
  ('المشروبات الباردة', 'موهيتو', null, 4000, '{"en":{"name":"Mojito"}}', 3),
  ('الحلويات', 'تشيز كيك', 'بسكويت مطحون وجبنة كريمية', 4000, '{"en":{"name":"Cheesecake"}}', 0),
  ('الحلويات', 'كوكيز', null, 2500, '{"en":{"name":"Cookies"}}', 1),
  ('الحلويات', 'كرواسون', null, 2000, '{"en":{"name":"Croissant"}}', 2),
  ('المقبلات', 'حمص', 'حمص مطحون بالطحينة وزيت الزيتون', 3000, '{"en":{"name":"Hummus"},"ckb":{"name":"حومس"}}', 0),
  ('المقبلات', 'متبل', null, 3000, '{"en":{"name":"Mutabbal"}}', 1),
  ('المقبلات', 'تبولة', null, 3500, '{"en":{"name":"Tabbouleh"}}', 2),
  ('المقبلات', 'فتوش', null, 3500, '{"en":{"name":"Fattoush"}}', 3),
  ('المشاوي', 'شيش طاووق', 'صدر دجاج متبّل على الفحم', 9000, '{"en":{"name":"Shish Tawook"}}', 0),
  ('المشاوي', 'كباب لحم', null, 10000, '{"en":{"name":"Lamb Kebab"}}', 1),
  ('المشاوي', 'ريش غنم', null, 14000, '{"en":{"name":"Lamb Chops"}}', 2),
  ('المشاوي', 'مشاوي مشكّلة', 'تشكيلة تكفي شخصين', 18000, '{"en":{"name":"Mixed Grill"}}', 3),
  ('الأطباق الرئيسية', 'مندي دجاج', null, 8000, '{"en":{"name":"Chicken Mandi"}}', 0),
  ('الأطباق الرئيسية', 'برياني لحم', null, 11000, '{"en":{"name":"Lamb Biryani"}}', 1),
  ('الأطباق الرئيسية', 'مقلوبة', null, 9000, '{"en":{"name":"Maqluba"}}', 2),
  ('المشروبات', 'عصير برتقال', null, 3000, '{"en":{"name":"Orange Juice"}}', 0),
  ('المشروبات', 'ليمون نعناع', null, 3000, '{"en":{"name":"Mint Lemonade"}}', 1),
  ('المشروبات', 'مياه', null, 500, '{"en":{"name":"Water"}}', 2)
) as i(cat, name, description, price, i18n, sort) on i.cat = cats.name;

-- variants (أحجام) for a couple of dallah drinks
insert into public.item_variants (restaurant_id, item_id, name, price)
select mi.restaurant_id, mi.id, v.vname, v.vprice
from public.menu_items mi
join public.restaurants r on r.id = mi.restaurant_id and r.slug = 'dallah'
join (values ('لاتيه', 'صغير', 2500), ('لاتيه', 'وسط', 3000), ('لاتيه', 'كبير', 3500)) as v(iname, vname, vprice)
  on v.iname = mi.name;

-- promotions + sample approved reviews for sham
insert into public.promotions (restaurant_id, title, description, sort)
select id, 'خصم 20% على المشاوي المشكّلة', 'يومياً من ٣ إلى ٦ مساءً', 0 from public.restaurants where slug = 'sham';
insert into public.promotions (restaurant_id, title, description, sort)
select id, 'عرض العائلة: مشاوي + مقبلات + مشروبات', '45,000 د.ع بدل 55,000', 1 from public.restaurants where slug = 'sham';

insert into public.reviews (restaurant_id, stars, name, comment, approved)
select id, s.stars, s.name, s.comment, true
from public.restaurants r
join (values
  (5, 'أحمد', 'أفضل مشاوي في بغداد'),
  (5, 'سارة', 'الخدمة ممتازة والأكل طازج'),
  (4, 'علي', 'جلسة عائلية مريحة')
) as s(stars, name, comment) on r.slug = 'sham';
insert into public.reviews (restaurant_id, stars, name, comment, approved)
select id, 5, 'نور', 'قهوة مختصة فعلاً', true from public.restaurants where slug = 'dallah';
