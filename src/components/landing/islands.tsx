"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { MenuPreview, type PreviewData } from "./MenuPreview";
import { PLAN_INFO, YEARLY_MONTHS, iqd } from "@/lib/plans";

/* ————— scroll-reveal wrapper (visible by default; hides only below-fold) ————— */
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
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;
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
  ["القوالب", "#templates"],
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
        background: solid ? "var(--nav-bg)" : "transparent",
        backdropFilter: solid ? "blur(14px)" : "none",
        borderBottom: solid ? "1px solid var(--line)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px]" style={{ background: "var(--grad)", boxShadow: "var(--shadow-brand)" }}>
            <span className="text-lg font-black" style={{ color: "#fff" }}>+</span>
          </span>
          <span className="text-2xl font-black leading-none" style={{ color: solid ? "var(--ink)" : "var(--ink)" }}>منيو بلس</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(([label, href]) => (
            <a key={href} href={href} className="text-[14px] font-bold transition-colors" style={{ color: "var(--ink-soft)" }}>
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="/sign-in" className="hidden text-[14px] font-bold sm:inline" style={{ color: "var(--ink)" }}>
            تسجيل الدخول
          </a>
          <a href="/sign-up" className="shimmer rounded-full px-5 py-2.5 text-[14px] font-bold text-white" style={{ background: "var(--grad)", boxShadow: "var(--shadow-brand)" }}>
            ابدأ الآن
          </a>
        </div>
      </div>
    </header>
  );
}

/* ————— animated count-up stat ————— */
export function Stat({ to, label, prefix = "", suffix = "", symbol }: { to?: number; label: string; prefix?: string; suffix?: string; symbol?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (symbol || to == null) return;
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVal(to);
      return;
    }
    let raf = 0;
    let start = 0;
    let done = false;
    const run = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / 1200);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(run);
    };
    const begin = () => {
      if (done) return;
      done = true;
      raf = requestAnimationFrame(run);
    };
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        begin();
        io.disconnect();
      }
    });
    io.observe(el);
    // safety net: if the observer never fires, still show the final value
    const safety = window.setTimeout(() => {
      if (!done) setVal(to);
    }, 2600);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
      io.disconnect();
    };
  }, [to, symbol]);
  return (
    <div ref={ref} className="text-center">
      <div className="text-[clamp(2rem,5vw,3.25rem)] font-black leading-none">
        <span className="brand-text">
          {prefix}
          {symbol ?? val}
          {suffix}
        </span>
      </div>
      <div className="mt-2 text-[13px] font-bold" style={{ color: "var(--ink-soft)" }}>{label}</div>
    </div>
  );
}

/* ————— live per-tenant colour switcher ————— */
const SWATCHES = [
  { name: "فيروزي", c: "#10b3a3" },
  { name: "بنّي", c: "#d18b4a" },
  { name: "أخضر", c: "#2f9e7a" },
  { name: "نيلي", c: "#3b5bdb" },
  { name: "نبيذي", c: "#9c3b52" },
];

const YOURS: PreviewData = {
  name: "مطعمك",
  logo: "✦",
  status: "مفتوح الآن · طاولة 1",
  cats: ["الأطباق", "المشروبات", "الحلويات"],
  cartLabel: "سلّتك · صنفان",
  cartTotal: "11,000",
  items: [
    { name: "طبق اليوم", desc: "طازج · من مطبخنا", price: "8,000", emoji: "🍽️", tile: "linear-gradient(135deg,#cdeee8,#7fc9bd)" },
    { name: "مشروب المنزل", desc: "بارد · منعش", price: "3,000", emoji: "🥤", tile: "linear-gradient(135deg,#cfeef0,#7cc6d6)" },
    { name: "حلى خاص", desc: "صنع اليوم", price: "4,500", emoji: "🍰", tile: "linear-gradient(135deg,#d9eede,#8fc79f)" },
  ],
};

