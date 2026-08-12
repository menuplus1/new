"use client";

/** القالب 3 — «الفاخر»: عاجيّ ذهبي بروح تحريرية.
 *  غلاف ممتد بطبقة داكنة، شعار بإطار ذهبي، بطاقات أقسام، ثم قائمة بنقاط قيادة. */

import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/types";
import { BrandingFooter, CoverHero, HoursBadge, LangSwitch, PromoStrip, RatingBadge, SocialRow, useMenu } from "./shared";

const GOLD = "#b08d3e";
const IVORY = "#faf8f3";
const LINE = "#e7e2d6";
const MUTED = "#8a8578";

/** amiri للعناوين على الجذر، tajawal للنصوص عبر غلاف */
const HEAD = { fontFamily: "var(--font-amiri), serif" } as const;
const BODY = { fontFamily: "var(--font-tajawal), sans-serif" } as const;

const isGradient = (u: string) => u.startsWith("linear-gradient") || u.startsWith("radial-gradient");
const stagger = (i: number) => ({ animationDelay: `${Math.min(i * 40, 400)}ms` });

function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden style={{ color: GOLD }}>
      <span className="h-px w-12" style={{ background: `linear-gradient(to left, ${GOLD}, transparent)` }} />
      <span className="text-[11px]">✦</span>
      <span className="h-px w-12" style={{ background: `linear-gradient(to right, ${GOLD}, transparent)` }} />
    </div>
  );
}

