"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_INFO, can, type Plan } from "@/lib/plans";
import { LANG_LABEL, type I18n, type Lang } from "@/lib/types";
import { FIELD, LockBadge } from "./ui";

type Variant = { id?: string; name: string; price: number };
type Item = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  images: string[] | null;
  price: number;
  sort: number;
  active: boolean;
  i18n: I18n;
  variants: Variant[];
};
type Cat = { id: string; name: string; image_url: string | null; i18n: I18n; sort: number; items: Item[] };

const MAX_IMAGES = 5;
const EMPTY = { name: "", description: "", image_url: "", images: [] as string[], price: 0, i18n: {} as I18n, variants: [] as Variant[] };

export function MenuEditor({ client, restaurantId, currency, accent, plan, languages }: { client: SupabaseClient; restaurantId: string; currency: string; accent: string; plan: Plan; languages: Lang[] }) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [newCat, setNewCat] = useState("");
  const [form, setForm] = useState<(typeof EMPTY & { id?: string; category_id: string }) | null>(null);
  const [ftab, setFtab] = useState<Lang>("ar");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: cs }, { data: its }, { data: vs }] = await Promise.all([
      client.from("categories").select("id, name, image_url, i18n, sort").eq("restaurant_id", restaurantId).order("sort"),
      client.from("menu_items").select("*, i18n").eq("restaurant_id", restaurantId).order("sort"),
      client.from("item_variants").select("*").eq("restaurant_id", restaurantId),
    ]);
    setCats(
      (cs ?? []).map((c) => ({
        ...c,
        i18n: c.i18n ?? {},
        items: (its ?? [])
          .filter((i) => i.category_id === c.id)
          .map((i) => ({ ...i, i18n: i.i18n ?? {}, variants: (vs ?? []).filter((v) => v.item_id === i.id).map((v) => ({ id: v.id, name: v.name, price: v.price })) })),
      })) as Cat[],
    );
  }, [client, restaurantId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  /** every mutation goes through here: run it, surface the error, reload once */
  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    const { error } = await fn();
    setErr(error?.message ?? null);
    await load();
    setBusy(false);
    return !error;
  }

  const multi = languages.length > 1;
  const canImgs = can(plan, "multi_item_images");
  const info = PLAN_INFO[plan];
  const nItems = cats.reduce((s, c) => s + c.items.length, 0);
  const catFull = info.catLimit !== null && cats.length >= info.catLimit;
  const itemFull = info.itemLimit !== null && nItems >= info.itemLimit;
  const fmtLim = (n: number | null) => (n === null ? "∞" : n.toLocaleString("en-US"));

  async function addCat() {
    const name = newCat.trim();
    if (!name || catFull) return;
    setNewCat("");
    await run(() => client.from("categories").insert({ restaurant_id: restaurantId, name, sort: cats.length }));
  }

  /** swap the sort value with the neighbour — two tiny updates, no reindexing */
  async function move(list: { id: string; sort: number }[], i: number, d: number, table: "categories" | "menu_items") {
    const a = list[i];
    const b = list[i + d];
    if (!a || !b) return;
    await run(async () => {
      const r1 = await client.from(table).update({ sort: b.sort }).eq("id", a.id);
      if (r1.error) return r1;
      return client.from(table).update({ sort: a.sort }).eq("id", b.id);
    });
  }

  async function renameCat(c: Cat) {
    const name = prompt("اسم القسم", c.name)?.trim();
    if (!name) return;
    const upd: { name: string; i18n?: I18n } = { name };
    if (multi) {
      const i18n: I18n = { ...c.i18n };
      for (const l of languages) {
        if (l === "ar") continue;
        const v = prompt("الاسم بـ " + LANG_LABEL[l], c.i18n?.[l]?.name ?? "");
        if (v === null) continue; // cancel keeps the current translation
        const cur = { ...i18n[l] };
        if (v.trim()) cur.name = v.trim();
        else delete cur.name;
        i18n[l] = cur;
      }
      upd.i18n = i18n;
    }
    await run(() => client.from("categories").update(upd).eq("id", c.id));
  }

  function setLangField(l: Exclude<Lang, "ar">, f: "name" | "description", v: string) {
    if (!form) return;
    setForm({ ...form, i18n: { ...form.i18n, [l]: { ...form.i18n[l], [f]: v } } });
  }

  async function saveItem() {
    if (!form) return;
    const name = form.name.trim();
    if (!name) return setErr("اسم الصنف مطلوب.");
    const row: Record<string, unknown> = {
      restaurant_id: restaurantId,
      category_id: form.category_id,
      name,
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      price: Math.max(0, Math.round(form.price)),
    };
    // untouched when the plan is locked, so a downgrade never wipes stored photos
    if (canImgs) row.images = form.images.map((u) => u.trim()).filter(Boolean).slice(0, MAX_IMAGES);
    if (multi) {
      // merge only enabled langs, drop empty strings
      const i18n: I18n = {};
      for (const l of languages) {
        if (l === "ar") continue;
        const d = form.i18n[l] ?? {};
        const o: Record<string, string> = {};
        if (d.name?.trim()) o.name = d.name.trim();
        if (d.description?.trim()) o.description = d.description.trim();
        if (Object.keys(o).length) i18n[l] = o;
      }
      row.i18n = i18n;
    }
    const clean = form.variants.filter((v) => v.name.trim());
    const ok = await run(async () => {
      const saved = form.id
        ? await client.from("menu_items").update(row).eq("id", form.id).select("id").single()
        : await client.from("menu_items").insert({ ...row, sort: cats.find((c) => c.id === form.category_id)?.items.length ?? 0 }).select("id").single();
      if (saved.error) return saved;
      // variants are few — rewrite them wholesale instead of diffing
      const del = await client.from("item_variants").delete().eq("item_id", saved.data.id);
      if (del.error || !clean.length) return del;
      return client.from("item_variants").insert(
        clean.map((v) => ({ restaurant_id: restaurantId, item_id: saved.data.id, name: v.name.trim(), price: Math.max(0, Math.round(v.price)) })),
      );
    });
    if (ok) setForm(null); // keep the form (and the typing) alive when saving failed
  }

  const money = (n: number) => `${n.toLocaleString("en-US")} ${currency}`;
  const field = FIELD;

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#a6a6a3]">
        الأقسام: {cats.length.toLocaleString("en-US")} من {fmtLim(info.catLimit)} · العناصر: {nItems.toLocaleString("en-US")} من {fmtLim(info.itemLimit)}
      </p>
      {(itemFull || catFull) && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm font-extrabold text-amber-300">
            وصلت إلى سقف باقتك — {info.itemLimit !== null ? `${info.itemLimit} صنفاً` : ""}{info.itemLimit !== null && info.catLimit !== null ? " و" : ""}{info.catLimit !== null ? `${info.catLimit} أقسام` : ""}
          </p>
          <p className="mt-1 text-xs text-amber-200/80">
            لإضافة المزيد رقِّ الباقة — القوالب كلها مجانية، لكن حجم المنيو والمميزات على الباقة.
          </p>
          <a href="/#pricing" target="_blank" className="mt-3 inline-block rounded-xl px-4 py-2 text-xs font-extrabold text-[#0d0d0d]" style={{ background: accent }}>
            ترقية الباقة
          </a>
        </div>
      )}
      {err && <p className="text-sm text-red-400">{err}</p>}

      <div className="flex gap-2">
        <input value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCat()} placeholder="قسم جديد (مثال: المشاوي)" className={field} />
        <button onClick={addCat} disabled={busy || catFull} className="shrink-0 rounded-xl px-4 text-sm font-extrabold text-[#0d0d0d] disabled:opacity-60" style={{ background: accent }}>إضافة قسم</button>
      </div>
      {catFull && <p className="text-xs text-amber-400">لا يمكن إضافة قسم جديد — رقِّ الباقة.</p>}

      {!cats.length && <p className="text-[#a6a6a3]">لا توجد أقسام بعد — ابدأ بإضافة قسم.</p>}

      {cats.map((c, ci) => (
        <section key={c.id} className="rounded-2xl border border-white/10 bg-[#1b1b1e]">
          <div className="flex flex-wrap items-center gap-2 p-3">
            <button onClick={() => setOpen(open === c.id ? null : c.id)} className="flex-1 text-right text-lg font-extrabold" style={{ color: accent }}>
              {open === c.id ? "▾" : "◂"} {c.name} <span className="text-sm font-normal text-[#a6a6a3]">({c.items.length})</span>
            </button>
            <button onClick={() => move(cats, ci, -1, "categories")} disabled={busy || ci === 0} className="rounded-lg border border-white/15 px-2 py-1 text-sm disabled:opacity-30">↑</button>
            <button onClick={() => move(cats, ci, 1, "categories")} disabled={busy || ci === cats.length - 1} className="rounded-lg border border-white/15 px-2 py-1 text-sm disabled:opacity-30">↓</button>
            <button
              onClick={async () => {
                const url = prompt("رابط صورة القسم (تظهر في قوالب بطاقات الأقسام)", c.image_url ?? "");
                if (url !== null) await run(() => client.from("categories").update({ image_url: url.trim() || null }).eq("id", c.id));
              }}
              className="rounded-lg border border-white/15 px-2 py-1 text-sm"
            >
              🖼
            </button>
            <button onClick={() => renameCat(c)} className="rounded-lg border border-white/15 px-2 py-1 text-sm">✎</button>
            <button
              onClick={async () => {
                if (confirm(`حذف قسم «${c.name}» وكل أصنافه؟`)) await run(() => client.from("categories").delete().eq("id", c.id));
              }}
              className="rounded-lg border border-white/15 px-2 py-1 text-sm text-red-400"
            >
              🗑
            </button>
          </div>

          {open === c.id && (
            <div className="border-t border-white/10 p-3">
              <ul className="space-y-2">
                {c.items.map((it, ii) => (
                  <li key={it.id} className={`flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#141416] p-2.5 ${it.active ? "" : "opacity-50"}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{it.name} {it.variants.length > 0 && <span className="text-xs text-[#a6a6a3]">· {it.variants.length} أحجام</span>}</p>
                      <p className="text-sm" style={{ color: accent }}>{money(it.price)}</p>
                    </div>
                    <button onClick={() => move(c.items, ii, -1, "menu_items")} disabled={busy || ii === 0} className="rounded-lg border border-white/15 px-2 py-1 text-sm disabled:opacity-30">↑</button>
                    <button onClick={() => move(c.items, ii, 1, "menu_items")} disabled={busy || ii === c.items.length - 1} className="rounded-lg border border-white/15 px-2 py-1 text-sm disabled:opacity-30">↓</button>
                    <button onClick={() => run(() => client.from("menu_items").update({ active: !it.active }).eq("id", it.id))} className="rounded-lg border border-white/15 px-2 py-1 text-xs font-bold">
                      {it.active ? "إخفاء" : "إظهار"}
                    </button>
                    <button
                      onClick={() => {
                        setFtab("ar");
                        setForm({ id: it.id, category_id: c.id, name: it.name, description: it.description ?? "", image_url: it.image_url ?? "", images: it.images ?? [], price: it.price, i18n: it.i18n ?? {}, variants: it.variants });
                      }}
                      className="rounded-lg border border-white/15 px-2 py-1 text-sm"
                    >
                      ✎
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`حذف «${it.name}»؟`)) await run(() => client.from("menu_items").delete().eq("id", it.id));
                      }}
                      className="rounded-lg border border-white/15 px-2 py-1 text-sm text-red-400"
                    >
                      🗑
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  setFtab("ar");
                  setForm({ ...EMPTY, category_id: c.id });
                }}
                disabled={itemFull}
                className="mt-3 w-full rounded-xl py-2.5 text-sm font-extrabold text-[#0d0d0d] disabled:opacity-40"
                style={{ background: accent }}
              >
                + صنف جديد
              </button>
              {itemFull && <p className="mt-1 text-xs text-amber-400">لا يمكن إضافة صنف جديد — رقِّ الباقة.</p>}
            </div>
          )}
        </section>
      ))}

      {form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onClick={() => setForm(null)}>
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#1b1b1e] p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-lg font-extrabold" style={{ color: accent }}>{form.id ? "تعديل صنف" : "صنف جديد"}</h3>

            {multi && (
              <div className="mb-3 flex gap-1.5">
                {languages.map((l) => (
                  <button key={l} onClick={() => setFtab(l)} className={`rounded-lg px-3 py-1 text-xs font-bold ${ftab === l ? "text-[#0d0d0d]" : "border border-white/15 text-[#a6a6a3]"}`} style={ftab === l ? { background: accent } : undefined}>
                    {LANG_LABEL[l]}
                  </button>
                ))}
              </div>
            )}

            {ftab === "ar" ? (
              <>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم" className={field} />
                <input value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })} type="number" inputMode="numeric" placeholder="السعر" dir="ltr" className={`${field} mt-2`} />
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="الوصف (اختياري)" className={`${field} mt-2`} />
                <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} dir="ltr" placeholder="رابط الصورة (اختياري)" className={`${field} mt-2`} />

                <div className={`mt-4 rounded-xl border border-white/10 p-3 ${canImgs ? "" : "opacity-60"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-extrabold">صور إضافية</p>
                    {!canImgs && <LockBadge feature="multi_item_images" />}
                  </div>
                  <p className="mb-2 text-xs text-[#a6a6a3]">تظهر كمصغّرات داخل صفحة الصنف — حتى {MAX_IMAGES} صور بعد الصورة الرئيسية</p>
                  {form.images.map((u, i) => (
                    <div key={i} className="mb-2 flex gap-2">
                      <input value={u} disabled={!canImgs} onChange={(e) => setForm({ ...form, images: form.images.map((x, j) => (j === i ? e.target.value : x)) })} dir="ltr" placeholder="رابط الصورة" className={field} />
                      <button onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })} disabled={!canImgs} className="shrink-0 rounded-xl border border-white/15 px-3 text-red-400 disabled:opacity-40">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setForm({ ...form, images: [...form.images, ""] })} disabled={!canImgs || form.images.length >= MAX_IMAGES} className="w-full rounded-xl border border-white/15 py-2 text-sm font-bold disabled:opacity-40">+ صورة</button>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 p-3">
                  <p className="text-sm font-extrabold">الأحجام (اختياري)</p>
                  <p className="mb-2 text-xs text-[#a6a6a3]">مثال: صغير 2500 · وسط 3000 — إن أضفتها يُسأل الزبون عن الحجم</p>
                  {form.variants.map((v, i) => (
                    <div key={i} className="mb-2 flex gap-2">
                      <input value={v.name} onChange={(e) => setForm({ ...form, variants: form.variants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} placeholder="الحجم" className={field} />
                      <input value={v.price} onChange={(e) => setForm({ ...form, variants: form.variants.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) || 0 } : x)) })} type="number" dir="ltr" placeholder="السعر" className={field} />
                      <button onClick={() => setForm({ ...form, variants: form.variants.filter((_, j) => j !== i) })} className="shrink-0 rounded-xl border border-white/15 px-3 text-red-400">×</button>
                    </div>
                  ))}
                  <button onClick={() => setForm({ ...form, variants: [...form.variants, { name: "", price: form.price }] })} className="w-full rounded-xl border border-white/15 py-2 text-sm font-bold">+ حجم</button>
                </div>
              </>
            ) : (
              <>
                <input value={form.i18n[ftab]?.name ?? ""} onChange={(e) => setLangField(ftab, "name", e.target.value)} dir={ftab === "en" ? "ltr" : undefined} placeholder={`الاسم (${LANG_LABEL[ftab]})`} className={field} />
                <textarea value={form.i18n[ftab]?.description ?? ""} onChange={(e) => setLangField(ftab, "description", e.target.value)} rows={2} dir={ftab === "en" ? "ltr" : undefined} placeholder={`الوصف (${LANG_LABEL[ftab]}) — اختياري`} className={`${field} mt-2`} />
              </>
            )}

            <div className="mt-4 flex gap-2">
              <button onClick={saveItem} disabled={busy} className="flex-1 rounded-2xl py-3 font-extrabold text-[#0d0d0d] disabled:opacity-60" style={{ background: accent }}>حفظ</button>
              <button onClick={() => setForm(null)} className="rounded-2xl border border-white/15 px-5 font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
