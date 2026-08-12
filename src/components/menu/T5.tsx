"use client";

/** القالب 5 — «المدمج»: قائمة فاتحة مضغوطة بصفحة واحدة — سريعة التصفح وخفيفة البيانات. */

import { useRef, useState } from "react";
import type { Category } from "@/lib/types";
import { BrandingFooter, CoverHero, HoursBadge, LangSwitch, PromoStrip, RatingBadge, useMenu } from "./shared";

const isGradient = (u: string) => u.startsWith("linear-gradient") || u.startsWith("radial-gradient");

export function T5() {
  const m = useMenu();
  const { r, cats, accent } = m;
  const [active, setActive] = useState(cats[0]?.id ?? "");
  const secRefs = useRef<Record<string, HTMLElement | null>>({});

  const jump = (c: Category) => {
    setActive(c.id);
    m.selectCat(c);
    secRefs.current[c.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-dvh bg-[#f6f6f6] pb-24 text-[#212529]">
      {/* header — centered, not sticky */}
      <header className="px-4 pt-6 text-center">
        {r.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.logo_url} alt={m.rName} className="mx-auto size-16 rounded-full object-cover" />
        ) : (
          <span className="mx-auto flex size-16 items-center justify-center rounded-full text-2xl font-black text-white" style={{ background: accent }}>
            {m.rName.charAt(0)}
          </span>
        )}
        <h1 className="mt-2 text-xl font-black">{m.rName}</h1>
        <div className="mt-1 flex items-center justify-center gap-2">
          <HoursBadge />
          <RatingBadge />
        </div>
        {m.rTagline && <p className="mt-1 text-sm text-[#6b7280]">{m.rTagline}</p>}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <LangSwitch />
          {m.booking && (
            <button onClick={m.openReserve} className="rounded-full px-4 py-1.5 text-sm font-extrabold text-white" style={{ background: accent }}>
              📅 {m.t("reserve")}
            </button>
          )}
          {m.hasInfo && (
            <button onClick={m.openInfo} aria-label="معلومات" className="flex size-8 items-center justify-center rounded-full bg-white text-sm shadow-sm">ⓘ</button>
          )}
          {m.table && (
            <span className="rounded-full px-4 py-1.5 text-sm font-extrabold" style={{ border: `1px solid ${accent}`, color: accent }}>
              🍽️ {m.t("table")} {m.table}
            </span>
          )}
        </div>
      </header>

      <div className="px-4 pt-4">
        <CoverHero h="h-40 sm:h-56" />
      </div>
      <PromoStrip />

      {/* sticky category chips — ponytail: no scroll-spy, active follows clicks only */}
      <nav className="sticky top-0 z-30 bg-[#f6f6f6]/95 py-2 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {cats.map((c) => {
            const on = c.id === active;
            return (
              <button
                key={c.id}
                onClick={() => jump(c)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${on ? "text-white" : "bg-white text-[#212529] shadow-sm"}`}
                style={on ? { background: accent } : undefined}
              >
                {m.name(c)}
              </button>
            );
          })}
        </div>
      </nav>

      {/* sections */}
      {cats.map((c) => (
        <section key={c.id} ref={(el) => { secRefs.current[c.id] = el; }} className="scroll-mt-14">
          <h2 className="mb-2 mt-5 px-4 text-lg font-black">{m.name(c)}</h2>
          <div className="space-y-2 px-4">
            {c.items.map((it) => (
              <article key={it.id} onClick={() => m.openItem(it)} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm">
                {it.image_url ? (
                  isGradient(it.image_url) ? (
                    <div className="size-20 shrink-0 rounded-xl" style={{ background: it.image_url }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image_url} alt={m.name(it)} loading={m.eager ? "eager" : "lazy"} className="size-20 shrink-0 rounded-xl object-cover" />
                  )
                ) : (
                  <span className="flex size-20 shrink-0 items-center justify-center rounded-xl text-2xl font-black" style={{ background: `${accent}22`, color: accent }}>
                    {m.name(it).charAt(0)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold leading-tight">{m.name(it)}</p>
                  {m.desc(it) && <p className="mt-0.5 line-clamp-2 text-[12px] text-[#6b7280]">{m.desc(it)}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-center gap-1.5">
                  <p className="whitespace-nowrap text-[14px] font-black" style={{ color: accent }}>{m.money(it.price)}</p>
                  {m.ordering && (
                    <button onClick={(e) => { e.stopPropagation(); m.onPlus(it); }} aria-label="أضف" className="flex size-8 items-center justify-center rounded-full text-lg font-bold text-white active:scale-90" style={{ background: accent }}>
                      +
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <BrandingFooter />
    </div>
  );
}
