/** Ready-made starter menus — one per template, matching its mood. A new
 *  restaurant is seeded with its template's starter so the owner edits a
 *  living menu instead of starting from zero. All sets fit the free limits
 *  (≤5 categories / ≤15 items) so the DB count triggers never block. */

type Item = [name: string, price: number, desc?: string];
export type Starter = {
  cover: string; // CSS gradient (CoverHero renders gradients natively)
  cats: { name: string; tile: string; items: Item[] }[];
};

const grill: Starter = {
  cover: "linear-gradient(120deg,#b3542e,#5c2415)",
  cats: [
    { name: "المقبلات", tile: "linear-gradient(135deg,#7aa953,#3f6428)", items: [["حمص", 3000], ["متبل", 3000], ["سلطة", 2500]] },
    { name: "المشاوي", tile: "linear-gradient(135deg,#b3542e,#66290f)", items: [["كباب", 10000, "لحم غنم طازج"], ["شيش طاووق", 9000], ["مشاوي مشكّلة", 18000, "تكفي شخصين"]] },
    { name: "الأطباق الرئيسية", tile: "linear-gradient(135deg,#8c7a3f,#4d421d)", items: [["مندي دجاج", 8000], ["برياني", 11000]] },
    { name: "المشروبات", tile: "linear-gradient(135deg,#3b8ea5,#1c4d5c)", items: [["عصير طازج", 3000], ["مياه", 500]] },
  ],
};

const lounge: Starter = {
  cover: "linear-gradient(120deg,#b08d3e,#5c4715)",
  cats: [
    { name: "الفطور", tile: "linear-gradient(135deg,#c9a25a,#7a5c1e)", items: [["فطور شرقي", 8000, "لشخصين"], ["أومليت بالجبن", 4500]] },
    { name: "الأطباق الرئيسية", tile: "linear-gradient(135deg,#8c7a3f,#4d421d)", items: [["ستيك مشوي", 22000], ["باستا ألفريدو", 12000], ["ريزوتو", 14000]] },
    { name: "الحلويات", tile: "linear-gradient(135deg,#a05a7c,#5c2e47)", items: [["تشيز كيك", 6000], ["تراميسو", 7000]] },
    { name: "المشروبات", tile: "linear-gradient(135deg,#3b6ea5,#1d3a57)", items: [["موكتيل", 6000], ["قهوة مختصة", 5000]] },
  ],
};

const burger: Starter = {
  cover: "linear-gradient(120deg,#e0803c,#7a3d0e)",
  cats: [
    { name: "برجر", tile: "linear-gradient(135deg,#b3542e,#66290f)", items: [["برجر كلاسيك", 5000], ["برجر دجاج مقرمش", 5500], ["دبل برجر", 8000, "قطعتا لحم + جبن"]] },
    { name: "سندويشات", tile: "linear-gradient(135deg,#c98a2b,#7a4d0e)", items: [["راب دجاج", 4500], ["هوت دوغ", 3500]] },
    { name: "الإضافات", tile: "linear-gradient(135deg,#8c7a3f,#4d421d)", items: [["بطاطا مقلية", 2000], ["أجنحة دجاج", 4500]] },
    { name: "المشروبات", tile: "linear-gradient(135deg,#3b8ea5,#1c4d5c)", items: [["مشروب غازي", 1000], ["ميلك شيك", 4000]] },
  ],
};

const cafe: Starter = {
  cover: "linear-gradient(120deg,#6b4226,#2c1a0e)",
  cats: [
    { name: "قهوة ساخنة", tile: "linear-gradient(135deg,#6b4226,#3c2415)", items: [["إسبريسو", 2500], ["لاتيه", 3000], ["كابتشينو", 3000]] },
    { name: "قهوة باردة", tile: "linear-gradient(135deg,#3b6ea5,#1d3a57)", items: [["آيس لاتيه", 3500], ["آيس موكا", 4000]] },
    { name: "الحلويات", tile: "linear-gradient(135deg,#a05a7c,#5c2e47)", items: [["كوكيز", 2500], ["تشيز كيك", 4000], ["كرواسون", 2000]] },
    { name: "مشروبات أخرى", tile: "linear-gradient(135deg,#7aa953,#3f6428)", items: [["شاي كرك", 1500], ["عصير برتقال", 3000]] },
  ],
};

const bakery: Starter = {
  cover: "linear-gradient(120deg,#c98a2b,#6b4226)",
  cats: [
    { name: "المخبوزات", tile: "linear-gradient(135deg,#c9a25a,#7a5c1e)", items: [["كرواسون زبدة", 2000], ["سينابون", 3000], ["دونات", 1500]] },
    { name: "الكيك", tile: "linear-gradient(135deg,#a05a7c,#5c2e47)", items: [["كيكة الشوكولا", 4000], ["ريد فلفت", 4500]] },
    { name: "القهوة", tile: "linear-gradient(135deg,#6b4226,#3c2415)", items: [["لاتيه", 3000], ["أمريكانو", 2500]] },
    { name: "المشروبات الباردة", tile: "linear-gradient(135deg,#3b8ea5,#1c4d5c)", items: [["سموذي فواكه", 4500], ["عصير ليمون نعناع", 3000]] },
  ],
};

/** template number → its starter (1 اللوحي، 2 بطاقات الأقسام، 3 الفاخر، 4 الداكن السريع، 5 المدمج، 6 الدافئ) */
export const STARTERS: Record<number, Starter> = { 1: grill, 2: grill, 3: lounge, 4: burger, 5: cafe, 6: bakery };