export function TenantSwitcher() {
  const [accent, setAccent] = useState(SWATCHES[0].c);
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div className="text-right">
        <p className="text-[13px] font-black tracking-wide" style={{ color: "var(--brand-deep)" }}>هوية لكل مطعم</p>
        <h2 className="mt-3 text-[clamp(1.9rem,3.6vw,3rem)] font-black leading-tight" style={{ color: "var(--ink)" }}>
          لونك، شعارك، منيو خاص بك — <span className="brand-text">نطاقك الخاص</span>
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-8" style={{ color: "var(--ink-soft)" }}>
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
                  transform: active ? "scale(1.14)" : "scale(1)",
                  boxShadow: active ? "0 0 0 2px var(--bg), 0 0 0 4px var(--brand), 0 8px 18px -6px rgba(0,0,0,.25)" : "0 4px 10px -4px rgba(0,0,0,.25)",
                }}
              />
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <a href="/dallah" className="lift inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-bold text-white" style={{ background: "#d18b4a" }}>
            افتح قهوة الدلّة ← /dallah
          </a>
          <a href="/sham" className="lift inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-bold text-white" style={{ background: "#2f9e7a" }}>
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
    { name: "قهوة عربية بالهيل", desc: "دلّة نحاسية · تُقدَّم مع تمر", price: "3,500", emoji: "☕" },
    { name: "إسبريسو مزدوج", desc: "تحميص متوسط", price: "3,000", emoji: "☕" },
    { name: "لاتيه بالزعفران", desc: "حليب مبخّر · زعفران إيراني", price: "4,000", emoji: "🥛" },
    { name: "شاي كرك", desc: "حليب · هيل · زنجبيل", price: "2,000", emoji: "🍵" },
  ],
  الحلويات: [
    { name: "كنافة نابلسية", desc: "جبن عكاوي · قطر · فستق", price: "5,000", emoji: "🍮" },
    { name: "تشيز كيك التوت", desc: "قاعدة بسكويت · توت طازج", price: "5,500", emoji: "🍰" },
    { name: "لقيمات بالقشطة", desc: "دبس تمر · سمسم", price: "3,500", emoji: "🍯" },
  ],
  المشاوي: [
    { name: "مشاوي مشكّلة", desc: "كباب · شيش طاووق · ريش", price: "12,500", emoji: "🍢" },
    { name: "شيش طاووق", desc: "صدور دجاج متبّلة · ثوم", price: "9,000", emoji: "🍗" },
    { name: "كباب حلبي", desc: "لحم غنم · بقدونس", price: "10,000", emoji: "🥩" },
  ],
  السلطات: [
    { name: "تبولة", desc: "بقدونس · برغل · ليمون", price: "3,500", emoji: "🥗" },
    { name: "فتوش", desc: "خضار · خبز محمّص · دبس رمان", price: "3,500", emoji: "🥙" },
    { name: "حمص بيروتي", desc: "طحينة · زيت زيتون · صنوبر", price: "3,000", emoji: "🫓" },
  ],
};

