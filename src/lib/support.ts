"use server";

/** جانب المطعم من الدعم والإعلانات — يُستدعى بتوكن صاحب المطعم أو مشرفه،
 *  لا بتوكن مدير المنصّة (ذاك في platform.ts).
 *
 *  نستخدم مفتاح الخدمة كما في actions.ts لأن الإعلانات تحتاج ترشيحاً حسب
 *  الاستهداف (باقة/مطعم) لا تصفه سياسة RLS واحدة — والبوابة هنا member():
 *  نفس نمط verifyOwner في actions.ts موسّعاً ليشمل مشرفي المطعم. */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const service = () => (URL && SERVICE ? createClient(URL, SERVICE) : null);

type Fail = { ok: false; error: string };

/** صاحب المطعم أو أحد مشرفيه — وإلا null */
async function member(sb: SupabaseClient, accessToken: string, restaurantId: string) {
  const { data: auth } = await sb.auth.getUser(accessToken);
  if (!auth.user) return null;
  const { data: r } = await sb.from("restaurants").select("id, plan, owner").eq("id", restaurantId).maybeSingle();
  if (!r) return null;
  if (r.owner === auth.user.id) return { rest: r, userId: auth.user.id };
  const { data: m } = await sb
    .from("restaurant_admins")
    .select("user_id")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  return m ? { rest: r, userId: auth.user.id } : null;
}

async function asMember<T>(
  accessToken: string,
  restaurantId: string,
  fn: (sb: SupabaseClient, ctx: { rest: { id: string; plan: string; owner: string | null }; userId: string }) => Promise<T>,
): Promise<T | Fail> {
  const sb = service();
  if (!sb) return { ok: false, error: "لم يتم ربط قاعدة البيانات بعد." };
  try {
    const ctx = await member(sb, accessToken, restaurantId);
    if (!ctx) return { ok: false, error: "غير مصرّح." };
    return await fn(sb, ctx);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ————— التذاكر ————— */

export async function openTicket(input: { accessToken: string; restaurantId: string; subject: string; body: string }) {
  return asMember(input.accessToken, input.restaurantId, async (sb) => {
    const subject = input.subject.trim();
    const body = input.body.trim();
    if (subject.length < 2 || subject.length > 120) return { ok: false as const, error: "العنوان بين حرفين و١٢٠ حرفاً." };
    if (body.length < 2 || body.length > 2000) return { ok: false as const, error: "الرسالة بين حرفين و٢٠٠٠ حرف." };
    const { data: t, error } = await sb
      .from("support_tickets")
      .insert({ restaurant_id: input.restaurantId, subject, unread_platform: true })
      .select("id")
      .single();
    if (error) return { ok: false as const, error: error.message };
    const { error: e2 } = await sb.from("ticket_messages").insert({ ticket_id: t.id, sender: "restaurant", body });
    if (e2) return { ok: false as const, error: e2.message };
    return { ok: true as const, id: t.id as string };
  });
}

export async function listMyTickets(input: { accessToken: string; restaurantId: string }) {
  return asMember(input.accessToken, input.restaurantId, async (sb) => {
    const { data } = await sb
      .from("support_tickets")
      .select("*")
      .eq("restaurant_id", input.restaurantId)
      .order("updated_at", { ascending: false });
    return { ok: true as const, tickets: data ?? [] };
  });
}

/** فتح التذكرة يمسح «ردّ جديد من المنصّة» */
export async function myTicketThread(input: { accessToken: string; restaurantId: string; id: string }) {
  return asMember(input.accessToken, input.restaurantId, async (sb) => {
    const { data: ticket } = await sb
      .from("support_tickets")
      .select("*")
      .eq("id", input.id)
      .eq("restaurant_id", input.restaurantId)
      .maybeSingle();
    if (!ticket) return { ok: false as const, error: "التذكرة غير موجودة." };
    const { data: messages } = await sb.from("ticket_messages").select("*").eq("ticket_id", input.id).order("created_at", { ascending: true });
    if (ticket.unread_restaurant) await sb.from("support_tickets").update({ unread_restaurant: false }).eq("id", input.id);
    return { ok: true as const, ticket: { ...ticket, unread_restaurant: false }, messages: messages ?? [] };
  });
}

export async function replyMyTicket(input: { accessToken: string; restaurantId: string; id: string; body: string }) {
  return asMember(input.accessToken, input.restaurantId, async (sb) => {
    const body = input.body.trim();
    if (!body) return { ok: false as const, error: "الرسالة فارغة." };
    const { data: t } = await sb.from("support_tickets").select("id").eq("id", input.id).eq("restaurant_id", input.restaurantId).maybeSingle();
    if (!t) return { ok: false as const, error: "التذكرة غير موجودة." };
    const { error } = await sb.from("ticket_messages").insert({ ticket_id: input.id, sender: "restaurant", body });
    if (error) return { ok: false as const, error: error.message };
    await sb
      .from("support_tickets")
      .update({ unread_platform: true, unread_restaurant: false, status: "open", updated_at: new Date().toISOString() })
      .eq("id", input.id);
    return { ok: true as const };
  });
}

/* ————— الإعلانات ————— */

/** الفعّالة ضمن الفترة والمستهدِفة لهذا المطعم، ناقص ما أغلقه هذا المستخدم */
export async function liveAnnouncements(input: { accessToken: string; restaurantId: string }) {
  return asMember(input.accessToken, input.restaurantId, async (sb, { rest, userId }) => {
    const now = new Date().toISOString();
    const [{ data: rows }, { data: reads }] = await Promise.all([
      sb
        .from("announcements")
        .select("*")
        .eq("active", true)
        .lte("starts_at", now)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("created_at", { ascending: false }),
      sb.from("announcement_reads").select("announcement_id").eq("user_id", userId),
    ]);
    const dismissed = new Set((reads ?? []).map((r) => r.announcement_id));
    const targeted = (rows ?? []).filter(
      (a) =>
        !dismissed.has(a.id) &&
        (a.audience === "all" ||
          (a.audience === "plan" && a.plan === rest.plan) ||
          (a.audience === "one" && a.restaurant_id === input.restaurantId)),
    );
    return { ok: true as const, announcements: targeted };
  });
}

export async function dismissAnnouncement(input: { accessToken: string; id: string }): Promise<{ ok: true } | Fail> {
  const sb = service();
  if (!sb) return { ok: false, error: "لم يتم ربط قاعدة البيانات بعد." };
  try {
    const { data: auth } = await sb.auth.getUser(input.accessToken);
    if (!auth.user) return { ok: false, error: "غير مصرّح." };
    const { error } = await sb
      .from("announcement_reads")
      .upsert({ announcement_id: input.id, user_id: auth.user.id }, { onConflict: "announcement_id,user_id" });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
