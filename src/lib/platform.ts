"use server";

/** لوحة مدير المنصّة — كل قراءة وكتابة هنا.
 *
 *  لماذا server actions لا استعلامات من المتصفّح: لا توجد سياسة RLS واحدة تمنح
 *  قراءة عابرة للمطاعم (وهذا مقصود)، و`protect_restaurant_cols` يتجاهل بصمت أي
 *  محاولة لتغيير الباقة من دور authenticated. مفتاح الخدمة وحده يتجاوز الاثنين،
 *  ولا يصل المتصفّح أبداً (بلا NEXT_PUBLIC_).
 *
 *  البوابة الوحيدة: asPlatform() — تتحقّق من التوكن عبر GoTrue ثم من العضوية في
 *  platform_admins. كل دالة مصدَّرة تمرّ عبرها. */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PLAN_INFO, effectivePlan, type Plan } from "./plans";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const service = () => (URL && SERVICE ? createClient(URL, SERVICE) : null);

type Fail = { ok: false; error: string };
export type Method = "cash" | "transfer" | "zaincash" | "gift";

async function asPlatform<T>(
  accessToken: string,
  fn: (sb: SupabaseClient, admin: { id: string; email: string }) => Promise<T>,
): Promise<T | Fail> {
  const sb = service();
  if (!sb) return { ok: false, error: "لم يتم ربط قاعدة البيانات بعد." };
  const { data: auth } = await sb.auth.getUser(accessToken);
  if (!auth.user) return { ok: false, error: "غير مصرّح." };
  const { data: pa } = await sb.from("platform_admins").select("user_id, email").eq("user_id", auth.user.id).maybeSingle();
  if (!pa) return { ok: false, error: "غير مصرّح." };
  try {
    return await fn(sb, { id: pa.user_id, email: pa.email });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** سطر في سجل النشاط — يُستدعى بعد كل تعديل ناجح */
async function log(sb: SupabaseClient, admin: { id: string; email: string }, action: string, target: string | null, meta: Record<string, unknown> = {}) {
  await sb.from("platform_audit").insert({ actor: admin.id, actor_email: admin.email, action, target, meta });
}

const DAY = 86400000;
const iso = (d: Date) => d.toISOString();
const day = (d: Date) => d.toISOString().slice(0, 10);

/* ————— الجلسة ————— */

export async function platformSession(accessToken: string) {
  return asPlatform(accessToken, async (_sb, admin) => ({ ok: true as const, email: admin.email }));
}

/* ————— نظرة عامة ————— */

export type Overview = {
  ok: true;
  kpis: {
    restaurants: number;
    active: number;
    signupsMonth: number;
    signupsPrevMonth: number;
    mrr: number;
    mrrIfTrialsConvert: number;
    trialsEnding7: number;
    orders30: number;
    orders30Prev: number;
    visits30: number;
    visits30Prev: number;
  };
  weeks: [string, number][];
  plans: [string, number][];
  alerts: { expiring: number; expired: number; openTickets: number };
};

export async function overview(accessToken: string) {
  return asPlatform(accessToken, async (sb): Promise<Overview> => {
    const now = Date.now();
    const [{ data: rests }, { data: orders }, { data: visits }] = await Promise.all([
      sb.from("restaurants").select("id, plan, trial_ends, active, created_at"),
      sb.from("orders").select("total, status, created_at").gte("created_at", iso(new Date(now - 60 * DAY))),
      sb.from("visits").select("day, kind, hits").gte("day", day(new Date(now - 60 * DAY))),
    ]);
    const R = rests ?? [];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getTime();
    const paid = (r: { plan: string; trial_ends: string | null }) => effectivePlan(r.plan as Plan, r.trial_ends) !== "free";
    const cut30 = now - 30 * DAY;

    const inWindow = (t: string, from: number, to: number) => {
      const ms = Date.parse(t);
      return ms >= from && ms < to;
    };
    const weeks: [string, number][] = [];
    for (let w = 7; w >= 0; w--) {
      const from = now - (w + 1) * 7 * DAY;
      const to = now - w * 7 * DAY;
      weeks.push([`قبل ${w} أسابيع`, R.filter((r) => inWindow(r.created_at, from, to)).length]);
    }
    const planCounts = (["free", "basic", "premium", "ultimate"] as Plan[]).map(
      (p) => [PLAN_INFO[p].label, R.filter((r) => r.plan === p).length] as [string, number],
    );
    const O = orders ?? [];
    const V = visits ?? [];
    const cut30day = day(new Date(cut30));
    const { count: openTickets } = await sb.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open");

    return {
      ok: true,
      kpis: {
        restaurants: R.length,
        active: R.filter((r) => r.active).length,
        signupsMonth: R.filter((r) => Date.parse(r.created_at) >= monthStart).length,
        signupsPrevMonth: R.filter((r) => inWindow(r.created_at, prevMonthStart, monthStart)).length,
        mrr: R.filter((r) => r.active && paid(r)).reduce((s, r) => s + PLAN_INFO[r.plan as Plan].monthly, 0),
        mrrIfTrialsConvert: R.filter((r) => r.active && r.plan !== "free").reduce((s, r) => s + PLAN_INFO[r.plan as Plan].monthly, 0),
        trialsEnding7: R.filter((r) => r.trial_ends && Date.parse(r.trial_ends) > now && Date.parse(r.trial_ends) < now + 7 * DAY).length,
        orders30: O.filter((o) => Date.parse(o.created_at) >= cut30).length,
        orders30Prev: O.filter((o) => Date.parse(o.created_at) < cut30).length,
        visits30: V.filter((v) => v.kind === "menu" && v.day >= cut30day).reduce((s, v) => s + v.hits, 0),
        visits30Prev: V.filter((v) => v.kind === "menu" && v.day < cut30day).reduce((s, v) => s + v.hits, 0),
      },
      weeks,
      plans: planCounts,
      alerts: {
        expiring: R.filter((r) => r.trial_ends && Date.parse(r.trial_ends) > now && Date.parse(r.trial_ends) < now + 7 * DAY).length,
        expired: R.filter((r) => r.trial_ends && Date.parse(r.trial_ends) <= now && r.plan !== "free").length,
        openTickets: openTickets ?? 0,
      },
    };
  });
}

/* ————— المطاعم ————— */

export type RestRow = {
  id: string;
  slug: string;
  name: string;
  plan: Plan;
  trial_ends: string | null;
  active: boolean;
  created_at: string;
  template: number;
  primary_color: string;
  apps: string[];
  owner: string | null;
  ownerEmail: string | null;
  items: number;
  orders: number;
};

export async function listRestaurants(accessToken: string) {
  return asPlatform(accessToken, async (sb) => {
    const [{ data: rests }, { data: items }, { data: orders }] = await Promise.all([
      sb.from("restaurants").select("id, slug, name, plan, trial_ends, active, created_at, template, primary_color, apps, owner").order("created_at", { ascending: false }),
      sb.from("menu_items").select("restaurant_id"),
      sb.from("orders").select("restaurant_id"),
    ]);
    const emails = new Map<string, string>();
    for (let page = 1; page <= 10; page++) {
      const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      data.users.forEach((u) => u.email && emails.set(u.id, u.email));
      if (data.users.length < 200) break;
    }
    const count = (rows: { restaurant_id: string }[] | null, id: string) => (rows ?? []).filter((x) => x.restaurant_id === id).length;
    const rows: RestRow[] = (rests ?? []).map((r) => ({
      ...(r as Omit<RestRow, "ownerEmail" | "items" | "orders">),
      ownerEmail: r.owner ? emails.get(r.owner) ?? null : null,
      items: count(items, r.id),
      orders: count(orders, r.id),
    }));
    return { ok: true as const, rows };
  });
}

export async function setPlan(input: { accessToken: string; id: string; plan: Plan }) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    const { error } = await sb.from("restaurants").update({ plan: input.plan }).eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };
    await log(sb, admin, "plan.set", input.id, { plan: input.plan });
    return { ok: true as const };
  });
}

