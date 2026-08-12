"use client";

/** القوالب ٧–١٦ — «الورقة»: غلاف عريض + شعار دائري + ورقة تعلو الغلاف،
 *  بطاقات أقسام بنسبة ٣:١، ثم قائمة أصناف بصور عريضة (١.٦١:١). خط: Rubik.
 *  سِمتان فقط — فاتحة وداكنة — وكل ما تبقّى يأتي من لون المطعم وشعاره،
 *  لذلك تتشارك القوالب العشرة هذا الملف وتختلف بالسِمة واللون والمنيو. */

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Category, MenuItem } from "@/lib/types";
import { BrandingFooter, HoursBadge, LangSwitch, PromoStrip, RatingBadge, SocialRow, useMenu } from "./shared";

export type OddSkin = "light" | "dark";

const SKIN: Record<OddSkin, { page: string; sheet: string; title: string; text: string; muted: string; soft: string; line: string; chipInk: string }> = {
  light: { page: "#f3f1ef", sheet: "#ffffff", title: "#000000", text: "#4c4c4c", muted: "#676767", soft: "#989898", line: "rgba(0,0,0,.08)", chipInk: "#ffffff" },
  dark: { page: "#272727", sheet: "#181818", title: "#dedede", text: "#c9c9c9", muted: "#676767", soft: "#8b8b8b", line: "rgba(255,255,255,.09)", chipInk: "#181818" },
};

const isGradient = (u: string) => u.startsWith("linear-gradient") || u.startsWith("radial-gradient");

export function Odd({ skin = "light" }: { skin?: OddSkin }) {
  const m = useMenu();
  const { r, cats, accent } = m;
  const s = SKIN[skin];
  const vars = {
    "--accent": accent,
    "--page": s.page,
    "--sheet": s.sheet,
    "--title": s.title,
    "--text": s.text,
    "--muted": s.muted,
    "--soft": s.soft,
    "--line": s.line,
    fontFamily: "var(--font-rubik), sans-serif",
  } as CSSProperties;

  const [open, setOpen] = useState<Category | null>(null);
  const [q, setQ] = useState("");

  const query = q.trim().toLowerCase();
  const found = useMemo(() => {
    if (!query) return null;
    const hit = (t: string | null) => Boolean(t && t.toLowerCase().includes(query));
    return cats
      .map((c) => ({ cat: c, items: c.items.filter((it) => hit(m.name(it)) || hit(m.desc(it))) }))
      .filter((g) => g.items.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, cats, m.lang]);

  const cover = r.covers[0];

  return (
    <div style={{ ...vars, background: "var(--page)" }} className="min-h-dvh text-[var(--text)]">
      {/* ————— الغلاف + الشعار ————— */}
      <div className="relative mx-auto h-[162px] max-w-[560px] overflow-hidden px-4">
        {cover ? (
          isGradient(cover) ? (
            <div className="absolute inset-0" style={{ background: cover }} />
          ) : (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${cover}")` }} />
          )
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}, #00000055)` }} />
        )}
        <div className="relative flex h-full items-center justify-center">
          {r.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.logo_url}
              alt={m.rName}
              loading={m.eager ? "eager" : "lazy"}
              className="-mt-[42px] size-[82px] shrink-0 rounded-full object-cover shadow-md"
            />
          ) : (
            <span
              className="-mt-[42px] flex size-[82px] shrink-0 items-center justify-center rounded-full text-3xl font-bold shadow-md"
              style={{ background: accent, color: s.chipInk }}
            >
              {m.rName.charAt(0)}
            </span>
          )}
        </div>
        <div className="absolute end-4 top-4 z-[2]">
          <LangSwitch />
        </div>
      </div>

      {/* ————— الورقة ————— */}
      <div className="relative mx-auto -mt-8 min-h-[60dvh] max-w-[560px] rounded-t-[24px] px-4 pt-6 shadow-sm" style={{ background: "var(--sheet)" }}>
        {open ? (
          <button
            onClick={() => setOpen(null)}
            aria-label={m.t("back")}
            className="menu-press mb-4 flex size-10 items-center justify-center rounded-full text-lg"
            style={{ background: s.sheet, color: s.title, boxShadow: "1px 1px 6px #0000002e" }}
          >
            <span className="rtl:rotate-180">←</span>
          </button>
        ) : (
          <>
            <h1 className="mb-1 truncate text-[32px] leading-[1.4] text-[var(--title)]">{m.rName}</h1>
            <div className="mb-2 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[var(--muted)]">
              {m.rTagline && <span>{m.rTagline}</span>}
              {r.whatsapp_phone && (
                <a href={`tel:${r.whatsapp_phone}`} dir="ltr" className="underline">
                  {r.whatsapp_phone}
                </a>
              )}
              <HoursBadge />
              <RatingBadge />
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-1">
              {m.hasInfo && (
                <button onClick={m.openInfo} className="menu-press rounded-full border-[3px] px-4 py-1 text-[15px] font-semibold" style={{ borderColor: accent, color: accent, background: "var(--sheet)" }}>
                  ⓘ {m.t("about")}
                </button>
              )}
              {m.booking && (
                <button onClick={m.openReserve} className="menu-press rounded-full border-[3px] px-4 py-1 text-[15px] font-semibold" style={{ borderColor: accent, background: accent, color: s.chipInk }}>
                  📅 {m.t("reserve")}
                </button>
              )}
              {m.table && (
                <span className="rounded-full border-[3px] px-4 py-1 text-[15px] font-semibold" style={{ borderColor: accent, color: accent }}>
                  🍽️ {m.t("table")} {m.table}
                </span>
              )}
            </div>
          </>
        )}

        {/* ————— البحث ————— */}
        <div className="flex h-16 items-center">
          <div className="relative w-full">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`🔍 ${m.t("menu")}…`}
              className="w-full rounded-[32px] border px-4 py-3 text-[16px] outline-none placeholder:text-[14px] placeholder:text-[var(--soft)]"
              style={{ borderColor: s.line, background: "var(--page)", color: "var(--text)" }}
            />
          </div>
        </div>

        {found ? (
          /* ————— نتائج البحث ————— */
          found.length ? (
            found.map((g) => (
              <section key={g.cat.id} className="pt-2">
                <h2 className="mb-[18px] text-[20px] text-[var(--title)]">{m.name(g.cat)}</h2>
                {g.items.map((it) => (
                  <Item key={it.id} it={it} skin={skin} />
                ))}
              </section>
            ))
          ) : (
            <p className="py-10 text-center text-[14px] text-[var(--muted)]">—</p>
          )
        ) : open ? (
          /* ————— قسم مفتوح ————— */
          <>
            <div className="mb-4 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]">
              {cats.map((c) => {
                const on = c.id === open.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setOpen(c);
                      m.selectCat(c);
                    }}
                    className="shrink-0 whitespace-nowrap rounded-[32px] border-[3px] px-2.5 pb-1 pt-[5px] text-[16px] font-semibold"
                    style={on ? { borderColor: accent, background: accent, color: s.chipInk } : { borderColor: accent, background: "var(--sheet)", color: accent }}
                  >
                    {m.name(c)}
                  </button>
                );
              })}
            </div>
            <section className="pt-2">
              <h2 className="mb-[18px] text-[20px] text-[var(--title)]">{m.name(open)}</h2>
              {open.items.map((it) => (
                <Item key={it.id} it={it} skin={skin} />
              ))}
            </section>
          </>
        ) : (
          /* ————— بطاقات الأقسام ————— */
          <>
            <PromoStrip />
            {/* داخل إطارات المعاينة نرسم ٦ أقسام فقط — عشرة إطارات × ٣٠ صورة تُثقل صفحة الهبوط */}
            <div className="flex flex-col">
              {(m.eager ? cats.slice(0, 6) : cats).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setOpen(c);
                    m.selectCat(c);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="menu-press relative mb-4 aspect-[3/1] w-full overflow-hidden rounded-[26px]"
                  style={{
                    backgroundImage: c.image_url ? `url("${c.image_url}")` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    background: c.image_url ? undefined : `linear-gradient(120deg, ${accent}, #00000066)`,
                    boxShadow: "0 1px 2px 0 rgba(0,0,0,.05)",
                  }}
                >
                  <span className="absolute inset-0 rounded-[26px]" style={{ background: "#252525", opacity: 0.3 }} />
                  <span
                    className="absolute inset-0 flex items-center justify-center p-4 text-center text-[24px] uppercase tracking-[1px] text-white sm:text-[28px]"
                    style={{ textShadow: "0 2px 3px rgba(0,0,0,.46)" }}
                  >
                    {m.name(c)}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        <SocialRow className="justify-center pt-2" />
        <BrandingFooter />
      </div>
    </div>
  );
}

