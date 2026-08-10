"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { MenuPreview, type PreviewData } from "./MenuPreview";

/* ————— scroll-reveal wrapper ————— */
export function Reveal({
  children,
  className = "",
  delay = 0,
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // reduced motion or no observer support → leave visible, no animation
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // already in view on mount → leave visible (don't animate what's on screen)
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;
    // below the fold → hide, then animate in when scrolled to
    el.classList.add("pre");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    // safety net: never leave content stuck invisible if the observer never fires
    const t = window.setTimeout(() => el.classList.add("in"), 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);
  return (
    <div ref={ref} data-reveal className={className} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

/* ————— scroll-aware top bar ————— */
const NAV_LINKS = [
  ["المميزات", "#features"],
  ["المطاعم", "#tenants"],
  ["الباقات", "#pricing"],
  ["الأسئلة", "#faq"],
];

export function Nav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
      style={{
        background: solid ? "rgba(23,17,13,.85)" : "transparent",
        backdropFilter: solid ? "blur(12px)" : "none",
        borderBottom: solid ? "1px solid rgba(201,162,75,.22)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 rotate-45 items-center justify-center rounded-[10px]"
            style={{ background: "linear-gradient(140deg,#e7cd8b,#9c6f2b)", boxShadow: "0 6px 16px -6px rgba(201,162,75,.7)" }}
          >
            <span className="-rotate-45 text-sm font-bold" style={{ color: "#20160b" }}>
              س
            </span>
          </span>
          <span className="font-display text-2xl font-bold leading-none" style={{ color: "#f6efe2" }}>
            سُفرة
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-[14px] font-medium transition-colors hover:text-white"
              style={{ color: "rgba(246,239,226,.7)" }}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="/sign-in" className="hidden text-[14px] font-medium sm:inline" style={{ color: "rgba(246,239,226,.8)" }}>
            تسجيل الدخول
          </a>
          <a
            href="#pricing"
            className="shimmer rounded-full px-5 py-2.5 text-[14px] font-semibold"
            style={{
              color: "#20160b",
              background: "linear-gradient(115deg,#f7e7b6,#d8b062 40%,#c99f4e)",
              boxShadow: "0 8px 22px -8px rgba(201,162,75,.6), inset 0 1px 0 rgba(255,255,255,.45)",
            }}
          >
            ابدأ الآن
          </a>
        </div>
      </div>
    </header>
  );
}

/* ————— live per-tenant colour switcher (proves multi-tenant theming) ————— */
const SWATCHES = [
  { name: "بنّي", c: "#d18b4a" },
  { name: "أخضر", c: "#2f9e7a" },
  { name: "نيلي", c: "#3b5bdb" },
  { name: "نبيذي", c: "#9c3b52" },
  { name: "ذهبي", c: "#c9a24b" },
];

const YOURS: PreviewData = {
  name: "مطعمك",
  logo: "✦",
  status: "مفتوح الآن · طاولة ١",
  cats: ["الأطباق", "المشروبات", "الحلويات"],
  cartLabel: "سلّتك · صنفان",
  cartTotal: "١١٬٠٠٠",
  items: [
    { name: "طبق اليوم", desc: "طازج · من مطبخنا", price: "٨٬٠٠٠", emoji: "🍽️", tile: "linear-gradient(135deg,#f0dcae,#d9a86a)" },
    { name: "مشروب المنزل", desc: "بارد · منعش", price: "٣٬٠٠٠", emoji: "🥤", tile: "linear-gradient(135deg,#cfe6d8,#7fb59a)" },
    { name: "حلى خاص", desc: "صنع اليوم", price: "٤٬٥٠٠", emoji: "🍰", tile: "linear-gradient(135deg,#f2c98a,#c77c3a)" },
  ],
};

export function TenantSwitcher() {
  const [accent, setAccent] = useState(SWATCHES[0].c);
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div className="text-right">
        <p className="text-[13px] font-semibold tracking-wide" style={{ color: "#8a6320" }}>
          هوية لكل مطعم
        </p>
        <h2 className="font-display mt-3 text-[clamp(1.9rem,3.6vw,3rem)] font-bold leading-tight" style={{ color: "#241b14" }}>
          لونك، شعارك، منيوك — <span className="foil">نطاقك الخاص</span>
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-8" style={{ color: "#6f5f4d" }}>
          كل مطعم على المنصّة مستقلٌّ تماماً. اختر لوناً وشاهد المنيو يُعاد طلاؤه أمامك لحظياً — نفس ما يحدث حين نُهيّئ علامتك.
        </p>

        <div className="mt-7 flex items-center justify-end gap-3" role="group" aria-label="اختر لون العلامة">
          {SWATCHES.map((s) => {
            const active = s.c === accent;
            return (
              <button
                key={s.c}
                onClick={() => setAccent(s.c)}
                aria-pressed={active}
                aria-label={s.name}
                className="relative h-10 w-10 rounded-full transition-transform"
                style={{
                  background: s.c,
                  transform: active ? "scale(1.12)" : "scale(1)",
                  boxShadow: active
                    ? "0 0 0 2px #fbf6ec, 0 0 0 4px #c9a24b, 0 8px 18px -6px rgba(0,0,0,.35)"
                    : "0 4px 10px -4px rgba(0,0,0,.3)",
                }}
              />
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <a href="/dallah" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5" style={{ background: "#d18b4a" }}>
            افتح قهوة الدلّة ← /dallah
          </a>
          <a href="/sham" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5" style={{ background: "#2f9e7a" }}>
            افتح بيت الشام ← /sham
          </a>
        </div>
      </div>

      <div className="flex justify-center">
        <MenuPreview accent={accent} data={YOURS} className="transition-all duration-500" />
      </div>
    </div>
  );
}

/* ————— live menu board with category tabs ————— */
type BoardItem = { name: string; desc: string; price: string; emoji: string };
const BOARD: Record<string, BoardItem[]> = {
  "المشروبات الساخنة": [
    { name: "قهوة عربية بالهيل", desc: "دلّة نحاسية · تُقدَّم مع تمر", price: "٣٬٥٠٠", emoji: "☕" },
    { name: "إسبريسو مزدوج", desc: "تحميص متوسط", price: "٣٬٠٠٠", emoji: "☕" },
    { name: "لاتيه بالزعفران", desc: "حليب مبخّر · زعفران إيراني", price: "٤٬٠٠٠", emoji: "🥛" },
    { name: "شاي كرك", desc: "حليب · هيل · زنجبيل", price: "٢٬٠٠٠", emoji: "🍵" },
  ],
  الحلويات: [
    { name: "كنافة نابلسية", desc: "جبن عكاوي · قطر · فستق", price: "٥٬٠٠٠", emoji: "🍮" },
    { name: "تشيز كيك التوت", desc: "قاعدة بسكويت · توت طازج", price: "٥٬٥٠٠", emoji: "🍰" },
    { name: "لقيمات بالقشطة", desc: "دبس تمر · سمسم", price: "٣٬٥٠٠", emoji: "🍯" },
  ],
  المشاوي: [
    { name: "مشاوي مشكّلة", desc: "كباب · شيش طاووق · ريش", price: "١٢٬٥٠٠", emoji: "🍢" },
    { name: "شيش طاووق", desc: "صدور دجاج متبّلة · ثوم", price: "٩٬٠٠٠", emoji: "🍗" },
    { name: "كباب حلبي", desc: "لحم غنم · بقدونس", price: "١٠٬٠٠٠", emoji: "🥩" },
  ],
  السلطات: [
    { name: "تبولة", desc: "بقدونس · برغل · ليمون", price: "٣٬٥٠٠", emoji: "🥗" },
    { name: "فتوش", desc: "خضار · خبز محمّص · دبس رمان", price: "٣٬٥٠٠", emoji: "🥙" },
    { name: "حمص بيروتي", desc: "طحينة · زيت زيتون · صنوبر", price: "٣٬٠٠٠", emoji: "🫓" },
  ],
};

export function LiveMenuBoard() {
  const cats = Object.keys(BOARD);
  const [active, setActive] = useState(cats[0]);
  return (
    <div
      className="paper relative mx-auto max-w-3xl overflow-hidden rounded-[28px] p-6 sm:p-8"
      style={{
        background: "linear-gradient(180deg,#fffdf8,#f7efe0)",
        border: "1px solid rgba(201,162,75,.28)",
        boxShadow: "0 30px 60px -30px rgba(42,32,23,.4), 0 1px 2px rgba(42,32,23,.05)",
      }}
    >
      <div className="relative z-10 flex flex-wrap justify-center gap-2">
        {cats.map((c) => {
          const on = c === active;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className="relative rounded-full px-4 py-2 text-[13px] font-semibold transition-colors"
              style={
                on
                  ? { background: "linear-gradient(115deg,#d8b062,#9c6f2b)", color: "#20160b" }
                  : { background: "rgba(201,162,75,.1)", color: "#8a6320" }
              }
            >
              {c}
            </button>
          );
        })}
      </div>

      <div key={active} className="sufra-in relative z-10 mt-6 space-y-2.5" style={{ animationDuration: ".45s" }}>
        {BOARD[active].map((it) => (
          <div
            key={it.name}
            className="flex items-center gap-4 rounded-2xl bg-white p-3"
            style={{ border: "1px solid #efe5d3", boxShadow: "0 1px 2px rgba(42,32,23,.04)" }}
          >
            <div
              className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-2xl"
              style={{ background: "linear-gradient(135deg,#f3e2be,#d9a86a)" }}
            >
              {it.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold" style={{ color: "#2a2017" }}>
                {it.name}
              </div>
              <div className="text-[12px]" style={{ color: "#9a8a74" }}>
                {it.desc}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[15px] font-bold">
                <span className="foil">{it.price}</span>
                <span className="ms-1 text-[10px]" style={{ color: "#b9a781" }}>
                  د.ع
                </span>
              </span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-white"
                style={{ background: "linear-gradient(140deg,#c9a24b,#8a6320)" }}
              >
                +
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ————— FAQ accordion ————— */
const FAQ: [string, string][] = [
  ["هل يحتاج الزبون إلى تحميل تطبيق؟", "لا. يكفي مسح رمز QR على الطاولة أو فتح رابط مطعمك المباشر — يعمل على أي هاتف من المتصفّح فوراً."],
  ["كيف أُحدّث الأسعار والأصناف؟", "من لوحة تحكّمك، أي تعديل على الأسعار أو الأصناف أو الصور يظهر للزبائن لحظياً دون إعادة طباعة أو تثبيت."],
  ["هل يعمل بدون إنترنت؟", "منيو التابلت يعمل أونلاين وأوفلاين كتطبيق ويب سريع (PWA)، ويُزامن التغييرات فور عودة الاتصال."],
  ["كم يستغرق إطلاق مطعمي؟", "دقائق. نُهيّئ قائمتك بعلامتك ولونك ونطاقك الخاص، ونولّد رموز QR لكل طاولة جاهزة للطباعة."],
  ["هل لكل فرع منيو مستقل؟", "نعم. كل مطعم — وكل فرع — يحصل على منيوه وطاولاته وطلباته بشكل مستقل تماماً تحت نطاقه الخاص."],
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="mx-auto max-w-2xl">
      {FAQ.map(([q, a], i) => {
        const on = i === open;
        return (
          <div key={q} className="border-b" style={{ borderColor: "rgba(201,162,75,.25)" }}>
            <button
              onClick={() => setOpen(on ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 py-5 text-right"
              aria-expanded={on}
            >
              <span className="text-[16px] font-semibold" style={{ color: "#241b14" }}>
                {q}
              </span>
              <span
                className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-lg transition-transform duration-300"
                style={{
                  background: "rgba(201,162,75,.14)",
                  color: "#8a6320",
                  transform: on ? "rotate(45deg)" : "none",
                }}
              >
                +
              </span>
            </button>
            <div
              className="grid transition-all duration-300 ease-out"
              style={{ gridTemplateRows: on ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="pb-5 text-[15px] leading-8" style={{ color: "#6f5f4d" }}>
                  {a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