/** تمديد «مدفوع حتى» — يبني على التاريخ الحالي إن كان مستقبلاً فلا تضيع أيام */
export async function extendTrial(input: { accessToken: string; id: string; days: number }) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    const { data: r } = await sb.from("restaurants").select("trial_ends").eq("id", input.id).single();
    const base = r?.trial_ends && Date.parse(r.trial_ends) > Date.now() ? Date.parse(r.trial_ends) : Date.now();
    const until = iso(new Date(base + input.days * DAY));
    const { error } = await sb.from("restaurants").update({ trial_ends: until }).eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };
    await log(sb, admin, "trial.extend", input.id, { days: input.days, until });
    return { ok: true as const, until };
  });
}

export async function setActive(input: { accessToken: string; id: string; active: boolean }) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    const { error } = await sb.from("restaurants").update({ active: input.active }).eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };
    await log(sb, admin, input.active ? "restaurant.activate" : "restaurant.suspend", input.id, {});
    return { ok: true as const };
  });
}

export async function setApps(input: { accessToken: string; id: string; apps: string[] }) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    const { error } = await sb.from("restaurants").update({ apps: input.apps }).eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };
    await log(sb, admin, "apps.set", input.id, { apps: input.apps });
    return { ok: true as const };
  });
}

/** حذف نهائي — يتطلّب كتابة الـslug، ويفشل إن كان للمطعم سجلّ اشتراكات (restrict) */
export async function deleteRestaurant(input: { accessToken: string; id: string; confirmSlug: string }) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    const { data: r } = await sb.from("restaurants").select("slug, name").eq("id", input.id).single();
    if (!r) return { ok: false as const, error: "المطعم غير موجود." };
    if (r.slug !== input.confirmSlug) return { ok: false as const, error: "الاسم المكتوب لا يطابق رابط المطعم." };
    const { error } = await sb.from("restaurants").delete().eq("id", input.id);
    if (error)
      return {
        ok: false as const,
        error: error.message.includes("violates foreign key") ? "لا يمكن الحذف: للمطعم سجلّ اشتراكات. علّقه بدل حذفه." : error.message,
      };
    await log(sb, admin, "restaurant.delete", input.id, { slug: r.slug, name: r.name });
    return { ok: true as const };
  });
}

