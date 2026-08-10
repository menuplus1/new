import { Nav, Reveal, Stat, TenantSwitcher, LiveMenuBoard, Faq } from "@/components/landing/islands";
import { MenuPreview, type PreviewData } from "@/components/landing/MenuPreview";

export const dynamic = "force-dynamic";

const HERO: PreviewData = {
  name: "مطعمك",
  logo: "✦",
  status: "مفتوح الآن · طاولة 7",
  cats: ["الأطباق", "المشروبات", "الحلويات"],
  cartLabel: "سلّتك · صنفان",
  cartTotal: "15,500",
  items: [
    { name: "سلطة الكينوا", desc: "أفوكادو · رمان · جوز", price: "6,000", emoji: "🥗", tile: "linear-gradient(135deg,#cdeee8,#7fc9bd)" },
    { name: "برجر أنغوس", desc: "جبن شيدر · بطاطا مقرمشة", price: "9,500", emoji: "🍔", tile: "linear-gradient(135deg,#d7efe6,#86c9b4)" },
    { name: "عصير مانجو طازج", desc: "بدون سكر مضاف", price: "4,000", emoji: "🥤", tile: "linear-gradient(135deg,#cfeef0,#7cc6d6)" },
  ],
};

/* stylized, deterministic QR (decorative, image-free) */
function Qr({ px = 112 }: { px?: number }) {
  const N = 13;
  const cell = px / N;
  const corners: [number, number][] = [
    [0, 0],
    [0, N - 5],
    [N - 5, 0],
  ];
  const inFinder = (r: number, c: number) => corners.some(([r0, c0]) => r >= r0 && r < r0 + 5 && c >= c0 && c < c0 + 5);
  const finderDark = (r: number, c: number) => {
    for (const [r0, c0] of corners) {
      if (r >= r0 && r < r0 + 5 && c >= c0 && c < c0 + 5) {
        const rr = r - r0;
        const cc = c - c0;
        return rr === 0 || rr === 4 || cc === 0 || cc === 4 || (rr === 2 && cc === 2);
      }
    }
    return false;
  };
  const dark = (r: number, c: number) => (inFinder(r, c) ? finderDark(r, c) : (r * 7 + c * 5 + ((r ^ c) * 3)) % 3 === 0);
  const rects = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (dark(r, c)) rects.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell * 0.9} height={cell * 0.9} rx={cell * 0.22} fill="#0c2a29" />);
    }
  }
  return (
    <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} aria-hidden>
      {rects}
    </svg>
  );
}

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-8" style={{ background: "var(--brand)" }} />
      <span className="text-[13px] font-black tracking-[0.15em]" style={{ color: light ? "var(--brand-bright)" : "var(--brand-deep)" }}>
        {children}
      </span>
    </div>
  );
}

const MARQUEE = ["منيو QR بالصور", "طلب من الطاولة", "تحديث فوري للأسعار", "ثنائي اللغة", "تطبيق PWA أوفلاين", "لوحة طلبات مباشرة", "ثيمات وألوان", "نطاق خاص لكل مطعم", "QR + NFC للطاولات", "تقارير مبيعات"];

const CORE = [
  ["⚡", "تحديث الأسعار فوراً", "غيّر صنفاً أو سعراً من لوحتك فيظهر للزبائن في اللحظة نفسها."],
  ["📱", "طلب بدون تطبيق", "يعمل على أي هاتف من المتصفّح — لا تحميل ولا حسابات."],
  ["🏛️", "فرعٌ واحد أو سلسلة", "كل مطعم وكل فرع بمنيوه وطاولاته وطلباته المستقلة."],
];

const STEPS = [
  ["نُهيّئ منيو خاص بك بعلامتك", "نُدخل أصنافك وصورك بلونك وشعارك ونطاقك الخاص."],
  ["نولّد QR لكل طاولة", "رموز جاهزة للطباعة، وستيكرات NFC اختيارية للطاولات."],
  ["الزبون يطلب فيصل مطبخك", "الطلبات تصل لوحتك مرتّبةً من الطاولة إلى المطبخ."],
];

