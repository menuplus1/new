"use client";

/** القالب 2 — «بطاقات الأقسام»: غلاف + شعار دائري، بطاقات أقسام عمودية كبيرة،
 *  وعرض أصناف القسم بصفوف بيضاء (مستوحى من menux.app/hakayah-cafe). */

import { useState } from "react";
import type { Category } from "@/lib/types";
import { BrandingFooter, CoverHero, HoursBadge, LangSwitch, PromoStrip, RatingBadge, useMenu } from "./shared";

const isGradient = (u: string) => u.startsWith("linear-gradient") || u.startsWith("radial-gradient");

export function T2() {
  const m = useMenu();
  const { r, cats, accent } = m;
  const [active, setActive] = useState<string | null>(null);
  const cat = active ? cats.find((c) => c.id === active) : null;

  const catBg = (c: Category) =>
    c.image_url && isGradient(c.image_url) ? c.image_url : `linear-gradient(135deg, ${accent}, #21252999)`;

  return (
    <div className="min-h-dvh pb-24 text-[#212529]" style={{ background: "#f6f6f6" }}>
      {/* ————— header ————— */}
      <div className="px-4 pt-4">
        <CoverHero rounded h="h-44 sm:h-64" />
      </div>
      <div className="-mt-8 flex flex-col items-center gap-2 px-4 text-center">
        {r.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.logo_url} alt={m.rName} className="size-16 rounded-full bg-white object-cover shadow ring-4 ring-white" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full text-2xl font-black text-white shadow ring-4 ring-white" style={{ background: accent }}>
            {m.rName.charAt(0)}
          </span>
        )}
        <h1 className="text-2xl font-black">{m.rName}</h1>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <HoursBadge />
          <RatingBadge />
          {m.table && (
            <span className="rounded-full bg-white px-3 py-1 text-[12px] font-black shadow-sm" style={{ color: accent }}>
              🍽️ {m.t("table")} {m.table}
            </span>
          )}
        </div>
        {m.rTagline && <p className="text-sm text-[#6b7280]">{m.rTagline}</p>}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <LangSwitch />
          {m.booking && (
            <button onClick={m.openReserve} className="rounded-full px-4 py-1.5 text-sm font-extrabold text-white" style={{ background: accent }}>
              📅 {m.t("reserve")}
            </button>
          )}
          {m.hasInfo && (
            <button onClick={m.openInfo} aria-label="معلومات" className="flex size-8 items-center justify-center rounded-full bg-white text-sm shadow-sm">ⓘ</button>
          )}
        </div>
      </div>
      <PromoStrip />

      {!cat ? (
        /* ————— main view: category cards ————— */
        <>
          <h2 className="px-4 pb-2 pt-1 text-sm font-bold text-[#6b7280]">{m.t("menu")}</h2>
          <div className="space-y-3 px-4">
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => { m.selectCat(c); setActive(c.id); }}
                className="relative block h-40 w-full overflow-hidden rounded-2xl text-start"
              >
                {c.image_url && !isGradient(c.image_url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" loading={m.eager ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ background: catBg(c) }} />
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.65), transparent 60%)" }} />
                <div className="absolute inset-x-0 bottom-0 px-4 pb-3 text-start">
                  <p className="text-xl font-black text-white">{m.name(c)}</p>
                  <p className="text-xs text-white/70">· {c.items.length}</p>
                </div>
              </button>
            ))}
          </div>
          <BrandingFooter />
        </>
      ) : (
        /* ————— category view: item rows ————— */
        <>
          <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 backdrop-blur" style={{ background: "rgba(246,246,246,.95)" }}>
            <button onClick={() => setActive(null)} className="rounded-full bg-white px-4 py-2 font-bold shadow">
              {m.t("back")}
            </button>
            <h2 className="text-lg font-black">{m.name(cat)}</h2>
          </div>
          <div className="space-y-2.5 px-4 pt-3">
            {cat.items.map((it) => (
              <div key={it.id} onClick={() => m.openItem(it)} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                {it.image_url ? (
                  isGradient(it.image_url) ? (
                    <div className="size-20 shrink-0 rounded-xl" style={{ background: it.image_url }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image_url} alt={m.name(it)} loading={m.eager ? "eager" : "lazy"} className="size-20 shrink-0 rounded-xl object-cover" />
                  )
                ) : (
                  <span className="flex size-20 shrink-0 items-center justify-center rounded-xl text-xl font-black" style={{ background: `color-mix(in srgb, ${accent} 15%, white)`, color: accent }}>
                    {m.name(it).charAt(0)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">{m.name(it)}</p>
                  {m.desc(it) && <p className="mt-0.5 line-clamp-2 text-[12px] text-[#6b7280]">{m.desc(it)}</p>}
                </div>
                <p className="whitespace-nowrap font-black" style={{ color: accent }}>{m.money(it.price)}</p>
                {m.ordering && (
                  <button
                    onClick={(e) => { e.stopPropagation(); m.onPlus(it); }}
                    aria-label="أضف"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white active:scale-90"
                    style={{ background: accent }}
                  >
                    +
                  </button>
                )}
              </div>
            ))}
          </div>
          <BrandingFooter />
        </>
      )}
    </div>
  );
}
