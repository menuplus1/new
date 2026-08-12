import { IMG } from "./food-images";

/** Ready-made Iraqi starter menus — one per template, with real photos and
 *  realistic IQD prices. A new restaurant is created already full, so the owner
 *  edits a living menu instead of staring at an empty dashboard.
 *  Every set fits the free limits (≤5 categories / ≤15 items) so the DB count
 *  triggers never block a fresh signup. */

type Item = [name: string, price: number, image: string, desc?: string];
export type Starter = {
  label: string; // what this starter is, shown in the signup summary
  cover: string;
  cats: { name: string; tile: string; items: Item[] }[];
};

/** مطعم عراقي — مشاوي وأكلات بيتية */
const iraqiGrill: Starter = {
  label: "مطعم عراقي — مشاوي وأكلات بيتية",
  cover: IMG.coverGrill,
  cats: [
    {
      name: "المقبلات",
      tile: IMG.mezze,
      items: [
        ["مقبلات مشكّلة", 5000, IMG.mezze, "حمص · متبل · مخللات"],
        ["سمبوسة", 2000, IMG.samosa, "٤ حبات"],
        ["سلطة عراقية", 2500, IMG.salad, "طماطم · خيار · بصل"],
      ],
    },
    {
      name: "المشاوي",
      tile: IMG.kebab,
      items: [
        ["كباب عراقي", 12000, IMG.kebab, "لحم غنم على الفحم"],
        ["تكة لحم", 13000, IMG.tikka],
        ["شيش طاووق", 10000, IMG.grilledPlate],
        ["مشاوي مشكّلة", 22000, IMG.mixedGrill, "تكفي شخصين"],
      ],
    },
    {
      name: "الأطباق",
      tile: IMG.tashreeb,
      items: [
        ["تشريب", 9000, IMG.tashreeb],
        ["ربيان بالرز", 15000, IMG.shrimpRice, "طبق بصراوي"],
        ["دجاج مشوي", 11000, IMG.grilledChicken, "نصف دجاجة"],
      ],
    },
    {
      name: "المشروبات",
      tile: IMG.tea,
      items: [
        ["چاي عراقي", 1000, IMG.tea],
        ["عصير برتقال", 3000, IMG.orangeJuice],
        ["ليمون نعناع", 3000, IMG.lemonMint],
      ],
    },
  ],
};

/** لاونج / مطعم راقٍ */
const lounge: Starter = {
  label: "لاونج ومطعم راقٍ",
  cover: IMG.coverRestaurant,
  cats: [
    {
      name: "الفطور",
      tile: IMG.breakfast,
      items: [
        ["فطور المطعم", 12000, IMG.breakfast, "لشخصين"],
        ["بيض بالصمون", 5000, IMG.eggToast],
      ],
    },
    {
      name: "الأطباق الرئيسية",
      tile: IMG.ribs,
      items: [
        ["ستيك مشوي", 28000, IMG.ribs],
        ["باستا بالصلصة الحمراء", 13000, IMG.pasta],
        ["دجاج مشوي بالأعشاب", 16000, IMG.grilledChicken],
      ],
    },
    {
      name: "الحلويات",
      tile: IMG.tiramisu,
      items: [
        ["تيراميسو", 7000, IMG.tiramisu],
        ["بانا كوتا بالفراولة", 6500, IMG.pannaCotta],
      ],
    },
    {
      name: "المشروبات",
      tile: IMG.latte,
      items: [
        ["قهوة مختصة", 5000, IMG.latte],
        ["موكتيل فراولة", 6000, IMG.strawberryDrink],
      ],
    },
  ],
};

