# منصّة المنيو الرقمي (Menu Platform)

منصّة **متعددة المطاعم** (multi-tenant) — كل مطعم/مقهى يحصل على منيوه الرقمي الخاص على رابط
`/<اسم-المطعم>`، بعلامته وألوانه وطاولاته وطلباته. مبنية على Next.js 16 + Supabase.

## يعمل الآن بلا قاعدة بيانات
شغّله مباشرة وسترى مطعمين تجريبيين:

```bash
npm run dev
```

- الصفحة الرئيسية: `http://localhost:3000`
- منيو مقهى تجريبي: `http://localhost:3000/dallah`
- منيو مطعم تجريبي: `http://localhost:3000/sham?t=5` (مع رقم طاولة)

كل مطعم بلونه ومنيوه المستقل — وهذه هي الفكرة.

## لربط قاعدة بيانات حقيقية (Supabase جديد)
1. أنشئ مشروع Supabase جديداً على supabase.com.
2. من **SQL Editor** شغّل محتوى `supabase/migrations/0001_init.sql`.
3. انسخ `.env.example` إلى `.env.local` واملأ:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (السري — للطلبات فقط)
4. أضف مطاعمك وأصنافك في جداول `restaurants` / `categories` / `menu_items`.

بمجرد ضبط المتغيّرات تتحوّل المنصّة تلقائياً من البيانات التجريبية إلى قاعدة البيانات الحقيقية.

## للنشر (Netlify جديد)
اربط المستودع بموقع Netlify جديد وأضف متغيّرات Supabase الثلاثة في إعداداته. `netlify.toml` جاهز.

## البنية
- `src/app/page.tsx` — الصفحة التعريفية + المطاعم التجريبية.
- `src/app/[slug]/page.tsx` — منيو مطعم واحد.
- `src/components/TenantMenu.tsx` — واجهة المنيو اللوحية (أقسام يمين + شبكة + سلة + طلب)، تتلوّن بلون المطعم.
- `src/lib/menu-data.ts` — طبقة البيانات (قاعدة حقيقية أو تجريبية).
- `src/lib/actions.ts` — `placeOrder`.
- `supabase/migrations/0001_init.sql` — مخطط متعدد المطاعم.

## القادم
لوحة إدارة لكل مطعم · تسجيل ذاتي + توليد QR/NFC للطاولات · الاشتراكات.