export function T3() {
  const m = useMenu();
  const { r, cats, accent } = m;
  const [active, setActive] = useState<string | null>(null);
  const [showUp, setShowUp] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const cat = cats.find((c) => c.id === active) ?? null;
  const hasCover = r.covers.length > 0;

  useEffect(() => {
    const onScroll = () => setShowUp(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string | null, c?: Category) => {
    setActive(id);
    if (c) m.selectCat(c);
    requestAnimationFrame(() =>
      id ? bodyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }) : window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  };

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-dvh pb-24" style={{ ...HEAD, background: IVORY, color: "#1c1a16" }}>
      {/* ————— غلاف ممتد + طبقة داكنة ————— */}
      <div className={hasCover ? "relative" : undefined}>
        <CoverHero rounded={false} h="h-56 sm:h-80" />
        {hasCover && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: `linear-gradient(to bottom, rgba(12,9,4,.55), rgba(12,9,4,.15) 45%, ${IVORY})` }}
          />
        )}
        <div
          className={hasCover ? "absolute inset-x-0 top-0 flex items-start justify-between p-3" : "flex items-start justify-between p-3"}
          style={hasCover ? { color: "#fff" } : undefined} /* الأزرار غير النشطة ترث اللون — تُقرأ فوق الغلاف الداكن */
        >
          <LangSwitch className="menu-pop backdrop-blur" />
          <HoursBadge className="menu-pop backdrop-blur" />
        </div>
      </div>

      {/* ————— الترويسة ————— */}
      <header className="mx-auto flex max-w-3xl flex-col items-center px-5 text-center">
        <div
          className={`menu-pop rounded-full p-[3px] ${hasCover ? "-mt-14" : "mt-1"}`}
          style={{ background: `linear-gradient(140deg, ${GOLD}, ${accent})`, boxShadow: "0 16px 34px -20px rgba(28,26,22,.7)" }}
        >
          <div className="rounded-full p-[3px]" style={{ background: IVORY }}>
            {r.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.logo_url}
                alt={m.rName}
                loading={m.eager ? "eager" : "lazy"}
                className="size-24 rounded-full object-cover"
                style={{ boxShadow: `inset 0 0 0 1px ${accent}44` }}
              />
            ) : (
              <span className="flex size-24 items-center justify-center rounded-full text-4xl font-black" style={{ background: accent, color: IVORY }}>
                {m.rName.charAt(0)}
              </span>
            )}
          </div>
        </div>

        <h1 className="menu-in mt-4 text-[30px] font-black leading-tight tracking-[0.14em] sm:text-4xl">{m.rName}</h1>
        <Ornament className="mt-2" />
        {m.rTagline && (
          <p className="menu-in mt-2 text-[13px] leading-6" style={{ ...BODY, color: MUTED }}>
            {m.rTagline}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2" style={BODY}>
          <RatingBadge className="menu-press" />
          {m.booking && (
            <button onClick={m.openReserve} className="menu-press rounded-full px-4 py-1.5 text-[13px] font-black" style={{ background: GOLD, color: IVORY }}>
              📅 {m.t("reserve")}
            </button>
          )}
          {m.hasInfo && (
            <button
              onClick={m.openInfo}
              aria-label={m.t("about")}
              className="menu-press flex size-8 items-center justify-center rounded-full border text-sm"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              ⓘ
            </button>
          )}
          {m.table && (
            <span className="rounded-full border px-4 py-1.5 text-[13px] font-black" style={{ borderColor: GOLD, color: GOLD }}>
              🍽️ {m.t("table")} {m.table}
            </span>
          )}
        </div>
        <SocialRow className="mt-3 justify-center" />
      </header>

      <div className="mx-auto max-w-5xl">
        <PromoStrip />
      </div>

      {/* ————— المحتوى ————— */}
      <div ref={bodyRef} className="scroll-mt-4">
        {!cat ? (
          <div key="cats" className="mx-auto grid max-w-5xl gap-5 px-5 pt-3 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((c, i) => {
              const bg = c.image_url ?? `linear-gradient(135deg, ${accent}, #1c1a16)`;
              return (
                <button
                  key={c.id}
                  onClick={() => go(c.id, c)}
                  style={stagger(i)}
                  className="menu-in menu-hover menu-zoom menu-press group relative block h-56 w-full overflow-hidden rounded-[20px] text-white"
                >
                  {isGradient(bg) ? (
                    <div className="absolute inset-0" style={{ background: bg }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bg} alt="" loading={m.eager ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,8,4,.8), transparent 68%)" }} />
                  <span className="absolute inset-x-0 bottom-6 px-4">
                    <span className="block text-[26px] font-black tracking-[0.06em]">{m.name(c)}</span>
                    <span className="mx-auto mt-2 block h-[2px] w-10 transition-all duration-300 group-hover:w-20" style={{ background: GOLD }} />
                    <span className="mt-1 block text-[12px] font-bold opacity-80" style={BODY}>
                      {c.items.length}
                    </span>
                  </span>
                  {/* خط ذهبي سفلي عند التحويم */}
                  <span
                    className="absolute inset-x-0 bottom-0 h-[3px] origin-center scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    style={{ background: GOLD }}
                  />
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            {/* شريط علوي لاصق: رجوع + عنوان + تنقل بين الأقسام */}
            <div className="sticky top-0 z-20 border-b backdrop-blur" style={{ borderColor: LINE, background: `${IVORY}f2` }}>
              <div className="mx-auto flex max-w-3xl items-center gap-2 px-5 pt-3">
                <button onClick={() => go(null)} className="menu-press flex items-center gap-1.5 text-sm font-black" style={{ ...BODY, color: GOLD }}>
                  <span className="rtl:rotate-180">‹</span> {m.t("back")}
                </button>
                <h2 className="min-w-0 flex-1 truncate text-center text-lg font-black tracking-[0.08em]">{m.name(cat)}</h2>
                <span className="w-14" />
              </div>
              <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-5 py-2 [scrollbar-width:none]" style={BODY}>
                {cats.map((c) => {
                  const on = c.id === cat.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => go(c.id, c)}
                      className="menu-press shrink-0 border-b-2 px-3 pb-1.5 text-[13px] font-black whitespace-nowrap"
                      style={{ borderColor: on ? GOLD : "transparent", color: on ? GOLD : MUTED }}
                    >
                      {m.name(c)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* قائمة تحريرية بنقاط قيادة */}
            <div key={cat.id} className="mx-auto max-w-3xl px-5" style={BODY}>
              {cat.items.map((it, i) => (
                <div
                  key={it.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => m.openItem(it)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      m.openItem(it);
                    }
                  }}
                  style={{ ...stagger(i), borderColor: LINE }}
                  className="menu-in menu-press menu-zoom flex cursor-pointer items-center gap-3 border-b py-4 outline-none focus-visible:ring-2"
                >
                  {it.image_url && (
                    <div className="size-20 shrink-0 overflow-hidden rounded-xl" style={{ boxShadow: `0 0 0 1px ${LINE}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.image_url} alt="" loading={m.eager ? "eager" : "lazy"} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-[17px] font-black" style={HEAD}>
                        {m.name(it)}
                      </p>
                      <span className="min-w-6 flex-1 -translate-y-1 border-b border-dotted" style={{ borderColor: "#c9c2b0" }} />
                      <p className="text-[16px] font-black whitespace-nowrap" style={{ color: GOLD }}>
                        {m.money(it.price)}
                      </p>
                    </div>
                    {m.desc(it) && (
                      <p className="mt-1 text-[13px] leading-5" style={{ color: MUTED }}>
                        {m.desc(it)}
                      </p>
                    )}
                  </div>
                  {m.ordering && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        m.onPlus(it);
                      }}
                      aria-label={m.t("addToCart")}
                      className="menu-press flex size-9 shrink-0 items-center justify-center rounded-full border text-lg font-bold"
                      style={{ borderColor: GOLD, color: GOLD }}
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ————— تذييل ————— */}
      <div className="mx-auto max-w-3xl px-5 pt-8">
        <Ornament />
        <SocialRow className="mt-4 justify-center" />
      </div>
      <BrandingFooter />

      {showUp && (
        <button
          onClick={toTop}
          aria-label="أعلى"
          className="menu-press menu-pop fixed bottom-28 end-4 z-30 flex size-11 items-center justify-center rounded-full text-lg font-black shadow-lg"
          style={{ background: GOLD, color: IVORY }}
        >
          ↑
        </button>
      )}
    </div>
  );
}
