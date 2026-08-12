/** نشر منيو بلس على استضافة cPanel (Namecheap Stellar).
 *
 *  الأهم: يحذف .next القديم على الخادم قبل الرفع. الدمج فوق بناء قديم يخلط
 *  ملفات الـchunks فتنكسر server actions برسالة
 *  «The Server Reference ID did not match the expected format» — حدث فعلاً.
 *
 *  الاستعمال:
 *    npm run build
 *    CPANEL_TOKEN="user:token" node scripts/deploy.mjs
 *  ثم افتح cPanel → Node.js → RESTART (فكّ الضغط والتشغيل يدويان لأن UAPI
 *  في هذا الخادم بلا دالة extract).
 */
import { createReadStream, existsSync, cpSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const HOST = process.env.CPANEL_HOST ?? "https://server407.web-hosting.com:2083";
const APP = process.env.CPANEL_APP_DIR ?? "/home/menujbwz/menuplus";
const TOKEN = process.env.CPANEL_TOKEN; // "menujbwz:XXXXXXXX"
if (!TOKEN) {
  console.error("ضع التوكن أولاً:  CPANEL_TOKEN=\"user:token\" node scripts/deploy.mjs");
  process.exit(1);
}
const auth = { Authorization: `cpanel ${TOKEN}` };
const root = path.resolve(import.meta.dirname, "..");
const standalone = path.join(root, ".next", "standalone");
if (!existsSync(standalone)) {
  console.error("لا يوجد .next/standalone — شغّل npm run build أولاً.");
  process.exit(1);
}

/** يستدعي API2 fileop (UAPI هنا بلا trash/extract) */
async function fileop(op, sourcefiles) {
  const u = new URL(`${HOST}/json-api/cpanel`);
  u.search = new URLSearchParams({
    cpanel_jsonapi_user: TOKEN.split(":")[0],
    cpanel_jsonapi_apiversion: "2",
    cpanel_jsonapi_module: "Fileman",
    cpanel_jsonapi_func: "fileop",
    op,
    sourcefiles,
    doubledot: "0",
  }).toString();
  const r = await fetch(u, { headers: auth });
  return r.json();
}

// 1) الحزمة: standalone + static + public + متغيّرات البيئة
console.log("… تجهيز الحزمة");
cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true });
cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
if (existsSync(path.join(root, ".env.local"))) {
  cpSync(path.join(root, ".env.local"), path.join(standalone, ".env.local"));
}
const zip = path.join(root, ".next", "deploy.zip");
// zip بمسارات POSIX. Compress-Archive في ويندوز يكتب شرطات خلفية فيفشل فكّها على
// لينكس فتضيع ملفات .next/static — لذلك نبني الأرشيف بـ python zipfile.
const PY = [
  "import os, sys, zipfile",
  "src, out = sys.argv[1], sys.argv[2]",
  "os.path.exists(out) and os.remove(out)",
  "z = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=6)",
  "[z.write(os.path.join(r, f), os.path.relpath(os.path.join(r, f), src).replace(chr(92), '/')) for r, _d, fs in os.walk(src) for f in fs]",
  "z.close()",
  "print('zipped', round(os.path.getsize(out) / 1048576, 2), 'MB')",
].join(String.fromCharCode(10));
execFileSync("python", ["-c", PY, standalone, zip], { stdio: "inherit" });

// 2) حذف البناء القديم — الخطوة التي تمنع خلط الإصدارات
console.log("… حذف .next القديم على الخادم");
console.log("   ", JSON.stringify(await fileop("trash", `${APP}/.next`)).slice(0, 120));

// 3) الرفع
console.log("… رفع الحزمة");
const form = new FormData();
form.set("dir", APP);
form.set("file-1", new Blob([readFileSync(zip)]), "deploy.zip");
const up = await fetch(`${HOST}/execute/Fileman/upload_files`, { method: "POST", headers: auth, body: form });
console.log("   ", JSON.stringify(await up.json()).slice(0, 160));

// 4) الفكّ عبر API2 (UAPI بلا extract)، ثم إعادة تشغيل Passenger بلمس restart.txt
console.log("… فكّ الحزمة");
console.log("   ", JSON.stringify(await fileop("extract", `${APP}/deploy.zip`)).slice(0, 120));
await new Promise((r) => setTimeout(r, 8000));
console.log("… إعادة التشغيل");
const touch = new URLSearchParams({ dir: `${APP}/tmp`, file: "restart.txt", content: new Date().toISOString(), charset: "utf-8" });
await fetch(`${HOST}/execute/Fileman/save_file_content`, { method: "POST", headers: auth, body: touch });
console.log("تم النشر. تحقّق: https://menuplus.rest");
