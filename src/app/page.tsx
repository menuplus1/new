import { Nav, Reveal, TenantSwitcher, LiveMenuBoard, Faq } from "@/components/landing/islands";
import { MenuPreview, DALLAH } from "@/components/landing/MenuPreview";

export const dynamic = "force-dynamic";

const GOLD = "linear-gradient(115deg,#f7e7b6 0%,#d8b062 30%,#c99f4e 60%,#e7cd8b 100%)";
const ESPRESSO_BG = "radial-gradient(120% 90% at 50% -8%, #2a1f16 0%, #1c150f 46%, #120d09 100%)";

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
      if (dark(r, c)) {
        rects.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell * 0.9} height={cell * 0.9} rx={cell * 0.22} fill="#20160b" />);
      }
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
      <span className="h-px w-8" style={{ background: "#c9a24b" }} />
      <span className="text-[13px] font-semibold tracking-[0.15em]" style={{ color: light ? "#efe0b7" : "#8a6320" }}>
        {children}
      </span>
    </div>
  );
}

const FEATURES = [
  ["🔖", "QR على كل طاولة", "امسح الرمز أو افتح الرابط — القائمة تفتح فوراً برقم الطاولة."],
  ["⚡", "تحديث الأسعار فوراً", "غيّر صنفاً أو سعراً من لوحتك فيظهر للزبائن في اللحظة نفسها."],
  ["📱", "طلب بدون تطبيق", "يعمل على أي هاتف من المتصفّح — لا تحميل ولا حسابات."],
  ["🏛️", "فرعٌ واحد أو سلسلة", "كل مطعم وكل فرع بمنيوه وطاولاته وطلباته المستقلة."],
];

const STEPS = [
  ["نُهيّئ منيوك بعلامتك", "نُدخل أصنافك وصورك بلونك وشعارك ونطاقك الخاص."],
  ["نولّد QR لكل طاولة", "رموز جاهزة للطباعة، وستيكرات NFC اختيارية للطاولات."],
  ["الزبون يطلب فيصل مطبخك", "الطلبات تصل لوحتك مرتّبةً من الطاولة إلى المطبخ."],
];

const PLANS = [
  { name: "تجربة", price: "مجاناً", unit: "لأول شهر", feats: ["منيو QR كامل", "قسم واحد", "لوحة تحكّم", "رموز QR للطاولات"], cta: "ابدأ التجربة", featured: false },
  { name: "المطعم", price: "٢٥٬٠٠٠", unit: "د.ع / شهرياً", feats: ["أصناف وأقسام بلا حدود", "هوية وألوان ونطاق خاص", "استقبال ومتابعة الطلبات", "منيو التابلت (PWA)", "منيو ثنائي اللغة"], cta: "ابدأ الآن", featured: true },
  { name: "السلسلة", price: "عند الطلب", unit: "لعدّة فروع", feats: ["كل مزايا «المطعم»", "فروع متعددة", "لوحة موحّدة", "دعم مخصّص"], cta: "تواصل معنا", featured: false },
];

const ORDERS = [
  { col: "جديد", dot: "#d8b062", cards: [["طاولة ٧", "لاتيه بالزعفران · كنافة", "الآن"], ["طاولة ٢", "قهوة عربية ×٢", "١ د"]] },
  { col: "قيد التحضير", dot: "#e08a3c", cards: [["طاولة ٤", "مشاوي مشكّلة", "٥ د"]] },
  { col: "جاهز", dot: "#2aa87a", cards: [["طاولة ٩", "تبولة · فتوش", "٨ د"]] },
];