const PLANS = [
  { name: "تجربة", price: "مجاناً", unit: "لأول شهر", feats: ["منيو QR كامل", "قسم واحد", "لوحة تحكّم", "رموز QR للطاولات"], cta: "ابدأ التجربة", featured: false },
  { name: "المطعم", price: "25,000", unit: "د.ع / شهرياً", feats: ["أصناف وأقسام بلا حدود", "هوية وألوان ونطاق خاص", "استقبال ومتابعة الطلبات", "منيو التابلت (PWA)", "منيو ثنائي اللغة"], cta: "ابدأ الآن", featured: true },
  { name: "السلسلة", price: "عند الطلب", unit: "لعدّة فروع", feats: ["كل مزايا «المطعم»", "فروع متعددة", "لوحة موحّدة", "دعم مخصّص"], cta: "تواصل معنا", featured: false },
];

const ORDERS = [
  { col: "جديد", dot: "#06b6d4", cards: [["طاولة 7", "برجر أنغوس · عصير مانجو", "الآن"], ["طاولة 2", "قهوة عربية ×2", "1 د"]] },
  { col: "قيد التحضير", dot: "#f59e0b", cards: [["طاولة 4", "مشاوي مشكّلة", "5 د"]] },
  { col: "جاهز", dot: "#10b3a3", cards: [["طاولة 9", "سلطة كينوا · فتوش", "8 د"]] },
];