/** صنف واحد: صورة عريضة ثم الاسم والوصف والسعر — والعناصر بلا صورة يفصلها خط */
function Item({ it, skin }: { it: MenuItem; skin: OddSkin }) {
  const m = useMenu();
  const s = SKIN[skin];
  const desc = m.desc(it);
  const price = it.variants.length ? Math.min(...it.variants.map((v) => v.price)) : it.price;
  return (
    <article className={`relative mb-14 flex flex-col items-center ${it.image_url ? "" : "border-t pt-4"}`} style={it.image_url ? undefined : { borderColor: s.line }}>
      {it.image_url && (
        <div className="mb-2.5 aspect-[1.61/1] w-full shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={it.image_url}
            alt={m.name(it)}
            loading={m.eager ? "eager" : "lazy"}
            onClick={() => m.openItem(it)}
            className="h-full w-full cursor-pointer rounded-[26px] object-cover object-center"
          />
        </div>
      )}
      <div className="flex w-full flex-col">
        <h3 onClick={() => m.openItem(it)} className="mb-1.5 line-clamp-2 grow cursor-pointer text-[16px] font-semibold text-[var(--text)]">
          {m.name(it)}
        </h3>
        {desc && <p className="mb-1.5 text-[14px] leading-[1.45] text-[var(--muted)]">{desc}</p>}
        <div className="mt-auto flex w-full items-center justify-between">
          <span className="flex items-baseline font-medium leading-none" style={{ color: m.accent }}>
            <b className="text-[16px] font-medium" dir="ltr">
              {price.toLocaleString("en-US")}
            </b>
            <span className="ms-0.5 text-[13px] font-normal">{m.r.currency}</span>
            {it.variants.length > 1 && <span className="ms-1 text-[12px] font-normal text-[var(--soft)]">+</span>}
          </span>
          {m.ordering && (
            <button
              onClick={() => m.onPlus(it)}
              aria-label={m.t("addToCart")}
              className="menu-press flex size-9 items-center justify-center rounded-full text-xl font-bold"
              style={{ background: m.accent, color: s.chipInk }}
            >
              +
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
