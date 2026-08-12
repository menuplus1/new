"use client";

/** آخر الطلبات عبر كل المطاعم — عرض فقط + ملاحظة داخلية لا يراها المطعم.
 *  الفلترة في المتصفّح: الاستدعاء يجلب آخر ١٠٠ طلب مرّة واحدة. */

import { useCallback, useEffect, useState } from "react";
import { addNote, listOrdersFeed } from "@/lib/platform";
import { ORDER_TYPE_LABEL, type OrderType } from "@/lib/types";
import { CARD, FIELD } from "@/app/admin/ui";
import { BRAND, Chip, Empty } from "./ui";

type Order = {
  id: string;
  restaurant_id: string;
  order_seq: number;
  order_type: OrderType;
  total: number;
  status: string;
  created_at: string;
  customer_name: string | null;
  phone: string | null;
};
type Rest = { id: string; name: string; currency: string };
type Note = { id: string; order_id: string | null; body: string; created_at: string };

const STATUS = {
  pending: { label: "قيد الانتظار", tone: "warn" },
  done: { label: "تم", tone: "good" },
  cancelled: { label: "ملغي", tone: "bad" },
} as const;

const STATUS_KEYS = Object.keys(STATUS) as (keyof typeof STATUS)[];

export function OrdersFeed({ token }: { token: string }) {
  const [data, setData] = useState<{ orders: Order[]; rests: Rest[]; notes: Note[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rest, setRest] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await listOrdersFeed({ accessToken: token, limit: 100 });
    if (!("ok" in res) || !res.ok) {
      setErr("error" in res ? res.error : "تعذّر تحميل الطلبات.");
      return;
    }
    setErr(null);
    setData({ orders: res.orders as Order[], rests: res.rests as Rest[], notes: res.notes as Note[] });
  }, [token]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  async function save(o: Order) {
    setBusy(true);
    const res = await addNote({ accessToken: token, restaurantId: o.restaurant_id, orderId: o.id, body });
    setBusy(false);
    if (!("ok" in res) || !res.ok) {
      setErr("error" in res ? res.error : "تعذّر حفظ الملاحظة.");
      return;
    }
    setOpen(null);
    setBody("");
    await load();
  }

  if (err && !data) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return <p className="text-[#a6a6a3]">جارٍ التحميل…</p>;

  const restOf = (id: string) => data.rests.find((r) => r.id === id);
  const noteOf = (id: string) => data.notes.find((n) => n.order_id === id); // مرتّبة تنازلياً — الأحدث أولاً
  const rows = data.orders.filter((o) => (!rest || o.restaurant_id === rest) && (!status || o.status === status));

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#a6a6a3]">للاطّلاع فقط — تغيير حالة الطلب من لوحة المطعم.</p>
      {err && <p className="text-sm text-red-400">{err}</p>}

      <div className={`${CARD} flex flex-wrap items-center gap-3`}>
        <div className="w-full sm:w-56">
          <select value={rest} onChange={(e) => setRest(e.target.value)} className={FIELD}>
            <option value="">كل المطاعم</option>
            {data.rests.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-40">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={FIELD}>
            <option value="">كل الحالات</option>
            {STATUS_KEYS.map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
          </select>
        </div>
        <span className="ms-auto text-xs font-bold text-[#a6a6a3]">{rows.length.toLocaleString("en-US")} طلب</span>
      </div>

      {!rows.length ? (
        <div className={CARD}>
          <Empty>لا توجد طلبات.</Empty>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((o) => {
            const r = restOf(o.restaurant_id);
            const at = new Date(o.created_at);
            const s = STATUS[o.status as keyof typeof STATUS] ?? { label: o.status, tone: "neutral" as const };
            const note = noteOf(o.id);
            return (
              <li key={o.id} className={CARD}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-extrabold">{r?.name ?? "مطعم محذوف"}</span>
                  <span className="text-sm font-bold" style={{ color: BRAND }} dir="ltr">#{o.order_seq}</span>
                  <span className="text-sm text-[#a6a6a3]">· {ORDER_TYPE_LABEL[o.order_type] ?? o.order_type}</span>
                  <span className="ms-auto text-xs text-[#a6a6a3]" dir="ltr">
                    {at.toLocaleDateString("en-GB")} {at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {(o.customer_name || o.phone) && (
                  <p className="mt-1 text-sm text-[#a6a6a3]">
                    {o.customer_name && <span>{o.customer_name}</span>}
                    {o.customer_name && o.phone && " · "}
                    {o.phone && <span dir="ltr">{o.phone}</span>}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="font-extrabold" style={{ color: BRAND }}>
                    {o.total.toLocaleString("en-US")} {r?.currency ?? "د.ع"}
                  </span>
                  <Chip label={s.label} tone={s.tone} />
                  <button
                    onClick={() => {
                      setOpen(open === o.id ? null : o.id);
                      setBody("");
                    }}
                    className="ms-auto rounded-xl border border-white/15 px-3 py-1.5 text-xs font-bold transition hover:bg-white/5"
                  >
                    ملاحظة
                  </button>
                </div>

                {note && <p className="mt-2 border-t border-white/5 pt-2 text-sm">📝 {note.body}</p>}

                {open === o.id && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={2}
                      placeholder="ملاحظة داخلية — لا يراها المطعم"
                      className={FIELD}
                    />
                    <button
                      onClick={() => save(o)}
                      disabled={busy || !body.trim()}
                      className="rounded-xl px-4 py-2 text-sm font-black text-[#0d0d0d] disabled:opacity-60"
                      style={{ background: BRAND }}
                    >
                      {busy ? "جارٍ الحفظ…" : "حفظ"}
                    </button>
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
