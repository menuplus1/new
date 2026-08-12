import { IMG } from "./food-images";
import { oddDemos } from "./odd-build";
import type { Category, DayHours, MenuData } from "./types";

/** Demo tenants — the platform renders these when no database is connected yet,
 *  and they are what the landing's live template previews show. Real photos and
 *  real prices, because that showcase is the product pitch.
 *  dallah = الباقة الأساسية (منيو للعرض فقط، لغتان، قالب مدمج) —
 *  sham   = الباقة الشاملة (كل الميزات: طلبات، حجز، عروض، تقييمات، ٣ لغات). */

type Row = [name: string, price: number, image: string, en?: string, desc?: string, extra?: string[]];

function cat(name: string, en: string, tile: string, items: Row[]): Category {
  return {
    id: name,
    name,
    image_url: tile,
    i18n: { en: { name: en } },
    items: items.map(([n, p, img, e, d, extra], i) => ({
      id: `${name}-${i}`,
      name: n,
      description: d ?? null,
      image_url: img,
      images: extra ?? [],
      price: p,
      variants: [],
      i18n: e ? { en: { name: e } } : {},
    })),
  };
}

const WEEK = (open: string, close: string, closedDay?: number): DayHours[] =>
  Array.from({ length: 7 }, (_, d) => ({ closed: d === closedDay, open, close }));