export default function Landing() {
  return (
    <main id="top" dir="rtl">
      <Nav />

      {/* ————————————————————— HERO ————————————————————— */}
      <section className="relative overflow-hidden" style={{ background: "var(--bg)" }}>
        <div aria-hidden className="drift pointer-events-none absolute -right-24 -top-24 h-[540px] w-[540px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(45,212,191,.38), transparent 65%)" }} />
        <div aria-hidden className="drift-2 pointer-events-none absolute -left-32 top-24 h-[480px] w-[480px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(6,182,212,.30), transparent 65%)" }} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(16,179,163,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,179,163,.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(75% 60% at 50% 25%, #000 0%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(75% 60% at 50% 25%, #000 0%, transparent 78%)",
          }}
        />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 pb-24 pt-36 lg:grid-cols-[1.05fr_.95fr] lg:pt-40">
          <div className="text-right">
            <div className="rise" style={{ animationDelay: "40ms" }}>
              <Eyebrow>منصّة المنيو الرقمي · للمطاعم والمقاهي</Eyebrow>
            </div>

            <h1 className="rise mt-6 text-[clamp(2.5rem,5.6vw,4.5rem)] font-black leading-[1.12]" style={{ animationDelay: "130ms", color: "var(--ink)" }}>
              حوّل قائمتك إلى <span className="brand-text">منيو رقميّ</span> يليق بمطعمك
            </h1>

            <p className="rise mt-6 max-w-xl text-[clamp(1rem,1.4vw,1.18rem)] leading-[1.95]" style={{ animationDelay: "220ms", color: "var(--ink-soft)" }}>
              منيو أنيق بضغطة QR على كل طاولة — بلونك وشعارك ونطاقك الخاص. حدّث الأسعار لحظياً، استقبل الطلبات، وأطلق خلال دقائق. بدون تطبيق، ويعمل أونلاين وأوفلاين.
            </p>

            <div className="rise mt-9 flex flex-wrap items-center gap-4" style={{ animationDelay: "310ms" }}>
              <a href="#pricing" className="shimmer inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-bold text-white" style={{ background: "var(--grad)", boxShadow: "var(--shadow-brand)" }}>
                <span>ابدأ مجاناً</span>
                <span aria-hidden style={{ transform: "scaleX(-1)" }}>➜</span>
              </a>
              <a href="#menu" className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-[15px] font-bold" style={{ color: "var(--brand-deep)", border: "1px solid var(--line)", background: "#fff" }}>
                شاهد عرضاً حيّاً
              </a>
            </div>

            <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "380ms" }}>
              <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>ادخل مطعماً حقيقياً:</span>
              <a href="/dallah" className="lift inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold" style={{ color: "var(--ink)", border: "1px solid var(--line)", background: "#fff" }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#d18b4a" }} /> قهوة الدلّة <span style={{ color: "var(--ink-soft)" }}>/dallah</span>
              </a>
              <a href="/sham" className="lift inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold" style={{ color: "var(--ink)", border: "1px solid var(--line)", background: "#fff" }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#2f9e7a" }} /> بيت الشام <span style={{ color: "var(--ink-soft)" }}>/sham</span>
              </a>
            </div>

            <div className="rise mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-[13px]" style={{ animationDelay: "450ms", color: "var(--ink-soft)" }}>
              <span className="inline-flex items-center gap-2"><span style={{ color: "var(--brand)" }}>✦</span> بدون تحميل تطبيق</span>
              <span className="inline-flex items-center gap-2"><span style={{ color: "var(--brand)" }}>✦</span> نطاق خاص لمطعمك</span>
              <span className="inline-flex items-center gap-2"><span style={{ color: "var(--brand)" }}>✦</span> جاهز خلال دقائق</span>
            </div>
          </div>

          {/* self-rendered phone centerpiece */}
          <div className="rise relative mx-auto" style={{ animationDelay: "300ms" }}>
            <div aria-hidden className="spin-slow absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70" style={{ background: "conic-gradient(from 0deg, transparent, rgba(20,184,166,.35), transparent 38%, rgba(6,182,212,.35), transparent 72%)", filter: "blur(10px)" }} />
            <div className="floaty relative mx-auto w-[min(300px,82vw)]">
              <MenuPreview accent="#10b3a3" data={HERO} />

              <div className="floaty-slow absolute -left-6 top-16 rounded-2xl p-3" style={{ background: "#fff", border: "1px solid var(--line)", boxShadow: "var(--shadow-lg)" }}>
                <Qr px={52} />
                <div className="mt-1.5 text-center text-[9px] font-black" style={{ color: "var(--brand-deep)" }}>امسح القائمة</div>
              </div>

              <div className="toast-cycle absolute -right-4 bottom-24 flex items-center gap-2 rounded-full px-4 py-2" style={{ background: "#fff", border: "1px solid var(--line)", boxShadow: "var(--shadow-lg)" }}>
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--brand)", boxShadow: "0 0 8px var(--brand)" }} />
                <span className="text-[12px] font-bold" style={{ color: "var(--ink)" }}>طلب جديد · طاولة 7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ————————————————————— CAPABILITY MARQUEE ————————————————————— */}
      <section className="overflow-hidden border-y py-4" style={{ background: "var(--deep)", borderColor: "rgba(255,255,255,.06)" }}>
        <div className="flex w-max marquee gap-3">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold" style={{ color: "#c9fbf4", background: "rgba(45,212,191,.1)", border: "1px solid rgba(45,212,191,.2)" }}>
              <span style={{ color: "var(--brand-bright)" }}>✦</span> {t}
            </span>
          ))}
        </div>
      </section>

      {/* ————————————————————— STATS ————————————————————— */}
      <section className="relative" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <Reveal delay={0}><Stat symbol="∞" label="أصناف وأقسام" /></Reveal>
            <Reveal delay={80}><Stat to={2} label="لغة · عربي/إنجليزي" /></Reveal>
            <Reveal delay={160}><Stat to={100} suffix="%" label="من المتصفّح — بلا تطبيق" /></Reveal>
            <Reveal delay={240}><Stat symbol="24/7" label="متاح دائماً" /></Reveal>
          </div>
        </div>
      </section>

      {/* ————————————————————— TENANTS + LIVE SWITCHER ————————————————————— */}
      <section id="tenants" className="relative" style={{ background: "var(--band)" }}>
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal>
            <TenantSwitcher />
          </Reveal>
        </div>
      </section>

      {/* ————————————————————— LIVE MENU BOARD ————————————————————— */}
      <section id="menu" className="relative" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>قائمة تُشهّي</Eyebrow></div>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-black leading-tight" style={{ color: "var(--ink)" }}>
              منيو حيّ بالصور — <span className="brand-text">يتصفّحه زبونك بلمسة</span>
            </h2>
            <p className="mt-4 text-[15px] leading-8" style={{ color: "var(--ink-soft)" }}>
              أقسام أنيقة، صور شهيّة، وأسعار واضحة. بدّل بين الأقسام وشاهد كيف تبدو القائمة لزبائنك.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <LiveMenuBoard />
          </Reveal>
        </div>
      </section>

      {/* ————————————————————— FEATURES (bento) ————————————————————— */}
      <section id="features" className="relative" style={{ background: "var(--band)" }}>
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>كل ما تحتاجه</Eyebrow></div>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-black leading-tight" style={{ color: "var(--ink)" }}>
              منصّة كاملة <span className="brand-text">لإدارة منيو مطعمك</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
            {/* big feature */}
            <Reveal className="md:col-span-3 md:row-span-2">
              <div className="lift flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-white p-7" style={{ border: "1px solid var(--line)", boxShadow: "var(--shadow-md)" }}>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-black" style={{ background: "var(--brand-soft)", color: "var(--brand-deep)" }}>الأساس</div>
                  <h3 className="mt-4 text-2xl font-black" style={{ color: "var(--ink)" }}>منيو QR بالصور</h3>
                  <p className="mt-2 max-w-sm text-[14px] leading-7" style={{ color: "var(--ink-soft)" }}>
                    قائمة تفاعلية بالصور والأقسام والأسعار — يمسح الزبون الرمز فتفتح فوراً برقم طاولته.
                  </p>
                </div>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div className="rounded-2xl bg-white p-3" style={{ border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
                    <Qr px={92} />
                  </div>
                  <div className="flex-1 space-y-2">
                    {["قهوة عربية", "برجر أنغوس", "سلطة كينوا"].map((n, i) => (
                      <div key={n} className="flex items-center justify-between rounded-xl px-3 py-2 text-[12px]" style={{ background: "var(--band)", border: "1px solid var(--line)" }}>
                        <span className="font-bold" style={{ color: "var(--ink)" }}>{n}</span>
                        <span className="brand-text font-black">{["3,500", "9,500", "6,000"][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* themes */}
            <Reveal delay={80} className="md:col-span-3">
              <div className="lift h-full rounded-3xl bg-white p-7" style={{ border: "1px solid var(--line)", boxShadow: "var(--shadow-md)" }}>
                <h3 className="text-xl font-black" style={{ color: "var(--ink)" }}>ثيمات وألوان لكل علامة</h3>
                <p className="mt-2 text-[14px] leading-7" style={{ color: "var(--ink-soft)" }}>لون وشعار ونطاق خاص — منيو خاص بك يشبه مطعمك لا منصّتنا.</p>
                <div className="mt-5 flex gap-3">
                  {["#10b3a3", "#d18b4a", "#2f9e7a", "#3b5bdb", "#9c3b52"].map((c) => (
                    <span key={c} className="h-9 w-9 rounded-full" style={{ background: c, boxShadow: "0 6px 14px -6px rgba(0,0,0,.25)" }} />
                  ))}
                </div>
              </div>
            </Reveal>

            {/* bilingual */}
            <Reveal delay={160} className="md:col-span-3">
              <div className="lift h-full rounded-3xl bg-white p-7" style={{ border: "1px solid var(--line)", boxShadow: "var(--shadow-md)" }}>
                <h3 className="text-xl font-black" style={{ color: "var(--ink)" }}>منيو ثنائي اللغة</h3>
                <p className="mt-2 text-[14px] leading-7" style={{ color: "var(--ink-soft)" }}>اعرض قائمتك بالعربية والإنجليزية بلمسة واحدة.</p>
                <div className="mt-5 inline-flex rounded-full p-1" style={{ background: "var(--band-2)" }}>
                  <span className="rounded-full px-4 py-1.5 text-[13px] font-black text-white" style={{ background: "var(--grad)" }}>عربي</span>
                  <span className="rounded-full px-4 py-1.5 text-[13px] font-black" style={{ color: "var(--ink-soft)" }}>EN</span>
                </div>
              </div>
            </Reveal>

            {/* three small */}
            {CORE.map(([icon, title, desc], i) => (
              <Reveal key={title} delay={i * 80} className="md:col-span-2">
                <div className="lift h-full rounded-3xl bg-white p-6" style={{ border: "1px solid var(--line)", boxShadow: "var(--shadow-md)" }}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl" style={{ background: "var(--brand-soft)" }}>{icon}</div>
                  <h3 className="mt-4 text-[16px] font-black" style={{ color: "var(--ink)" }}>{title}</h3>
                  <p className="mt-2 text-[13px] leading-6" style={{ color: "var(--ink-soft)" }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ————————————————————— TABLET / PWA ————————————————————— */}
      <section className="relative" style={{ background: "var(--bg)" }}>
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 sm:py-28 lg:grid-cols-2">
          <Reveal className="text-right">
            <Eyebrow>تجربة على التابلت</Eyebrow>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-black leading-tight" style={{ color: "var(--ink)" }}>
              منيو خاص بك <span className="brand-text">على شاشة الطاولة</span>
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-8" style={{ color: "var(--ink-soft)" }}>
              تطبيق ويب سريع (PWA) بتجربة أنيقة تناسب التابلت، وتعكس هوية مطعمك على كل طاولة.
            </p>
            <ul className="mt-7 space-y-4">
              {["يعمل أونلاين وأوفلاين", "تطبيق ويب سريع بدون تحميل من المتاجر", "قوالب جاهزة تناسب شاشة التابلت", "تحديث لحظي لكل تغيير في المنيو"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[13px] text-white" style={{ background: "var(--grad)" }}>✓</span>
                  <span className="text-[15px] font-bold" style={{ color: "var(--ink)" }}>{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120} className="flex justify-center">
            <div className="floaty w-full max-w-lg">
              <MenuPreview accent="#2f9e7a" data={{ ...HERO, name: "مطعم بيت الشام", logo: "🍽️", cats: ["مقبلات", "مشاوي", "أطباق", "حلويات"] }} wide />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ————————————————————— ORDERS DASHBOARD (deep band) ————————————————————— */}
      <section className="relative overflow-hidden" style={{ background: "radial-gradient(120% 90% at 50% -10%, var(--deep-2), var(--deep) 60%, #041b1a)" }}>
        <div aria-hidden className="glow-pulse pointer-events-none absolute left-1/2 top-0 h-[360px] w-[360px] -translate-x-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--glow), transparent 68%)" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow light>إدارة الطلبات</Eyebrow></div>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-black leading-tight" style={{ color: "#eafffb" }}>
              كل طلبٍ <span className="brand-text">تحت السيطرة</span> — من الطاولة إلى المطبخ
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="mx-auto max-w-4xl rounded-[26px] p-5 sm:p-7" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(45,212,191,.2)", boxShadow: "0 40px 80px -40px rgba(0,0,0,.6)" }}>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: "#a7d8d2" }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--brand-bright)", boxShadow: "0 0 8px var(--brand-bright)" }} /> لوحة الطلبات · مباشر
                </div>
                <span className="rounded-full px-3 py-1 text-[12px] font-black" style={{ background: "rgba(45,212,191,.16)", color: "#c9fbf4" }}>3 طلبات جديدة</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {ORDERS.map((c) => (
                  <div key={c.col} className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(45,212,191,.12)" }}>
                    <div className="mb-3 flex items-center gap-2 px-1 text-[13px] font-black" style={{ color: "#eafffb" }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: c.dot }} /> {c.col}
                    </div>
                    <div className="space-y-2.5">
                      {c.cards.map(([t, items, time]) => (
                        <div key={t} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(45,212,191,.12)" }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-black" style={{ color: "#eafffb" }}>{t}</span>
                            <span className="text-[11px] tabular-nums" style={{ color: "#87b8b2" }}>{time}</span>
                          </div>
                          <div className="mt-1 text-[12px]" style={{ color: "#a7d8d2" }}>{items}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ————————————————————— HOW IT WORKS ————————————————————— */}
      <section className="relative" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>البداية سهلة</Eyebrow></div>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-black leading-tight" style={{ color: "var(--ink)" }}>
              مطعمك جاهز في <span className="brand-text">ثلاث خطوات</span>
            </h2>
          </Reveal>
          <div className="relative grid gap-8 sm:grid-cols-3">
            <div aria-hidden className="absolute right-[16%] left-[16%] top-9 hidden h-px sm:block" style={{ background: "linear-gradient(90deg,transparent,var(--brand),transparent)" }} />
            {STEPS.map(([title, desc], i) => (
              <Reveal key={title} delay={i * 120} className="relative text-center">
                <div className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-full text-2xl font-black text-white" style={{ background: "var(--grad)", boxShadow: "var(--shadow-brand)" }}>
                  {["1", "2", "3"][i]}
                </div>
                <h3 className="mt-5 text-[18px] font-black" style={{ color: "var(--ink)" }}>{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-[14px] leading-7" style={{ color: "var(--ink-soft)" }}>{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ————————————————————— PRICING ————————————————————— */}
      <section id="pricing" className="relative" style={{ background: "var(--band)" }}>
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>الباقات</Eyebrow></div>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-black leading-tight" style={{ color: "var(--ink)" }}>
              اشتراك واحد، <span className="brand-text">تحكّم كامل</span>
            </h2>
            <p className="mt-4 text-[15px]" style={{ color: "var(--ink-soft)" }}>ابدأ مجاناً — بدون بطاقة ائتمانية.</p>
          </Reveal>

          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {PLANS.map((p, i) => (
              <Reveal key={p.name} delay={i * 90} className={p.featured ? "lg:-mt-3" : ""}>
                <div
                  className="lift flex h-full flex-col rounded-[26px] p-7"
                  style={
                    p.featured
                      ? { background: "#fff", border: "2px solid var(--brand)", boxShadow: "0 40px 80px -34px rgba(16,179,163,.5)" }
                      : { background: "#fff", border: "1px solid var(--line)", boxShadow: "var(--shadow-md)" }
                  }
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black" style={{ color: "var(--ink)" }}>{p.name}</h3>
                    {p.featured && <span className="rounded-full px-3 py-1 text-[11px] font-black text-white" style={{ background: "var(--grad)" }}>الأكثر طلباً</span>}
                  </div>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-4xl font-black">
                      <span className={p.price.match(/[0-9]/) ? "brand-text" : ""} style={p.price.match(/[0-9]/) ? {} : { color: "var(--ink)" }}>{p.price}</span>
                    </span>
                    <span className="pb-1 text-[13px]" style={{ color: "var(--ink-soft)" }}>{p.unit}</span>
                  </div>
                  <div className="my-6 rule" />
                  <ul className="flex-1 space-y-3">
                    {p.feats.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-[14px]" style={{ color: "var(--ink)" }}>
                        <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] text-white" style={{ background: "var(--grad)" }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#top"
                    className={`mt-7 rounded-full py-3.5 text-center text-[15px] font-bold ${p.featured ? "shimmer text-white" : ""}`}
                    style={p.featured ? { background: "var(--grad)", boxShadow: "var(--shadow-brand)" } : { color: "var(--brand-deep)", border: "1px solid var(--brand)" }}
                  >
                    {p.cta}
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ————————————————————— FAQ ————————————————————— */}
      <section id="faq" className="relative" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>أسئلة شائعة</Eyebrow></div>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-black leading-tight" style={{ color: "var(--ink)" }}>
              كل ما قد <span className="brand-text">تسأل عنه</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <Faq />
          </Reveal>
        </div>
      </section>

      {/* ————————————————————— FINAL CTA (deep band) ————————————————————— */}
      <section className="relative overflow-hidden" style={{ background: "radial-gradient(120% 90% at 50% -10%, var(--deep-2), var(--deep) 60%, #041b1a)" }}>
        <div aria-hidden className="glow-pulse pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--glow), transparent 68%)" }} />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <Reveal>
            <h2 className="text-[clamp(2rem,4.6vw,3.4rem)] font-black leading-tight" style={{ color: "#eafffb" }}>
              جهّز <span className="brand-text">منيو مطعمك الرقمي</span> اليوم
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[16px] leading-8" style={{ color: "#a7d8d2" }}>
              انضم إلى المطاعم التي تمنح زبائنها تجربةً أرقى — قائمة أنيقة، طلبٌ أسهل، وإدارةٌ أوضح.
            </p>
            <a href="#pricing" className="shimmer mt-9 inline-flex items-center gap-2 rounded-full px-9 py-4 text-[16px] font-bold text-white" style={{ background: "var(--grad)", boxShadow: "var(--shadow-brand)" }}>
              ابدأ مجاناً الآن <span aria-hidden style={{ transform: "scaleX(-1)" }}>➜</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ————————————————————— FOOTER ————————————————————— */}
      <footer style={{ background: "#041b1a" }}>
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[11px]" style={{ background: "var(--grad)" }}>
                  <span className="text-base font-black text-white">س</span>
                </span>
                <span className="text-2xl font-black" style={{ color: "#eafffb" }}>سُفرة</span>
              </div>
              <p className="mt-4 max-w-xs text-[13px] leading-7" style={{ color: "#7fb0aa" }}>
                منصّة المنيو الرقمي للمطاعم والمقاهي — قائمة QR أنيقة، بلونك ونطاقك الخاص.
              </p>
            </div>
            {[
              ["المنصّة", ["المميزات", "الباقات", "منيو التابلت", "الأسئلة"]],
              ["المطاعم", ["قهوة الدلّة", "بيت الشام", "أنشئ مطعمك", "تسجيل الدخول"]],
              ["تواصل معنا", ["الدعم", "واتساب", "بغداد — العراق"]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <h4 className="text-[14px] font-black" style={{ color: "var(--brand-bright)" }}>{title}</h4>
                <ul className="mt-4 space-y-3">
                  {(links as string[]).map((l) => (
                    <li key={l}><span className="text-[13px]" style={{ color: "#7fb0aa" }}>{l}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="my-8 rule" />
          <div className="flex flex-col items-center justify-between gap-3 text-[12px] sm:flex-row" style={{ color: "#6b9c96" }}>
            <span>© منصّة سُفرة — جميع الحقوق محفوظة</span>
            <span className="inline-flex items-center gap-2"><span style={{ color: "var(--brand)" }}>◆</span> صُنع بعنايةٍ للمطاعم العراقية</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
