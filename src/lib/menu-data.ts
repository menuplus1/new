import { createClient } from "@supabase/supabase-js";
import { DEMO, DEMO_LIST } from "./demo";
import type { Category, MenuData, Variant } from "./types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasDb = () => Boolean(URL && KEY);

/** One tenant's full menu. Live DB when configured, else the demo tenants. */
export async function getMenu(slug: string): Promise<MenuData | null> {
  if (!hasDb()) return DEMO[slug] ?? null;
  try {
    return await fromDb(slug);
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

async function fromDb(slug: string): Promise<MenuData | null> {
  const sb = createClient(URL!, KEY!);
  const { data: r } = await sb.from("restaurants").select("*").eq("slug", slug).eq("active", true).maybeSingle();
  if (!r) return null;

  const [{ data: cats }, { data: items }, { data: vars }] = await Promise.all([
    sb.from("categories").select("id, name, sort").eq("restaurant_id", r.id).eq("active", true).order("sort"),
    sb.from("menu_items").select("id, category_id, name, description, image_url, price, sort").eq("restaurant_id", r.id).eq("active", true).order("sort"),
    sb.from("item_variants").select("id, item_id, name, price").eq("restaurant_id", r.id),
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
    items: (items ?? [])
      .filter((it) => it.category_id === c.id)
      .map((it) => ({ id: it.id, name: it.name, description: it.description, image_url: it.image_url, price: it.price, variants: varsByItem.get(it.id) ?? [] })),
  }));

  return {
    restaurant: { id: r.id, slug: r.slug, name: r.name, logo_url: r.logo_url, primary_color: r.primary_color, currency: r.currency, ordering: r.ordering },
    categories,
  };
}
