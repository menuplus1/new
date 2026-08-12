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
import { TPLS, TPL_BY_N } from "./templates";

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

/* ————— الدعم الفني ————— */

export type TicketStatus = "open" | "pending" | "closed";
const TICKET_STATUS: TicketStatus[] = ["open", "pending", "closed"];

export type TicketRow = {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_slug: string;
  subject: string;
  status: TicketStatus;
  priority: "low" | "normal" | "high";
  unread_platform: boolean;
  created_at: string;
  updated_at: string;
  messages_count: number;
  last_message: string | null;
};

/** لا joins عبر PostgREST — نجلب المطاعم والرسائل ونربط في JS */
export async function listTickets(input: { accessToken: string; status?: TicketStatus }) {
  return asPlatform(input.accessToken, async (sb) => {
    let q = sb.from("support_tickets").select("*").order("updated_at", { ascending: false }).limit(300);
    if (input.status) q = q.eq("status", input.status);
    const { data: tickets, error } = await q;
    if (error) return { ok: false as const, error: error.message };
    const T = tickets ?? [];
    const [{ data: rests }, { data: msgs }] = await Promise.all([
      sb.from("restaurants").select("id, name, slug"),
      T.length
        ? sb.from("ticket_messages").select("ticket_id, body, created_at").in("ticket_id", T.map((t) => t.id)).order("created_at", { ascending: true })
        : Promise.resolve({ data: [] as { ticket_id: string; body: string; created_at: string }[] }),
    ]);
    const byRest = new Map((rests ?? []).map((r) => [r.id, r]));
    const count = new Map<string, number>();
    const last = new Map<string, string>();
    for (const m of msgs ?? []) {
      count.set(m.ticket_id, (count.get(m.ticket_id) ?? 0) + 1);
      last.set(m.ticket_id, m.body); // مرتّبة تصاعدياً — الأخير يفوز
    }
    const rows: TicketRow[] = T.map((t) => ({
      ...(t as Omit<TicketRow, "restaurant_name" | "restaurant_slug" | "messages_count" | "last_message">),
      restaurant_name: byRest.get(t.restaurant_id)?.name ?? "—",
      restaurant_slug: byRest.get(t.restaurant_id)?.slug ?? "",
      messages_count: count.get(t.id) ?? 0,
      last_message: last.get(t.id) ?? null,
    }));
    return { ok: true as const, tickets: rows };
  });
}

/** فتح التذكرة يمسح «جديد من المطعم» — القراءة نفسها هي الإشعار */
export async function ticketThread(input: { accessToken: string; id: string }) {
  return asPlatform(input.accessToken, async (sb) => {
    const { data: ticket } = await sb.from("support_tickets").select("*").eq("id", input.id).maybeSingle();
    if (!ticket) return { ok: false as const, error: "التذكرة غير موجودة." };
    const [{ data: messages }, { data: rest }] = await Promise.all([
      sb.from("ticket_messages").select("*").eq("ticket_id", input.id).order("created_at", { ascending: true }),
      sb.from("restaurants").select("id, name, slug, plan").eq("id", ticket.restaurant_id).maybeSingle(),
    ]);
    if (ticket.unread_platform) await sb.from("support_tickets").update({ unread_platform: false }).eq("id", input.id);
    return { ok: true as const, ticket: { ...ticket, unread_platform: false, restaurant: rest ?? null }, messages: messages ?? [] };
  });
}

export async function replyTicket(input: { accessToken: string; id: string; body: string }) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    const body = input.body.trim();
    if (!body) return { ok: false as const, error: "الرسالة فارغة." };
    const { data: t } = await sb.from("support_tickets").select("status").eq("id", input.id).maybeSingle();
    if (!t) return { ok: false as const, error: "التذكرة غير موجودة." };
    const { error } = await sb.from("ticket_messages").insert({ ticket_id: input.id, sender: "platform", body });
    if (error) return { ok: false as const, error: error.message };
    const status: TicketStatus = t.status === "open" ? "pending" : t.status;
    await sb.from("support_tickets").update({ unread_restaurant: true, unread_platform: false, status, updated_at: iso(new Date()) }).eq("id", input.id);
    await log(sb, admin, "ticket.reply", input.id, { status });
    return { ok: true as const };
  });
}

export async function setTicketStatus(input: { accessToken: string; id: string; status: TicketStatus }) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    if (!TICKET_STATUS.includes(input.status)) return { ok: false as const, error: "حالة غير صالحة." };
    const { error } = await sb.from("support_tickets").update({ status: input.status, updated_at: iso(new Date()) }).eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };
    await log(sb, admin, "ticket.status", input.id, { status: input.status });
    return { ok: true as const };
  });
}

