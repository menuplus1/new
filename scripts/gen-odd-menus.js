/* Generates src/lib/odd-menus.ts from the 10 downloaded oddmenu payloads. */
const fs = require("fs");
const path = require("path");

const OUT = "C:/Users/al3r1/OneDrive/Desktop/Menu/src/lib/odd-menus.ts";

/** user's numbering → slug, plus the bits that need human judgement */
const ORDER = [
  ["hikaytalsayad", "حكاية الصياد", "مطعم أسماك ومشاوي عراقية", "الفيروزي الفاتح"],
  ["albarari", "لحوم البراري", "مطعم لحوم ومشاوي", "العنابي الفاتح"],
  ["bs-chai", "بس چاي", "چايخانة وكافيه", "الزيتي الداكن"],
  ["saj-alarba", "صاج العرب", "صاج وفطور شعبي", "الرملي الفاتح"],
  ["fayrouz-cafe-1", "فيروز كافيه", "كافيه ومطعم", "القرميدي الفاتح"],
  ["al-basal-basha-rest", "مطعم الباشا", "مطعم عراقي شامل", "المشمشي الفاتح"],
  ["italiankalar", "إيتاليان كوزين", "مطبخ إيطالي", "الليموني الداكن"],
  ["naas-restaurant", "مطعم ناس", "مطعم وجبات وبرغر", "الأرجواني الفاتح"],
  ["madoduhok", "مادو", "حلويات وآيس كريم وكافيه", "الرمادي الداكن"],
  ["dark-bluerestaurant1", "دارك بلو", "مطعم عالمي وكافيه", "الأزرق الداكن"],
];

const FALLBACK_ACCENT = { "saj-alarba": "#c98f4b" };

const q = (s) => JSON.stringify(s ?? null);
const file = (u) => (u ? String(u) : null);

const sets = ORDER.map(([slug, name, kind, look], idx) => {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, "odd", slug + ".json"), "utf8"));
  const p = d.place;

  const menus = d.menus.filter((m) => m.isVisible).sort((a, b) => a.position - b.position);
  const menuName = new Map(menus.map((m) => [m.id, (m.info && m.info.name || "").trim()]));
  const menuPos = new Map(menus.map((m, i) => [m.id, i]));

  const cats = d.menuCategories
    .filter((c) => c.isVisible && menuPos.has(c.menuId))
    .sort((a, b) => (menuPos.get(a.menuId) - menuPos.get(b.menuId)) || (a.position - b.position));

  const items = d.menuItems.filter((i) => i.isVisible);
  const byCat = new Map();
  for (const it of items) {
    const arr = byCat.get(it.menuCategoryId) || [];
    arr.push(it);
    byCat.set(it.menuCategoryId, arr);
  }

  // a category name may repeat across menu groups — qualify the duplicates
  const seen = new Map();
  const outCats = [];
  for (const c of cats) {
    const raw = ((c.info && c.info.name) || "").trim();
    if (!raw) continue;
    const rows = (byCat.get(c.id) || []).sort((a, b) => a.position - b.position);
    if (!rows.length) continue; // an empty section is noise in a starter menu
    const n = (seen.get(raw) || 0) + 1;
    seen.set(raw, n);
    const mn = menuName.get(c.menuId);
    const name = n > 1 && mn ? `${raw} — ${mn}` : raw;
    outCats.push({
      name,
      tile: file(c.croppedImage || c.image),
      items: rows.map((it) => {
        const info = it.info || {};
        const desc = (info.description || "").trim();
        const weight = (info.weight || "").trim();
        return {
          name: (info.name || "").trim(),
          price: Math.round(Number(it.price) || 0),
          img: file(it.croppedImage || it.image),
          desc: [desc, weight].filter(Boolean).join(" · ") || null,
        };
      }).filter((x) => x.name),
    });
  }

  return {
    tpl: 7 + idx,
    key: slug,
    name,
    kind,
    look,
    skin: p.theme === "DARK" ? "dark" : "light",
    accent: (p.themeColor || "").trim() || FALLBACK_ACCENT[slug] || "#c98f4b",
    logo: file(p.croppedLogo || p.logo),
    cover: file(p.bgImage),
    address: [(p.info || {}).address, (p.info || {}).city].filter(Boolean).join(", ") || null,
    phone: (p.phone || "").trim() || null,
    cats: outCats,
  };
});

const body = sets
  .map(
    (s) => `  {
    tpl: ${s.tpl},
    key: ${q(s.key)},
    name: ${q(s.name)},
    kind: ${q(s.kind)},
    look: ${q(s.look)},
    skin: ${q(s.skin)},
    accent: ${q(s.accent)},
    logo: ${q(s.logo)},
    cover: ${q(s.cover)},
    address: ${q(s.address)},
    phone: ${q(s.phone)},
    cats: [
${s.cats
  .map(
    (c) => `      {
        name: ${q(c.name)},
        tile: ${q(c.tile)},
        items: [
${c.items.map((i) => `          [${q(i.name)}, ${i.price}, ${q(i.img)}, ${q(i.desc)}],`).join("\n")}
        ],
      },`,
  )
  .join("\n")}
    ],
  },`,
  )
  .join("\n");