/** وجبات سريعة — برجر وبروستد */
const fastFood: Starter = {
  label: "وجبات سريعة — برجر وبروستد",
  cover: IMG.coverGrill,
  cats: [
    {
      name: "برجر",
      tile: IMG.burger,
      items: [
        ["برجر كلاسيك", 6000, IMG.burger],
        ["دبل برجر", 9000, IMG.doubleBurger, "قطعتا لحم وجبن"],
        ["برجر بريوش", 8000, IMG.burgerBrioche],
      ],
    },
    {
      name: "دجاج وسندويشات",
      tile: IMG.broasted,
      items: [
        ["بروستد ٤ قطع", 8000, IMG.broasted, "مع بطاطا وخبز"],
        ["شاورما دجاج", 5000, IMG.shawarma],
        ["كلوب سندويش", 6500, IMG.sandwich],
      ],
    },
    {
      name: "بيتزا",
      tile: IMG.pizza,
      items: [
        ["بيتزا مشكّلة", 10000, IMG.pizza],
        ["بيتزا خضار", 9000, IMG.pizzaGreens],
      ],
    },
    {
      name: "المشروبات",
      tile: IMG.smoothie,
      items: [
        ["مشروب غازي", 1000, IMG.orangeJuice],
        ["ميلك شيك", 5000, IMG.smoothie],
      ],
    },
  ],
};

/** كافيه — قهوة وحلويات */
const cafe: Starter = {
  label: "كافيه — قهوة وحلويات",
  cover: IMG.coverCafe,
  cats: [
    {
      name: "قهوة ساخنة",
      tile: IMG.latte,
      items: [
        ["إسبريسو", 2500, IMG.coffeeCookies],
        ["لاتيه", 3500, IMG.latte],
        ["كابتشينو", 3500, IMG.cappuccino],
      ],
    },
    {
      name: "قهوة باردة",
      tile: IMG.icedLatte,
      items: [
        ["آيس لاتيه", 4000, IMG.icedLatte],
        ["كولد برو", 4500, IMG.coldBrew],
      ],
    },
    {
      name: "الحلويات",
      tile: IMG.chocolateDessert,
      items: [
        ["كوكيز", 2500, IMG.cookies],
        ["حلى الشوكولاتة", 6000, IMG.chocolateDessert],
        ["كرواسون", 3000, IMG.croissant],
      ],
    },
    {
      name: "مشروبات أخرى",
      tile: IMG.tea,
      items: [
        ["چاي كرك", 1500, IMG.tea],
        ["ليمون نعناع", 3000, IMG.lemonMint],
        ["سموذي فراولة", 5000, IMG.smoothie],
      ],
    },
  ],
};

/** مخبز وقهوة */
const bakery: Starter = {
  label: "مخبز وقهوة",
  cover: IMG.coverBakery,
  cats: [
    {
      name: "المخبوزات",
      tile: IMG.croissant,
      items: [
        ["كرواسون زبدة", 2000, IMG.croissant],
        ["صمون بيتي", 500, IMG.bread, "حبة"],
        ["مافن توت", 2500, IMG.muffin],
      ],
    },
    {
      name: "الكيك والحلويات",
      tile: IMG.chocolateCake,
      items: [
        ["كيكة الشوكولاتة", 5000, IMG.chocolateCake, "قطعة"],
        ["كريب بالشوكولاتة", 5500, IMG.crepe],
        ["فرنش توست", 6000, IMG.frenchToast],
      ],
    },
    {
      name: "القهوة",
      tile: IMG.cappuccino,
      items: [
        ["لاتيه", 3500, IMG.latte],
        ["كابتشينو", 3500, IMG.cappuccino],
        ["چاي", 1000, IMG.tea],
      ],
    },
    {
      name: "المشروبات الباردة",
      tile: IMG.smoothie,
      items: [
        ["سموذي فواكه", 5000, IMG.smoothie],
        ["عصير برتقال طازج", 3500, IMG.orangeJuice],
      ],
    },
  ],
};

/** template number → its starter (1 اللوحي، 2 بطاقات الأقسام، 3 الفاخر، 4 الداكن السريع، 5 المدمج، 6 الدافئ) */
export const STARTERS: Record<number, Starter> = {
  1: iraqiGrill,
  2: iraqiGrill,
  3: lounge,
  4: fastFood,
  5: cafe,
  6: bakery,
};
