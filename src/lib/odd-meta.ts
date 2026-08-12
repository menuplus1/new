/** بطاقة تعريف كل قالب من القوالب ٧–١٦ — بلا أصناف، ليستوردها المتصفّح بأمان.
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
  { tpl: 7, key: "hikaytalsayad", name: "حكاية الصياد", kind: "مطعم أسماك ومشاوي عراقية", look: "الفيروزي الفاتح", skin: "light", accent: "#0CADB1", logo: "crop-4b1aa80f-2ce2-4988-ac81-55b03a442489.jpeg", cover: "42bff6b9-28cc-4632-bdb0-36e289e4893d.jpeg", items: 122, catNames: ["الأطباق الرئيسية", "المشويات", "السلطات", "المقبلات الساخنة", "مقبلات باردة", "الكريب والوافل", "وجبات الأطفال", "الاراكيل", "مشروبات باردة", "مشروبات قهوة ساخنه", "مشروبات قهوة باردة", "عصائر فريش", "كوكتيلات", "فرابتشينو", "موهيتو", "ميلك شيك"] },
  { tpl: 8, key: "albarari", name: "لحوم البراري", kind: "مطعم لحوم ومشاوي", look: "العنابي الفاتح", skin: "light", accent: "#6E1312", logo: "crop-0d7b3c2e-4320-4b74-8514-ac0be0c5c701.jpeg", cover: "052bb766-851a-4248-95fa-164c738149c7.jpeg", items: 65, catNames: ["لحوم العجل", "لحوم الغنم", "المشويات", "الدجاج", "منتجات البراري"] },
  { tpl: 9, key: "bs-chai", name: "بس چاي", kind: "چايخانة وكافيه", look: "الزيتي الداكن", skin: "dark", accent: "#4c5f46", logo: "crop-cd44b01b-5e96-4dc4-b859-5a0dd8d4a027.jpeg", cover: "17cf8117-95e7-4110-a1cd-967fbc21b052.jpeg", items: 139, catNames: ["الفطور الصباحي", "ساندوتش ايطالي", "بيتزا ايطالي", "بيتزا امريكي", "مناقيش", "كيك & معجنات", "كريب & وافل", "سموذي", "ميلك شيك", "عصائر", "موهيتو & موكتيل", "سبيشل بس جاي", "جاي", "ايس جاي", "سبيشل بُنة", "هوت بُنة", "ايس بُنة", "لاتيه", "دَخنة", "اخرى"] },
  { tpl: 10, key: "saj-alarba", name: "صاج العرب", kind: "صاج وفطور شعبي", look: "الرملي الفاتح", skin: "light", accent: "#c98f4b", logo: null, cover: null, items: 67, catNames: ["المقبلات", "البيتزا", "المأكولات الغربية (السناك)", "المشويات (لحم)", "المشويات (دجاج)", "الشاورما على الحطب", "المشروبات الباردة"] },
  { tpl: 11, key: "fayrouz-cafe-1", name: "فيروز كافيه", kind: "كافيه ومطعم", look: "القرميدي الفاتح", skin: "light", accent: "#86180b", logo: null, cover: "f09ed131-7654-4635-916b-9045edcdbba5.jpeg", items: 92, catNames: ["المشروبات الساخنة", "المشروبات الباردة", "ميلك شيك", "العصائر الطبيعية", "الموهيتو", "ايس تي", "الإضافات", "كريب", "وافل وبان كيك", "حلويات", "ايس كريم", "اراكيل  خشب", "نراكيل الماني"] },
  { tpl: 12, key: "al-basal-basha-rest", name: "مطعم الباشا", kind: "مطعم عراقي شامل", look: "المشمشي الفاتح", skin: "light", accent: "#f7906c", logo: "crop-1f3346dc-ae31-450d-ba5c-74145e5c8e72.jpeg", cover: "ff6987b5-a632-4217-88ae-68c0bdf6a69d.jpeg", items: 137, catNames: ["المقبلات الباردة", "المقبلات الكبيرة", "المقبلات الحارة", "معكرونة", "المشويات", "الاكل البحري", "الاكل الغربي", "الاكل الشرقي", "الايطالي", "الحجز المسبق", "العصائر والمشروبات الساخنه", "الاراكيل"] },
  { tpl: 13, key: "italiankalar", name: "إيتاليان كوزين", kind: "مطبخ إيطالي", look: "الليموني الداكن", skin: "dark", accent: "#7fd25b", logo: "3840803824331055.jpeg", cover: "359637116989492.jpeg", items: 168, catNames: ["Kurdish Foods | خواردنە کوردەواریەکان | الاكلات الكردية", "Foriegn Food | خواردنە بیانییەکان | الاكلات الاجنبية", "Fast Food | فاست فوود | فست فود", "Pizza | پیتزا | بيتزا", "Specials | خواردنە تایبەتەکان | الاكلات الخاصة", "Soup & Salads | سوپ و موقەبیلات | سوب و مقبلات", "Drinks | ساردی | مشروبات غازية", "Fresh Juice | شەربەتی فرێش | عصير طازج", "Mocktail | مۆکتێل | موكتيل", "Milkshake | میڵکشەیک | ميلكشيك", "Cold Drinks | خواردنەوە ساردەکان | مشروبات باردة", "Hot Drinks | خواردنەوە گەرمەکان | مشروبات ساخنة", "Cake | کێک | کعک", "Ice Cream | دۆندرمە | بوضة"] },
  { tpl: 14, key: "naas-restaurant", name: "مطعم ناس", kind: "مطعم وجبات وبرغر", look: "الأرجواني الفاتح", skin: "light", accent: "#ce1adb", logo: "crop-302a4695-c8d3-4088-8aca-ddc54e1c172f.jpeg", cover: "bb1b8fe1-6fd9-4014-8fc1-5d9148f8ff3d.jpeg", items: 169, catNames: ["المقبلات الباردة", "مقبلات حارة", "معكرونة", "مشويات", "الاكلات البحرية", "الاكل الغربي", "الاكل الشرقي", "الايطالي", "الحجز المسبق", "العصائر والمشروبات الساخنة", "الاراكيل"] },
  { tpl: 15, key: "madoduhok", name: "مادو", kind: "حلويات وآيس كريم وكافيه", look: "الرمادي الداكن", skin: "dark", accent: "#d0cfcd", logo: "5846721089229753.jpeg", cover: "555811130688194.jpeg", items: 169, catNames: ["وجبات الفطور", "المقبلات الساخنة", "السلطات", "الباستا", "البيتزا", "السندويشات والبرغر", "الاطباق العالمية", "الاطباق التركية", "الاطباق المحلية", "اطباق ايس كريم الكسمى", "اطباق الايس كريم", "الحلويات مع الايس كريم", "الحلويات", "اطباق البقلاوة", "الكيك", "عصير", "ميلك شيك", "مشروبات ساخنه", "مشروبات قهوه بارده", "موهيتو", "نركيلة", "طبيعي"] },
  { tpl: 16, key: "dark-bluerestaurant1", name: "دارك بلو", kind: "مطعم عالمي وكافيه", look: "الأزرق الداكن", skin: "dark", accent: "#0056d6", logo: null, cover: "10439cce-07a8-4e88-a9fe-a6ec30dbdf4a.jpeg", items: 199, catNames: ["مقبلات", "أكلات غربية", "كنتاكي + كرسبي", "همبرگر", "شاورمة", "صاجات", "پیتزا", "ريزو Rizo", "كيك", "حلويات", "كريب", "ئایس کریم", "WAFFLES. وافل", "بانكيك", "Espresso coffe ايسبرسو قهوه", "Coffe قهوه", "Hot Drinks مشروبات حاره", "كوفي لاتية latte coffe", "Iced Espresso اسبريسو مثلج", "شاي Tea", "Cappuccino كابجينو", "Milk shake ميلك شيك", "Fraipe فرابي", "FRESH JUICE عصاير طازح", "SMOOTHIE COCKTAIL كوكتيل سموذي", "Fruits فواكه", "موهيتو", "مكسيكي", "صوده", "نراگيل"] },
];

export const ODD_META_BY_TPL: Record<number, OddMeta> = Object.fromEntries(ODD_META.map((s) => [s.tpl, s]));
/** سِمة القالب — تُمرَّر لمكوّن Odd */
export const oddSkin = (tpl: number): "light" | "dark" | null => ODD_META_BY_TPL[tpl]?.skin ?? null;
/** رابط المطعم التجريبي الذي يعرض المنيو المنسوخ كما هو */
export const oddDemoSlug = (key: string) => `odd-${key}`;
export const ODD_FIRST_TPL = 7;
export const ODD_LAST_TPL = 16;
