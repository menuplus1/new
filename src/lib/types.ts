import type { Plan } from "./plans";

export type OrderType = "dine_in" | "delivery" | "takeaway";
export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  dine_in: "صالة",
  delivery: "دلفري",
  takeaway: "سفري",
};

/* ————— languages ————— */
export type Lang = "ar" | "en" | "ckb";
export const LANG_LABEL: Record<Lang, string> = { ar: "العربية", en: "English", ckb: "کوردی" };
/** translations live as {en: {name: "..", description: ".."}, ckb: {...}} — Arabic is the base row */
export type I18n = Partial<Record<Exclude<Lang, "ar">, Record<string, string | undefined>>>;
export function tr(i18n: I18n | null | undefined, lang: Lang, field: string, fallback: string | null): string | null {
  if (lang === "ar") return fallback;
  return i18n?.[lang]?.[field] || fallback;
}

/* ————— working hours ————— */
/** 7 entries indexed by JS getDay() (0 = الأحد). close < open means the range spans midnight. */
export type DayHours = { closed: boolean; open: string; close: string };
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
export function isOpenNow(hours: DayHours[] | null | undefined): boolean | null {
  if (!hours || hours.length !== 7) return null;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const today = hours[now.getDay()];
  const yest = hours[(now.getDay() + 6) % 7];
  if (!today.closed) {
    const o = toMin(today.open);
    const c = toMin(today.close);
    // normal range, or the pre-midnight side of an overnight range (close < open)
    if (c > o ? cur >= o && cur < c : cur >= o) return true;
  }
  // yesterday's overnight spill past midnight (e.g. opens 20:00, closes 02:00)
  if (!yest.closed && toMin(yest.close) < toMin(yest.open) && cur < toMin(yest.close)) return true;
  return false;
}

export const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/* ————— validation shared by forms and server actions ————— */
export function orderProblem(o: { orderType: OrderType; phone: string | null; address: string | null }): string | null {
  if (o.orderType !== "dine_in" && !o.phone?.trim()) return "الرجاء إدخال رقم الهاتف.";
  if (o.orderType === "delivery" && !o.address?.trim()) return "الرجاء كتابة عنوان التوصيل.";
  return null;
}

export function reservationProblem(r: { name: string; phone: string; date: string; time: string; guests: number }): string | null {
  if (!r.name.trim()) return "الرجاء كتابة الاسم.";
  if (!r.phone.trim()) return "الرجاء إدخال رقم الهاتف.";
  if (!r.date || !r.time) return "الرجاء اختيار التاريخ والوقت.";
  if (r.guests < 1) return "عدد الأشخاص غير صحيح.";
  return null;
}

export function reviewProblem(r: { stars: number; name: string; comment: string }): string | null {
  if (!Number.isInteger(r.stars) || r.stars < 1 || r.stars > 5) return "اختر تقييماً من ١ إلى ٥ نجوم.";
  if (!r.name.trim() || r.name.length > 60) return "الرجاء كتابة الاسم.";
  if (r.comment.length > 500) return "التعليق طويل جداً.";
  return null;
}

/* ————— entities ————— */
export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string; // brand accent (hex)
  currency: string; // e.g. "د.ع"
  ordering: boolean; // manager toggle: does this tenant accept orders?
  order_types: OrderType[]; // which ways to order the manager keeps on
  reservations: boolean; // manager toggle: table booking on/off
  plan: Plan;
  apps: string[]; // activated store apps ("booking" | "promos")
  template: number; // 1..6
  tagline: string | null;
  about: string | null;
  socials: Record<string, string>; // instagram/whatsapp/facebook/tiktok → url
  hours: DayHours[] | null;
  languages: Lang[]; // always includes "ar"
  i18n: I18n; // name/tagline/about translations
  seo: { title?: string; description?: string };
  covers: string[]; // cover URLs (or CSS gradients in demo mode)
  hide_branding: boolean;
  health_cert: string | null; // رقم الإجازة الصحية
  whatsapp_phone?: string | null;
};

export type Variant = { id: string; name: string; price: number };
export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  variants: Variant[];
  i18n: I18n;
};
export type Category = { id: string; name: string; image_url: string | null; items: MenuItem[]; i18n: I18n };
export type Promo = { id: string; title: string; description: string | null; image_url: string | null };
export type MenuData = {
  restaurant: Restaurant;
  categories: Category[];
  promos: Promo[];
  rating: { avg: number; count: number } | null;
};
