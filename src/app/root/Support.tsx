"use client";

/** كونسول المنصّة — تذاكر الدعم.
 *
 *  استدعاء واحد يجلب كل التذاكر والفلترة في المتصفّح، فيظهر العدّاد بجانب كل
 *  حالة بلا استدعاء إضافي (listTickets يقبل status لكنه يعيد حالة واحدة فقط).
 *  ponytail: كل التذاكر في الذاكرة — لو تجاوزت الآلاف انقل الفلترة للخادم. */

import { useCallback, useEffect, useState } from "react";
import {
  listTickets,
  replyTicket,
  setTicketStatus,
  ticketThread,
  type TicketRow,
  type TicketStatus,
} from "@/lib/platform";
import { CARD, FIELD } from "@/app/admin/ui";
import { BRAND, Chip, Empty, TD, Table } from "./ui";

type Msg = { id: string; sender: "restaurant" | "platform"; body: string; created_at: string };
type ThreadTicket = {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: "low" | "normal" | "high";
  created_at: string;
  restaurant: { name: string; slug: string } | null;
};

const FILTERS: ["all" | TicketStatus, string][] = [
  ["all", "الكل"],
  ["open", "مفتوحة"],
  ["pending", "قيد المتابعة"],
  ["closed", "مغلقة"],
];

const STATUS: Record<TicketStatus, { label: string; tone: "warn" | "brand" | "neutral" }> = {
  open: { label: "مفتوحة", tone: "warn" },
  pending: { label: "قيد المتابعة", tone: "brand" },
  closed: { label: "مغلقة", tone: "neutral" },
};

const PRIORITY: Record<string, { label: string; tone: "neutral" | "brand" | "bad" }> = {
  low: { label: "منخفضة", tone: "neutral" },
  normal: { label: "عادية", tone: "brand" },
  high: { label: "عاجلة", tone: "bad" },
};

const COLS = ["المطعم", "الموضوع", "الأولوية", "الحالة", "آخر تحديث"];
const BTN = "rounded-xl border border-white/15 px-3 py-1.5 text-sm font-bold transition hover:bg-white/5 disabled:opacity-40";
const BTN_ON = "rounded-xl px-4 py-2 text-sm font-black text-[#0d0d0d] transition disabled:opacity-40";

