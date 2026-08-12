# نشر منيو بلس — الموقع حيّ على https://menuplus.rest

## ما هو منشور الآن
- **الاستضافة**: Namecheap Stellar (cPanel) — تطبيق Node.js على `/home/menujbwz/menuplus`
  بإصدار **Node 24.18** ووضع Production، ملف البدء `server.js`.
- **الدومين**: `menuplus.rest` من نفس الحساب (لا يحتاج سجلات DNS إضافية).
- **قاعدة البيانات**: Supabase (`ctozurhbkdqtonzidyzd`) — المتغيّرات في `.env.local` داخل
  الحزمة المرفوعة، فلا شيء سرّي في المستودع.

## النشر (خطوتان)

```bash
npm run build
CPANEL_TOKEN="menujbwz:<التوكن>" npm run deploy
```

`scripts/deploy.mjs` يجهّز الحزمة (standalone + static + public + `.env.local`)،
**يحذف `.next` القديم من الخادم**، ثم يرفع `deploy.zip`.

ثم من cPanel:
1. **File Manager** → `/home/menujbwz/menuplus` → حدّد `deploy.zip` → **Extract** إلى نفس المجلد.
2. **Setup Node.js App** → التطبيق → **RESTART**.

> التوكن من cPanel → **Manage API Tokens**. احذفه متى شئت وأنشئ غيره عند الحاجة.

## لماذا حذف `.next` قبل الرفع؟
فكّ حزمة جديدة **فوق** بناء قديم يترك ملفات chunks من الإصدارين معاً، فتنكسر
server actions برسالة في `stderr.log`:

```
The Server Reference ID did not match the expected format. Received "y"
```

وهذا ما حدث فعلاً في أول نشر للوحة المنصّة: الصفحة تُحمَّل ثم تسقط عند أول نداء
للخادم. الحلّ حذف `.next` أولاً — وهو ما يفعله سكربت النشر تلقائياً.

## التشخيص عند أي عطل
`stderr.log` في مجلد التطبيق هو أول مكان تنظر فيه:

```bash
curl -s -H "Authorization: cpanel $CPANEL_TOKEN" \
  --get --data-urlencode "dir=/home/menujbwz/menuplus" --data-urlencode "file=stderr.log" \
  "https://server407.web-hosting.com:2083/execute/Fileman/get_file_content"
```

## الحسابات
| الدور | الرابط | الحساب |
|---|---|---|
| مدير المنصّة | `menuplus.rest/root` | `admin@menuplus.rest` |
| مطعم | `menuplus.rest/admin` | حساب المطعم |

## الهجرات
شغّل ملفات `supabase/migrations/` بالترتيب من SQL Editor (`0001` → `0013`).
المطبَّق حالياً على الإنتاج: كلها.