/* ————— الحسابات ————— */

export async function listAccounts(accessToken: string) {
  return asPlatform(accessToken, async (sb) => {
    const users: { id: string; email: string; created_at: string; last_sign_in_at: string | null }[] = [];
    for (let page = 1; page <= 10; page++) {
      const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      data.users.forEach((u) =>
        users.push({ id: u.id, email: u.email ?? "—", created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null }),
      );
      if (data.users.length < 200) break;
    }
    const [{ data: owned }, { data: memberships }] = await Promise.all([
      sb.from("restaurants").select("id, name, slug, owner"),
      sb.from("restaurant_admins").select("user_id, restaurant_id, email, role"),
    ]);
    return { ok: true as const, users, owned: owned ?? [], memberships: memberships ?? [] };
  });
}

/* ————— الاشتراكات والتجديد ————— */

export async function listSubscriptions(input: { accessToken: string; days?: number }) {
  return asPlatform(input.accessToken, async (sb) => {
    const days = input.days ?? 14;
    const now = Date.now();
    const [{ data: rests }, { data: subs }] = await Promise.all([
      sb.from("restaurants").select("id, slug, name, plan, trial_ends, active, owner"),
      sb.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    const expiring = (rests ?? [])
      .filter((r) => r.plan !== "free" && r.trial_ends && Date.parse(r.trial_ends) < now + days * DAY)
      .map((r) => ({ ...r, daysLeft: Math.ceil((Date.parse(r.trial_ends!) - now) / DAY) }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
    return { ok: true as const, expiring, subs: subs ?? [], rests: rests ?? [] };
  });
}

/** تسجيل تجديد: يكتب الفاتورة ويمدّد «مدفوع حتى» ويضبط الباقة — عملية واحدة */
export async function renewSubscription(input: {
  accessToken: string;
  restaurantId: string;
  plan: Plan;
  months: number;
  amount: number;
  method: Method;
  note?: string | null;
}) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    const months = Math.max(1, Math.min(24, Math.round(input.months)));
    const { data: r } = await sb.from("restaurants").select("trial_ends, name").eq("id", input.restaurantId).single();
    if (!r) return { ok: false as const, error: "المطعم غير موجود." };
    // نبني من الأبعد: اليوم أو نهاية الفترة الحالية — فلا تُهدر أيام مدفوعة
    const from = new Date(Math.max(Date.now(), r.trial_ends ? Date.parse(r.trial_ends) : 0));
    const to = new Date(from);
    to.setMonth(to.getMonth() + months);

    const { error: e1 } = await sb.from("subscriptions").insert({
      restaurant_id: input.restaurantId,
      plan: input.plan,
      period_start: day(from),
      period_end: day(to),
      months,
      amount: Math.max(0, Math.round(input.amount)),
      method: input.method,
      status: "paid",
      note: input.note ?? null,
      created_by: admin.id,
    });
    if (e1) return { ok: false as const, error: e1.message };

    const { error: e2 } = await sb.from("restaurants").update({ plan: input.plan, trial_ends: iso(to) }).eq("id", input.restaurantId);
    if (e2) return { ok: false as const, error: e2.message };
    await log(sb, admin, "subscription.renew", input.restaurantId, { plan: input.plan, months, amount: input.amount, method: input.method, until: iso(to) });
    return { ok: true as const, until: iso(to), name: r.name };
  });
}

/* ————— الطلبات والملاحظات ————— */

export async function listOrdersFeed(input: { accessToken: string; restaurantId?: string; limit?: number }) {
  return asPlatform(input.accessToken, async (sb) => {
    let q = sb.from("orders").select("id, restaurant_id, order_seq, order_type, total, status, created_at, customer_name, phone").order("created_at", { ascending: false }).limit(input.limit ?? 100);
    if (input.restaurantId) q = q.eq("restaurant_id", input.restaurantId);
    const [{ data: orders }, { data: rests }, { data: notes }] = await Promise.all([
      q,
      sb.from("restaurants").select("id, name, currency"),
      sb.from("admin_notes").select("id, order_id, body, created_at").not("order_id", "is", null).order("created_at", { ascending: false }),
    ]);
    return { ok: true as const, orders: orders ?? [], rests: rests ?? [], notes: notes ?? [] };
  });
}

export async function addNote(input: { accessToken: string; restaurantId: string; orderId?: string | null; body: string }) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    const body = input.body.trim();
    if (!body) return { ok: false as const, error: "الملاحظة فارغة." };
    const { error } = await sb.from("admin_notes").insert({
      restaurant_id: input.restaurantId,
      order_id: input.orderId ?? null,
      body,
      author: admin.id,
    });
    if (error) return { ok: false as const, error: error.message };
    await log(sb, admin, "note.add", input.orderId ?? input.restaurantId, {});
    return { ok: true as const };
  });
}

export async function listNotes(input: { accessToken: string; restaurantId: string }) {
  return asPlatform(input.accessToken, async (sb) => {
    const { data } = await sb.from("admin_notes").select("id, body, order_id, created_at").eq("restaurant_id", input.restaurantId).order("created_at", { ascending: false });
    return { ok: true as const, notes: data ?? [] };
  });
}

/* ————— سجل النشاط ————— */

export async function listAudit(input: { accessToken: string; limit?: number }) {
  return asPlatform(input.accessToken, async (sb) => {
    const { data } = await sb.from("platform_audit").select("*").order("created_at", { ascending: false }).limit(input.limit ?? 200);
    return { ok: true as const, rows: data ?? [] };
  });
}
