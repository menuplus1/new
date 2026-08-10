"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { MenuData, MenuItem } from "@/lib/types";
import { placeOrder } from "@/lib/actions";

type Line = { key: string; name: string; unit_price: number; qty: number };

export function TenantMenu({ data, table = null }: { data: MenuData; table?: string | null }) {
  const { restaurant, categories } = data;
  const cur = restaurant.currency;
  const money = (n: number) => `${n.toLocaleString("en-US")} ${cur}`;
  const vars = {
    "--accent": restaurant.primary_color,
    "--bg": "#121214",
    "--panel": "#1e1e21",
    "--panelsoft": "#19191c",
    "--text": "#f2f2f0",
    "--muted": "#a6a6a3",
    "--line": "rgba(255,255,255,0.09)",
    "--activeink": "#141414",
  } as CSSProperties;
  const grad = `radial-gradient(1100px 700px at 88% -8%, ${restaurant.primary_color}22, transparent 55%), linear-gradient(160deg, #191919, #0f0f10)`;

  const [active, setActive] = useState(categories[0]?.name ?? "");
  const [cart, setCart] = useState<Record<string, Line>>({});
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [modalVar, setModalVar] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const cat = categories.find((c) => c.name === active) ?? categories[0];
  const lines = Object.values(cart);
  const total = lines.reduce((s, l) => s + l.unit_price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  function addLine(key: string, name: string, unit_price: number) {
    setCart((c) => ({ ...c, [key]: { key, name, unit_price, qty: (c[key]?.qty ?? 0) + 1 } }));
  }
  function step(key: string, d: number) {
    setCart((c) => {
      const l = c[key];
      if (!l) return c;
      const qty = l.qty + d;
      if (qty <= 0) {
        const n = { ...c };
        delete n[key];
        return n;
      }
      return { ...c, [key]: { ...l, qty } };
    });
  }
  function onPlus(it: MenuItem) {
    if (it.variants.length > 0) {
      setModalItem(it);
      setModalVar(it.variants[0]?.id ?? null);
    } else {
      addLine(it.id, it.name, it.price);
    }
  }
  const modalPrice = modalItem ? modalItem.variants.find((v) => v.id === modalVar)?.price ?? modalItem.price : 0;

  async function checkout() {
    if (!lines.length || busy) return;
    setBusy(true);
    setErr(null);
    const res = await placeOrder({
      restaurantId: restaurant.id,
      table,
      lines: lines.map((l) => ({ name: l.name, qty: l.qty, unit_price: l.unit_price })),
      phone: phone.trim() || null,
      note: note.trim() || null,
    });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    setCart({});
    setNote("");
    setPhone("");
    setCartOpen(false);
    setConfirmed(res.orderNumber);
  }

  return (
    <div dir="rtl" style={{ ...vars, background: grad }} className="flex h-dvh flex-col text-[var(--text)]">
      {/* header */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-3">
        <div className="flex items-center gap-2.5">
          {restaurant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={restaurant.logo_url} alt={restaurant.name} className="size-9 rounded-full object-cover" />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full text-lg font-black text-[var(--activeink)]" style={{ background: restaurant.primary_color }}>
              {restaurant.name.charAt(0)}
            </span>
          )}
          <span className="text-lg font-extrabold text-[var(--accent)]">{restaurant.name}</span>
        </div>
        {table ? (
          <span className="rounded-full border border-[var(--accent)] px-4 py-1.5 text-sm font-extrabold text-[var(--accent)]">🍽️ طاولة {table}</span>
        ) : (
          <h1 className="text-base font-bold text-[var(--muted)]">المنيو</h1>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-row-reverse">
        {/* products — LEFT */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-24">
          <h2 className="mb-3 px-1 text-xl font-extrabold text-[var(--accent)]">{cat?.name}</h2>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {(cat?.items ?? []).map((it) => (
              <article key={it.id} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panelsoft)]">
                <div className="relative aspect-[4/5] bg-[var(--panel)]">
                  {it.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image_url} alt={it.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="absolute inset-0 m-auto flex size-14 items-center justify-center rounded-full text-2xl font-black text-[var(--activeink)] opacity-80" style={{ background: restaurant.primary_color }}>
                      {it.name.charAt(0)}
                    </span>
                  )}
                  {restaurant.ordering && (
                    <button onClick={() => onPlus(it)} aria-label="أضف" className="absolute bottom-2 left-2 z-10 flex size-10 items-center justify-center rounded-full text-2xl font-bold text-[var(--activeink)] shadow-lg active:scale-90" style={{ background: restaurant.primary_color }}>
                      +
                    </button>
                  )}
                </div>
                <div className="px-3 py-2.5 text-right">
                  <p className="line-clamp-2 min-h-[2.4em] text-[15px] font-bold leading-tight">{it.name}</p>
                  <p className="mt-1 whitespace-nowrap text-lg font-extrabold text-[var(--accent)]">{money(it.price)}</p>
                </div>
              </article>
            ))}
          </div>
        </main>

        {/* categories — RIGHT */}
        <aside className="w-[132px] shrink-0 overflow-y-auto border-l border-[var(--line)] bg-[var(--panelsoft)]/60 py-2 sm:w-[184px]">
          {categories.map((c) => {
            const on = c.name === active;
            return (
              <button key={c.name} onClick={() => setActive(c.name)} className={`flex w-full flex-col items-center gap-1 px-2 py-4 text-center text-[13px] font-bold leading-tight transition ${on ? "bg-[var(--text)] text-[var(--activeink)]" : "text-[var(--muted)] hover:bg-[var(--panel)]"}`}>
                {c.name.split(" ").map((w, i) => (
                  <span key={i} className="block">{w}</span>
                ))}
              </button>
            );
          })}
        </aside>
      </div>

      {/* cart bar */}
      {restaurant.ordering && count > 0 && !cartOpen && !confirmed && !modalItem && (
        <button onClick={() => setCartOpen(true)} className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4 font-extrabold text-[var(--activeink)] shadow-lg" style={{ background: restaurant.primary_color }}>
          <span>🛒 عرض السلة ({count})</span>
          <span>{money(total)}</span>
        </button>
      )}

      {/* size modal */}
      {modalItem && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center" onClick={() => setModalItem(null)}>
          <div style={vars} className="w-full max-w-md rounded-t-3xl bg-[var(--panelsoft)] p-5 text-[var(--text)] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 text-lg font-extrabold">{modalItem.name}</h2>
            <div className="mb-4 flex flex-wrap gap-2">
              {modalItem.variants.map((v) => (
                <button key={v.id} onClick={() => setModalVar(v.id)} className={`rounded-xl border px-4 py-2.5 font-bold ${modalVar === v.id ? "text-[var(--activeink)]" : "border-[var(--line)]"}`} style={modalVar === v.id ? { background: restaurant.primary_color, borderColor: restaurant.primary_color } : undefined}>
                  {v.name} · {money(v.price)}
                </button>
              ))}
            </div>
            <button onClick={() => { addLine(`${modalItem.id}|${modalVar}`, `${modalItem.name} — ${modalItem.variants.find((v) => v.id === modalVar)?.name ?? ""}`, modalPrice); setModalItem(null); }} className="w-full rounded-2xl py-4 text-lg font-extrabold text-[var(--activeink)]" style={{ background: restaurant.primary_color }}>
              أضف للسلة · {money(modalPrice)}
            </button>
          </div>
        </div>
      )}

      {/* cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/60" onClick={() => setCartOpen(false)}>
          <div style={vars} className="max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-[var(--panelsoft)] p-5 text-[var(--text)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 text-lg font-extrabold text-[var(--accent)]">سلة الطلب {table ? `· طاولة ${table}` : ""}</h2>
            <ul className="space-y-2">
              {lines.map((l) => (
                <li key={l.key} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{l.name}</p>
                    <p className="text-sm text-[var(--accent)]">{money(l.unit_price * l.qty)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => step(l.key, -1)} className="rounded-full border border-[var(--line)] px-2.5 py-1 font-bold">−</button>
                    <span className="w-6 text-center font-bold">{l.qty}</span>
                    <button onClick={() => step(l.key, 1)} className="rounded-full border border-[var(--line)] px-2.5 py-1 font-bold">+</button>
                  </div>
                </li>
              ))}
            </ul>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="رقم الهاتف (اختياري)" dir="ltr" className="mt-3 w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5 text-sm outline-none" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة" className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5 text-sm outline-none" />
            {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
            <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3">
              <span className="text-[var(--muted)]">الإجمالي</span>
              <span className="text-xl font-extrabold text-[var(--accent)]">{money(total)}</span>
            </div>
            <button onClick={checkout} disabled={busy} className="mt-3 w-full rounded-2xl py-4 text-lg font-extrabold text-[var(--activeink)] disabled:opacity-60" style={{ background: restaurant.primary_color }}>
              {busy ? "جارٍ الإرسال…" : "إتمام الطلب"}
            </button>
          </div>
        </div>
      )}

      {/* confirmation */}
      {confirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setConfirmed(null)}>
          <div style={vars} className="w-full max-w-sm rounded-3xl bg-[var(--panelsoft)] p-8 text-center text-[var(--text)]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex size-20 items-center justify-center rounded-full text-4xl text-[var(--activeink)]" style={{ background: restaurant.primary_color }}>✓</div>
            <h2 className="mt-4 text-2xl font-extrabold">تم إرسال طلبك</h2>
            <p className="mt-2 text-[var(--muted)]">رقم الطلب</p>
            <p className="text-4xl font-extrabold text-[var(--accent)]">{confirmed}</p>
            <button onClick={() => setConfirmed(null)} className="mt-5 w-full rounded-2xl border border-[var(--accent)] py-3 font-bold text-[var(--accent)]">طلب آخر</button>
          </div>
        </div>
      )}
    </div>
  );
}