export default function Landing() {
  return (
    <main id="top" dir="rtl" style={{ fontFamily: "var(--font-arabic), system-ui, sans-serif" }}>
      <Nav />

      {/* ————————————————————— HERO ————————————————————— */}
      <section className="relative overflow-hidden" style={{ background: ESPRESSO_BG }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(201,162,75,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,75,.05) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(70% 60% at 50% 20%, #000 0%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(70% 60% at 50% 20%, #000 0%, transparent 75%)",
          }}
        />
        <div
          aria-hidden
          className="sufra-breathe pointer-events-none absolute left-1/2 top-[-12%] h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(216,176,98,.26), rgba(216,176,98,0) 68%)" }}
        />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 pb-24 pt-36 lg:grid-cols-[1.05fr_.95fr] lg:pt-40">
          {/* copy */}
          <div className="text-right">
            <div className="sufra-in" style={{ animationDelay: "40ms" }}>
              <Eyebrow light>منصّة المنيو الرقمي · للمطاعم والمقاهي</Eyebrow>
            </div>

            <h1 className="font-display sufra-in mt-6 text-[clamp(2.5rem,5.6vw,4.5rem)] font-bold leading-[1.15]" style={{ animationDelay: "130ms", color: "#f6efe2" }}>
              حوّل قائمتك إلى <span className="foil">سُفرةٍ رقمية</span> تليق بمطعمك
            </h1>

            <p className="sufra-in mt-6 max-w-xl text-[clamp(1rem,1.4vw,1.18rem)] leading-[1.95]" style={{ animationDelay: "220ms", color: "rgba(246,239,226,.68)" }}>
              منيو أنيق بضغطة QR على كل طاولة — بلونك وشعارك ونطاقك الخاص. حدّث الأسعار لحظياً، استقبل الطلبات، وأطلق خلال دقائق. بدون تطبيق، ويعمل أونلاين وأوفلاين.
            </p>

            <div className="sufra-in mt-9 flex flex-wrap items-center gap-4" style={{ animationDelay: "310ms" }}>
              <a href="#pricing" className="shimmer inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold" style={{ color: "#20160b", background: GOLD, boxShadow: "0 10px 30px rgba(201,162,75,.32), inset 0 1px 0 rgba(255,255,255,.45)" }}>
                <span>ابدأ سُفرتك مجاناً</span>
                <span aria-hidden style={{ transform: "scaleX(-1)" }}>➜</span>
              </a>
              <a href="#menu" className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-[15px] font-medium" style={{ color: "#f0e6d4", border: "1px solid rgba(201,162,75,.4)", background: "rgba(255,255,255,.02)" }}>
                شاهد عرضاً حيّاً
              </a>
            </div>

            {/* live tenant chips */}
            <div className="sufra-in mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "380ms" }}>
              <span className="text-[13px]" style={{ color: "rgba(246,239,226,.5)" }}>ادخل مطعماً حقيقياً:</span>
              <a href="/dallah" className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-transform hover:-translate-y-0.5" style={{ color: "#f0e6d4", border: "1px solid rgba(209,139,74,.5)", background: "rgba(209,139,74,.12)" }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#d18b4a" }} />
                قهوة الدلّة <span style={{ color: "rgba(246,239,226,.45)" }}>/dallah</span>
              </a>
              <a href="/sham" className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-transform hover:-translate-y-0.5" style={{ color: "#f0e6d4", border: "1px solid rgba(47,158,122,.5)", background: "rgba(47,158,122,.12)" }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#2f9e7a" }} />
                بيت الشام <span style={{ color: "rgba(246,239,226,.45)" }}>/sham</span>
              </a>
            </div>

            {/* trust row (product-true, not fabricated stats) */}
            <div className="sufra-in mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-[13px]" style={{ animationDelay: "450ms", color: "rgba(246,239,226,.5)" }}>
              <span className="inline-flex items-center gap-2"><span style={{ color: "#d8b062" }}>✦</span> بدون تحميل تطبيق</span>
              <span className="inline-flex items-center gap-2"><span style={{ color: "#d8b062" }}>✦</span> نطاق خاص لمطعمك</span>
              <span className="inline-flex items-center gap-2"><span style={{ color: "#d8b062" }}>✦</span> جاهز خلال دقائق</span>
            </div>
          </div>

          {/* self-rendered phone centerpiece */}
          <div className="sufra-in relative mx-auto" style={{ animationDelay: "300ms" }}>
            <div className="sufra-float relative mx-auto w-[300px]">
              <MenuPreview accent="#d18b4a" data={DALLAH} />

              {/* floating gold QR chip */}
              <div className="sufra-float-slow absolute -left-6 top-16 rounded-2xl p-3" style={{ background: "#fbf6ec", border: "1px solid rgba(201,162,75,.5)", boxShadow: "0 18px 40px -12px rgba(0,0,0,.55)" }}>
                <Qr px={52} />
                <div className="mt-1.5 text-center text-[9px] font-semibold" style={{ color: "#8a6320" }}>امسح القائمة</div>
              </div>

              {/* orbiting live-order toast */}
              <div className="sufra-toast absolute -right-4 bottom-24 flex items-center gap-2 rounded-full px-4 py-2" style={{ background: "rgba(23,17,13,.92)", border: "1px solid rgba(201,162,75,.4)", boxShadow: "0 16px 34px -12px rgba(0,0,0,.6)" }}>
                <span className="h-2 w-2 rounded-full" style={{ background: "#2aa87a", boxShadow: "0 0 8px #2aa87a" }} />
                <span className="text-[12px]" style={{ color: "#f0e6d4" }}>طلب جديد · طاولة ٧</span>
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,162,75,.5), transparent)" }} />
      </section>

      {/* ————————————————————— TENANTS + LIVE SWITCHER ————————————————————— */}
      <section id="tenants" className="paper relative" style={{ background: "linear-gradient(180deg,#fbf6ec,#f4ecdd)" }}>
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal>
            <TenantSwitcher />
          </Reveal>
        </div>
      </section>

      {/* ————————————————————— LIVE MENU BOARD ————————————————————— */}
      <section id="menu" className="relative overflow-hidden" style={{ background: "linear-gradient(180deg,#17110d 0%,#1c150f 55%,#2a1f16 100%)" }}>
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow light>قائمة تُشهّي</Eyebrow></div>
            <h2 className="font-display mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-bold leading-tight" style={{ color: "#f6efe2" }}>
              منيو حيّ بالصور — <span className="foil">يتصفّحه زبونك بلمسة</span>
            </h2>
            <p className="mt-4 text-[15px] leading-8" style={{ color: "rgba(246,239,226,.6)" }}>
              أقسام أنيقة، صور شهيّة، وأسعار واضحة. بدّل بين الأقسام وشاهد كيف تبدو القائمة لزبائنك.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <LiveMenuBoard />
          </Reveal>
        </div>
      </section>

      {/* ————————————————————— FEATURES + QR ————————————————————— */}
      <section id="features" className="paper relative" style={{ background: "#fbf6ec" }}>
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>لماذا سُفرة</Eyebrow></div>
            <h2 className="font-display mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-bold leading-tight" style={{ color: "#241b14" }}>
              كل ما يرفع مستوى مطعمك <span className="foil">في مكانٍ واحد</span>
            </h2>
          </Reveal>

          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
            <div className="grid gap-5 sm:grid-cols-2">
              {FEATURES.map(([icon, title, desc], i) => (
                <Reveal key={title} delay={i * 90}>
                  <div className="h-full rounded-3xl bg-white p-6" style={{ border: "1px solid rgba(201,162,75,.22)", boxShadow: "0 1px 2px rgba(42,32,23,.04), 0 18px 40px -30px rgba(42,32,23,.5)" }}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl" style={{ background: "rgba(201,162,75,.12)", border: "1px solid rgba(201,162,75,.35)" }}>
                      {icon}
                    </div>
                    <h3 className="mt-4 text-[17px] font-bold" style={{ color: "#241b14" }}>{title}</h3>
                    <p className="mt-2 text-[14px] leading-7" style={{ color: "#6f5f4d" }}>{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* self-rendered QR table-tent */}
            <Reveal delay={120} className="flex justify-center">
              <div className="relative">
                <div className="relative rounded-[26px] px-8 pb-8 pt-9 text-center" style={{ background: "linear-gradient(160deg,#fffdf8,#f2e7d3)", border: "1px solid rgba(201,162,75,.35)", boxShadow: "0 40px 70px -34px rgba(42,32,23,.5)" }}>
                  <div className="font-display text-lg font-bold" style={{ color: "#241b14" }}>امسح · تصفّح · اطلب</div>
                  <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-4" style={{ border: "1px solid rgba(201,162,75,.3)", boxShadow: "0 10px 24px -14px rgba(42,32,23,.4)" }}>
                    <Qr px={132} />
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-semibold" style={{ background: "rgba(201,162,75,.14)", color: "#8a6320" }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#2aa87a" }} /> طاولة رقم ٧
                  </div>
                </div>
                <div aria-hidden className="absolute -bottom-3 left-1/2 h-6 w-3/4 -translate-x-1/2 rounded-full blur-md" style={{ background: "rgba(42,32,23,.25)" }} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ————————————————————— TABLET / PWA ————————————————————— */}
      <section className="relative overflow-hidden" style={{ background: ESPRESSO_BG }}>
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 sm:py-28 lg:grid-cols-2">
          <Reveal className="text-right">
            <Eyebrow light>تجربة على التابلت</Eyebrow>
            <h2 className="font-display mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-bold leading-tight" style={{ color: "#f6efe2" }}>
              منيو خاص بك <span className="foil">على شاشة الطاولة</span>
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-8" style={{ color: "rgba(246,239,226,.62)" }}>
              تطبيق ويب سريع (PWA) بتجربة فاخرة تناسب التابلت، وتعكس هوية مطعمك على كل طاولة.
            </p>
            <ul className="mt-7 space-y-4">
              {["يعمل أونلاين وأوفلاين", "تطبيق ويب سريع بدون تحميل من المتاجر", "قوالب جاهزة تناسب شاشة التابلت", "تحديث لحظي لكل تغيير في المنيو"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[13px]" style={{ background: "linear-gradient(140deg,#e7cd8b,#9c6f2b)", color: "#20160b" }}>✓</span>
                  <span className="text-[15px]" style={{ color: "#f0e6d4" }}>{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120} className="flex justify-center">
            <div className="sufra-float w-full max-w-lg">
              <MenuPreview accent="#2f9e7a" data={{ ...DALLAH, name: "مطعم بيت الشام", logo: "🍽️", cats: ["مقبلات", "مشاوي", "أطباق", "حلويات"] }} wide />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ————————————————————— ORDERS DASHBOARD ————————————————————— */}
      <section className="paper relative" style={{ background: "linear-gradient(180deg,#f4ecdd,#fbf6ec)" }}>
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>إدارة الطلبات</Eyebrow></div>
            <h2 className="font-display mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-bold leading-tight" style={{ color: "#241b14" }}>
              كل طلبٍ <span className="foil">تحت السيطرة</span> — من الطاولة إلى المطبخ
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="mx-auto max-w-4xl rounded-[26px] p-5 sm:p-7" style={{ background: "linear-gradient(160deg,#1c150f,#120d09)", border: "1px solid rgba(201,162,75,.25)", boxShadow: "0 40px 80px -40px rgba(0,0,0,.7)" }}>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px]" style={{ color: "rgba(246,239,226,.6)" }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: "#2aa87a", boxShadow: "0 0 8px #2aa87a" }} /> لوحة الطلبات · مباشر
                </div>
                <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: "rgba(216,176,98,.16)", color: "#e7cd8b" }}>٣ طلبات جديدة</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {ORDERS.map((c) => (
                  <div key={c.col} className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(201,162,75,.14)" }}>
                    <div className="mb-3 flex items-center gap-2 px-1 text-[13px] font-semibold" style={{ color: "#f0e6d4" }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: c.dot }} /> {c.col}
                    </div>
                    <div className="space-y-2.5">
                      {c.cards.map(([t, items, time]) => (
                        <div key={t} className="rounded-xl p-3" style={{ background: "rgba(251,246,236,.06)", border: "1px solid rgba(201,162,75,.12)" }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-bold" style={{ color: "#f6efe2" }}>{t}</span>
                            <span className="text-[11px] tabular-nums" style={{ color: "rgba(246,239,226,.5)" }}>{time}</span>
                          </div>
                          <div className="mt-1 text-[12px]" style={{ color: "rgba(246,239,226,.6)" }}>{items}</div>
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
      <section className="relative" style={{ background: "#fbf6ec" }}>
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>البداية سهلة</Eyebrow></div>
            <h2 className="font-display mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-bold leading-tight" style={{ color: "#241b14" }}>
              مطعمك جاهز في <span className="foil">ثلاث خطوات</span>
            </h2>
          </Reveal>
          <div className="relative grid gap-8 sm:grid-cols-3">
            <div aria-hidden className="absolute right-[16%] left-[16%] top-9 hidden h-px sm:block" style={{ background: "linear-gradient(90deg,transparent,rgba(201,162,75,.5),transparent)" }} />
            {STEPS.map(([title, desc], i) => (
              <Reveal key={title} delay={i * 120} className="relative text-center">
                <div className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-full text-2xl font-bold" style={{ background: "#fbf6ec", border: "1px solid rgba(201,162,75,.4)", color: "#8a6320", boxShadow: "0 10px 26px -14px rgba(42,32,23,.4)" }}>
                  <span className="font-display foil">{["١", "٢", "٣"][i]}</span>
                </div>
                <h3 className="mt-5 text-[18px] font-bold" style={{ color: "#241b14" }}>{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-[14px] leading-7" style={{ color: "#6f5f4d" }}>{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ————————————————————— PRICING ————————————————————— */}
      <section id="pricing" className="paper relative" style={{ background: "linear-gradient(180deg,#f4ecdd,#fbf6ec)" }}>
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>الباقات</Eyebrow></div>
            <h2 className="font-display mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-bold leading-tight" style={{ color: "#241b14" }}>
              اشتراك واحد، <span className="foil">تحكّم كامل</span>
            </h2>
            <p className="mt-4 text-[15px]" style={{ color: "#6f5f4d" }}>ابدأ مجاناً — بدون بطاقة ائتمانية.</p>
          </Reveal>

          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {PLANS.map((p, i) => (
              <Reveal key={p.name} delay={i * 90} className={p.featured ? "lg:-mt-3" : ""}>
                <div
                  className="flex h-full flex-col rounded-[26px] p-7"
                  style={
                    p.featured
                      ? { background: "linear-gradient(170deg,#fffdf8,#f7edd8)", border: "1px solid rgba(201,162,75,.6)", boxShadow: "0 40px 80px -34px rgba(138,99,32,.5)" }
                      : { background: "#fffdf8", border: "1px solid rgba(201,162,75,.22)", boxShadow: "0 20px 50px -40px rgba(42,32,23,.5)" }
                  }
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl font-bold" style={{ color: "#241b14" }}>{p.name}</h3>
                    {p.featured && <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: GOLD, color: "#20160b" }}>الأكثر طلباً</span>}
                  </div>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="font-display text-4xl font-bold">
                      <span className={p.price.match(/[٠-٩]/) ? "foil" : ""} style={p.price.match(/[٠-٩]/) ? {} : { color: "#241b14" }}>{p.price}</span>
                    </span>
                    <span className="pb-1 text-[13px]" style={{ color: "#9a8a74" }}>{p.unit}</span>
                  </div>
                  <div className="my-6 brass-rule" />
                  <ul className="flex-1 space-y-3">
                    {p.feats.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-[14px]" style={{ color: "#4a3d30" }}>
                        <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px]" style={{ background: "rgba(201,162,75,.16)", color: "#8a6320" }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#top"
                    className={`mt-7 rounded-full py-3.5 text-center text-[15px] font-semibold ${p.featured ? "shimmer" : ""}`}
                    style={
                      p.featured
                        ? { color: "#20160b", background: GOLD, boxShadow: "0 12px 28px -10px rgba(201,162,75,.5)" }
                        : { color: "#8a6320", background: "transparent", border: "1px solid rgba(201,162,75,.5)" }
                    }
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
      <section id="faq" className="relative" style={{ background: "#fbf6ec" }}>
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>أسئلة شائعة</Eyebrow></div>
            <h2 className="font-display mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-bold leading-tight" style={{ color: "#241b14" }}>
              كل ما قد <span className="foil">تسأل عنه</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <Faq />
          </Reveal>
        </div>
      </section>

      {/* ————————————————————— FINAL CTA ————————————————————— */}
      <section className="relative overflow-hidden" style={{ background: ESPRESSO_BG }}>
        <div aria-hidden className="sufra-breathe pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(216,176,98,.22), rgba(216,176,98,0) 68%)" }} />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <Reveal>
            <h2 className="font-display text-[clamp(2rem,4.6vw,3.4rem)] font-bold leading-tight" style={{ color: "#f6efe2" }}>
              جهّز <span className="foil">سُفرتك الرقمية</span> اليوم
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[16px] leading-8" style={{ color: "rgba(246,239,226,.65)" }}>
              انضم إلى المطاعم التي تمنح زبائنها تجربةً أرقى — قائمة أنيقة، طلبٌ أسهل، وإدارةٌ أوضح.
            </p>
            <a href="#pricing" className="shimmer mt-9 inline-flex items-center gap-2 rounded-full px-9 py-4 text-[16px] font-semibold" style={{ color: "#20160b", background: GOLD, boxShadow: "0 14px 34px -10px rgba(201,162,75,.55), inset 0 1px 0 rgba(255,255,255,.45)" }}>
              ابدأ مجاناً الآن <span aria-hidden style={{ transform: "scaleX(-1)" }}>➜</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ————————————————————— FOOTER ————————————————————— */}
      <footer style={{ background: "#120d09" }}>
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 rotate-45 items-center justify-center rounded-[10px]" style={{ background: "linear-gradient(140deg,#e7cd8b,#9c6f2b)" }}>
                  <span className="-rotate-45 text-sm font-bold" style={{ color: "#20160b" }}>س</span>
                </span>
                <span className="font-display text-2xl font-bold" style={{ color: "#f6efe2" }}>سُفرة</span>
              </div>
              <p className="mt-4 max-w-xs text-[13px] leading-7" style={{ color: "rgba(246,239,226,.5)" }}>
                منصّة المنيو الرقمي للمطاعم والمقاهي — قائمة QR أنيقة، بلونك ونطاقك الخاص.
              </p>
            </div>
            {[
              ["المنصّة", ["المميزات", "الباقات", "منيو التابلت", "الأسئلة"]],
              ["المطاعم", ["قهوة الدلّة", "بيت الشام", "أنشئ مطعمك", "تسجيل الدخول"]],
              ["تواصل معنا", ["الدعم", "واتساب", "بغداد — العراق"]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <h4 className="text-[14px] font-bold" style={{ color: "#e7cd8b" }}>{title}</h4>
                <ul className="mt-4 space-y-3">
                  {(links as string[]).map((l) => (
                    <li key={l}>
                      <span className="text-[13px] transition-colors hover:text-white" style={{ color: "rgba(246,239,226,.55)" }}>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="my-8 brass-rule" />
          <div className="flex flex-col items-center justify-between gap-3 text-[12px] sm:flex-row" style={{ color: "rgba(246,239,226,.4)" }}>
            <span>© منصّة سُفرة — جميع الحقوق محفوظة</span>
            <span className="inline-flex items-center gap-2"><span className="rotate-45" style={{ color: "#c9a24b" }}>◆</span> صُنع بعنايةٍ للمطاعم العراقية</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
