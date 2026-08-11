"use client";

/** القالب 6 — «الدافئ»: صفحة واحدة بقائمة مدمجة بطابع مخبز/مقهى دافئ. */

import { useRef, useState } from "react";
import { BrandingFooter, CoverHero, HoursBadge, LangSwitch, PromoStrip, RatingBadge, useMenu } from "./shared";

const INK = "#2b2419";
const MUTED = "#8d8371";
const ORNA = "#a3855c";
const isGradient = (u: string) => u.startsWith("linear-gradient") || u.startsWith("radial-gradient");

export function T6() {
  const m = useMenu();
  const { r, cats, accent } = m;
  const cardBg = `color-mix(in srgb, ${accent} 8%, #f7f1e1)`;
  const priceInk = `color-mix(in srgb, ${accent} 70%, #000)`;

  const [active, setActive] = useState(cats[0]?.id ?? "");
  const secRefs = useRef<Record<string, HTMLElement | null>>({});

  return (
    <div className="min-h-dvh bg-[#faf5ea] pb-24" style={{ color: INK }}>
      {/* header */}
      <header className="flex flex-col items-center gap-2 px-4 pt-6 text-center">
        {r.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.logo_url} alt={m.rName} className="size-16 rounded-full object-cover" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full text-2xl font-black text-white" style={{ background: accent }}>
            {m.rName.charAt(0)}
          </span>
        )}
        <h1 className="text-2xl font-black">{m.rName}</h1>
        <div className="text-[13px] tracking-[0.4em]" style={{ color: ORNA }}>✦ ✦ ✦</div>
        <div className="flex items-center gap-2">
          <HoursBadge />
          <RatingBadge />
        </div>
        {m.rTagline && <p className="text-[13px] font-bold" style={{ color: MUTED }}>{m.rTagline}</p>}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <LangSwitch />
          {m.booking && (
            <button onClick={m.openReserve} className="rounded-full px-4 py-1.5 text-[13px] font-black text-white" style={{ background: accent }}>
              📅 {m.t("reserve")}
            </button>
          )}
          {m.hasInfo && (
            <button onClick={m.openInfo} aria-label="معلومات" className="flex size-8 items-center justify-center rounded-full border border-black/10 text-sm">ⓘ</button>
          )}
          {m.table && (
            <span className="rounded-full border px-4 py-1.5 text-[13px] font-black" style={{ borderColor: accent, color: priceInk }}>
              🍽️ {m.t("table")} {m.table}
            </span>
          )}
        </div>
      </header>

      <div className="mt-4 overflow-hidden rounded-[16px] px-4">
        <CoverHero h="h-44 sm:h-60" />
      </div>
      <PromoStrip />

      {/* sticky category chips — ponytail: no scroll-spy, active follows clicks only */}
      <nav className="sticky top-0 z-30 bg-[#faf5ea]/95 py-2 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActive(c.id);
                m.selectCat(c);
                secRefs.current[c.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`whitespace-nowrap rounded-[30px] px-4 py-2 text-[13px] font-bold transition ${active === c.id ? "bg-[#1f1f1f] text-white" : "bg-black/10 text-[#2b2419]"}`}
            >
              {m.name(c)}
            </button>
          ))}
        </div>
      </nav>

      {/* sections */}
      {cats.map((c) => (
        <section key={c.id} ref={(el) => { secRefs.current[c.id] = el; }} className="scroll-mt-16">
          <h2 className="mb-2 mt-6 px-4 text-lg font-black">
            <span style={{ color: ORNA }}>✦ </span>
            {m.name(c)}
          </h2>
          <div className="space-y-2.5 px-4">
            {c.items.map((it) => (
              <div key={it.id} onClick={() => m.openItem(it)} className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/5 p-2.5" style={{ background: cardBg }}>
                {it.image_url ? (
                  isGradient(it.image_url) ? (
                    <div className="size-20 shrink-0 rounded-2xl" style={{ background: it.image_url }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image_url} alt={m.name(it)} loading="lazy" className="size-20 shrink-0 rounded-2xl object-cover" />
                  )
                ) : (
                  <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white" style={{ background: accent }}>
                    {m.name(it).charAt(0)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">{m.name(it)}</p>
                  {m.desc(it) && <p className="line-clamp-2 text-[12px] font-bold" style={{ color: MUTED }}>{m.desc(it)}</p>}
                </div>
                <p className="whitespace-nowrap font-black" style={{ color: priceInk }}>{m.money(it.price)}</p>
                {m.ordering && (
                  <button onClick={(e) => { e.stopPropagation(); m.onPlus(it); }} aria-label="أضف" className="flex size-8 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white active:scale-90" style={{ background: accent }}>
                    +
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <BrandingFooter />
    </div>
  );
}
