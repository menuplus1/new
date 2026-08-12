# نشر منيو بلس وربط الدومين menuplus.rest

المنصّة تطبيق **Node.js (Next.js 16)** — ليست صفحات HTML ثابتة. أي استضافة تشغّله
يجب أن تشغّل عملية Node مستمرة (طلبات، لوحة التحكم، مفتاح Supabase السري).

الدومين مسجّل في Namecheap ونيم سيرفراته الآن: `dns1/dns2.namecheaphosting.com`
ويشير إلى صفحة إيقاف (Parking).

---

## المسار (أ) — استضافة Namecheap الحالية (cPanel + Node.js)

يعمل **فقط** إن كانت باقتك تُظهر في cPanel أداة **Setup Node.js App**
(متوفّرة في Stellar / Stellar Plus / Stellar Business، وغير متوفّرة في باقات الاستضافة الثابتة).

### 1) جهّز الحزمة (نفّذتُها لك محلياً وهي جاهزة)
```bash
npm run build
```
تنتج `.next/standalone/` — خادم مستقل حجمه ~25MB يشمل `server.js` و`node_modules`
المطلوبة فقط، وقد نسخنا معه `.next/static` و`public`. جُرِّب فعلياً وردّ 200 على
الصفحة الرئيسية ومنيو مطعم وصفحة التسجيل.

### 2) ارفعه إلى الخادم
- ارفع محتويات `.next/standalone/` (بما فيها `.next` و`public`) إلى مجلد التطبيق، مثل `~/menuplus`.

### 3) cPanel → Setup Node.js App
| الحقل | القيمة |
|---|---|
| Node.js version | 20 أو أحدث |
| Application mode | Production |
| Application root | `menuplus` |
| Application URL | `menuplus.rest` |
| Application startup file | `server.js` |

ثم **Environment variables** (نفس قيم `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://ctozurhbkdqtonzidyzd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=3000
HOSTNAME=0.0.0.0
```
ثم **Run JS script → start**، وبعدها **Restart**.

> ملاحظة: `SUPABASE_SERVICE_ROLE_KEY` سرّي — يبقى في متغيّرات الخادم فقط، ولا يُرفع إلى GitHub.

### 4) DNS في Namecheap
مع استضافة Namecheap نفسها لا تحتاج تعديل DNS — التطبيق يُربط بالدومين من cPanel
مباشرة. تأكّد فقط أن Domain List → menuplus.rest → **Nameservers = Namecheap Web Hosting DNS**
(وهي كذلك الآن).

---

## المسار (ب) — الأسرع والأثبت: استضافة التطبيق خارجياً والدومين يبقى عندك

إن لم تجد **Setup Node.js App** في cPanel، انشر على Vercel (مجاناً) واربط الدومين:

1. vercel.com → Add New Project → استورد `menuplus1/new` من GitHub.
2. أضف المتغيّرات الثلاثة أعلاه في Project Settings → Environment Variables.
3. Settings → Domains → أضف `menuplus.rest` و`www.menuplus.rest`.
4. في Namecheap → Domain List → menuplus.rest → **Advanced DNS**، واضبط:

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | `@` | `76.76.21.21` | Automatic |
| CNAME | `www` | `cname.vercel-dns.com.` | Automatic |

(احذف سجلّي الـParking `@` و`www` القديمين أولاً.)

للانتشار: عادة دقائق، وقد يصل إلى ساعة. تحقّق بـ:
```bash
nslookup menuplus.rest
```

---

## بعد الربط
- `https://menuplus.rest` الصفحة التعريفية، و`https://menuplus.rest/<اسم-المطعم>` منيو كل مطعم.
- الروابط في الكود (sitemap · robots · OpenGraph · روابط QR للطاولات) مضبوطة على
  `https://menuplus.rest` — لا شيء يحتاج تعديلاً بعد الربط.
