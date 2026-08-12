"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { can } from "@/lib/plans";
import { qrMatrix } from "@/lib/qr";
import { CARD, FIELD, LockBadge, type Rest } from "./ui";

type Table = { id: string; label: string };

const linkFor = (slug: string, label: string) => `https://menuplus.rest/${slug}?t=${encodeURIComponent(label)}`;

/** QR as inline SVG — one <rect> per dark module, 4-module quiet zone */
function QR({ text, size }: { text: string; size: number }) {
  const m = qrMatrix(text);
  const n = m.length + 8;
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label="رمز QR">
      <rect width={n} height={n} fill="#fff" />
      {m.map((row, r) =>
        row.map((dark, c) => (dark ? <rect key={`${r}-${c}`} x={c + 4} y={r + 4} width={1} height={1} fill="#000" /> : null)),
      )}
    </svg>
  );
}

export function Tables({ client, rest, accent }: { client: SupabaseClient; rest: Rest; accent: string }) {
  const [rows, setRows] = useState<Table[] | null>(null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const locked = !can(rest.plan, "tables");

  const load = useCallback(async () => {
    const { data, error } = await client.from("tables").select("id, label").eq("restaurant_id", rest.id).order("label");
    if (error) {
      setErr(/does not exist|schema cache|permission/i.test(error.message) ? "جدول الطاولات غير مهيّأ — شغّل ملف 0009_tables.sql في قاعدة البيانات." : error.message);
      setRows([]);
      return;
    }
    setErr(null);
    setRows((data ?? []) as Table[]);
  }, [client, rest.id]);

  useEffect(() => {
    if (locked) return;
    (async () => {
      await load();
    })();
  }, [load, locked]);

  if (locked)
    return (
      <section className={`${CARD} flex items-center justify-between gap-3`}>
        <p className="font-extrabold">🪑 إدارة الطاولات متاحة من باقة التميز</p>
        <LockBadge feature="tables" />
      </section>
    );

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    const { error } = await fn();
    await load();
    if (error) setErr(error.message);
    setBusy(false);
    return !error;
  }

  async function add() {
    const l = label.trim();
    if (!l) return setErr("رقم أو اسم الطاولة مطلوب.");
    if (await run(() => client.from("tables").insert({ restaurant_id: rest.id, label: l }))) setLabel("");
  }

  async function copy(t: Table) {
    await navigator.clipboard.writeText(linkFor(rest.slug, t.label));
    setCopied(t.id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section className={CARD}>
      {/* the sheet stays in flow (not position:fixed) so it paginates instead of
          clipping every table past the first page; print:hidden collapses the
          on-screen UI above it so page 1 doesn't start with a blank block */}
      <style>{`
        .qrprint { display: none; }
        @media print {
          @page { margin: 8mm; }
          body * { visibility: hidden; }
          .qrprint, .qrprint * { visibility: visible; }
          .qrprint {
            display: grid; margin: 0; gap: 8mm;
            grid-template-columns: repeat(3, 1fr); background: #fff; color: #000;
          }
          .qrprint > div { border: 1px dashed #999; border-radius: 6mm; padding: 4mm; text-align: center; break-inside: avoid; }
        }
      `}</style>

      <div className="mb-3 flex items-center justify-between gap-2 print:hidden">
        <p className="font-extrabold" style={{ color: accent }}>🪑 الطاولات ورموز QR</p>
        {!!rows?.length && (
          <button onClick={() => window.print()} className="rounded-xl border border-white/15 px-3 py-1.5 text-sm font-bold">طباعة الرموز</button>
        )}
      </div>
      <p className="mb-3 text-sm text-[#a6a6a3] print:hidden">كل طاولة لها رابط خاص — عند مسحه يفتح المنيو ويُرسل رقم الطاولة مع الطلب تلقائياً.</p>
      {err && <p className="mb-2 text-sm text-red-400 print:hidden">{err}</p>}

      {rows === null ? (
        <p className="text-[#a6a6a3]">جارٍ التحميل…</p>
      ) : (
        <>
          {!rows.length && !err && <p className="text-[#a6a6a3]">لا توجد طاولات — أضف أول طاولة.</p>}

          <ul className="space-y-2 print:hidden">
            {rows.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#141416] p-2.5">
                <div className="shrink-0 rounded-lg bg-white p-1">
                  <QR text={linkFor(rest.slug, t.label)} size={72} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">طاولة {t.label}</p>
                  <p dir="ltr" className="truncate text-xs text-[#a6a6a3]">{linkFor(rest.slug, t.label)}</p>
                  <div className="mt-1.5 flex gap-2">
                    <button onClick={() => copy(t)} className="rounded-lg border border-white/15 px-2 py-1 text-xs font-bold">
                      {copied === t.id ? "تم النسخ ✓" : "نسخ الرابط"}
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`حذف طاولة «${t.label}»؟`)) await run(() => client.from("tables").delete().eq("id", t.id));
                      }}
                      className="rounded-lg border border-white/15 px-2 py-1 text-xs font-bold text-red-400"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex gap-2 print:hidden">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              maxLength={24}
              placeholder="رقم/اسم الطاولة"
              className={FIELD}
            />
            <button onClick={add} disabled={busy} className="shrink-0 rounded-xl px-4 text-sm font-extrabold text-[#0d0d0d] disabled:opacity-60" style={{ background: accent }}>
              إضافة طاولة
            </button>
          </div>

          {/* print-only sheet */}
          <div className="qrprint">
            {rows.map((t) => (
              <div key={t.id}>
                <p style={{ fontWeight: 800 }}>{rest.name}</p>
                <p style={{ fontWeight: 800, fontSize: "1.4em" }}>طاولة {t.label}</p>
                <QR text={linkFor(rest.slug, t.label)} size={150} />
                <p dir="ltr" style={{ fontSize: "0.75em" }}>menuplus.rest/{rest.slug}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
