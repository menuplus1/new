"use client";

/** القالب 1 — «اللوحي الداكن»: كونسول لوحي ثابت الارتفاع.
 *  رَف أقسام على اليمين + شبكة منتجات على اليسار. خط: Cairo. */

import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { BrandingFooter, CoverHero, HoursBadge, LangSwitch, PromoStrip, RatingBadge, SocialRow, useMenu } from "./shared";

const delay = (i: number) => ({ animationDelay: `${Math.min(i * 40, 400)}ms` });

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
    fontFamily: "var(--font-cairo), sans-serif",
  } as CSSProperties;
  const grad = `radial-gradient(1100px 700px at 88% -8%, ${accent}22, transparent 55%), linear-gradient(160deg, #191919, #0f0f10)`;

  const [active, setActive] = useState(cats[0]?.id ?? "");
  const cat = cats.find((c) => c.id === active) ?? cats[0];
  const mainRef = useRef<HTMLElement>(null);

  return (
    <div style={{ ...vars, background: grad }} className="flex h-dvh flex-col text-[var(--text)]">
      {/* header — glassy, sticky, accent hairline */}
      <header
        className="sticky top-0 z-20 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-black/30 px-4 py-3 backdrop-blur-xl sm:px-5"
        style={{ boxShadow: `0 1px 0 0 ${accent}40, 0 14px 34px -28px ${accent}` }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {r.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.logo_url}
              alt={m.rName}
              loading={m.eager ? "eager" : "lazy"}
              className="size-11 shrink-0 rounded-full object-cover"
              style={{ boxShadow: `0 0 0 2px ${accent}, 0 0 18px -4px ${accent}` }}
            />
          ) : (
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl font-black text-[var(--activeink)]"
              style={{ background: accent, boxShadow: `0 0 22px -6px ${accent}` }}
            >
              {m.rName.charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <span className="block truncate text-xl font-black leading-tight tracking-tight text-[var(--accent)] sm:text-2xl">{m.rName}</span>
            <span className="mt-0.5 flex items-center gap-2">
              <HoursBadge />
              <RatingBadge />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LangSwitch />
          {m.hasInfo && (
            <button onClick={m.openInfo} aria-label="معلومات" className="menu-press flex size-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--panelsoft)] text-sm">
              ⓘ
            </button>
          )}
          {m.booking && (
            <button onClick={m.openReserve} className="menu-press rounded-full px-4 py-2 text-sm font-black text-[var(--activeink)]" style={{ background: accent }}>
              📅 {m.t("reserve")}
            </button>
          )}
          {m.table ? (
            <span className="rounded-full border border-[var(--accent)] px-4 py-1.5 text-sm font-black text-[var(--accent)]">
              🍽️ {m.t("table")} {m.table}
            </span>
          ) : (
            <h1 className="text-base font-bold text-[var(--muted)]">{m.t("menu")}</h1>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-row-reverse">
        {/* products — LEFT */}
        <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto p-4 pb-24">
          <CoverHero h="h-32 sm:h-44" />
          <PromoStrip />
          <h2 key={`h-${active}`} className="menu-in mb-3 mt-2 px-1 text-2xl font-black tracking-tight text-[var(--accent)]">
            {cat ? m.name(cat) : ""}
          </h2>
          <div key={active} className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {(cat?.items ?? []).map((it, i) => (
              // .menu-in fills `transform` forwards — it must sit on a wrapper, not on the
              // card itself, or it would pin .menu-hover / .menu-press transforms flat.
              <div key={it.id} style={delay(i)} className="menu-in">
                <article className="menu-hover menu-zoom h-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panelsoft)]">
                  <div className="relative aspect-[4/5] cursor-pointer overflow-hidden bg-[var(--panel)]" onClick={() => m.openItem(it)}>
                    {it.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt={m.name(it)} loading={m.eager ? "eager" : "lazy"} className="h-full w-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 m-auto flex size-14 items-center justify-center rounded-full text-2xl font-black text-[var(--activeink)] opacity-80" style={{ background: accent }}>
                        {m.name(it).charAt(0)}
                      </span>
                    )}
                    {m.ordering && (
                      <button
                        onClick={(e) => { e.stopPropagation(); m.onPlus(it); }}
                        aria-label={m.t("addToCart")}
                        className="menu-press absolute bottom-2 end-2 z-10 flex size-10 items-center justify-center rounded-full text-2xl font-bold text-[var(--activeink)] shadow-lg"
                        style={{ background: accent }}
                      >
                        +
                      </button>
                    )}
                  </div>
                  <div className="px-3 py-2.5 text-start">
                    <p className="line-clamp-2 min-h-[2.4em] text-[15px] font-bold leading-tight">{m.name(it)}</p>
                    <div className="mt-2 flex items-center gap-2 border-t border-[var(--line)] pt-2">
                      <span className="h-3.5 w-1 shrink-0 rounded-full" style={{ background: accent }} />
                      <p className="whitespace-nowrap text-lg font-black text-[var(--accent)]">{m.money(it.price)}</p>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
          <BrandingFooter />
        </main>

        {/* categories — RIGHT */}
        <aside className="flex w-[132px] shrink-0 flex-col overflow-y-auto border-l border-[var(--line)] bg-[var(--panelsoft)]/60 py-2 sm:w-[184px]">
          {cats.map((c) => {
            const on = c.id === active;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActive(c.id);
                  m.selectCat(c);
                  mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`menu-press relative flex w-full shrink-0 flex-col items-center gap-1 px-3 py-4 text-center text-[13px] font-black leading-tight ${
                  on ? "scale-[1.03] bg-[var(--text)] text-[var(--activeink)]" : "text-[var(--muted)] hover:bg-[var(--panel)]"
                }`}
              >
                {on && <span className="absolute inset-y-2 end-0 w-1 rounded-full" style={{ background: accent, boxShadow: `0 0 12px -1px ${accent}` }} />}
                {m.name(c).split(" ").map((w, j) => (
                  <span key={j} className="block">{w}</span>
                ))}
              </button>
            );
          })}
          <SocialRow className="mt-auto shrink-0 justify-center border-t border-[var(--line)] px-2 pb-2 pt-4" />
        </aside>
      </div>
    </div>
  );
}
