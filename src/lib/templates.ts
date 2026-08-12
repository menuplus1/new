/** المصدر الوحيد لقائمة القوالب — تستورده صفحة الهبوط ولوحة التحكم وصفحة التسجيل.
 *  ١–٦ قوالب المنصّة، و٧–١٦ «الورقة» بمنيوهات جاهزة منسوخة عن مطاعم حقيقية
 *  (نفس المكوّن، تختلف بالسِمة واللون والمنيو — لذلك لا داعي لعشرة مكوّنات).
 *  خفيف بقصد: لا يستورد بيانات الأصناف (odd-menus) حتى لا تدخل حزمة المتصفّح. */

import { ODD_META, oddDemoSlug } from "./odd-meta";
import { STARTERS } from "./starter-menus";

export type Tpl = {
  n: number;
  name: string;
  desc: string;
  chips: [string, string, string];
  /** متاح في الباقة المجانية */
  free?: boolean;
  /** مثال لمطعم حقيقي يستخدم هذا الشكل */
  example?: string;
  /** رابط المعاينة الحيّة */
  preview: string;
  /** أسماء الأقسام التي تُزرع جاهزة عند التسجيل */
  cats: string[];
  /** عدد الأصناف الجاهزة */
  items: number;
  /** لون العلامة الافتراضي لهذا القالب — يُطبَّق فعلياً على المطعم عند اختياره */
  accent: string;
};

const BUILT_IN: Omit<Tpl, "preview" | "cats" | "items">[] = [
  { n: 1, name: "اللوحي الداكن", desc: "أقسام جانبية وشبكة صور — تجربة تابلت", chips: ["شبكة صور", "أقسام جانبية", "داكن"], free: true, example: "https://pizzara-modern.netlify.app/menu" , accent: "#d18b4a" },
  { n: 2, name: "بطاقات الأقسام", desc: "غلاف كبير وبطاقة صورة لكل قسم", chips: ["غلاف كبير", "بطاقات أقسام", "فاتح"] , accent: "#2f9e7a" },
  { n: 3, name: "الفاخر", desc: "عاجيّ وذهبي بلمسة راقية", chips: ["راقٍ", "متعدد اللغات", "لاونج"] , accent: "#b08d3e" },
  { n: 4, name: "الداكن السريع", desc: "صفحة واحدة وشبكة أصناف — وجبات سريعة", chips: ["سريع", "وجبات سريعة", "داكن"] , accent: "#10b3a3" },
  { n: 5, name: "المدمج", desc: "قائمة مضغوطة سريعة التصفح", chips: ["مضغوط", "سريع التصفح", "فاتح"] , accent: "#6b4226" },
  { n: 6, name: "الدافئ", desc: "ألوان كريمية دافئة — مقاهٍ ومخابز", chips: ["دافئ", "مقاهٍ", "مخابز"] , accent: "#c98a2b" },
];

export const TPLS: Tpl[] = [
  ...BUILT_IN.map((t) => {
    const st = STARTERS[t.n];
    return {
      ...t,
      preview: `/sham?tpl=${t.n}`,
      cats: st ? st.cats.map((c) => c.name) : [],
      items: st ? st.cats.reduce((n, c) => n + c.items.length, 0) : 0,
    };
  }),
  ...ODD_META.map(
    (s): Tpl => ({
      n: s.tpl,
      name: `${s.look} — ${s.name}`,
      desc: `${s.kind} · منيو جاهز بـ${s.items} صنفاً وصورها`,
      chips: [s.kind, `${s.catNames.length} أقسام`, s.skin === "dark" ? "داكن" : "فاتح"],
      preview: `/${oddDemoSlug(s.key)}`,
      cats: s.catNames,
      items: s.items,
      accent: s.accent,
    }),
  ),
];

export const TPL_BY_N: Record<number, Tpl> = Object.fromEntries(TPLS.map((t) => [t.n, t]));
export const TPL_MAX = TPLS[TPLS.length - 1].n;
/** يقصّ أي رقم قالب داخل المدى المتاح */
export const clampTpl = (n: number) => Math.min(TPL_MAX, Math.max(1, Math.round(n) || 1));
