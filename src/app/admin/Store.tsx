"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasApp, type AppKey } from "@/lib/plans";
import { CARD, FIELD, Toggle, type Rest } from "./ui";

type Promo = { id: string; title: string; description: string | null; image_url: string | null; active: boolean; sort: number };

const APPS: { key: AppKey; icon: string; name: string; desc: string }[] = [
  { key: "booking", icon: "📅", name: "تطبيق الحجز", desc: "استقبل حجوزات الطاولات من المنيو مباشرة — بالتاريخ والوقت وعدد الأشخاص." },
  { key: "promos", icon: "🎁", name: "تطبيق العروض الترويجية", desc: "شريط عروض وحملات يظهر أعلى المنيو الخاص بك." },
];

export function Store({ client, rest, accent, onPatch }: { client: SupabaseClient; rest: Rest; accent: string; onPatch: (fields: Partial<Rest>) => Promise<void> }) {
  const paid = rest.plan === "basic" || rest.plan === "premium";

  return (
    <div className="space-y-3">
      {APPS.map((a) => (
        <div key={a.key}>
          <div className={`${CARD} flex items-start justify-between gap-3`}>
            <div>
              <p className="font-extrabold">{a.icon} {a.name}</p>
              <p className="mt-1 text-sm text-[#a6a6a3]">{a.desc}</p>
            </div>
            {rest.plan === "ultimate" ? (
              <span className="shrink-0 rounded-full bg-green-500/15 px-2.5 py-1 text-[11px] font-black text-green-400">مضمّن في باقتك ✓</span>
            ) : rest.plan === "free" ? (
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-[#a6a6a3]">🔒 متاح من الباقة الأساسية</span>
                <Toggle on={false} onClick={() => {}} accent={accent} disabled />
              </div>
            ) : (
              <Toggle
                on={rest.apps.includes(a.key)}
                onClick={() => onPatch({ apps: rest.apps.includes(a.key) ? rest.apps.filter((x) => x !== a.key) : [...rest.apps, a.key] })}
                accent={accent}
              />
            )}
          </div>
          {paid && <p className="mt-1.5 px-1 text-xs text-[#a6a6a3]">التفعيل يُضاف إلى فاتورتك الشهرية.</p>}
        </div>
      ))}

      {hasApp(rest, "promos") && <Promos client={client} restaurantId={rest.id} accent={accent} />}
    </div>
  );
}

function Promos({ client, restaurantId, accent }: { client: SupabaseClient; restaurantId: string; accent: string }) {
  const [promos, setPromos] = useState<Promo[] | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await client.from("promotions").select("*").eq("restaurant_id", restaurantId).order("sort");
    if (error) {
      setErr(
        /does not exist|schema cache/i.test(error.message)
          ? "جدول العروض غير موجود — شغّل ملف 0006_engagement.sql في قاعدة البيانات."
          : error.message,
      );
      setPromos([]);
      return;
    }
    setErr(null);
    setPromos((data ?? []) as Promo[]);
  }, [client, restaurantId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  /** every mutation goes through here: run it, reload, surface the error */
  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    const { error } = await fn();
    await load();
    if (error) setErr(error.message);
    setBusy(false);
    return !error;
  }

  async function add() {
    const t = title.trim();
    if (!t) return setErr("عنوان العرض مطلوب.");
    const ok = await run(() => client.from("promotions").insert({ restaurant_id: restaurantId, title: t, description: desc.trim() || null, sort: promos?.length ?? 0 }));
    if (ok) {
      setTitle("");
      setDesc("");
    }
  }

  return (
    <section className={CARD}>
      <p className="mb-3 font-extrabold" style={{ color: accent }}>🎁 إدارة العروض</p>
      {err && <p className="mb-2 text-sm text-red-400">{err}</p>}
      {promos === null ? (
        <p className="text-[#a6a6a3]">جارٍ التحميل…</p>
      ) : (
        <>
          {!promos.length && !err && <p className="text-[#a6a6a3]">لا توجد عروض — أضف أول عرض.</p>}

          <ul className="space-y-2">
            {promos.map((p) => (
              <li key={p.id} className={`flex items-center gap-2 rounded-xl border border-white/10 bg-[#141416] p-2.5 ${p.active ? "" : "opacity-50"}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{p.title}</p>
                  {p.description && <p className="truncate text-sm text-[#a6a6a3]">{p.description}</p>}
                </div>
                <Toggle on={p.active} onClick={() => run(() => client.from("promotions").update({ active: !p.active }).eq("id", p.id))} accent={accent} disabled={busy} />
                <button
                  onClick={async () => {
                    if (confirm(`حذف عرض «${p.title}»؟`)) await run(() => client.from("promotions").delete().eq("id", p.id));
                  }}
                  className="rounded-lg border border-white/15 px-2 py-1 text-sm text-red-400"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 space-y-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="عنوان العرض (مثال: خصم 20% على المشاوي)" className={FIELD} />
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="وصف قصير (اختياري)" className={FIELD} />
            <button onClick={add} disabled={busy} className="w-full rounded-xl py-2.5 text-sm font-extrabold text-[#0d0d0d] disabled:opacity-60" style={{ background: accent }}>إضافة عرض</button>
          </div>
        </>
      )}
    </section>
  );
}
