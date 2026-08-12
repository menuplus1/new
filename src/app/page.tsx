import Link from "next/link";
import { Nav, Reveal, Stat, TenantSwitcher, LiveMenuBoard, Faq, ThemeSwitcher, Pricing } from "@/components/landing/islands";
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
      <rect x={0} y={0} width={px} height={px} rx={px * 0.12} fill="#ffffff" />
      <g transform={`translate(${px * 0.08}, ${px * 0.08}) scale(0.84)`}>{rects}</g>
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

const ORDERS = [
  { col: "جديد", dot: "#06b6d4", cards: [["طاولة 7", "برجر أنغوس · عصير مانجو", "الآن"], ["طاولة 2", "قهوة عربية ×2", "1 د"]] },
  { col: "قيد التحضير", dot: "#f59e0b", cards: [["طاولة 4", "مشاوي مشكّلة", "5 د"]] },
  { col: "جاهز", dot: "#10b3a3", cards: [["طاولة 9", "سلطة كينوا · فتوش", "8 د"]] },
];

/* ————— deep-feature mockups (pure CSS, no images) ————— */
const CARD = { background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" };

function StatsMock() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl p-4" style={CARD}>
        <span className="flex h-10 w-10 items-center justify-center rounded-full text-lg" style={{ background: "var(--brand-soft)" }}>👥</span>
        <div className="text-left">
          <div className="text-2xl font-black" style={{ color: "var(--ink)" }}>3,452</div>
          <div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>عدد الزيارات</div>
        </div>
        <span className="rounded-full px-2.5 py-1 text-[12px] font-black" style={{ background: "var(--brand-soft)", color: "var(--brand-deep)" }}>↗ 25%</span>
      </div>
      <div className="rounded-2xl p-4" style={CARD}>
        <div className="mb-3 text-[13px] font-black" style={{ color: "var(--ink)" }}>الأقسام الأعلى زيارة</div>
        {[["المشاوي", "3,532", true], ["المقبلات", "1,532", true], ["المشروبات الساخنة", "532", true], ["الحلويات", "481", false]].map(([n, v, up]) => (
          <div key={n as string} className="flex items-center justify-between border-t py-2 text-[13px]" style={{ borderColor: "var(--line)" }}>
            <span style={{ color: "var(--ink)" }}>{n as string}</span>
            <span className="flex items-center gap-2">
              <span className="font-black" style={{ color: "var(--ink)" }}>{v as string}</span>
              <span className="text-[12px] font-black" style={{ color: up ? "var(--brand-deep)" : "#e05a5a" }}>{up ? "↗" : "↘"}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersMock() {
  return (
    <div className="space-y-3">
      {[
        ["#1245", "برجر دجاج · كولا · بيتزا", "14,000", "جديد", "var(--brand-soft)"],
        ["#1244", "مشاوي مشكّلة", "20,000", "قيد التحضير", "rgba(245,158,11,.18)"],
        ["#1243", "قهوة عربية ×2", "5,000", "تم التوصيل", "rgba(16,179,163,.18)"],
      ].map(([id, items, total, status, bg]) => (
        <div key={id} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={CARD}>
          <span className="text-[13px] font-black" style={{ color: "var(--ink-soft)" }}>{id}</span>
          <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: "var(--ink)" }}>{items}</span>
          <span className="whitespace-nowrap text-[13px] font-black" style={{ color: "var(--ink)" }}>{total} د.ع</span>
          <span className="whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-black" style={{ background: bg, color: "var(--brand-deep)" }}>{status}</span>
        </div>
      ))}
      <div className="rounded-2xl p-4" style={CARD}>
        <div className="mb-3 text-[13px] font-black" style={{ color: "var(--ink)" }}>حدّد طريقة الطلب</div>
        {[["🛵", "توصيل", true], ["🥡", "استلام من الفرع", false], ["🍽️", "طلب من الطاولة", false]].map(([icon, label, on]) => (
          <div key={label as string} className="flex items-center justify-between border-t py-2.5 text-[13px]" style={{ borderColor: "var(--line)" }}>
            <span className="flex items-center gap-2" style={{ color: "var(--ink)" }}><span>{icon as string}</span>{label as string}</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] text-white" style={{ background: on ? "var(--grad)" : "transparent", border: on ? "none" : "1px solid var(--line)" }}>{on ? "✓" : ""}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-2xl px-4 py-3 text-[13px]" style={CARD}>
        <span>💬</span>
        <span style={{ color: "var(--ink-soft)" }}>إشعار واتساب: <span style={{ color: "var(--ink)" }}>طلب جديد #1245 — طاولة 7</span></span>
      </div>
    </div>
  );
}

function CatalogMock() {
  return (
    <div className="space-y-2.5">
      {[["المشاوي", "منشور", true], ["المشروبات الساخنة", "منشور", true], ["الأكثر طلباً", "منشور", true], ["الحلويات", "معطّل", false]].map(([name, state, on]) => (
        <div key={name as string} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={CARD}>
          <span className="text-[15px]" style={{ color: "var(--ink-soft)" }}>≡</span>
          <span className="flex-1 text-[13.5px] font-black" style={{ color: "var(--ink)" }}>{name as string}</span>
          <span className="flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-black" style={{ background: on ? "var(--brand-soft)" : "var(--band-2)", color: on ? "var(--brand-deep)" : "var(--ink-soft)" }}>
            {state as string}
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: on ? "var(--brand)" : "var(--ink-soft)" }} />
          </span>
          <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>✎</span>
          <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>🗑</span>
        </div>
      ))}
      <div className="flex items-center gap-3 rounded-2xl p-3" style={CARD}>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl text-xl" style={{ background: "var(--brand-soft)" }}>🍢</span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-black" style={{ color: "var(--ink)" }}>شيش طاووق</div>
          <div className="truncate text-[12px]" style={{ color: "var(--ink-soft)" }}>صدر دجاج متبّل · خبز · صلصة</div>
        </div>
        <span className="brand-text whitespace-nowrap text-[13px] font-black">9,000 – 14,000 د.ع</span>
      </div>
    </div>
  );
}

function BrandMock() {
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl p-6 text-center" style={{ background: "linear-gradient(120deg,#ffd166,#ef476f)" }}>
        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-[12px] text-white">✎</span>
        <div className="text-3xl font-black text-white drop-shadow">خصم 50%</div>
        <div className="mt-1 text-[13px] font-bold text-white/90">غلاف الحملة — تغيّره متى شئت</div>
      </div>
      <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={CARD}>
        <span className="text-[13px] font-black" style={{ color: "var(--ink)" }}>اللون الأساسي للهوية</span>
        <span className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-soft)" }}>
          #074942 <span className="h-6 w-6 rounded-full" style={{ background: "#074942" }} />
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3" style={CARD}>
        <span className="flex items-center gap-2 text-[13px] font-black" style={{ color: "var(--ink)" }}>🌐 لغة ظهور المنيو</span>
        <span className="flex gap-2">
          {[["العربية", true], ["English", false], ["کوردی", false]].map(([l, on]) => (
            <span key={l as string} className="rounded-full px-3 py-1 text-[12px] font-black" style={on ? { background: "var(--grad)", color: "#fff" } : { border: "1px solid var(--line)", color: "var(--ink-soft)" }}>{l as string}</span>
          ))}
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={CARD}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-black text-white" style={{ background: "var(--grad)" }}>م</span>
        <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>الشعار · روابط إنستغرام وواتساب وفيسبوك</span>
      </div>
    </div>
  );
}

const DEEP = [
  {
    eyebrow: "الأرقام",
    title: "احصائيات لمتابعة النمو",
    body: ["من أجل متابعة نموّك قمنا برصد الزيارات لك ولأقسامك ومنتجاتك، لتتمكّن من التطوير والمتابعة المستمرة، والتحسين بناءً على الأرقام."],
    mock: StatsMock,
  },
  {
    eyebrow: "الطلبات",
    title: "تابع الطلبات بسهولة",
    body: ["استقبل طلبات عملائك بسهولة من الطاولة أو للاستلام أو للتوصيل، مع إمكانية متابعة حالة كل طلب وتحديثها مباشرة، بالإضافة إلى استلام إشعارات الطلب على رقمك عبر الواتساب لضمان تجربة إدارة سلسة."],
    mock: OrdersMock,
  },
  {
    eyebrow: "المنيو",
    title: "تحكّم بالكامل بالأقسام والعناصر",
    body: [
      "أضف الأقسام وتحكّم بترتيبها لتظهر بالقائمة وتسهّل على المستخدم الوصول لطلبه، وأضف العناصر بكل مرونة وسهولة مع التحكّم بالأسعار والأوصاف والصور المرفقة.",
      "يمكنك أيضاً إخفاء عناصر عن القائمة في حال عدم توفّرها أو انتهاء صلاحيتها.",
    ],
    mock: CatalogMock,
  },
  {
    eyebrow: "الهوية",
    title: "تحكّم بشكل ظهورك",
    body: [
      "خصّص الهوية البصرية من خلال تغيير الألوان والشعار والغلاف، واربطها مع وسائل التواصل الاجتماعي المختلفة.",
      "يمكّنك الغلاف من عرض صور لمنتج جديد أو دعم حملة تخفيضات معيّنة، وابتكر الطرق المناسبة لك للعرض. كما يمكنك تخصيص عرض المنيو بلغات مختلفة مثل العربية والإنجليزية والكردية.",
    ],
    mock: BrandMock,
  },
];

/* ————— template showcase: 6 hand-drawn CSS minis ————— */
const TPLS = [
  { n: 1, name: "اللوحي الداكن", desc: "أقسام جانبية + شبكة صور — تجربة تابلت", free: true, example: "https://pizzara-modern.netlify.app/menu" },
  { n: 2, name: "بطاقات الأقسام", desc: "غلاف كبير وبطاقات صور لكل قسم" },
  { n: 3, name: "الفاخر", desc: "عاجيّ وذهبي بلمسة راقية" },
  { n: 4, name: "الداكن السريع", desc: "صفحة واحدة وشبكة أصناف — وجبات سريعة" },
  { n: 5, name: "المدمج", desc: "قائمة مضغوطة سريعة التصفح" },
  { n: 6, name: "الدافئ", desc: "ألوان كريمية دافئة — مقاهٍ ومخابز" },
];

/* ————— the interconnected feature set, at a glance ————— */
const ALL_FEATURES = [
  ["📱", "منيو QR بالصور", "بدون تطبيق — يفتح برقم الطاولة"],
  ["🛎️", "الطلبات", "صالة · دلفري · سفري، بإشعار فوري للوحة"],
  ["📅", "حجز الطاولات", "بالتاريخ والوقت وعدد الأشخاص"],
  ["📊", "الإحصائيات", "زيارات المنيو والأقسام والأصناف"],
  ["⭐", "التقييمات", "بموافقتك قبل النشر"],
  ["🌐", "3 لغات", "العربية · English · کوردی"],
  ["🕐", "أوقات العمل", "شارة «مفتوح الآن» تلقائية"],
  ["🖼️", "صور الغلاف", "سلايدر لحملاتك وعروضك"],
  ["🎁", "العروض الترويجية", "شريط عروض أعلى المنيو"],
  ["👥", "عدة مشرفين", "حتى 10 حسابات لفريقك"],
  ["🔎", "SEO", "مطعمك يظهر في نتائج البحث"],
  ["🎨", "6 قوالب", "بدّل شكل المنيو الخاص بك بضغطة"],
] as const;

export default function Landing() {

  return (
    <main id="top" dir="rtl">
      <Nav />
      <ThemeSwitcher />

      {/* ————————————————————— HERO ————————————————————— */}
      <section className="relative overflow-hidden" style={{ background: "var(--bg)" }}>
        <div aria-hidden className="drift pointer-events-none absolute -right-24 -top-24 h-[540px] w-[540px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--glow), transparent 65%)" }} />
        <div aria-hidden className="drift-2 pointer-events-none absolute -left-32 top-24 h-[480px] w-[480px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--glow), transparent 65%)" }} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(75% 60% at 50% 25%, #000 0%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(75% 60% at 50% 25%, #000 0%, transparent 78%)",
          }}
        />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 pb-24 pt-36 lg:grid-cols-[1.05fr_.95fr] lg:pt-40">
          <div className="text-right">
            <div className="rise" style={{ animationDelay: "40ms" }}>
              <Eyebrow>منيو بلس · menuplus.rest</Eyebrow>
            </div>

            <h1 className="rise mt-6 text-[clamp(2.5rem,5.6vw,4.5rem)] font-black leading-[1.12]" style={{ animationDelay: "130ms", color: "var(--ink)" }}>
              حوّل قائمتك إلى <span className="brand-text">منيو رقميّ</span> يليق بمطعمك
            </h1>

            <p className="rise mt-6 max-w-xl text-[clamp(1rem,1.4vw,1.18rem)] leading-[1.95]" style={{ animationDelay: "220ms", color: "var(--ink-soft)" }}>
              منيو أنيق بضغطة QR على كل طاولة — بلونك وشعارك ونطاقك الخاص. حدّث الأسعار لحظياً، استقبل الطلبات، وأطلق خلال دقائق. بدون تطبيق، ويعمل أونلاين وأوفلاين.
            </p>

            <div className="rise mt-9 flex flex-wrap items-center gap-4" style={{ animationDelay: "310ms" }}>
              <Link href="/sign-up" className="shimmer inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-bold text-white" style={{ background: "var(--grad)", boxShadow: "var(--shadow-brand)" }}>
                <span>ابدأ مجاناً</span>
                <span aria-hidden style={{ transform: "scaleX(-1)" }}>➜</span>
              </Link>
              <a href="#menu" className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-[15px] font-bold" style={{ color: "var(--brand-deep)", border: "1px solid var(--line)", background: "var(--surface)" }}>
                شاهد عرضاً حيّاً
              </a>
            </div>

            <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "380ms" }}>
              <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>ادخل مطعماً حقيقياً:</span>
              <a href="/dallah" className="lift inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold" style={{ color: "var(--ink)", border: "1px solid var(--line)", background: "var(--surface)" }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#d18b4a" }} /> قهوة الدلّة <span style={{ color: "var(--ink-soft)" }}>/dallah</span>
              </a>
              <a href="/sham" className="lift inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold" style={{ color: "var(--ink)", border: "1px solid var(--line)", background: "var(--surface)" }}>
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

              <div className="floaty-slow absolute -left-6 top-16 rounded-2xl p-3" style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-lg)" }}>
                <Qr px={52} />
                <div className="mt-1.5 text-center text-[9px] font-black" style={{ color: "var(--brand-deep)" }}>امسح القائمة</div>
              </div>

              <div className="toast-cycle absolute -right-4 bottom-24 flex items-center gap-2 rounded-full px-4 py-2" style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-lg)" }}>
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
            <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold" style={{ color: "var(--on-deep)", background: "color-mix(in srgb, var(--brand) 14%, transparent)", border: "1px solid color-mix(in srgb, var(--brand) 34%, transparent)" }}>
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
              <div className="lift flex h-full flex-col justify-between overflow-hidden rounded-3xl surface p-7" style={{ border: "1px solid var(--line)", boxShadow: "var(--shadow-md)" }}>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-black" style={{ background: "var(--brand-soft)", color: "var(--brand-deep)" }}>الأساس</div>
                  <h3 className="mt-4 text-2xl font-black" style={{ color: "var(--ink)" }}>منيو QR بالصور</h3>
                  <p className="mt-2 max-w-sm text-[14px] leading-7" style={{ color: "var(--ink-soft)" }}>
                    قائمة تفاعلية بالصور والأقسام والأسعار — يمسح الزبون الرمز فتفتح فوراً برقم طاولته.
                  </p>
                </div>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div className="rounded-2xl surface p-3" style={{ border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
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
              <div className="lift h-full rounded-3xl surface p-7" style={{ border: "1px solid var(--line)", boxShadow: "var(--shadow-md)" }}>
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
              <div className="lift h-full rounded-3xl surface p-7" style={{ border: "1px solid var(--line)", boxShadow: "var(--shadow-md)" }}>
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
                <div className="lift h-full rounded-3xl surface p-6" style={{ border: "1px solid var(--line)", boxShadow: "var(--shadow-md)" }}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl" style={{ background: "var(--brand-soft)" }}>{icon}</div>
                  <h3 className="mt-4 text-[16px] font-black" style={{ color: "var(--ink)" }}>{title}</h3>
                  <p className="mt-2 text-[13px] leading-6" style={{ color: "var(--ink-soft)" }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ————————————————————— DEEP FEATURES ————————————————————— */}
      <section className="relative" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-7xl space-y-20 px-6 py-20 sm:space-y-28 sm:py-28">
          {DEEP.map(({ eyebrow, title, body, mock: Mock }, i) => (
            <Reveal key={title}>
              <div className={`grid items-center gap-12 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-last" : ""}`}>
                <div className="text-right">
                  <Eyebrow>{eyebrow}</Eyebrow>
                  <h2 className="mt-4 text-[clamp(1.6rem,3.2vw,2.5rem)] font-black leading-tight" style={{ color: "var(--ink)" }}>{title}</h2>
                  {body.map((p) => (
                    <p key={p} className="mt-4 max-w-lg text-[15px] leading-8" style={{ color: "var(--ink-soft)" }}>{p}</p>
                  ))}
                </div>
                <div className="rounded-[26px] p-5 sm:p-7" style={{ background: "var(--band)", border: "1px solid var(--line)", boxShadow: "var(--shadow-md)" }}>
                  <Mock />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ————————————————————— TEMPLATES ————————————————————— */}
      <section id="templates" className="relative" style={{ background: "var(--band)" }}>
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>القوالب</Eyebrow></div>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-black leading-tight" style={{ color: "var(--ink)" }}>
              6 قوالب — <span className="brand-text">المنيو الخاص بك بالشكل الذي يليق بك</span>
            </h2>
            <p className="mt-4 text-[15px]" style={{ color: "var(--ink-soft)" }}>
              نفس المنيو الخاص بك وبياناتك، بستّة أشكال مختلفة — بدّل بينها من لوحة التحكم بضغطة واحدة.
            </p>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TPLS.map((tp, i) => (
              <Reveal key={tp.n} delay={i * 70}>
                <div className="lift flex h-full flex-col rounded-3xl surface p-5" style={{ border: tp.free ? "2px solid var(--brand)" : "1px solid var(--line)", boxShadow: "var(--shadow-md)" }}>
                  {/* the real template, live — same page a customer sees, scaled to fit */}
                  <div className="relative h-80 overflow-hidden rounded-[20px]" style={{ border: "1px solid var(--line)", background: "#101012" }}>
                    <iframe
                      src={`/sham?tpl=${tp.n}&preview=1`}
                      title={tp.name}
                      loading="lazy"
                      tabIndex={-1}
                      className="pointer-events-none absolute left-0 top-0 origin-top-left"
                      style={{ width: "200%", height: "200%", transform: "scale(0.5)", border: 0 }}
                    />
                    <a href={`/sham?tpl=${tp.n}`} target="_blank" className="absolute inset-0" aria-label={`معاينة ${tp.name}`} />
                    <span className="absolute top-2 start-2 rounded-full px-3 py-1 text-[11px] font-black text-white" style={{ background: tp.free ? "var(--grad)" : "rgba(0,0,0,.55)" }}>
                      {tp.free ? "مجاني دائماً" : "الباقات المدفوعة"}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-black" style={{ color: "var(--ink)" }}>
                    {tp.n}. {tp.name}
                  </h3>
                  <p className="mt-1 flex-1 text-[13px] leading-6" style={{ color: "var(--ink-soft)" }}>{tp.desc}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <a href={`/sham?tpl=${tp.n}`} target="_blank" className="rounded-full px-4 py-2 text-[13px] font-bold text-white" style={{ background: "var(--grad)" }}>
                      معاينة حيّة
                    </a>
                    {tp.example && (
                      <a href={tp.example} target="_blank" rel="noreferrer" className="rounded-full px-4 py-2 text-[13px] font-bold" style={{ color: "var(--brand-deep)", border: "1px solid var(--line)" }}>
                        مثال لمطعم حقيقي
                      </a>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ————————————————————— ALL FEATURES ————————————————————— */}
      <section className="relative" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>منظومة مترابطة</Eyebrow></div>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-black leading-tight" style={{ color: "var(--ink)" }}>
              كل ما يحتاجه مطعمك <span className="brand-text">في مكان واحد</span>
            </h2>
            <p className="mt-4 text-[15px]" style={{ color: "var(--ink-soft)" }}>
              المنيو والطلبات والحجوزات والإحصائيات تعمل معاً — تُدار كلها من لوحة واحدة.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {ALL_FEATURES.map(([icon, title, desc], i) => (
              <Reveal key={title} delay={(i % 4) * 60}>
                <div className="lift h-full rounded-2xl surface p-5" style={{ border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
                  <span className="text-2xl">{icon}</span>
                  <h3 className="mt-2 text-[15px] font-black" style={{ color: "var(--ink)" }}>{title}</h3>
                  <p className="mt-1 text-[12.5px] leading-6" style={{ color: "var(--ink-soft)" }}>{desc}</p>
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
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3.1rem)] font-black leading-tight" style={{ color: "var(--on-deep)" }}>
              كل طلبٍ <span className="brand-text">تحت السيطرة</span> — من الطاولة إلى المطبخ
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="mx-auto max-w-4xl rounded-[26px] p-5 sm:p-7" style={{ background: "rgba(255,255,255,.04)", border: "1px solid color-mix(in srgb, var(--brand) 34%, transparent)", boxShadow: "0 40px 80px -40px rgba(0,0,0,.6)" }}>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: "var(--on-deep-soft)" }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--brand-bright)", boxShadow: "0 0 8px var(--brand-bright)" }} /> لوحة الطلبات · مباشر
                </div>
                <span className="rounded-full px-3 py-1 text-[12px] font-black" style={{ background: "color-mix(in srgb, var(--brand) 18%, transparent)", color: "var(--on-deep)" }}>3 طلبات جديدة</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {ORDERS.map((c) => (
                  <div key={c.col} className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,.03)", border: "1px solid color-mix(in srgb, var(--brand) 18%, transparent)" }}>
                    <div className="mb-3 flex items-center gap-2 px-1 text-[13px] font-black" style={{ color: "var(--on-deep)" }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: c.dot }} /> {c.col}
                    </div>
                    <div className="space-y-2.5">
                      {c.cards.map(([t, items, time]) => (
                        <div key={t} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,.05)", border: "1px solid color-mix(in srgb, var(--brand) 18%, transparent)" }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-black" style={{ color: "var(--on-deep)" }}>{t}</span>
                            <span className="text-[11px] tabular-nums" style={{ color: "var(--on-deep-soft)" }}>{time}</span>
                          </div>
                          <div className="mt-1 text-[12px]" style={{ color: "var(--on-deep-soft)" }}>{items}</div>
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

          <Pricing />
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
            <h2 className="text-[clamp(2rem,4.6vw,3.4rem)] font-black leading-tight" style={{ color: "var(--on-deep)" }}>
              جهّز <span className="brand-text">منيو مطعمك الرقمي</span> اليوم
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[16px] leading-8" style={{ color: "var(--on-deep-soft)" }}>
              انضم إلى المطاعم التي تمنح زبائنها تجربةً أرقى — قائمة أنيقة، طلبٌ أسهل، وإدارةٌ أوضح.
            </p>
            <Link href="/sign-up" className="shimmer mt-9 inline-flex items-center gap-2 rounded-full px-9 py-4 text-[16px] font-bold text-white" style={{ background: "var(--grad)", boxShadow: "var(--shadow-brand)" }}>
              ابدأ مجاناً الآن <span aria-hidden style={{ transform: "scaleX(-1)" }}>➜</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ————————————————————— FOOTER ————————————————————— */}
      <footer style={{ background: "var(--footer)" }}>
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[11px]" style={{ background: "var(--grad)" }}>
                  <span className="text-lg font-black text-white">+</span>
                </span>
                <span className="text-2xl font-black" style={{ color: "var(--on-deep)" }}>منيو بلس</span>
              </div>
              <p className="mt-4 max-w-xs text-[13px] leading-7" style={{ color: "var(--on-deep-soft)" }}>
                منيو بلس — منصّة المنيو الرقمي للمطاعم والمقاهي: قائمة QR أنيقة، طلبات وحجوزات، بلونك ونطاقك الخاص.
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
                    <li key={l}><span className="text-[13px]" style={{ color: "var(--on-deep-soft)" }}>{l}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="my-8 rule" />
          <div className="flex flex-col items-center justify-between gap-3 text-[12px] sm:flex-row" style={{ color: "var(--on-deep-soft)" }}>
            <span>© منيو بلس · menuplus.rest — جميع الحقوق محفوظة</span>
            <span className="inline-flex items-center gap-2"><span style={{ color: "var(--brand)" }}>◆</span> صُنع بعنايةٍ للمطاعم العراقية</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
