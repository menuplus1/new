"use client";

/** القالب 5 — «المدمج»: قائمة فاتحة مضغوطة بصفحة واحدة — سريعة التصفح وخفيفة البيانات. */

import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/types";
import { BrandingFooter, CoverHero, HoursBadge, LangSwitch, PromoStrip, RatingBadge, SocialRow, useMenu } from "./shared";

const isGradient = (u: string) => u.startsWith("linear-gradient") || u.startsWith("radial-gradient");
const stagger = (i: number) => ({ animationDelay: `${Math.min(i * 40, 400)}ms` });

export function T5() {
  const m = useMenu();
  const { r, cats, accent } = m;
  const [active, setActive] = useState(cats[0]?.id ?? "");
  const [showTop, setShowTop] = useState(false);
  const secRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const on = () => setShowTop(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const jump = (c: Category) => {
    setActive(c.id);
    m.selectCat(c);
    chipRefs.current[c.id]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    secRefs.current[c.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-dvh bg-[#f6f6f6] pb-24 text-[#212529]" style={{ fontFamily: "var(--font-tajawal), sans-serif" }}>
      {/* header — centered, not sticky */}
      <header className="menu-in px-4 pt-6 text-center">
        {r.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.logo_url}
            alt={m.rName}
            loading={m.eager ? "eager" : "lazy"}
            className="mx-auto size-16 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${accent}` }}
          />
        ) : (
          <span
            className="mx-auto flex size-16 items-center justify-center rounded-full text-2xl font-black text-white"
            style={{ background: accent, boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${accent}44` }}
          >
            {m.rName.charAt(0)}
          </span>
        )}
        <h1 className="mt-3 text-2xl font-black leading-tight">{m.rName}</h1>
        {m.rTagline && <p className="mt-1 text-[13px] text-[#6b7280]">{m.rTagline}</p>}
        <div className="mt-2 flex items-center justify-center gap-2">
          <HoursBadge />
          <RatingBadge className="menu-press" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <LangSwitch />
          {m.booking && (
            <button onClick={m.openReserve} className="menu-press rounded-full px-4 py-1.5 text-sm font-extrabold text-white" style={{ background: accent }}>
              📅 {m.t("reserve")}
            </button>
          )}
          {m.hasInfo && (
            <button onClick={m.openInfo} aria-label="معلومات" className="menu-press flex size-8 items-center justify-center rounded-full bg-white text-sm shadow-sm">ⓘ</button>
          )}
          {m.table && (
            <span className="rounded-full px-4 py-1.5 text-sm font-extrabold" style={{ border: `1px solid ${accent}`, color: accent }}>
              🍽️ {m.t("table")} {m.table}
            </span>
          )}
        </div>
      </header>

      <div className="menu-in px-4 pt-4" style={stagger(1)}>
        <CoverHero h="h-40 sm:h-56" />
      </div>
      <PromoStrip />

      {/* sticky category chips — ponytail: no scroll-spy, active follows clicks only */}
      <nav className="sticky top-0 z-30 border-b border-black/5 bg-[#f6f6f6]/95 py-2 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {cats.map((c, i) => {
            const on = c.id === active;
            return (
              <button
                key={c.id}
                ref={(el) => { chipRefs.current[c.id] = el; }}
                onClick={() => jump(c)}
                className={`menu-in menu-press shrink-0 rounded-full px-4 py-2 text-sm font-extrabold ${on ? "text-white shadow" : "bg-white text-[#212529] shadow-sm"}`}
                style={on ? { ...stagger(i), background: accent } : stagger(i)}
              >
                {m.name(c)}
              </button>
            );
          })}
        </div>
      </nav>

      {/* sections */}
      {cats.map((c) => (
        <section key={c.id} ref={(el) => { secRefs.current[c.id] = el; }} className="scroll-mt-20">
          <h2 className="mb-2 mt-6 flex items-center gap-2 px-4 text-lg font-black">
            <span className="h-4 w-1 shrink-0 rounded-full" style={{ background: accent }} />
            {m.name(c)}
          </h2>
          <div className="space-y-2 px-4">
            {c.items.map((it, i) => (
              <article
                key={it.id}
                onClick={() => m.openItem(it)}
                style={stagger(i)}
                className="menu-in menu-press flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm hover:shadow-md"
              >
                <div className="menu-zoom size-20 shrink-0 overflow-hidden rounded-xl">
                  {it.image_url ? (
                    isGradient(it.image_url) ? (
                      <div className="h-full w-full" style={{ background: it.image_url }} />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt={m.name(it)} loading={m.eager ? "eager" : "lazy"} className="h-full w-full object-cover" />
                    )
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl font-black" style={{ background: `${accent}22`, color: accent }}>
                      {m.name(it).charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold leading-tight">{m.name(it)}</p>
                  {m.desc(it) && <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[#6b7280]">{m.desc(it)}</p>}
                  <p className="mt-1 whitespace-nowrap text-[15px] font-black" style={{ color: accent }}>{m.money(it.price)}</p>
                </div>
                {m.ordering && (
                  <button
                    onClick={(e) => { e.stopPropagation(); m.onPlus(it); }}
                    aria-label="أضف"
                    className="menu-press flex size-9 shrink-0 items-center justify-center rounded-full text-lg font-black text-white"
                    style={{ background: accent }}
                  >
                    +
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-8 flex justify-center border-t border-black/5 pt-5">
        <SocialRow />
      </div>
      <BrandingFooter />

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="أعلى"
          className="menu-pop menu-press fixed bottom-24 end-4 z-30 flex size-11 items-center justify-center rounded-full bg-white text-lg font-black shadow-lg"
          style={{ color: accent }}
        >
          ↑
        </button>
      )}
    </div>
  );
}
