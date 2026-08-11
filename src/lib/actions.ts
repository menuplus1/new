"use server";

import { createClient } from "@supabase/supabase-js";
import { orderProblem, reservationProblem, reviewProblem, type OrderType } from "./types";
import { PLAN_INFO, TRIAL_DAYS, effectivePlan, hasApp, type Plan } from "./plans";
import { notifyNewOrder, notifyNewReservation } from "./notify";

/** unit_price/name are used for the demo receipt only — the DB rpc resolves
 *  real prices from menu_items/item_variants by id and ignores client prices. */
export type OrderLine = { item_id: string; variant_id: string | null; name: string; qty: number; unit_price: number };

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const service = () => (URL && SERVICE ? createClient(URL, SERVICE) : null);

export async function placeOrder(input: {
  restaurantId: string;
  table: string | null;
  lines: OrderLine[];
  phone: string | null;
  note: string | null;
  orderType: OrderType;
  name: string | null;
  address: string | null;
}): Promise<{ ok: true; orderNumber: string } | { ok: false; error: string }> {
  if (!input.lines.length) return { ok: false, error: "السلة فارغة." };
  const bad = orderProblem(input);
  if (bad) return { ok: false, error: bad };

  const sb = service();
  if (sb) {
    try {
      // plan/ordering/order-type gates + price resolution live inside the rpc (0005_plans.sql)
      const { data, error } = await sb.rpc("place_order", {
        p_restaurant: input.restaurantId,
        p_table: input.orderType === "dine_in" ? input.table : null,
        p_lines: input.lines.map((l) => ({ item_id: l.item_id, variant_id: l.variant_id, qty: l.qty })),
        p_phone: input.phone,
        p_note: input.note,
        p_type: input.orderType,
        p_name: input.name,
        p_address: input.address,
      });
      if (error) return { ok: false, error: error.message };
      const { data: r } = await sb.from("restaurants").select("name, whatsapp_phone").eq("id", input.restaurantId).single();
      if (r) notifyNewOrder(r, String(data), input.orderType);
      return { ok: true, orderNumber: String(data) };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  // demo mode (no DB yet) — deterministic-ish placeholder number
  const n = 100 + (input.lines.reduce((s, l) => s + l.qty, 0) % 900);
  return { ok: true, orderNumber: String(n).padStart(3, "0") };
}

/** Book a table. Date and time stay separate columns — no timezone surprises. */
export async function reserveTable(input: {
  restaurantId: string;
  name: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  guests: number;
  note: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const bad = reservationProblem(input);
  if (bad) return { ok: false, error: bad };

  const sb = service();
  if (!sb) return { ok: true }; // demo mode

  try {
    const { data: r } = await sb.from("restaurants").select("name, active, reservations, plan, apps, trial_ends, whatsapp_phone").eq("id", input.restaurantId).single();
    if (!r || !r.active) return { ok: false, error: "المطعم غير متاح حالياً." };
    if (!r.reservations) return { ok: false, error: "الحجز متوقف حالياً." };
    if (!hasApp({ plan: effectivePlan((r.plan ?? "free") as Plan, r.trial_ends), apps: r.apps ?? [] }, "booking"))
      return { ok: false, error: "الحجز غير متاح في باقة هذا المطعم." };
    const { error } = await sb.from("reservations").insert({
      restaurant_id: input.restaurantId,
      name: input.name.trim(),
      phone: input.phone.trim(),
      res_date: input.date,
      res_time: input.time,
      guests: input.guests,
      note: input.note,
    });
    if (error) return { ok: false, error: error.message };
    notifyNewReservation(r, input.name.trim(), `${input.date} ${input.time}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Public review submission. Moderation (approved=false) is the abuse gate —
 *  ponytail: no rate limiting; add one if spam ever materializes. */
export async function submitReview(input: {
  restaurantId: string;
  stars: number;
  name: string;
  comment: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const bad = reviewProblem(input);
  if (bad) return { ok: false, error: bad };
  const sb = service();
  if (!sb) return { ok: true }; // demo mode
  try {
    const { error } = await sb.from("reviews").insert({
      restaurant_id: input.restaurantId,
      stars: input.stars,
      name: input.name.trim(),
      comment: input.comment.trim() || null,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Visit counters — rpc is revoked from anon, so all tracking flows through here. */
export async function trackVisit(restaurantId: string, kind: "menu" | "cat" | "item", ref?: string): Promise<void> {
  const sb = service();
  if (!sb) return;
  try {
    await sb.rpc("track_visit", { p_restaurant: restaurantId, p_kind: kind, p_ref: ref ?? "" });
  } catch {
    /* stats are best-effort */
  }
}

/* ————— free self-signup: restaurant + owner account in one step ————— */

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
const RESERVED_SLUGS = new Set(["admin", "sign-in", "sign-up", "api", "sitemap.xml", "robots.txt", "www", "app"]);

export async function signUpRestaurant(input: {
  name: string;
  slug: string;
  color: string;
  email: string;
  password: string;
  plan: Plan;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2 || name.length > 40) return { ok: false, error: "اسم المطعم بين حرفين و40 حرفاً." };
  if (!SLUG_RE.test(slug) || RESERVED_SLUGS.has(slug))
    return { ok: false, error: "الرابط: أحرف إنجليزية صغيرة وأرقام وشرطات فقط (3–30)." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "بريد غير صالح." };
  if (input.password.length < 8) return { ok: false, error: "كلمة المرور 8 أحرف على الأقل." };
  if (!(input.plan in PLAN_INFO)) return { ok: false, error: "باقة غير معروفة." };
  const color = /^#[0-9a-fA-F]{6}$/.test(input.color) ? input.color : "#10b3a3";

  const sb = service();
  if (!sb) return { ok: false, error: "المنصّة غير مربوطة بقاعدة بيانات بعد." };
  try {
    const { data: taken } = await sb.from("restaurants").select("id").eq("slug", slug).maybeSingle();
    if (taken) return { ok: false, error: "هذا الرابط محجوز — جرّب اسماً آخر." };

    const created = await sb.auth.admin.createUser({ email, password: input.password, email_confirm: true });
    if (created.error || !created.data.user)
      return { ok: false, error: created.error?.message.includes("already") ? "هذا البريد مسجّل مسبقاً — سجّل دخولك." : (created.error?.message ?? "تعذّر إنشاء الحساب.") };

    // paid plans start as a 7-day trial (no payment integration yet); free is forever
    const { error } = await sb.from("restaurants").insert({
      slug,
      name,
      primary_color: color,
      currency: "د.ع",
      plan: input.plan,
      trial_ends: input.plan === "free" ? null : new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(),
      template: 1,
      owner: created.data.user.id,
    });
    if (error) {
      await sb.auth.admin.deleteUser(created.data.user.id); // don't strand an ownerless account
      return { ok: false, error: error.message.includes("duplicate") ? "هذا الرابط محجوز — جرّب اسماً آخر." : error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ————— multi-admin management (owner only) ————— */

async function verifyOwner(sb: NonNullable<ReturnType<typeof service>>, accessToken: string, restaurantId: string) {
  const { data: auth } = await sb.auth.getUser(accessToken);
  if (!auth.user) return null;
  const { data: r } = await sb.from("restaurants").select("id, plan, owner").eq("id", restaurantId).single();
  if (!r || r.owner !== auth.user.id) return null;
  return r;
}

export async function addAdmin(input: {
  accessToken: string;
  restaurantId: string;
  email: string;
}): Promise<{ ok: true; tempPassword: string | null } | { ok: false; error: string }> {
  const sb = service();
  if (!sb) return { ok: false, error: "لم يتم ربط قاعدة البيانات بعد." };
  const email = input.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "بريد غير صالح." };
  try {
    const r = await verifyOwner(sb, input.accessToken, input.restaurantId);
    if (!r) return { ok: false, error: "هذه العملية لصاحب المطعم فقط." };

    // find-or-create the auth user
    let userId: string | null = null;
    let tempPassword: string | null = null;
    const pass = `Mp${Math.random().toString(36).slice(2, 10)}!`;
    const created = await sb.auth.admin.createUser({ email, password: pass, email_confirm: true });
    if (created.data.user) {
      userId = created.data.user.id;
      tempPassword = pass;
    } else {
      // already registered — find them. ponytail: paged scan; fine below ~thousands of users
      for (let page = 1; page <= 20 && !userId; page++) {
        const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
        userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
        if (!data.users.length) break;
      }
      if (!userId) return { ok: false, error: "تعذّر إنشاء الحساب أو إيجاده." };
    }

    const { error } = await sb.from("restaurant_admins").insert({ restaurant_id: input.restaurantId, user_id: userId, email });
    if (error)
      return { ok: false, error: error.message.includes("ADMIN_LIMIT") ? "بلغت حدّ المشرفين في باقتك." : error.message };
    return { ok: true, tempPassword };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function removeAdmin(input: {
  accessToken: string;
  restaurantId: string;
  userId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = service();
  if (!sb) return { ok: false, error: "لم يتم ربط قاعدة البيانات بعد." };
  try {
    const r = await verifyOwner(sb, input.accessToken, input.restaurantId);
    if (!r) return { ok: false, error: "هذه العملية لصاحب المطعم فقط." };
    const { error } = await sb.from("restaurant_admins").delete().eq("restaurant_id", input.restaurantId).eq("user_id", input.userId);
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