export const DEMO: Record<string, MenuData> = {
  dallah: {
    restaurant: {
      id: "dallah",
      slug: "dallah",
      name: "قهوة الدلّة",
      logo_url: null,
      primary_color: "#d18b4a",
      currency: "د.ع",
      ordering: true,
      order_types: ["dine_in", "takeaway"],
      reservations: false,
      plan: "basic", // منيو للعرض فقط — السلة تظهر من باقة التميز
      apps: [],
      template: 5,
      tagline: "قهوة مختصة وحلويات بيتية",
      about: "مقهى صغير في قلب بغداد — نحمّص قهوتنا أسبوعياً ونخبز حلوياتنا كل صباح.",
      socials: { instagram: "https://instagram.com/dallah", whatsapp: "https://wa.me/9647700000000" },
      hours: WEEK("08:00", "23:00"),
      languages: ["ar", "en"],
      i18n: { en: { name: "Dallah Coffee", tagline: "Specialty coffee & homemade sweets" } },
      seo: {},
      covers: [IMG.coverCafe],
      hide_branding: false,
      health_cert: null,
    },
    categories: [
      cat("المشروبات الساخنة", "Hot Drinks", IMG.latte, [
        ["إسبريسو", 2500, IMG.coffeeCookies, "Espresso"],
        ["لاتيه", 3500, IMG.latte, "Latte"],
        ["كابتشينو", 3500, IMG.cappuccino, "Cappuccino"],
        ["چاي كرك", 1500, IMG.tea, "Karak Tea"],
      ]),
      cat("المشروبات الباردة", "Cold Drinks", IMG.icedLatte, [
        ["آيس لاتيه", 4000, IMG.icedLatte, "Iced Latte"],
        ["كولد برو", 4500, IMG.coldBrew, "Cold Brew"],
        ["سموذي فراولة", 5000, IMG.smoothie, "Strawberry Smoothie"],
        ["ليمون نعناع", 3000, IMG.lemonMint, "Mint Lemonade"],
      ]),
      cat("الحلويات", "Desserts", IMG.chocolateDessert, [
        ["كوكيز", 2500, IMG.cookies, "Cookies"],
        ["حلى الشوكولاتة", 6000, IMG.chocolateDessert, "Chocolate Dessert"],
        ["كرواسون", 3000, IMG.croissant, "Croissant"],
        ["كيكة الشوكولاتة", 5000, IMG.chocolateCake, "Chocolate Cake"],
      ]),
    ],
    promos: [],
    rating: { avg: 4.6, count: 18 },
  },

  sham: {
    restaurant: {
      id: "sham",
      slug: "sham",
      name: "مطعم بيت الشام",
      logo_url: null,
      primary_color: "#2f9e7a",
      currency: "د.ع",
      ordering: true,
      order_types: ["dine_in", "delivery", "takeaway"],
      reservations: true,
      plan: "ultimate",
      apps: [],
      template: 1,
      tagline: "مأكولات شامية وعراقية أصيلة منذ ١٩٨٨",
      about: "مطبخ عريق — مشاوي على الفحم، مقبلات طازجة يومياً، وجلسات عائلية.",
      socials: {
        instagram: "https://instagram.com/sham",
        facebook: "https://facebook.com/sham",
        whatsapp: "https://wa.me/9647711111111",
      },
      hours: WEEK("11:00", "01:00", 1), // يغلق الاثنين، ويسهر بعد منتصف الليل
      languages: ["ar", "en", "ckb"],
      i18n: {
        en: { name: "Bait Al-Sham", tagline: "Authentic Levantine cuisine since 1988" },
        ckb: { name: "ماڵی شام", tagline: "خواردنی شامی ڕەسەن لە ١٩٨٨ەوە" },
      },
      seo: {
        title: "بيت الشام — مشاوي ومأكولات شامية في بغداد",
        description: "منيو مطعم بيت الشام: مشاوي على الفحم، مقبلات، وأطباق شامية أصيلة.",
      },
      covers: [IMG.coverGrill, IMG.coverRestaurant],
      hide_branding: false,
      health_cert: "إجازة صحية رقم 4821 — بغداد",
    },
    categories: [
      cat("المقبلات", "Starters", IMG.mezze, [
        ["مقبلات مشكّلة", 5000, IMG.mezze, "Mezze", "حمص · متبل · مخللات", [IMG.salad, IMG.samosa]],
        ["سمبوسة", 2000, IMG.samosa, "Samosa", "٤ حبات"],
        ["سلطة عراقية", 2500, IMG.salad, "Iraqi Salad"],
      ]),
      cat("المشاوي", "Grills", IMG.kebab, [
        ["كباب عراقي", 12000, IMG.kebab, "Iraqi Kebab", "لحم غنم على الفحم", [IMG.grilledPlate, IMG.tikka]],
        ["تكة لحم", 13000, IMG.tikka, "Lamb Tikka"],
        ["شيش طاووق", 10000, IMG.grilledPlate, "Shish Tawook"],
        ["مشاوي مشكّلة", 22000, IMG.mixedGrill, "Mixed Grill", "تكفي شخصين", [IMG.ribs, IMG.grilledChicken]],
      ]),
      cat("الأطباق الرئيسية", "Mains", IMG.tashreeb, [
        ["تشريب", 9000, IMG.tashreeb, "Tashreeb"],
        ["ربيان بالرز", 15000, IMG.shrimpRice, "Shrimp Rice", "طبق بصراوي"],
        ["دجاج مشوي", 11000, IMG.grilledChicken, "Grilled Chicken", "نصف دجاجة"],
      ]),
      cat("المشروبات", "Drinks", IMG.tea, [
        ["چاي عراقي", 1000, IMG.tea, "Iraqi Tea"],
        ["عصير برتقال", 3000, IMG.orangeJuice, "Orange Juice"],
        ["ليمون نعناع", 3000, IMG.lemonMint, "Mint Lemonade"],
      ]),
    ],
    promos: [
      { id: "p1", title: "خصم 20% على المشاوي المشكّلة", description: "يومياً من ٣ إلى ٦ مساءً", image_url: null },
      { id: "p2", title: "عرض العائلة: مشاوي + مقبلات + مشروبات", description: "45,000 د.ع بدل 55,000", image_url: null },
    ],
    rating: { avg: 4.8, count: 127 },
  },
  // القوالب ٧–١٦: معاينة كل منيو منسوخ على /odd-<key> بأقسامه وأصنافه وصورها
  ...oddDemos(),
};

/** مطاعم العرض في مبدّل الواجهة — بلا نسخ القوالب (١٠ مطاعم تجريبية تزحم القائمة) */
export const DEMO_LIST = Object.values(DEMO)
  .filter((m) => !m.restaurant.slug.startsWith("odd-"))
  .map((m) => ({ slug: m.restaurant.slug, name: m.restaurant.name, color: m.restaurant.primary_color }));
