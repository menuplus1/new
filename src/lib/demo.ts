import type { Category, DayHours, MenuData } from "./types";

/** Demo tenants — the platform renders these when no database is connected yet.
 *  dallah = الباقة الأساسية (منيو للعرض فقط، لغتان، قالب مدمج) —
 *  sham   = الباقة الشاملة (كل الميزات: طلبات، حجز، عروض، تقييمات، ٣ لغات). */

type Row = [string, number, string?, string?]; // name, price, desc?, en name?

function cat(name: string, en: string, tile: string, items: Row[]): Category {
  return {
    id: name,
    name,
    image_url: tile, // CSS gradient — CoverHero/category cards render gradients in demo mode
    i18n: { en: { name: en } },
    items: items.map(([n, p, d, e], i) => ({
      id: `${name}-${i}`,
      name: n,
      description: d ?? null,
      image_url: null,
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
      covers: ["linear-gradient(120deg,#d18b4a,#8a5526)"],
      hide_branding: false,
      health_cert: null,
    },
    categories: [
      cat("المشروبات الساخنة", "Hot Drinks", "linear-gradient(135deg,#6b4226,#3c2415)", [
        ["إسبريسو", 2500, undefined, "Espresso"],
        ["لاتيه", 3000, undefined, "Latte"],
        ["كابتشينو", 3000, undefined, "Cappuccino"],
        ["موكا", 3500, undefined, "Mocha"],
        ["قهوة تركية", 2500, undefined, "Turkish Coffee"],
        ["شاي كرك", 1500, undefined, "Karak Tea"],
      ]),
      cat("المشروبات الباردة", "Cold Drinks", "linear-gradient(135deg,#3b6ea5,#1d3a57)", [
        ["آيس لاتيه", 3500, undefined, "Iced Latte"],
        ["آيس أمريكانو", 3000, undefined, "Iced Americano"],
        ["فرابتشينو", 4000, undefined, "Frappuccino"],
        ["موهيتو", 4000, undefined, "Mojito"],
      ]),
      cat("الحلويات", "Desserts", "linear-gradient(135deg,#a05a7c,#5c2e47)", [
        ["تشيز كيك", 4000, "بسكويت مطحون وجبنة كريمية", "Cheesecake"],
        ["كوكيز", 2500, undefined, "Cookies"],
        ["كرواسون", 2000, undefined, "Croissant"],
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
      tagline: "مأكولات شامية أصيلة منذ ١٩٨٨",
      about: "مطبخ شامي عريق — مشاوي على الفحم، مقبلات طازجة يومياً، وجلسات عائلية.",
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
      seo: { title: "بيت الشام — مشاوي ومأكولات شامية في بغداد", description: "منيو مطعم بيت الشام: مشاوي على الفحم، مقبلات، وأطباق شامية أصيلة." },
      covers: ["linear-gradient(120deg,#2f9e7a,#14523d)", "linear-gradient(120deg,#c98a2b,#7a4d0e)"],
      hide_branding: false,
      health_cert: "إجازة صحية رقم 4821 — بغداد",
    },
    categories: [
      cat("المقبلات", "Starters", "linear-gradient(135deg,#7aa953,#3f6428)", [
        ["حمص", 3000, "حمص مطحون بالطحينة وزيت الزيتون", "Hummus"],
        ["متبل", 3000, undefined, "Mutabbal"],
        ["تبولة", 3500, undefined, "Tabbouleh"],
        ["فتوش", 3500, undefined, "Fattoush"],
      ]),
      cat("المشاوي", "Grills", "linear-gradient(135deg,#b3542e,#66290f)", [
        ["شيش طاووق", 9000, "صدر دجاج متبّل على الفحم", "Shish Tawook"],
        ["كباب لحم", 10000, undefined, "Lamb Kebab"],
        ["ريش غنم", 14000, undefined, "Lamb Chops"],
        ["مشاوي مشكّلة", 18000, "تشكيلة تكفي شخصين", "Mixed Grill"],
      ]),
      cat("الأطباق الرئيسية", "Mains", "linear-gradient(135deg,#8c7a3f,#4d421d)", [
        ["مندي دجاج", 8000, undefined, "Chicken Mandi"],
        ["برياني لحم", 11000, undefined, "Lamb Biryani"],
        ["مقلوبة", 9000, undefined, "Maqluba"],
      ]),
      cat("المشروبات", "Drinks", "linear-gradient(135deg,#3b8ea5,#1c4d5c)", [
        ["عصير برتقال", 3000, undefined, "Orange Juice"],
        ["ليمون نعناع", 3000, undefined, "Mint Lemonade"],
        ["مياه", 500, undefined, "Water"],
      ]),
    ],
    promos: [
      { id: "p1", title: "خصم 20% على المشاوي المشكّلة", description: "يومياً من ٣ إلى ٦ مساءً", image_url: null },
      { id: "p2", title: "عرض العائلة: مشاوي + مقبلات + مشروبات", description: "45,000 د.ع بدل 55,000", image_url: null },
    ],
    rating: { avg: 4.8, count: 127 },
  },
};

export const DEMO_LIST = Object.values(DEMO).map((m) => ({ slug: m.restaurant.slug, name: m.restaurant.name, color: m.restaurant.primary_color }));
