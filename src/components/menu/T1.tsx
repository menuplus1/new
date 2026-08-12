"use client";

/** القالب 1 — «اللوحي الداكن»: الواجهة الأصلية. أقسام يمين + شبكة صور + سلة. */

import { useState } from "react";
import type { CSSProperties } from "react";
import { BrandingFooter, CoverHero, HoursBadge, LangSwitch, PromoStrip, RatingBadge, useMenu } from "./shared";

export function T1() {
  const m = useMenu();
  const { r, cats, accent } = m;
  const vars = {
    "--accent": accent,
    "--panel": "#1e1e21",
    "--panelsoft": "#19191c",
    "--text": "#f2f2f0",
    "--muted": "#a6a6a3",
    "--line": "rgba(255,255,255,0.09)",
    "--activeink": "#141414",
  } as CSSProperties;
  const grad = `radial-gradient(1100px 700px at 88% -8%, ${accent}22, transparent 55%), linear-gradient(160deg, #191919, #0f0f10)`;

  const [active, setActive] = useState(cats[0]?.id ?? "");
  const cat = cats.find((c) => c.id === active) ?? cats[0];

  return (
    <div style={{ ...vars, background: grad }} className="flex h-dvh flex-col text-[var(--text)]">
      {/* header */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-5 py-3">
        <div className="flex items-center gap-2.5">
          {r.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.logo_url} alt={m.rName} className="size-9 rounded-full object-cover" />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full text-lg font-black text-[var(--activeink)]" style={{ background: accent }}>
              {m.rName.charAt(0)}
            </span>
          )}
          <div>
            <span className="block text-lg font-extrabold leading-tight text-[var(--accent)]">{m.rName}</span>
            <span className="flex items-center gap-2">
              <HoursBadge />
              <RatingBadge />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LangSwitch />
          {m.hasInfo && (
            <button onClick={m.openInfo} aria-label="معلومات" className="flex size-8 items-center justify-center rounded-full border border-[var(--line)] text-sm">ⓘ</button>
          )}
          {m.booking && (
            <button onClick={m.openReserve} className="rounded-full px-4 py-1.5 text-sm font-extrabold text-[var(--activeink)]" style={{ background: accent }}>
              📅 {m.t("reserve")}
            </button>
          )}
          {m.table ? (
            <span className="rounded-full border border-[var(--accent)] px-4 py-1.5 text-sm font-extrabold text-[var(--accent)]">🍽️ {m.t("table")} {m.table}</span>
          ) : (
            <h1 className="text-base font-bold text-[var(--muted)]">{m.t("menu")}</h1>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-row-reverse">
        {/* products — LEFT */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-24">
          <CoverHero h="h-32 sm:h-44" />
          <PromoStrip />
          <h2 className="mb-3 mt-2 px-1 text-xl font-extrabold text-[var(--accent)]">{cat ? m.name(cat) : ""}</h2>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {(cat?.items ?? []).map((it) => (
              <article key={it.id} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panelsoft)]">
                <div className="relative aspect-[4/5] cursor-pointer bg-[var(--panel)]" onClick={() => m.openItem(it)}>
                  {it.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image_url} alt={m.name(it)} loading={m.eager ? "eager" : "lazy"} className="h-full w-full object-cover" />
                  ) : (
                    <span className="absolute inset-0 m-auto flex size-14 items-center justify-center rounded-full text-2xl font-black text-[var(--activeink)] opacity-80" style={{ background: accent }}>
                      {m.name(it).charAt(0)}
                    </span>
                  )}
                  {m.ordering && (
                    <button onClick={(e) => { e.stopPropagation(); m.onPlus(it); }} aria-label="أضف" className="absolute bottom-2 left-2 z-10 flex size-10 items-center justify-center rounded-full text-2xl font-bold text-[var(--activeink)] shadow-lg active:scale-90" style={{ background: accent }}>
                      +
                    </button>
                  )}
                </div>
                <div className="px-3 py-2.5 text-right">
                  <p className="line-clamp-2 min-h-[2.4em] text-[15px] font-bold leading-tight">{m.name(it)}</p>
                  <p className="mt-1 whitespace-nowrap text-lg font-extrabold text-[var(--accent)]">{m.money(it.price)}</p>
                </div>
              </article>
            ))}
          </div>
          <BrandingFooter />
        </main>

        {/* categories — RIGHT */}
        <aside className="w-[132px] shrink-0 overflow-y-auto border-l border-[var(--line)] bg-[var(--panelsoft)]/60 py-2 sm:w-[184px]">
          {cats.map((c) => {
            const on = c.id === active;
            return (
              <button key={c.id} onClick={() => { setActive(c.id); m.selectCat(c); }} className={`flex w-full flex-col items-center gap-1 px-2 py-4 text-center text-[13px] font-bold leading-tight transition ${on ? "bg-[var(--text)] text-[var(--activeink)]" : "text-[var(--muted)] hover:bg-[var(--panel)]"}`}>
                {m.name(c).split(" ").map((w, i) => (
                  <span key={i} className="block">{w}</span>
                ))}
              </button>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