export function LiveMenuBoard() {
  const cats = Object.keys(BOARD);
  const [active, setActive] = useState(cats[0]);
  return (
    <div
      className="relative mx-auto max-w-3xl overflow-hidden rounded-[28px] p-6 sm:p-8"
      style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-lg)" }}
    >
      <div className="flex flex-wrap justify-center gap-2">
        {cats.map((c) => {
          const on = c === active;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className="rounded-full px-4 py-2 text-[13px] font-bold transition-colors"
              style={on ? { background: "var(--grad)", color: "#fff" } : { background: "var(--brand-soft)", color: "var(--brand-deep)" }}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div key={active} className="rise mt-6 space-y-2.5" style={{ animationDuration: ".45s" }}>
        {BOARD[active].map((it) => (
          <div key={it.name} className="lift flex items-center gap-4 rounded-2xl p-3" style={{ background: "var(--band)", border: "1px solid var(--line)" }}>
            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-2xl" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--brand) 22%, #fff), color-mix(in srgb, var(--brand) 50%, #fff))" }}>
              {it.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-black" style={{ color: "var(--ink)" }}>{it.name}</div>
              <div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{it.desc}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[15px] font-black">
                <span className="brand-text">{it.price}</span>
                <span className="ms-1 text-[10px]" style={{ color: "#9aa8a5" }}>د.ع</span>
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-white" style={{ background: "var(--grad)" }}>+</span>
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
          <div key={q} className="border-b" style={{ borderColor: "var(--line)" }}>
            <button onClick={() => setOpen(on ? -1 : i)} className="flex w-full items-center justify-between gap-4 py-5 text-right" aria-expanded={on}>
              <span className="text-[16px] font-black" style={{ color: "var(--ink)" }}>{q}</span>
              <span
                className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-lg transition-transform duration-300"
                style={{ background: "var(--brand-soft)", color: "var(--brand-deep)", transform: on ? "rotate(45deg)" : "none" }}
              >
                +
              </span>
            </button>
            <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: on ? "1fr" : "0fr" }}>
              <div className="overflow-hidden">
                <p className="pb-5 text-[15px] leading-8" style={{ color: "var(--ink-soft)" }}>{a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ————— live theme comparison switcher (temporary tool) ————— */
const THEMES = [
  { key: "turquoise", name: "فيروزي", c: "#10b3a3" },
  { key: "indigo", name: "نيلي جوهري", c: "#6366f1" },
  { key: "wine", name: "عاجيّ نبيذي", c: "#a12f47" },
];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState("turquoise");
  function apply(t: string) {
    const root = document.documentElement;
    if (t === "turquoise") delete root.dataset.theme;
    else root.dataset.theme = t;
  }
  useEffect(() => {
    const saved = localStorage.getItem("emenu-theme") || "turquoise";
    apply(saved);
    setTheme(saved);
  }, []);
  function pick(t: string) {
    apply(t);
    setTheme(t);
    localStorage.setItem("emenu-theme", t);
  }
  return (
    <div
      className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full px-3 py-2"
      style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-lg)" }}
    >
      <span className="hidden text-[12px] font-bold sm:inline" style={{ color: "var(--ink-soft)" }}>الثيم</span>
      {THEMES.map((t) => (
        <button
          key={t.key}
          onClick={() => pick(t.key)}
          aria-label={t.name}
          title={t.name}
          className="h-7 w-7 rounded-full transition-transform"
          style={{
            background: t.c,
            transform: theme === t.key ? "scale(1.16)" : "scale(1)",
            boxShadow: theme === t.key ? "0 0 0 2px var(--surface), 0 0 0 4px var(--brand)" : "0 2px 6px -2px rgba(0,0,0,.3)",
          }}
        />
      ))}
    </div>
  );
}

/* ————— pricing: 4 tiers, monthly/yearly, feature matrix ————— */
/** cell: true = included · false = not · "store" = sold separately · string = its own wording */
type Cell = boolean | "store" | string;
const TIERS = [
  { plan: "free", name: "باقة الانطلاق", icon: "⚡", price: PLAN_INFO.free.monthly, tag: "الاشتراك الحالي", note: "استمتع مجاناً دون إدخال بيانات البطاقة" },
  { plan: "basic", name: "الباقة الأساسية", icon: "★", price: PLAN_INFO.basic.monthly, note: "جرّب مجاناً 7 أيام دون إدخال بيانات البطاقة" },
  { plan: "premium", name: "باقة التميز", icon: "♛", price: PLAN_INFO.premium.monthly, tag: "الأكثر طلباً", featured: true, note: "جرّب مجاناً 7 أيام دون إدخال بيانات البطاقة" },
  { plan: "ultimate", name: "باقة شاملة", icon: "🚀", price: PLAN_INFO.ultimate.monthly, note: "جرّب مجاناً 7 أيام دون إدخال بيانات البطاقة" },
];
const FEATURES: { label: string; v: [Cell, Cell, Cell, Cell] }[] = [
  { label: "عدد العناصر", v: ["امكانية اضافة 15 عنصر", "امكانية اضافة 100 عنصر", "عدد لا نهائي من العناصر", "عدد لا نهائي من العناصر"] },
  { label: "عدد الأقسام", v: ["امكانية اضافة 5 أقسام", "امكانية اضافة 15 قسم", "عدد لا نهائي من الأقسام", "عدد لا نهائي من الأقسام"] },
  { label: "التحكم بروابط التواصل الاجتماعي", v: [true, true, true, true] },
  { label: "لا تتضمن إعلانات", v: [false, true, true, true] },
  { label: "احصائيات متقدمة", v: [false, true, true, true] },
  { label: "Seo تحسين ظهور محركات البحث", v: [false, true, true, true] },
  { label: "تعدد طرق العرض", v: [false, true, true, true] },
  { label: "تعدد اللغات", v: [false, true, true, true] },
  { label: "نبذة عنا", v: [false, true, true, true] },
  { label: "أوقات العمل", v: [false, true, true, true] },
  { label: "التقييمات", v: [false, true, true, true] },
  { label: "نظام الطلبات من خلال القائمة", v: [false, false, true, true] },
  { label: "إدارة الطاولات", v: [false, false, true, true] },
  { label: "تعدد صور الغلاف", v: [false, false, true, true] },
  { label: "تعدد صور العناصر", v: [false, false, true, true] },
  { label: "اشتراطات وزارة الصحة العراقية", v: [false, false, true, true] },
  { label: "المشرفون", v: ["مشرف واحد", "مشرف واحد", "3 مشرفين", "10 مشرفين"] },
  { label: "تطبيق الحجز", v: [false, "store", "store", true] },
  { label: "تطبيق العروض الترويجية", v: [false, "store", "store", true] },
  { label: "إمكانية إخفاء حقوق منيو بلس", v: [false, false, false, true] },
];
const SHORT = 8; // features shown before "عرض المزيد"

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [all, setAll] = useState(false);
  const shown = all ? FEATURES : FEATURES.slice(0, SHORT);

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center justify-center gap-4">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: "var(--brand-deep)" }}>
          <span aria-hidden>↩</span> شهرين مجاناً
        </span>
        <div className="flex rounded-full p-1" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          {[
            ["سنوياً", true],
            ["شهرياً", false],
          ].map(([label, on]) => (
            <button
              key={label as string}
              onClick={() => setYearly(on as boolean)}
              className="rounded-full px-6 py-2 text-[14px] font-bold transition"
              style={yearly === on ? { background: "var(--grad)", color: "#fff" } : { color: "var(--ink-soft)" }}
            >
              {label as string}
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((t, i) => (
          <div
            key={t.name}
            className="lift flex h-full flex-col overflow-hidden rounded-[22px]"
            style={
              t.featured
                ? { background: "var(--surface-2)", border: "2px solid var(--brand)", boxShadow: "0 40px 80px -34px rgba(16,179,163,.45)" }
                : { background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-md)" }
            }
          >
            <div className="flex flex-col items-center gap-2 px-5 pb-6 pt-6 text-center">
              <div className="flex w-full items-start justify-between">
                {t.tag ? (
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-black"
                    style={t.featured ? { background: "var(--grad)", color: "#fff" } : { background: "var(--brand-soft)", color: "var(--brand-deep)" }}
                  >
                    {t.tag}
                  </span>
                ) : (
                  <span />
                )}
                <span className="text-2xl" aria-hidden>{t.icon}</span>
              </div>
              <h3 className="text-xl font-black" style={{ color: "var(--ink)" }}>{t.name}</h3>
              <p className="flex items-end gap-1.5">
                <span className="brand-text text-4xl font-black">{t.price === 0 ? "مجاناً" : iqd(yearly ? t.price * YEARLY_MONTHS : t.price)}</span>
                {t.price > 0 && <span className="pb-1.5 text-[12px]" style={{ color: "var(--ink-soft)" }}>{yearly ? "سنوياً" : "شهرياً"}</span>}
              </p>
            </div>

            <ul className="flex-1 space-y-3 border-t px-5 py-5" style={{ borderColor: "var(--line)" }}>
              {shown.map((f) => {
                const cell = f.v[i];
                const on = cell === true || typeof cell === "string";
                return (
                  <li key={f.label} className="flex items-start gap-2.5 text-[13.5px] leading-6" style={{ color: on ? "var(--ink)" : "var(--ink-soft)" }}>
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] text-white"
                      style={{ background: on ? "var(--grad)" : "color-mix(in srgb, var(--ink-soft) 45%, transparent)" }}
                    >
                      {on ? "✓" : "✕"}
                    </span>
                    <span>
                      {typeof cell === "string" ? cell : f.label}
                      {cell === "store" && <span className="text-[12px] opacity-70"> (متاح بالمتجر)</span>}
                    </span>
                  </li>
                );
              })}
              <li>
                <button onClick={() => setAll(!all)} className="mt-1 w-full rounded-full py-2 text-[13px] font-bold" style={{ color: "var(--brand-deep)", border: "1px solid var(--line)" }}>
                  {all ? "عرض أقل ⌃" : "عرض المزيد ⌄"}
                </button>
              </li>
            </ul>

            <div className="px-5 pb-6">
              <a
                href={`/sign-up?plan=${t.plan}`}
                className={`block rounded-full py-3.5 text-center text-[15px] font-bold ${t.featured ? "shimmer text-white" : ""}`}
                style={t.featured ? { background: "var(--grad)", boxShadow: "var(--shadow-brand)" } : { color: "var(--brand-deep)", border: "1px solid var(--brand)" }}
              >
                {t.price === 0 ? "ابدأ مجاناً" : "ابدأ تجربتك المجانية"}
              </a>
              <p className="mt-3 text-center text-[12px] leading-5" style={{ color: "var(--ink-soft)" }}>{t.note}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
