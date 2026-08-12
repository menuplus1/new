/** يحوّل المنيوهات المنسوخة (odd-menus) إلى ما تحتاجه المنصّة:
 *  مطاعم تجريبية للمعاينة الحيّة، ومنيو ابتدائي يُزرع عند التسجيل.
 *  للسيرفر فقط — الملف يسحب بيانات ١٣٢٧ صنفاً، فلا تستورده من مكوّن "use client". */

import { ODD_BY_TPL, ODD_SETS, oddImg, type OddSet } from "./odd-menus";
import { oddDemoSlug } from "./odd-meta";
import type { Starter } from "./starter-menus";
import type { Category, DayHours, MenuData } from "./types";

const WEEK: DayHours[] = Array.from({ length: 7 }, () => ({ closed: false, open: "10:00", close: "23:59" }));

function categories(s: OddSet): Category[] {
  return s.cats.map((c, i) => ({
    id: `${s.key}-c${i}`,
    name: c.name,
    image_url: oddImg(c.tile),
    i18n: {},
    items: c.items.map(([name, price, img, desc], j) => ({
      id: `${s.key}-c${i}-i${j}`,
      name,
      description: desc,
      image_url: oddImg(img),
      images: [],
      price,
      variants: [],
      i18n: {},
    })),
  }));
}

/** مطعم تجريبي لكل قالب — يفتح على /odd-<key> ويعرض المنيو المنسوخ كما هو.
 *  الشعار مقصود أنه فارغ: هو (مع الاسم) ما يغيّره المشترك. */
export function oddDemos(): Record<string, MenuData> {
  const out: Record<string, MenuData> = {};
  for (const s of ODD_SETS) {
    const slug = oddDemoSlug(s.key);
    out[slug] = {
      restaurant: {
        id: slug,
        slug,
        name: s.name,
        logo_url: null,
        primary_color: s.accent,
        currency: "د.ع",
        ordering: true,
        order_types: ["dine_in", "delivery", "takeaway"],
        reservations: false,
        plan: "premium", // معاينة بكل الميزات المرئية دون إخفاء علامة منيو بلس
        apps: [],
        template: s.tpl,
        tagline: s.kind,
        about: `منيو جاهز مع القالب — ${s.cats.length} أقساماً وكل صورها. غيّر الاسم والشعار وابدأ.`,
        socials: {},
        hours: WEEK,
        languages: ["ar"],
        i18n: {},
        seo: {},
        covers: [oddImg(s.cover)].filter(Boolean) as string[],
        hide_branding: false,
        health_cert: null,
        whatsapp_phone: null,
      },
      categories: categories(s),
      promos: [],
      rating: null,
    };
  }
  return out;
}

/** المنيو الابتدائي للقالب، مقصوصاً على حدود الباقة (وإلا رفضته محفّزات القاعدة).
 *  التوزيع بالتساوي على الأقسام: أربعة أقسام ناقصة أفضل من قسم واحد كامل. */
export function oddStarter(tpl: number, catLimit: number | null, itemLimit: number | null): Starter | null {
  const s = ODD_BY_TPL[tpl];
  if (!s) return null;
  let cats = catLimit ? s.cats.slice(0, catLimit) : s.cats;
  if (itemLimit) {
    const per = Math.max(1, Math.floor(itemLimit / Math.max(1, cats.length)));
    let left = itemLimit;
    cats = cats
      .map((c) => {
        const take = Math.min(per, left, c.items.length);
        left -= take;
        return { ...c, items: c.items.slice(0, take) };
      })
      .filter((c) => c.items.length);
  }
  return {
    label: `منيو ${s.name} — ${s.kind}`,
    cover: oddImg(s.cover) ?? "",
    cats: cats.map((c) => ({
      name: c.name,
      tile: oddImg(c.tile),
      items: c.items.map(([n, p, img, d]) => [n, p, oddImg(img), d ?? undefined] as Starter["cats"][number]["items"][number]),
    })),
  };
}
