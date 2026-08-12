"use client";

/** القالب 2 — «بطاقات الأقسام»: غلاف + شعار دائري متداخل، بطاقات أقسام عمودية كبيرة
 *  تفتح على قائمة أصناف القسم بصفوف بيضاء. خط القالب: Tajawal. */

import { useEffect, useState } from "react";
import type { Category } from "@/lib/types";
import { BrandingFooter, CoverHero, HoursBadge, LangSwitch, PromoStrip, RatingBadge, SocialRow, useMenu } from "./shared";

const isGradient = (u: string) => u.startsWith("linear-gradient") || u.startsWith("radial-gradient");
const stagger = (i: number) => ({ animationDelay: `${Math.min(i * 40, 400)}ms` });

export function T2() {
  const m = useMenu();
  const { r, cats, accent } = m;
  const [active, setActive] = useState<string | null>(null);
  const [showTop, setShowTop] = useState(false);
  const cat = active ? (cats.find((c) => c.id === active) ?? null) : null;

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string | null) => {
    setActive(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const catBg = (c: Category) =>
    c.image_url && isGradient(c.image_url) ? c.image_url : `linear-gradient(135deg, ${accent}, #21252999)`;

  return (
    <div
      className="min-h-dvh pb-24 text-[#212529]"
      style={{ background: "#f6f6f6", fontFamily: "var(--font-tajawal), sans-serif" }}
    >
      {/* ————— header: cover + overlapping logo ————— */}
      <div className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-3xl">
          <CoverHero rounded h="h-44 sm:h-64" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,.5), rgba(0,0,0,.05) 55%, transparent)" }}
          />
        </div>
      </div>

      <div className="menu-in relative z-10 -mt-10 flex flex-col items-center gap-2 px-4 text-center">
        {r.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.logo_url}
            alt={m.rName}
            loading={m.eager ? "eager" : "lazy"}
            className="size-20 rounded-full bg-white object-cover shadow-lg ring-4 ring-white"
            style={{ outline: `2px solid ${accent}`, outlineOffset: "2px" }}
          />
        ) : (
          <span
            className="flex size-20 items-center justify-center rounded-full text-3xl font-black text-white shadow-lg ring-4 ring-white"
            style={{ background: accent, outline: `2px solid ${accent}`, outlineOffset: "2px" }}
          >
            {m.rName.charAt(0)}
          </span>
        )}

        <h1 className="mt-1 text-[26px] font-black leading-tight sm:text-3xl">{m.rName}</h1>
        {m.rTagline && <p className="text-sm font-medium text-[#6b7280]">{m.rTagline}</p>}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <HoursBadge />
          <RatingBadge />
          {m.table && (
            <span className="rounded-full bg-white px-3 py-1 text-[12px] font-black shadow-sm" style={{ color: accent }}>
              🍽️ {m.t("table")} {m.table}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <LangSwitch />
          {m.booking && (
            <button
              onClick={m.openReserve}
              className="menu-press rounded-full px-4 py-1.5 text-sm font-extrabold text-white shadow-sm"
              style={{ background: accent }}
            >
              📅 {m.t("reserve")}
            </button>
          )}
          {m.hasInfo && (
            <button
              onClick={m.openInfo}
              aria-label={m.t("about")}
              className="menu-press flex size-8 items-center justify-center rounded-full bg-white text-sm shadow-sm"
            >
              ⓘ
            </button>
          )}
        </div>
      </div>

      <PromoStrip />

      {!cat ? (
        /* ————— main view: category cards ————— */
        <>
          <h2 className="px-4 pb-2 pt-2 text-sm font-black tracking-wide text-[#6b7280]">{m.t("menu")}</h2>
          <div key="cats" className="space-y-3 px-4">
            {cats.map((c, i) => (
              <button
                key={c.id}
                onClick={() => { m.selectCat(c); go(c.id); }}
                style={stagger(i)}
                className="menu-in menu-hover menu-zoom menu-press group relative block h-40 w-full overflow-hidden rounded-3xl text-start shadow-sm sm:h-48"
              >
                {c.image_url && !isGradient(c.image_url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" loading={m.eager ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ background: catBg(c) }} />
                )}
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,.25) 45%, rgba(0,0,0,.05))" }}
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-4 pb-4">
                  <div className="min-w-0">
                    <p className="truncate text-xl font-black text-white sm:text-2xl">{m.name(c)}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-black text-white backdrop-blur-sm">
                      {c.items.length}
                    </span>
                  </div>
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-lg font-black text-white shadow transition-transform duration-300 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                    style={{ background: accent }}
                    aria-hidden
                  >
                    {m.dir === "rtl" ? "‹" : "›"}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <SocialRow className="mt-6 justify-center" />
          <BrandingFooter />
        </>
      ) : (
        /* ————— category view: item rows ————— */
        <>
          <div
            className="sticky top-0 z-20 mt-2 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
            style={{ background: "rgba(246,246,246,.82)" }}
          >
            <button
              onClick={() => go(null)}
              className="menu-press flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-black shadow"
            >
              <span aria-hidden>{m.dir === "rtl" ? "›" : "‹"}</span>
              {m.t("back")}
            </button>
            <h2 className="truncate text-lg font-black">{m.name(cat)}</h2>
          </div>

          <div key={cat.id} className="scroll-mt-20 space-y-2.5 px-4 pt-3">
            {cat.items.map((it, i) => (
              <div
                key={it.id}
                onClick={() => m.openItem(it)}
                style={stagger(i)}
                className="menu-in menu-press menu-zoom flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl bg-white p-3 shadow-sm"
              >
                {it.image_url ? (
                  isGradient(it.image_url) ? (
                    <div className="size-20 shrink-0 rounded-xl" style={{ background: it.image_url }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image_url} alt={m.name(it)} loading={m.eager ? "eager" : "lazy"} className="size-20 shrink-0 rounded-xl object-cover" />
                  )
                ) : (
                  <span
                    className="flex size-20 shrink-0 items-center justify-center rounded-xl text-xl font-black"
                    style={{ background: `color-mix(in srgb, ${accent} 15%, white)`, color: accent }}
                  >
                    {m.name(it).charAt(0)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-extrabold leading-snug">{m.name(it)}</p>
                  {m.desc(it) && <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-[#6b7280]">{m.desc(it)}</p>}
                </div>
                <p className="whitespace-nowrap text-[15px] font-black" style={{ color: accent }}>{m.money(it.price)}</p>
                {m.ordering && (
                  <button
                    onClick={(e) => { e.stopPropagation(); m.onPlus(it); }}
                    aria-label={m.t("addToCart")}
                    className="menu-press flex size-9 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
                    style={{ background: accent }}
                  >
                    +
                  </button>
                )}
              </div>
            ))}
          </div>

          <SocialRow className="mt-6 justify-center" />
          <BrandingFooter />

          {showTop && (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="أعلى"
              className="menu-press menu-pop fixed bottom-24 end-4 z-30 flex size-11 items-center justify-center rounded-full text-xl font-black text-white shadow-lg"
              style={{ background: accent }}
            >
              ↑
            </button>
          )}
        </>
      )}
    </div>
  );
}
