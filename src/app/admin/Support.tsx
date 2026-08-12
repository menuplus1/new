"use client";

/** الدعم — جانب المطعم.
 *
 *  التوكن يُقرأ داخل تأثير لا أثناء الرندر، وكل نداء يمرّ على أفعال src/lib/support.ts
 *  (هي التي تتحقّق من العضوية). التذاكر عشرات لا آلاف فلا ترقيم ولا بحث. */

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listMyTickets, myTicketThread, openTicket, replyMyTicket } from "@/lib/support";
import { Chip } from "@/app/root/ui";
import { CARD, FIELD, type Rest } from "./ui";

type Status = "open" | "pending" | "closed";
type Ticket = { id: string; subject: string; status: Status; unread_restaurant: boolean; created_at: string; updated_at: string };
type Msg = { id: string; sender: "restaurant" | "platform"; body: string; created_at: string };

const STATUS: Record<Status, { label: string; tone: "good" | "warn" | "neutral" }> = {
  open: { label: "مفتوحة", tone: "good" },
  pending: { label: "قيد المعالجة", tone: "warn" },
  closed: { label: "مغلقة", tone: "neutral" },
};

const when = (s: string) => new Date(s).toLocaleString("en-GB");
const oops = (res: object) => ("error" in res ? String((res as { error: unknown }).error) : "تعذّر التنفيذ.");

const BTN = "rounded-xl border border-white/15 px-3 py-1.5 text-sm font-bold transition hover:bg-white/5 disabled:opacity-40";
const BTN_ON = "rounded-xl px-4 py-2 text-sm font-extrabold text-[#0d0d0d] transition disabled:opacity-40";

export function Support({ client, rest }: { client: SupabaseClient; rest: Rest }) {
  const accent = rest.primary_color;
  const [token, setToken] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (t: string) => {
      const res = await listMyTickets({ accessToken: t, restaurantId: rest.id });
      if (!("ok" in res) || !res.ok) {
        setErr(oops(res));
        setTickets([]);
        return;
      }
      setTickets(res.tickets as Ticket[]);
    },
    [rest.id],
  );

  useEffect(() => {
    (async () => {
      const t = (await client.auth.getSession()).data.session?.access_token ?? null;
      setToken(t);
      if (t) await load(t);
      else setTickets([]);
    })();
  }, [client, load]);

  /** فتح التذكرة يمسح «ردّ جديد» على الخادم — فنمسحه محليّاً أيضاً */
  async function openThread(t: string, id: string) {
    setSel(id);
    setMsgs([]);
    setErr(null);
    const res = await myTicketThread({ accessToken: t, restaurantId: rest.id, id });
    if (!("ok" in res) || !res.ok) {
      setErr(oops(res));
      return;
    }
    setMsgs(res.messages as Msg[]);
    setTickets((ts) => (ts ?? []).map((x) => (x.id === id ? { ...x, unread_restaurant: false } : x)));
  }

  async function create() {
    if (!token) return;
    setBusy(true);
    setErr(null);
    const res = await openTicket({ accessToken: token, restaurantId: rest.id, subject, body });
    setBusy(false);
    if (!("ok" in res) || !res.ok) {
      setErr(oops(res));
      return;
    }
    setSubject("");
    setBody("");
    await load(token);
    await openThread(token, res.id);
  }

  async function send() {
    if (!token || !sel) return;
    setBusy(true);
    setErr(null);
    const res = await replyMyTicket({ accessToken: token, restaurantId: rest.id, id: sel, body: reply });
    setBusy(false);
    if (!("ok" in res) || !res.ok) {
      setErr(oops(res));
      return;
    }
    setReply("");
    await openThread(token, sel);
    await load(token);
  }

  if (tickets === null) return <p className="text-[#a6a6a3]">جارٍ التحميل…</p>;

  return (
    <div className="space-y-5">
      {err && <p className="text-sm text-red-400">{err}</p>}

      {/* ————— تذكرة جديدة ————— */}
      <section className={`${CARD} space-y-3`}>
        <p className="font-extrabold">تذكرة جديدة</p>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="الموضوع"
          maxLength={120}
          className={FIELD}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="اشرح لنا المشكلة أو الطلب…"
          maxLength={2000}
          className={`${FIELD} resize-y`}
        />
        <button
          disabled={busy || !token || subject.trim().length < 2 || body.trim().length < 2}
          onClick={create}
          className={BTN_ON}
          style={{ background: accent }}
        >
          إرسال
        </button>
      </section>

      {/* ————— التذاكر ————— */}
      {!tickets.length ? (
        <p className="py-6 text-center text-sm text-[#a6a6a3]">لا توجد تذاكر — إن احتجت شيئاً افتح تذكرة وسنجيبك.</p>
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => {
            const on = t.id === sel;
            return (
              <li key={t.id} className={CARD}>
                <button
                  onClick={() => (on ? setSel(null) : token && openThread(token, t.id))}
                  className="flex w-full items-center gap-2 text-start"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold">{t.subject}</span>
                    <span className="mt-0.5 block text-[11px] text-[#a6a6a3]">{when(t.updated_at ?? t.created_at)}</span>
                  </span>
                  {t.unread_restaurant && (
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black text-[#0d0d0d]" style={{ background: accent }}>
                      رد جديد
                    </span>
                  )}
                  <Chip {...STATUS[t.status]} />
                  <span className="shrink-0 text-[#a6a6a3]">{on ? "▴" : "▾"}</span>
                </button>

                {on && (
                  <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                    <ul className="space-y-2">
                      {msgs.map((m) => {
                        const mine = m.sender === "restaurant";
                        return (
                          <li
                            key={m.id}
                            className={`max-w-[85%] rounded-2xl px-3 py-2 ${mine ? "ms-auto bg-white/[0.06]" : "me-auto"}`}
                            style={mine ? undefined : { background: `color-mix(in srgb, ${accent} 14%, transparent)` }}
                          >
                            <p className="text-[11px] font-black" style={mine ? { color: "#a6a6a3" } : { color: accent }}>
                              {mine ? "أنت" : "فريق منيو بلس"}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm">{m.body}</p>
                            <p className="mt-1 text-[10px] text-[#a6a6a3]">{when(m.created_at)}</p>
                          </li>
                        );
                      })}
                    </ul>

                    {t.status === "closed" ? (
                      <p className="text-sm text-[#a6a6a3]">هذه التذكرة مغلقة — الردّ عليها يعيد فتحها.</p>
                    ) : null}

                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={3}
                      placeholder="اكتب ردّك…"
                      className={`${FIELD} resize-y`}
                    />
                    <div className="flex gap-2">
                      <button disabled={busy || !reply.trim()} onClick={send} className={BTN_ON} style={{ background: accent }}>
                        إرسال الرد
                      </button>
                      <button onClick={() => setSel(null)} className={BTN}>إغلاق ✕</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
