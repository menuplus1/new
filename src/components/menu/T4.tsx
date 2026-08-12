"use client";

/** القالب 4 — «الداكن السريع»: صفحة واحدة داكنة بأسلوب الوجبات السريعة —
 *  هيدر لاصق من صفّين (شعار + شريط تصنيفات) + شبكة بطاقات مربعة لكل قسم. */

import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/types";
import { BrandingFooter, CoverHero, HoursBadge, LangSwitch, PromoStrip, RatingBadge, SocialRow, useMenu } from "./shared";

const delay = (i: number) => ({ animationDelay: `${Math.min(i * 40, 400)}ms` });

export function T4() {
  const m = useMenu();
  const { r, cats, accent } = m;
  const [active, setActive] = useState(cats[0]?.id ?? "");
  const [tap, setTap] = useState({ id: "", n: 0 }); // آخر تصنيف تم الضغط عليه → إعادة تشغيل الحركة
  const [showTop, setShowTop] = useState(false);
  const secRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lock = useRef(false); // مقفول أثناء التمرير البرمجي

  // scroll-spy: القسم الظاهر تحت الهيدر هو التصنيف النشط
  useEffect(() => {
    const els = Object.values(secRefs.current).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (lock.current) return; // أثناء التمرير البرمجي
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const id = (hit?.target as HTMLElement | undefined)?.dataset.cat;
        if (id) setActive(id);
      },
      { rootMargin: "-120px 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [cats]);

  // الشريحة النشطة تُمرَّر أفقياً لمنتصف الشريط
  useEffect(() => {
    chipRefs.current[active]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  useEffect(() => {
    const on = () => setShowTop(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const onChip = (c: Category) => {
    m.selectCat(c);
    setActive(c.id);
    setTap((t) => ({ id: c.id, n: t.n + 1 }));
    lock.current = true;
    setTimeout(() => (lock.current = false), 900);
    secRefs.current[c.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-dvh bg-[#1a1a1a] pb-24 text-[#f2f2f0]" style={{ fontFamily: "var(--font-rubik), sans-serif" }}>
      {/* ————— هيدر لاصق من صفّين ————— */}
      <header className="sticky top-0 z-30 bg-[#1a1a1a]/80 shadow-[0_1px_0_rgba(255,255,255,.10)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          {r.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.logo_url}
              alt={m.rName}
              loading={m.eager ? "eager" : "lazy"}
              className="size-12 shrink-0 rounded-2xl border-2 object-cover"
              style={{ borderColor: accent }}
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-[#141414] ring-2 ring-white/10" style={{ background: accent }}>
              {m.rName.charAt(0)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[22px] font-black leading-tight tracking-tight">{m.rName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <HoursBadge />
              <RatingBadge className="menu-press" />
              {m.table && (
                <span className="whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-black" style={{ borderColor: accent, color: accent }}>
                  🍽️ {m.t("table")} {m.table}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <LangSwitch />
            {m.hasInfo && (
              <button onClick={m.openInfo} aria-label={m.t("about")} className="menu-press flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                ⓘ
              </button>
            )}
          </div>
        </div>

        {/* شريط التصنيفات */}
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pb-2.5 [scrollbar-width:none]">
          {cats.map((c) => {
            const on = c.id === active;
            return (
              <button
                key={c.id}
                ref={(el) => { chipRefs.current[c.id] = el; }}
                onClick={() => onChip(c)}
                aria-current={on ? "true" : undefined}
                className={`menu-press whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-black ${on ? "scale-105 text-[#141414]" : "bg-white/10 text-white/70"}`}
                style={on ? { background: accent, boxShadow: `0 8px 20px -8px ${accent}` } : undefined}
              >
                {m.name(c)}
              </button>
            );
          })}
        </div>
      </header>

      <div className="mx-auto max-w-5xl">
        <div className="menu-in px-4 pt-4">
          <CoverHero h="h-36 sm:h-52" />
        </div>
        <PromoStrip />
        {m.booking && (
          <div className="flex justify-center px-4 pt-1">
            <button onClick={m.openReserve} className="menu-press rounded-full px-5 py-2.5 text-sm font-black text-[#141414]" style={{ background: accent }}>
              📅 {m.t("reserve")}
            </button>
          </div>
        )}

        {cats.map((c) => (
          <section
            key={c.id}
            data-cat={c.id}
            ref={(el) => { secRefs.current[c.id] = el; }}
            className="scroll-mt-28"
          >
            <h2 className="mb-3 mt-7 px-4 text-[20px] font-black tracking-tight" style={{ color: accent }}>
              {m.name(c)}
            </h2>
            {/* re-key عند الضغط على الشريحة → إعادة تشغيل حركة الدخول */}
            <div key={c.id === tap.id ? `${c.id}-${tap.n}` : c.id} className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-4">
              {c.items.map((it, i) => (
                <article
                  key={it.id}
                  onClick={() => m.openItem(it)}
                  style={delay(i)}
                  className="menu-in menu-hover menu-zoom cursor-pointer overflow-hidden rounded-2xl bg-[#242427]"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {it.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt={m.name(it)} loading={m.eager ? "eager" : "lazy"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl font-black text-[#141414]" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}66)` }}>
                        {m.name(it).charAt(0)}
                      </div>
                    )}
                    {m.ordering && (
                      <button
                        onClick={(e) => { e.stopPropagation(); m.onPlus(it); }}
                        aria-label={m.t("addToCart")}
                        className="menu-press absolute bottom-2 start-2 flex size-10 items-center justify-center rounded-full text-2xl font-black text-[#141414] shadow-lg"
                        style={{ background: accent }}
                      >
                        +
                      </button>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 min-h-[2.4em] text-[15px] font-bold leading-tight">{m.name(it)}</p>
                    <p className="mt-1 whitespace-nowrap text-[14px] font-black" style={{ color: accent }}>{m.money(it.price)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {/* ————— الفوتر ————— */}
        <div className="mt-10 border-t border-white/10 px-4 pt-6">
          <SocialRow className="justify-center" />
        </div>
        <BrandingFooter />
      </div>

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="أعلى"
          className="menu-press menu-pop fixed bottom-28 end-4 z-30 flex size-11 items-center justify-center rounded-full text-xl font-black text-[#141414] shadow-xl"
          style={{ background: accent }}
        >
          ↑
        </button>
      )}
    </div>
  );
}
