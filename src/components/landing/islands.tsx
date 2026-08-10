"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { MenuPreview, type PreviewData } from "./MenuPreview";

const toAr = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);

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
        background: solid ? "rgba(255,255,255,.82)" : "transparent",
        backdropFilter: solid ? "blur(14px)" : "none",
        borderBottom: solid ? "1px solid var(--line)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px]" style={{ background: "var(--grad)", boxShadow: "var(--shadow-brand)" }}>
            <span className="text-base font-black" style={{ color: "#fff" }}>س</span>
          </span>
          <span className="text-2xl font-black leading-none" style={{ color: solid ? "var(--ink)" : "var(--ink)" }}>سُفرة</span>
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
          <a href="#pricing" className="shimmer rounded-full px-5 py-2.5 text-[14px] font-bold text-white" style={{ background: "var(--grad)", boxShadow: "var(--shadow-brand)" }}>
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
          {symbol ?? toAr(val)}
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
  status: "مفتوح الآن · طاولة ١",
  cats: ["الأطباق", "المشروبات", "الحلويات"],
  cartLabel: "سلّتك · صنفان",
  cartTotal: "١١٬٠٠٠",
  items: [
    { name: "طبق اليوم", desc: "طازج · من مطبخنا", price: "٨٬٠٠٠", emoji: "🍽️", tile: "linear-gradient(135deg,#cdeee8,#7fc9bd)" },
    { name: "مشروب المنزل", desc: "بارد · منعش", price: "٣٬٠٠٠", emoji: "🥤", tile: "linear-gradient(135deg,#cfeef0,#7cc6d6)" },
    { name: "حلى خاص", desc: "صنع اليوم", price: "٤٬٥٠٠", emoji: "🍰", tile: "linear-gradient(135deg,#d9eede,#8fc79f)" },
  ],
};

export function TenantSwitcher() {
  const [accent, setAccent] = useState(SWATCHES[0].c);
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div className="text-right">
        <p className="text-[13px] font-black tracking-wide" style={{ color: "var(--brand-deep)" }}>هوية لكل مطعم</p>
        <h2 className="mt-3 text-[clamp(1.9rem,3.6vw,3rem)] font-black leading-tight" style={{ color: "var(--ink)" }}>
          لونك، شعارك، منيوك — <span className="brand-text">نطاقك الخاص</span>
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
                  boxShadow: active ? "0 0 0 2px #fff, 0 0 0 4px var(--brand), 0 8px 18px -6px rgba(0,0,0,.25)" : "0 4px 10px -4px rgba(0,0,0,.25)",
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
      className="relative mx-auto max-w-3xl overflow-hidden rounded-[28px] p-6 sm:p-8"
      style={{ background: "#fff", border: "1px solid var(--line)", boxShadow: "var(--shadow-lg)" }}
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
            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-2xl" style={{ background: "linear-gradient(135deg,#d3f0ea,#8fd0c5)" }}>
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
