"use client";

/** القالب 6 — «الدافئ»: صفحة واحدة بطابع مخبز/مقهى دافئ (كريمي + زخارف ✦). */

import { useEffect, useRef, useState } from "react";
import { BrandingFooter, CoverHero, HoursBadge, LangSwitch, PromoStrip, RatingBadge, SocialRow, useMenu } from "./shared";

const INK = "#2b2419";
const MUTED = "#8d8371";
const ORNA = "#a3855c";
const CREAM = "#faf5ea";
const DARKCHIP = "#1f1a12";
/** sticky bar height — used for both scroll-spy and scroll-mt */
const NAV_H = 90;
const isGradient = (u: string) => u.startsWith("linear-gradient") || u.startsWith("radial-gradient");
/** entrance stagger, capped so long lists don't crawl in */
const stagger = (i: number) => ({ animationDelay: `${Math.min(i * 40, 400)}ms` });

export function T6() {
  const m = useMenu();
  const { r, cats, accent } = m;
  const cardBg = `color-mix(in srgb, ${accent} 8%, #f7f1e1)`;
  const priceInk = `color-mix(in srgb, ${accent} 70%, #000)`;
  const ring = `color-mix(in srgb, ${accent} 45%, transparent)`;
  const rule = `linear-gradient(90deg, transparent, color-mix(in srgb, ${ORNA} 55%, transparent), transparent)`;

  const [active, setActive] = useState(cats[0]?.id ?? "");
  const [showTop, setShowTop] = useState(false);
  /** `${catId}#${nonce}` — set only by a chip tap so the entrance replays on demand */
  const [tap, setTap] = useState("");
  const secRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipRefs = useRef<Record<string, HTMLElement | null>>({});
  /** ignore the scroll-spy while a programmatic jump is still gliding */
  const lock = useRef(false); // مقفول أثناء التمرير البرمجي

  // one listener drives both the back-to-top button and the active chip
  // ponytail: O(cats) rect reads per scroll — fine under ~50 categories
  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 600);
      if (lock.current) return;
      let cur = cats[0]?.id ?? "";
      for (const c of cats) {
        const el = secRefs.current[c.id];
        if (el && el.getBoundingClientRect().top <= NAV_H) cur = c.id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [cats]);

  // keep the active chip centered in its own bar (tap *and* scroll driven)
  useEffect(() => {
    chipRefs.current[active]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  function goto(c: (typeof cats)[number]) {
    lock.current = true;
    setTimeout(() => (lock.current = false), 800);
    setActive(c.id);
    setTap((t) => `${c.id}#${t.split("#")[1] ? Number(t.split("#")[1]) + 1 : 1}`);
    m.selectCat(c);
    secRefs.current[c.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-dvh pb-24" style={{ background: CREAM, color: INK, fontFamily: "var(--font-cairo), sans-serif" }}>
      {/* warm textured header */}
      <header
        className="menu-in relative overflow-hidden rounded-b-[34px] px-4 pb-6 pt-7 text-center"
        style={{
          background: `radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, ${accent} 26%, #fdf8ee), color-mix(in srgb, ${accent} 5%, ${CREAM}))`,
          boxShadow: `inset 0 -1px 0 color-mix(in srgb, ${accent} 20%, transparent)`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.35]" style={{ background: "radial-gradient(circle at 18% 12%, rgba(255,255,255,.85), transparent 42%), radial-gradient(circle at 84% 8%, rgba(255,255,255,.6), transparent 38%)" }} />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-2.5">
          <div className="text-[12px] tracking-[0.55em]" style={{ color: ORNA }}>✦ ✦ ✦</div>

          {r.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.logo_url}
              alt={m.rName}
              loading={m.eager ? "eager" : "lazy"}
              className="size-24 rounded-full object-cover sm:size-28"
              style={{ boxShadow: `0 0 0 5px ${CREAM}, 0 0 0 7px ${ring}, 0 16px 30px -20px rgba(43,36,25,.7)` }}
            />
          ) : (
            <span
              className="flex size-24 items-center justify-center rounded-full text-4xl font-black text-white sm:size-28"
              style={{ background: accent, boxShadow: `0 0 0 5px ${CREAM}, 0 0 0 7px ${ring}` }}
            >
              {m.rName.charAt(0)}
            </span>
          )}

          <h1 className="text-[28px] font-black leading-tight sm:text-4xl">{m.rName}</h1>
          {m.rTagline && <p className="max-w-md text-[13px] font-bold sm:text-sm" style={{ color: MUTED }}>{m.rTagline}</p>}

          <div className="flex items-center gap-2">
            <HoursBadge />
            <RatingBadge className="menu-press" />
          </div>

          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <LangSwitch />
            {m.booking && (
              <button onClick={m.openReserve} className="menu-press rounded-full px-4 py-1.5 text-[13px] font-black text-white shadow-sm" style={{ background: accent }}>
                📅 {m.t("reserve")}
              </button>
            )}
            {m.hasInfo && (
              <button onClick={m.openInfo} aria-label={m.t("about")} className="menu-press flex size-8 items-center justify-center rounded-full border text-sm" style={{ borderColor: ring, color: priceInk }}>
                ⓘ
              </button>
            )}
            {m.table && (
              <span className="rounded-full border px-4 py-1.5 text-[13px] font-black" style={{ borderColor: accent, color: priceInk }}>
                🍽️ {m.t("table")} {m.table}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto mt-4 max-w-4xl px-4">
        <CoverHero h="h-44 sm:h-60" />
      </div>
      <div className="mx-auto max-w-4xl">
        <PromoStrip />
      </div>

      {/* sticky pill chip bar — active follows both taps and scroll position */}
      <nav className="sticky top-0 z-30 py-2.5 backdrop-blur" style={{ background: "rgba(250,245,234,.92)", boxShadow: `0 1px 0 color-mix(in srgb, ${ORNA} 28%, transparent)` }}>
        <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {cats.map((c) => (
            <button
              key={c.id}
              ref={(el) => { chipRefs.current[c.id] = el; }}
              onClick={() => goto(c)}
              aria-current={active === c.id ? "true" : undefined}
              className={`menu-press whitespace-nowrap rounded-[30px] px-4 py-2 text-[13px] font-black ${active === c.id ? "text-white shadow-md" : ""}`}
              style={active === c.id ? { background: DARKCHIP } : { background: `color-mix(in srgb, ${accent} 14%, #ece2cd)`, color: INK }}
            >
              {m.name(c)}
            </button>
          ))}
        </div>
      </nav>

      {/* sections */}
      <div className="mx-auto max-w-4xl">
        {cats.map((c) => (
          <section key={c.id} ref={(el) => { secRefs.current[c.id] = el; }} style={{ scrollMarginTop: NAV_H }}>
            <div className="px-4 pt-7">
              <h2 className="text-xl font-black sm:text-2xl">
                <span style={{ color: ORNA }}>✦ </span>
                {m.name(c)}
              </h2>
              <div className="mt-2 h-px" style={{ background: rule }} />
            </div>

            {/* re-keyed on tap so the entrance stagger replays when the chip is pressed */}
            <div key={tap.startsWith(`${c.id}#`) ? tap : c.id} className="mt-3 grid gap-2.5 px-4 sm:grid-cols-2">
              {c.items.map((it, i) => (
                <div
                  key={it.id}
                  onClick={() => m.openItem(it)}
                  style={{ background: cardBg, ...stagger(i) }}
                  className="menu-in menu-hover menu-zoom menu-press flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border border-black/5 p-2.5"
                >
                  {it.image_url ? (
                    isGradient(it.image_url) ? (
                      <div className="size-20 shrink-0 rounded-xl" style={{ background: it.image_url }} />
                    ) : (
                      <span className="size-20 shrink-0 overflow-hidden rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.image_url} alt={m.name(it)} loading={m.eager ? "eager" : "lazy"} className="size-20 object-cover" />
                      </span>
                    )
                  ) : (
                    <span className="flex size-20 shrink-0 items-center justify-center rounded-xl text-2xl font-black text-white" style={{ background: accent }}>
                      {m.name(it).charAt(0)}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold leading-snug sm:text-base">{m.name(it)}</p>
                    {m.desc(it) && <p className="mt-0.5 line-clamp-2 text-[12px] font-bold leading-relaxed" style={{ color: MUTED }}>{m.desc(it)}</p>}
                  </div>

                  <p className="whitespace-nowrap text-[15px] font-black tabular-nums" style={{ color: priceInk }}>{m.money(it.price)}</p>

                  {m.ordering && (
                    <button
                      onClick={(e) => { e.stopPropagation(); m.onPlus(it); }}
                      aria-label={m.t("addToCart")}
                      className="menu-press flex size-8 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                      style={{ background: accent }}
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* footer area */}
      <div className="mx-auto mt-10 max-w-4xl px-4 text-center">
        <div className="h-px" style={{ background: rule }} />
        <div className="mt-3 text-[12px] tracking-[0.55em]" style={{ color: ORNA }}>✦ ✦ ✦</div>
        <p className="mt-2 text-[15px] font-black">{m.rName}</p>
        <SocialRow className="mt-3 justify-center" />
      </div>

      <BrandingFooter />

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="أعلى"
          className="menu-press menu-pop fixed bottom-24 end-4 z-30 flex size-11 items-center justify-center rounded-full text-lg font-black text-white"
          style={{ background: DARKCHIP, boxShadow: `0 0 0 3px ${CREAM}, 0 12px 24px -14px rgba(43,36,25,.9)` }}
        >
          ↑
        </button>
      )}
    </div>
  );
}