const out = `/** القوالب ٧–١٦ — منيوهات جاهزة منسوخة عن ١٠ مطاعم عراقية حقيقية.
 *  مولّد آلياً — لا تعدّله بيدك؛ عدّل السكربت الذي أنشأه.
 *  الأصناف والأقسام والأسماء والصور كما هي؛ المطعم يغيّر الاسم والشعار فقط.
 *  الصور تُخدَم من CDN المصدر (لا نسخ محلية) — ${sets.reduce((n, s) => n + s.cats.reduce((m, c) => m + c.items.length, 0), 0)} صنفاً في ${sets.reduce((n, s) => n + s.cats.length, 0)} قسماً. */

const CDN = "https://dyj6gt4964deb.cloudfront.net/images/";
/** اسم ملف الصورة → رابط كامل */
export const oddImg = (f: string | null): string | null => (f ? CDN + f : null);

/** [الاسم، السعر، الصورة، الوصف] */
export type OddItem = [name: string, price: number, img: string | null, desc: string | null];
export type OddCat = { name: string; tile: string | null; items: OddItem[] };
export type OddSet = {
  /** رقم القالب في المنصّة (٧…١٦) */
  tpl: number;
  key: string;
  /** اسم المطعم الأصلي — يُستبدل باسم المشترك */
  name: string;
  /** نوع المطعم، يظهر في اختيار القالب */
  kind: string;
  /** وصف الشكل (لون/سِمة) */
  look: string;
  skin: "light" | "dark";
  accent: string;
  logo: string | null;
  cover: string | null;
  address: string | null;
  phone: string | null;
  cats: OddCat[];
};

export const ODD_SETS: OddSet[] = [
${body}
];

export const ODD_BY_TPL: Record<number, OddSet> = Object.fromEntries(ODD_SETS.map((s) => [s.tpl, s]));
/** أول قالب أودمنيو وآخره */
export const ODD_FIRST = ${sets[0].tpl};
export const ODD_LAST = ${sets[sets.length - 1].tpl};
`;

fs.writeFileSync(OUT, out, "utf8");

/* ————— a light twin the client bundle can import (no items, no image lists) ————— */
const META = "C:/Users/al3r1/OneDrive/Desktop/Menu/src/lib/odd-meta.ts";
const meta = `/** بطاقة تعريف كل قالب من القوالب ٧–١٦ — بلا أصناف، ليستوردها المتصفّح بأمان.
 *  مولّد آلياً مع odd-menus.ts (نفس السكربت) — البيانات الكاملة هناك (للسيرفر فقط). */

export type OddMeta = {
  tpl: number;
  key: string;
  /** اسم المطعم الأصلي المنسوخ عنه */
  name: string;
  kind: string;
  look: string;
  skin: "light" | "dark";
  accent: string;
  logo: string | null;
  cover: string | null;
  /** أسماء الأقسام الجاهزة */
  catNames: string[];
  items: number;
};

const CDN = "https://dyj6gt4964deb.cloudfront.net/images/";
export const oddMetaImg = (f: string | null): string | null => (f ? CDN + f : null);

export const ODD_META: OddMeta[] = [
${sets
  .map(
    (s) => `  { tpl: ${s.tpl}, key: ${q(s.key)}, name: ${q(s.name)}, kind: ${q(s.kind)}, look: ${q(s.look)}, skin: ${q(s.skin)}, accent: ${q(s.accent)}, logo: ${q(s.logo)}, cover: ${q(s.cover)}, items: ${s.cats.reduce((m, c) => m + c.items.length, 0)}, catNames: [${s.cats.map((c) => q(c.name)).join(", ")}] },`,
  )
  .join("\n")}
];

export const ODD_META_BY_TPL: Record<number, OddMeta> = Object.fromEntries(ODD_META.map((s) => [s.tpl, s]));
/** سِمة القالب — تُمرَّر لمكوّن Odd */
export const oddSkin = (tpl: number): "light" | "dark" | null => ODD_META_BY_TPL[tpl]?.skin ?? null;
/** رابط المطعم التجريبي الذي يعرض المنيو المنسوخ كما هو */
export const oddDemoSlug = (key: string) => \`odd-\${key}\`;
export const ODD_FIRST_TPL = ${sets[0].tpl};
export const ODD_LAST_TPL = ${sets[sets.length - 1].tpl};
`;
fs.writeFileSync(META, meta, "utf8");
console.log("wrote", META, (meta.length / 1024).toFixed(1) + "KB");
const items = sets.reduce((n, s) => n + s.cats.reduce((m, c) => m + c.items.length, 0), 0);
console.log("wrote", OUT, (out.length / 1024).toFixed(0) + "KB");
for (const s of sets) console.log(s.tpl, s.key.padEnd(22), s.skin, s.accent.padEnd(8), "cats", String(s.cats.length).padStart(2), "items", s.cats.reduce((m, c) => m + c.items.length, 0));
console.log("TOTAL items", items);