const when = (s: string) => new Date(s).toLocaleDateString("en-GB");
const stamp = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function Support({ token }: { token: string }) {
  const [rows, setRows] = useState<TicketRow[] | null>(null);
  const [filter, setFilter] = useState<"all" | TicketStatus>("all");
  const [sel, setSel] = useState<string | null>(null);
  const [thread, setThread] = useState<{ ticket: ThreadTicket; messages: Msg[] } | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await listTickets({ accessToken: token });
    if (!("ok" in res) || !res.ok) {
      setErr("error" in res ? String(res.error) : "تعذّر تحميل التذاكر.");
      setRows([]);
      return;
    }
    setRows(res.tickets);
  }, [token]);

  const loadThread = useCallback(
    async (id: string) => {
      const res = await ticketThread({ accessToken: token, id });
      if (!("ok" in res) || !res.ok) {
        setErr("error" in res ? String(res.error) : "تعذّر فتح التذكرة.");
        setThread(null);
        return;
      }
      setThread({ ticket: res.ticket as ThreadTicket, messages: res.messages as Msg[] });
    },
    [token],
  );

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  /** فتح التذكرة يمسح «جديد» في الخادم — لذلك نعيد تحميل القائمة بعده */
  useEffect(() => {
    if (!sel) return;
    (async () => {
      setErr(null);
      setReply("");
      await loadThread(sel);
      await load();
    })();
  }, [sel, loadThread, load]);

  /** كل تعديل: انتظر، اعرض الخطأ حرفيّاً، ثم أعد تحميل الخيط والقائمة */
  async function run<T extends { ok: boolean }>(p: Promise<T>) {
    setErr(null);
    setBusy(true);
    const res = await p;
    setBusy(false);
    if (!("ok" in res) || !res.ok) {
      setErr("error" in res ? String(res.error) : "فشل التنفيذ.");
      return null;
    }
    if (sel) await loadThread(sel);
    await load();
    return res;
  }

  if (rows === null) return <p className="text-[#a6a6a3]">جارٍ التحميل…</p>;

  const count = (k: "all" | TicketStatus) => (k === "all" ? rows.length : rows.filter((t) => t.status === k).length);
  const view = filter === "all" ? rows : rows.filter((t) => t.status === filter);

  const send = async () => {
    if (!sel || !reply.trim()) return;
    const res = await run(replyTicket({ accessToken: token, id: sel, body: reply }));
    if (res) setReply("");
  };

  return (
    <div className="space-y-4">
      {err && <p className="text-sm text-red-400">{err}</p>}

      {/* ————— الفلاتر ————— */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            aria-pressed={filter === k}
            className="rounded-xl border px-3 py-1.5 text-xs font-black transition"
            style={
              filter === k
                ? { background: `color-mix(in srgb, ${BRAND} 18%, transparent)`, color: BRAND, borderColor: BRAND }
                : { borderColor: "rgba(255,255,255,0.15)", color: "#a6a6a3" }
            }
          >
            {label} <span className="opacity-70">{count(k).toLocaleString("en-US")}</span>
          </button>
        ))}
      </div>

      {/* ————— الخيط ————— */}
      {thread && (
        <div className={`${CARD} space-y-4`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-lg font-black">{thread.ticket.subject}</p>
              <p className="mt-0.5 text-xs text-[#a6a6a3]">
                {thread.ticket.restaurant?.name ?? "—"}
                {thread.ticket.restaurant && (
                  <span dir="ltr" className="ms-2">/{thread.ticket.restaurant.slug}</span>
                )}
                <span className="ms-2">· فُتحت {when(thread.ticket.created_at)}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Chip {...PRIORITY[thread.ticket.priority]} />
              <Chip {...STATUS[thread.ticket.status]} />
              <button onClick={() => { setSel(null); setThread(null); }} className={BTN}>إغلاق ✕</button>
            </div>
          </div>

          <ul className="max-h-[420px] space-y-2 overflow-y-auto">
            {!thread.messages.length && <li className="text-sm text-[#a6a6a3]">لا رسائل في هذه التذكرة.</li>}
            {thread.messages.map((m) => {
              const mine = m.sender === "platform";
              return (
                <li key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                  <div
                    className="max-w-[85%] rounded-2xl border px-3 py-2"
                    style={
                      mine
                        ? { borderColor: `color-mix(in srgb, ${BRAND} 45%, transparent)`, background: `color-mix(in srgb, ${BRAND} 12%, transparent)` }
                        : { borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }
                    }
                  >
                    <p className="text-[11px] font-black" style={{ color: mine ? BRAND : "#a6a6a3" }}>
                      {mine ? "المنصّة" : thread.ticket.restaurant?.name ?? "المطعم"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{m.body}</p>
                    <p className="mt-1 text-[10px] text-[#a6a6a3]" dir="ltr">{stamp(m.created_at)}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              placeholder="اكتب ردّك للمطعم…"
              className={`${FIELD} resize-y`}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button disabled={busy || !reply.trim()} onClick={send} className={BTN_ON} style={{ background: BRAND }}>
                {busy ? "جارٍ الإرسال…" : "إرسال الرد"}
              </button>
              <span className="flex-1" />
              {thread.ticket.status === "closed" ? (
                <button
                  disabled={busy}
                  onClick={() => void run(setTicketStatus({ accessToken: token, id: thread.ticket.id, status: "open" }))}
                  className={BTN}
                >
                  إعادة فتح
                </button>
              ) : (
                <>
                  <button
                    disabled={busy || thread.ticket.status === "pending"}
                    onClick={() => void run(setTicketStatus({ accessToken: token, id: thread.ticket.id, status: "pending" }))}
                    className={BTN}
                  >
                    قيد المتابعة
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void run(setTicketStatus({ accessToken: token, id: thread.ticket.id, status: "closed" }))}
                    className={BTN}
                  >
                    إغلاق التذكرة
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ————— الجدول ————— */}
      {!rows.length ? (
        <Empty>لا توجد تذاكر دعم.</Empty>
      ) : !view.length ? (
        <Empty>لا تذاكر في هذه الحالة.</Empty>
      ) : (
        <Table cols={COLS}>
          {view.map((t) => (
            <tr
              key={t.id}
              onClick={() => setSel(t.id)}
              className={`cursor-pointer transition hover:bg-white/5 ${t.id === sel ? "bg-white/[0.06]" : ""}`}
            >
              <td className={TD}>
                <p className="truncate font-extrabold">{t.restaurant_name}</p>
                <p className="text-[11px] text-[#a6a6a3]" dir="ltr">/{t.restaurant_slug}</p>
              </td>
              <td className={TD}>
                <span className="flex items-center gap-2">
                  {t.unread_platform && (
                    <span
                      title="جديد"
                      aria-label="جديد"
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: BRAND }}
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{t.subject}</span>
                    <span className="block truncate text-[11px] text-[#a6a6a3]">{t.last_message ?? "—"}</span>
                  </span>
                </span>
              </td>
              <td className={TD}><Chip {...PRIORITY[t.priority]} /></td>
              <td className={TD}><Chip {...STATUS[t.status]} /></td>
              <td className={`${TD} whitespace-nowrap text-xs text-[#a6a6a3]`} dir="ltr">{when(t.updated_at)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
