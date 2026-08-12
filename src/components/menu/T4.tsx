"use client";

/** القالب 4 — «الداكن السريع»: صفحة واحدة داكنة بأسلوب الوجبات السريعة —
 *  شريط تصنيفات أفقي لاصق + شبكة بطاقات مربعة لكل قسم. */

import { useRef, useState } from "react";
import type { Category } from "@/lib/types";
import { BrandingFooter, CoverHero, HoursBadge, LangSwitch, PromoStrip, RatingBadge, useMenu } from "./shared";

export function T4() {
  const m = useMenu();
  const { r, cats, accent } = m;
  const [active, setActive] = useState(cats[0]?.id ?? "");
  const secRefs = useRef<Record<string, HTMLElement | null>>({});

  // ponytail: active chip = last clicked, no scroll-spy
  const onChip = (c: Category) => {
    m.selectCat(c);
    setActive(c.id);
    secRefs.current[c.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-dvh bg-[#1a1a1a] pb-24 text-[#f2f2f0]">
      {/* sticky header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#1a1a1a]/95 backdrop-blur">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {r.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.logo_url} alt={m.rName} className="size-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full text-lg font-black text-[#141414]" style={{ background: accent }}>
                {m.rName.charAt(0)}
              </span>
            )}
            <span className="truncate text-lg font-extrabold">{m.rName}</span>
            <HoursBadge />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <RatingBadge />
            <LangSwitch />
            {m.hasInfo && (
              <button onClick={m.openInfo} aria-label="معلومات" className="flex size-8 items-center justify-center rounded-full border border-white/10 text-sm">ⓘ</button>
            )}
            {m.table && (
              <span className="whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-extrabold" style={{ borderColor: accent, color: accent }}>
                🍽️ {m.t("table")} {m.table}
              </span>
            )}
          </div>
        </div>
        {/* category chips */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
          {cats.map((c) => {
            const on = c.id === active;
            return (
              <button
                key={c.id}
                onClick={() => onChip(c)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-extrabold ${on ? "text-[#141414]" : "bg-white/10"}`}
                style={on ? { background: accent } : undefined}
              >
                {m.name(c)}
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-4 pt-4">
        <CoverHero h="h-36 sm:h-52" />
      </div>
      <PromoStrip />
      {m.booking && (
        <div className="flex justify-center px-4 pt-1">
          <button onClick={m.openReserve} className="rounded-full px-5 py-2 text-sm font-extrabold text-[#141414]" style={{ background: accent }}>
            📅 {m.t("reserve")}
          </button>
        </div>
      )}

      {cats.map((c) => (
        <section key={c.id} ref={(el) => { secRefs.current[c.id] = el; }} className="scroll-mt-28">
          <h2 className="mb-3 mt-6 px-4 text-xl font-extrabold" style={{ color: accent }}>{m.name(c)}</h2>
          <div className="grid grid-cols-2 gap-3 px-4">
            {c.items.map((it) => (
              <article key={it.id} onClick={() => m.openItem(it)} className="cursor-pointer overflow-hidden rounded-2xl bg-[#242427]">
                <div className="relative aspect-square">
                  {it.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image_url} alt={m.name(it)} loading={m.eager ? "eager" : "lazy"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl font-black text-[#141414]" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}66)` }}>
                      {m.name(it).charAt(0)}
                    </div>
                  )}
                  {m.ordering && (
                    <button onClick={(e) => { e.stopPropagation(); m.onPlus(it); }} aria-label="أضف" className="absolute bottom-2 start-2 flex size-10 items-center justify-center rounded-full text-2xl font-bold text-[#141414] shadow-lg active:scale-90" style={{ background: accent }}>
                      +
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 min-h-[2.5em] text-[14px] font-bold leading-tight">{m.name(it)}</p>
                  <p className="mt-1 font-black" style={{ color: accent }}>{m.money(it.price)}</p>
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
