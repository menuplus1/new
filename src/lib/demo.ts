import type { MenuData } from "./types";

/** Demo tenants — the platform renders these when no database is connected yet,
 *  so the multi-restaurant idea is visible immediately. Replace with live data
 *  once Supabase is wired. */

function cat(name: string, items: [string, number, string?][]) {
  return {
    id: name,
    name,
    items: items.map(([n, p, d], i) => ({ id: `${name}-${i}`, name: n, description: d ?? null, image_url: null, price: p, variants: [] })),
  };
}

export const DEMO: Record<string, MenuData> = {
  dallah: {
    restaurant: { id: "dallah", slug: "dallah", name: "قهوة الدلّة", logo_url: null, primary_color: "#d18b4a", currency: "د.ع", ordering: true },
    categories: [
      cat("المشروبات الساخنة", [["إسبريسو", 2500], ["لاتيه", 3000], ["كابتشينو", 3000], ["موكا", 3500], ["قهوة تركية", 2500], ["شاي كرك", 1500]]),
      cat("المشروبات الباردة", [["آيس لاتيه", 3500], ["آيس أمريكانو", 3000], ["فرابتشينو", 4000], ["موهيتو", 4000]]),
      cat("الحلويات", [["تشيز كيك", 4000], ["كوكيز", 2500], ["كرواسون", 2000]]),
    ],
  },
  sham: {
    restaurant: { id: "sham", slug: "sham", name: "مطعم بيت الشام", logo_url: null, primary_color: "#2f9e7a", currency: "د.ع", ordering: true },
    categories: [
      cat("المقبلات", [["حمص", 3000], ["متبل", 3000], ["تبولة", 3500], ["فتوش", 3500]]),
      cat("المشاوي", [["شيش طاووق", 9000], ["كباب لحم", 10000], ["ريش غنم", 14000], ["مشاوي مشكّلة", 18000]]),
      cat("الأطباق الرئيسية", [["مندي دجاج", 8000], ["برياني لحم", 11000], ["مقلوبة", 9000]]),
      cat("المشروبات", [["عصير برتقال", 3000], ["ليمون نعناع", 3000], ["مياه", 500]]),
    ],
  },
};

export const DEMO_LIST = Object.values(DEMO).map((m) => ({ slug: m.restaurant.slug, name: m.restaurant.name, color: m.restaurant.primary_color }));
