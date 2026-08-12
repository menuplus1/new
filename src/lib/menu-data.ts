import { createClient } from "@supabase/supabase-js";
import { DEMO, DEMO_LIST } from "./demo";
import { effectivePlan } from "./plans";
import type { Category, MenuData, Restaurant, Variant } from "./types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasDb = () => Boolean(URL && KEY);

/** One tenant's full menu. Live DB when configured, else the demo tenants. */
export async function getMenu(slug: string): Promise<MenuData | null> {
  if (!hasDb()) return DEMO[slug] ?? null;
  try {
    // a demo slug has no DB row — fall back so the template previews resolve
    return (await fromDb(slug)) ?? DEMO[slug] ?? null;
  } catch {
    return DEMO[slug] ?? null;
  }
}

export async function listRestaurants(): Promise<{ slug: string; name: string; color: string }[]> {
  if (!hasDb()) return DEMO_LIST;
  try {
    const sb = createClient(URL!, KEY!);
    const { data } = await sb.from("restaurants").select("slug, name, primary_color").eq("active", true);
    return (data ?? []).map((r) => ({ slug: r.slug, name: r.name, color: r.primary_color }));
  } catch {
    return DEMO_LIST;
  }
}

export async function listSlugs(): Promise<string[]> {
  if (!hasDb()) return Object.keys(DEMO);
  try {
    const sb = createClient(URL!, KEY!);
    const { data } = await sb.from("restaurants").select("slug").eq("active", true);
    return (data ?? []).map((r) => r.slug);
  } catch {
    return Object.keys(DEMO);
  }
}

async function fromDb(slug: string): Promise<MenuData | null> {
  const sb = createClient(URL!, KEY!);
  // أعمدة صريحة: مفتاح anon لم يعد يملك select على owner و whatsapp_phone (0013_lockdown)
  const { data: r } = await sb
    .from("restaurants")
    .select(
      "id, slug, name, logo_url, primary_color, currency, ordering, order_types, reservations, plan, apps, trial_ends, template, tagline, about, socials, hours, languages, i18n, seo, covers, hide_branding, health_cert",
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (!r) return null;

  // promotions/reviews may not exist until 0006 runs — supabase returns {error} without throwing, so ?? [] keeps us live
  const [{ data: cats }, { data: items }, { data: vars }, { data: promos }, { data: reviews }] = await Promise.all([
    sb.from("categories").select("id, name, image_url, i18n, sort").eq("restaurant_id", r.id).eq("active", true).order("sort"),
    sb.from("menu_items").select("id, category_id, name, description, image_url, images, price, i18n, sort").eq("restaurant_id", r.id).eq("active", true).order("sort"),
    sb.from("item_variants").select("id, item_id, name, price").eq("restaurant_id", r.id),
    sb.from("promotions").select("id, title, description, image_url").eq("restaurant_id", r.id).eq("active", true).order("sort"),
    sb.from("reviews").select("stars").eq("restaurant_id", r.id).eq("approved", true),
  ]);

  const varsByItem = new Map<string, Variant[]>();
  for (const v of vars ?? []) {
    const arr = varsByItem.get(v.item_id) ?? [];
    arr.push({ id: v.id, name: v.name, price: v.price });
    varsByItem.set(v.item_id, arr);
  }
  const categories: Category[] = (cats ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    image_url: c.image_url ?? null,
    i18n: c.i18n ?? {},
    items: (items ?? [])
      .filter((it) => it.category_id === c.id)
      .map((it) => ({
        id: it.id,
        name: it.name,
        description: it.description,
        image_url: it.image_url,
        images: it.images ?? [],
        price: it.price,
        variants: varsByItem.get(it.id) ?? [],
        i18n: it.i18n ?? {},
      })),
  }));

  const stars = (reviews ?? []).map((x) => x.stars);
  const restaurant: Restaurant = {
    id: r.id,
    slug: r.slug,
    name: r.name,
    logo_url: r.logo_url,
    primary_color: r.primary_color,
    currency: r.currency,
    ordering: r.ordering,
    order_types: r.order_types ?? ["dine_in", "delivery", "takeaway"],
    reservations: r.reservations ?? true,
    plan: effectivePlan(r.plan ?? "free", r.trial_ends), // expired trial renders as free
    apps: r.apps ?? [],
    template: r.template ?? 1,
    tagline: r.tagline ?? null,
    about: r.about ?? null,
    socials: r.socials ?? {},
    hours: r.hours ?? null,
    languages: r.languages ?? ["ar"],
    i18n: r.i18n ?? {},
    seo: r.seo ?? {},
    covers: r.covers ?? [],
    hide_branding: r.hide_branding ?? false,
    health_cert: r.health_cert ?? null,
  };

  return {
    restaurant,
    categories,
    promos: promos ?? [],
    rating: stars.length
      ? { avg: Math.round((stars.reduce((s, n) => s + n, 0) / stars.length) * 10) / 10, count: stars.length }
      : null,
  };
}