/* ————— الإعلانات ————— */

export type AnnouncementKind = "info" | "offer" | "warning";
export type Audience = "all" | "plan" | "one";

export async function listAnnouncements(accessToken: string) {
  return asPlatform(accessToken, async (sb) => {
    const { data } = await sb.from("announcements").select("*").order("created_at", { ascending: false });
    const A = data ?? [];
    const ids = A.map((a) => a.restaurant_id).filter(Boolean);
    const { data: rests } = ids.length
      ? await sb.from("restaurants").select("id, name").in("id", ids)
      : { data: [] as { id: string; name: string }[] };
    const byId = new Map((rests ?? []).map((r) => [r.id, r.name]));
    return {
      ok: true as const,
      rows: A.map((a) => ({ ...a, restaurant_name: a.restaurant_id ? byId.get(a.restaurant_id) ?? "—" : null })),
    };
  });
}

export async function saveAnnouncement(input: {
  accessToken: string;
  id?: string | null;
  title: string;
  body: string;
  kind: AnnouncementKind;
  audience: Audience;
  plan?: Plan | null;
  restaurantId?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  active: boolean;
}) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    const title = input.title.trim();
    const body = input.body.trim();
    if (title.length < 2 || title.length > 80) return { ok: false as const, error: "العنوان بين حرفين و٨٠ حرفاً." };
    if (body.length < 2 || body.length > 500) return { ok: false as const, error: "النص بين حرفين و٥٠٠ حرف." };
    if (input.audience === "plan" && !(input.plan && input.plan in PLAN_INFO)) return { ok: false as const, error: "اختر باقة صالحة." };
    if (input.audience === "one" && !input.restaurantId) return { ok: false as const, error: "اختر المطعم المستهدف." };

    const row: Record<string, unknown> = {
      title,
      body,
      kind: input.kind,
      audience: input.audience,
      plan: input.audience === "plan" ? input.plan : null,
      restaurant_id: input.audience === "one" ? input.restaurantId : null,
      cta_label: input.ctaLabel?.trim() || null,
      cta_url: input.ctaUrl?.trim() || null,
      ends_at: input.endsAt || null,
      active: input.active,
    };
    if (input.startsAt) row.starts_at = input.startsAt;

    const res = input.id
      ? await sb.from("announcements").update(row).eq("id", input.id).select("id").maybeSingle()
      : await sb.from("announcements").insert(row).select("id").maybeSingle();
    if (res.error) return { ok: false as const, error: res.error.message };
    await log(sb, admin, "announcement.save", res.data?.id ?? input.id ?? null, { title, audience: input.audience, active: input.active });
    return { ok: true as const, id: res.data?.id ?? input.id ?? null };
  });
}

export async function deleteAnnouncement(input: { accessToken: string; id: string }) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    const { error } = await sb.from("announcements").delete().eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };
    await log(sb, admin, "announcement.delete", input.id, {});
    return { ok: true as const };
  });
}

/* ————— الكوبونات ————— */
// الجدول (0011) مفتاحه code وقيمته kind/value وplans[] — الواجهة هنا percent/amount/plan
// وتُترجم عند الحفظ. لذلك id في هذه الدوال هو الكود نفسه.

export type CouponRow = {
  id: string;
  code: string;
  percent: number | null;
  amount: number | null;
  plan: Plan | null;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  note: string | null;
  created_at: string;
};

export async function listCoupons(accessToken: string) {
  return asPlatform(accessToken, async (sb) => {
    const [{ data: coupons }, { data: subs }] = await Promise.all([
      sb.from("coupons").select("*").order("created_at", { ascending: false }),
      sb.from("subscriptions").select("coupon_code").not("coupon_code", "is", null),
    ]);
    const used = new Map<string, number>();
    for (const s of subs ?? []) used.set(s.coupon_code, (used.get(s.coupon_code) ?? 0) + 1);
    const rows: CouponRow[] = (coupons ?? []).map((c) => ({
      id: c.code,
      code: c.code,
      percent: c.kind === "percent" ? c.value : null,
      amount: c.kind === "amount" ? c.value : null,
      plan: (c.plans?.[0] as Plan) ?? null,
      expires_at: c.expires_at,
      max_uses: c.max_uses,
      used_count: used.get(c.code) ?? 0,
      active: c.active,
      note: c.note ?? null,
      created_at: c.created_at,
    }));
    return { ok: true as const, rows };
  });
}

