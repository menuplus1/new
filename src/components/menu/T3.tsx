"use client";

/** القالب 3 — «الفاخر»: عاجيّ راقٍ. بطاقات أقسام ثم قائمة تحريرية بنقاط قيادة. */

import { useState } from "react";
import { BrandingFooter, CoverHero, HoursBadge, LangSwitch, PromoStrip, RatingBadge, SocialRow, useMenu } from "./shared";

const GOLD = "#b08d3e";
const isGradient = (u: string) => u.startsWith("linear-gradient");

export function T3() {
  const m = useMenu();
  const { r, cats, accent } = m;
  const [active, setActive] = useState<string | null>(null);
  const cat = cats.find((c) => c.id === active) ?? null;

  return (
    <div className="min-h-dvh bg-[#faf8f3] pb-24 text-[#1c1a16]">
      {/* cover — full bleed */}
      <div className="relative">
        <CoverHero rounded={false} h="h-52 sm:h-72" />
        <LangSwitch className="absolute top-3 right-3" />
        <HoursBadge className="absolute top-3 left-3 bg-[#faf8f3]/90" />
      </div>

      {/* centered header */}
      <header className="flex flex-col items-center px-5 text-center">
        {r.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.logo_url} alt={m.rName} className="-mt-10 size-20 rounded-full object-cover ring-4 ring-[#faf8f3]" />
        ) : (
          <span className="-mt-10 flex size-20 items-center justify-center rounded-full text-3xl font-black text-[#faf8f3] ring-4 ring-[#faf8f3]" style={{ background: accent }}>
            {m.rName.charAt(0)}
          </span>
        )}
        <h1 className="mt-3 text-3xl font-black tracking-tight">{m.rName}</h1>
        <div className="mt-2 flex items-center gap-3" style={{ color: GOLD }}>
          <span className="h-px w-10" style={{ background: GOLD }} />
          <span className="text-sm">✦</span>
          <span className="h-px w-10" style={{ background: GOLD }} />
        </div>
        {m.rTagline && <p className="mt-2 text-sm italic text-[#8a8578]">{m.rTagline}</p>}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <RatingBadge />
          {m.booking && (
            <button onClick={m.openReserve} className="rounded-full px-4 py-1.5 text-[13px] font-black text-[#faf8f3]" style={{ background: GOLD }}>
              📅 {m.t("reserve")}
            </button>
          )}
          {m.hasInfo && (
            <button onClick={m.openInfo} aria-label="معلومات" className="flex size-8 items-center justify-center rounded-full border text-sm" style={{ borderColor: GOLD, color: GOLD }}>
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

      <PromoStrip />

      {!cat ? (
        /* category cards */
        <div className="space-y-4 px-5 pt-2">
          {cats.map((c) => {
            const bg = c.image_url ?? `linear-gradient(135deg, ${accent}, #1c1a16)`;
            return (
              <button key={c.id} onClick={() => { setActive(c.id); m.selectCat(c); }} className="relative block h-48 w-full overflow-hidden rounded-[20px] text-white">
                {isGradient(bg) ? (
                  <div className="absolute inset-0" style={{ background: bg }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bg} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,8,4,.75), transparent 65%)" }} />
                <span className="absolute bottom-5 w-full text-center text-2xl font-black">
                  {m.name(c)}
                  <span className="mx-auto mt-2 block h-[2px] w-10" style={{ background: GOLD }} />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        /* drill-in: editorial list */
        <div>
          <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#e7e2d6] bg-[#faf8f3]/95 px-5 py-3 backdrop-blur">
            <button onClick={() => setActive(null)} className="flex items-center gap-1.5 text-sm font-black" style={{ color: GOLD }}>
              ‹ {m.t("back")}
            </button>
            <h2 className="flex-1 text-center text-lg font-black">{m.name(cat)}</h2>
            <span className="w-12" />
          </div>
          <div className="px-5">
            {cat.items.map((it) => (
              <div key={it.id} onClick={() => m.openItem(it)} className="flex cursor-pointer items-center gap-3 border-b border-[#e7e2d6] py-4">
                {it.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image_url} alt="" loading="lazy" className="size-16 shrink-0 rounded-xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-[16px] font-black">{m.name(it)}</p>
                    <span className="flex-1 -translate-y-1 border-b border-dotted border-[#c9c2b0]" />
                    <p className="whitespace-nowrap font-black" style={{ color: GOLD }}>{m.money(it.price)}</p>
                  </div>
                  {m.desc(it) && <p className="mt-1 text-[13px] text-[#8a8578]">{m.desc(it)}</p>}
                </div>
                {m.ordering && (
                  <button onClick={(e) => { e.stopPropagation(); m.onPlus(it); }} aria-label="أضف" className="flex size-8 shrink-0 items-center justify-center rounded-full border text-lg font-bold active:scale-90" style={{ borderColor: GOLD, color: GOLD }}>
                    +
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <BrandingFooter />
    </div>
  );
}