export async function saveCoupon(input: {
  accessToken: string;
  id?: string | null;
  code: string;
  percent?: number | null;
  amount?: number | null;
  plan?: Plan | null;
  expiresAt?: string | null;
  maxUses?: number | null;
  active: boolean;
  note?: string | null;
}) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    const code = input.code.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,24}$/.test(code)) return { ok: false as const, error: "الكود من ٣ إلى ٢٤ حرفاً: A-Z و0-9 وشرطة." };
    const percent = input.percent ?? null;
    const amount = input.amount ?? null;
    if ((percent === null) === (amount === null)) return { ok: false as const, error: "حدّد نسبة أو مبلغاً — واحداً فقط." };
    if (percent !== null && (!Number.isFinite(percent) || percent < 1 || percent > 100)) return { ok: false as const, error: "النسبة بين ١ و١٠٠." };
    if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) return { ok: false as const, error: "المبلغ أكبر من صفر." };
    if (input.plan && !(input.plan in PLAN_INFO)) return { ok: false as const, error: "باقة غير صالحة." };

    const row = {
      code,
      kind: percent !== null ? "percent" : "amount",
      value: Math.round((percent ?? amount) as number),
      plans: input.plan ? [input.plan] : [],
      expires_at: input.expiresAt || null,
      max_uses: input.maxUses ?? null,
      active: input.active,
      note: input.note?.trim() || null,
    };
    // إعادة تسمية الكود = تعديل المفتاح، وغيرها upsert عادي
    const res = input.id && input.id !== code
      ? await sb.from("coupons").update(row).eq("code", input.id)
      : await sb.from("coupons").upsert(row, { onConflict: "code" });
    if (res.error) return { ok: false as const, error: res.error.message.includes("duplicate") ? "هذا الكود موجود مسبقاً." : res.error.message };
    await log(sb, admin, "coupon.save", code, { kind: row.kind, value: row.value, plan: input.plan ?? null, active: input.active });
    return { ok: true as const, code };
  });
}

export async function deleteCoupon(input: { accessToken: string; id: string }) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    const { error } = await sb.from("coupons").delete().eq("code", input.id);
    if (error) return { ok: false as const, error: error.message };
    await log(sb, admin, "coupon.delete", input.id, {});
    return { ok: true as const };
  });
}

/* ————— القوالب ————— */
// التخطيط شيفرة؛ platform_templates طبقة عرض فوقه (اسم/وصف/لون/ترتيب/إظهار).

export type TemplateRow = {
  n: number;
  name: string;
  description: string;
  accent: string;
  sort: number;
  active: boolean;
  source: "code" | "override";
};

export async function listTemplateRows(accessToken: string) {
  return asPlatform(accessToken, async (sb) => {
    const { data } = await sb.from("platform_templates").select("*");
    const byN = new Map((data ?? []).map((t) => [t.n as number, t]));
    const rows: TemplateRow[] = TPLS.map((t) => {
      const o = byN.get(t.n);
      return {
        n: t.n,
        name: o?.name ?? t.name,
        description: o?.description ?? t.desc,
        accent: o?.accent ?? t.accent,
        sort: o?.sort ?? 0,
        active: o?.active ?? true,
        source: o ? ("override" as const) : ("code" as const),
      };
    }).sort((a, b) => a.sort - b.sort || a.n - b.n);
    return { ok: true as const, rows };
  });
}

export async function saveTemplate(input: {
  accessToken: string;
  n: number;
  name?: string | null;
  description?: string | null;
  accent?: string | null;
  sort?: number | null;
  active: boolean;
}) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    if (!TPL_BY_N[input.n]) return { ok: false as const, error: "رقم قالب غير موجود." };
    const row: Record<string, unknown> = { n: input.n, active: input.active, updated_at: iso(new Date()) };
    if (input.name !== undefined) row.name = input.name?.trim() || null;
    if (input.description !== undefined) row.description = input.description?.trim() || null;
    if (input.accent !== undefined) row.accent = input.accent?.trim() || null;
    if (input.sort !== undefined && input.sort !== null) row.sort = Math.round(input.sort);
    const { error } = await sb.from("platform_templates").upsert(row, { onConflict: "n" });
    if (error) return { ok: false as const, error: error.message };
    await log(sb, admin, "template.save", String(input.n), { active: input.active });
    return { ok: true as const };
  });
}

/** حذف صف التخصيص — يعود القالب لِما في الشيفرة */
export async function resetTemplate(input: { accessToken: string; n: number }) {
  return asPlatform(input.accessToken, async (sb, admin) => {
    const { error } = await sb.from("platform_templates").delete().eq("n", input.n);
    if (error) return { ok: false as const, error: error.message };
    await log(sb, admin, "template.reset", String(input.n), {});
    return { ok: true as const };
  });
}
