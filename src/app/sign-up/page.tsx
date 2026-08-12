"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { signUpRestaurant } from "@/lib/actions";
import { PLAN_INFO, TRIAL_DAYS, iqd, type Plan } from "@/lib/plans";
import { STARTERS } from "@/lib/starter-menus";
import TestimonialsWall from "@/components/landing/TestimonialsWall";

const PLANS: Plan[] = ["free", "basic", "premium", "ultimate"];
const INPUT = { background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" } as const;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TPLS: { n: number; name: string; desc: string; chips: [string, string, string] }[] = [
  { n: 1, name: "اللوحي الداكن", desc: "أقسام جانبية وشبكة صور — تجربة تابلت", chips: ["شبكة صور", "أقسام جانبية", "داكن"] },
  { n: 2, name: "بطاقات الأقسام", desc: "غلاف كبير وبطاقة لكل قسم", chips: ["غلاف كبير", "بطاقات أقسام", "فاتح"] },
  { n: 3, name: "الفاخر", desc: "عاجي وذهبي بلمسة راقية", chips: ["راقٍ", "متعدد اللغات", "لاونج"] },
  { n: 4, name: "الداكن السريع", desc: "صفحة واحدة وشبكة أصناف", chips: ["سريع", "وجبات سريعة", "داكن"] },
  { n: 5, name: "المدمج", desc: "قائمة مضغوطة سريعة التصفح", chips: ["مضغوط", "سريع التصفح", "فاتح"] },
  { n: 6, name: "الدافئ", desc: "ألوان كريمية دافئة", chips: ["دافئ", "مقاهٍ", "مخابز"] },
];

const STEPS = ["اختر القالب", "بيانات المطعم", "تأكيد وإنشاء"];

/** auth pages follow the landing's live theme (same localStorage key as ThemeSwitcher) */
function applySavedTheme() {
  const t = localStorage.getItem("emenu-theme") || "turquoise";
  if (t === "turquoise") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

type Errs = Partial<Record<"name" | "slug" | "email" | "password", string>>;

export default function SignUpPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("free");
  const [step, setStep] = useState(1);
  const [slide, setSlide] = useState(1); // القالب المعروض في الكاروسيل
  const [f, setF] = useState({ name: "", slug: "", color: "#10b3a3", email: "", password: "" });
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // the plan was already chosen on the pricing table — don't ask again
  useEffect(() => {
    (async () => {
      applySavedTheme();
      const p = new URLSearchParams(window.location.search).get("plan");
      if (p && (PLANS as string[]).includes(p)) setPlan(p as Plan);
    })();
  }, []);

  const info = PLAN_INFO[plan];
  const locked = (n: number) => plan === "free" && n !== 1;
  const template = locked(slide) ? 1 : slide; // الباقة المجانية تبقى على القالب 1
  const shown = TPLS[slide - 1];
  const chosen = TPLS[template - 1];
  const starter = STARTERS[template];

  function validate(): boolean {
    const e: Errs = {};
    if (f.name.trim().length < 2) e.name = "اكتب اسم المطعم (حرفان على الأقل).";
    if (!SLUG_RE.test(f.slug)) e.slug = "أحرف إنجليزية صغيرة وأرقام وشرطات، من 3 إلى 30 حرفاً.";
    if (!EMAIL_RE.test(f.email.trim())) e.email = "البريد الإلكتروني غير صالح.";
    if (f.password.length < 8) e.password = "كلمة المرور 8 أحرف فأكثر.";
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (step === 2 && !validate()) return;
    setStep(step + 1);
  }

  async function submit() {
    if (!validate()) return setStep(2);
    const client = sb();
    if (!client) return setErr("المنصّة غير مربوطة بقاعدة بيانات بعد.");
    setBusy(true);
    setErr(null);
    const res = await signUpRestaurant({ ...f, plan, template });
    if (!res.ok) {
      setBusy(false);
      return setErr(res.error);
    }
    const { error } = await client.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
    setBusy(false);
    if (error) return router.replace("/sign-in");
    router.replace("/admin");
  }

  const field = (
    k: "name" | "email" | "password",
    props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <div>
      <input
        {...props}
        value={f[k]}
        onChange={(e) => {
          setF({ ...f, [k]: e.target.value });
          if (errs[k]) setErrs({ ...errs, [k]: undefined });
        }}
        className="w-full rounded-xl px-3 py-3 text-sm outline-none"
        style={{ ...INPUT, borderColor: errs[k] ? "#ef4444" : "var(--line)" }}
      />
      {errs[k] && <p className="mt-1 text-[12px] text-red-500">{errs[k]}</p>}
    </div>
  );

  return (
    <main dir="rtl" className="relative min-h-dvh overflow-hidden p-4 sm:p-6" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-50">
        <TestimonialsWall className="h-full" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl rounded-3xl p-5 sm:p-7" style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-lg)" }}>
        {/* ————— header ————— */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: "var(--grad)" }}>
              <span className="text-base font-black text-white">+</span>
            </span>
            <span className="text-lg font-black">منيو بلس</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "var(--brand-soft)", border: "1px solid var(--line)" }}>
            <span className="text-[12px] font-black">{info.label}</span>
            <Link href="/#pricing" className="text-[11px] font-bold underline" style={{ color: "var(--brand-deep)" }}>تغيير</Link>
          </div>
        </div>

        {/* ————— stepper ————— */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[12px]" style={{ color: "var(--ink-soft)" }}>
            <span className="font-black" style={{ color: "var(--ink)" }}>{STEPS[step - 1]}</span>
            <span>الخطوة {step} من 3</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%`, background: "var(--grad)" }} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <span key={s} className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: i + 1 <= step ? "var(--brand-deep)" : "var(--ink-soft)" }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: i + 1 <= step ? "var(--brand)" : "var(--line)" }} />
                {s}
                {i < 2 && <span className="mx-1 opacity-40">—</span>}
              </span>
            ))}
          </div>
        </div>

        {/* ————— STEP 1 — القالب ————— */}
        {step === 1 && (
          <div className="mt-6">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <button type="button" aria-label="السابق" onClick={() => setSlide(slide === 1 ? 6 : slide - 1)} className="h-10 w-10 shrink-0 rounded-full text-lg font-black" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>›</button>

              <div className="relative mx-auto aspect-[9/19] w-full max-w-[300px] overflow-hidden rounded-[28px]" style={{ border: "1px solid var(--line)", background: "#101012", boxShadow: "var(--shadow-md)" }}>
                <iframe
                  key={slide}
                  src={`/sham?tpl=${slide}&preview=1`}
                  title={`معاينة ${shown.name}`}
                  loading="lazy"
                  tabIndex={-1}
                  className="pointer-events-none absolute left-0 top-0 origin-top-left"
                  style={{ width: "250%", height: "250%", transform: "scale(0.4)", border: 0 }}
                />
                <span className="absolute top-2 start-2 rounded-full px-3 py-1 text-[11px] font-black text-white" style={{ background: slide === 1 ? "var(--grad)" : "rgba(0,0,0,.55)" }}>
                  {slide === 1 ? "مجاني دائماً" : locked(slide) ? "للباقات المدفوعة" : "متاح لك"}
                </span>
              </div>

              <button type="button" aria-label="التالي" onClick={() => setSlide(slide === 6 ? 1 : slide + 1)} className="h-10 w-10 shrink-0 rounded-full text-lg font-black" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>‹</button>
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-xl font-black">{shown.n}. {shown.name}</h2>
              <p className="mt-1 text-[13px]" style={{ color: "var(--ink-soft)" }}>{shown.desc}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {shown.chips.map((c) => (
                  <span key={c} className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink-soft)" }}>{c}</span>
                ))}
              </div>
              {locked(slide) && (
                <p className="mt-3 text-[12px] font-bold" style={{ color: "var(--brand-deep)" }}>
                  هذا القالب للباقات المدفوعة — سيُطبَّق القالب 1 (اللوحي الداكن).{" "}
                  <Link href="/#pricing" className="underline">ترقية الباقة</Link>
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              {TPLS.map((tp) => (
                <button
                  key={tp.n}
                  type="button"
                  aria-label={`القالب ${tp.n}`}
                  onClick={() => setSlide(tp.n)}
                  className="h-2.5 rounded-full transition-all"
                  style={{ width: slide === tp.n ? 26 : 10, background: slide === tp.n ? "var(--brand)" : "var(--line)", opacity: locked(tp.n) ? 0.5 : 1 }}
                />
              ))}
            </div>

            <p className="mt-4 text-center text-[12px]" style={{ color: "var(--ink-soft)" }}>
              يبدأ المنيو الخاص بك بأصناف وأسعار جاهزة تعدّلها بضغطة.
            </p>
          </div>
        )}

        {/* ————— STEP 2 — البيانات ————— */}
        {step === 2 && (
          <div className="mt-6 grid gap-3">
            {field("name", { placeholder: "اسم المطعم (مثال: قهوة النخلة)" })}
            <div>
              <div className="flex items-center gap-2 rounded-xl px-3" dir="ltr" style={{ ...INPUT, borderColor: errs.slug ? "#ef4444" : "var(--line)" }}>
                <span className="text-xs whitespace-nowrap" style={{ color: "var(--ink-soft)" }}>menuplus.rest/</span>
                <input
                  value={f.slug}
                  onChange={(e) => {
                    setF({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") });
                    if (errs.slug) setErrs({ ...errs, slug: undefined });
                  }}
                  placeholder="my-cafe"
                  className="w-full bg-transparent py-3 text-sm outline-none"
                  style={{ color: "var(--ink)" }}
                />
              </div>
              {errs.slug && <p className="mt-1 text-[12px] text-red-500">{errs.slug}</p>}
            </div>
            <label className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm" style={INPUT}>
              <span style={{ color: "var(--ink-soft)" }}>لون العلامة</span>
              <input type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} className="h-8 w-14 cursor-pointer rounded border-0 bg-transparent" />
            </label>
            {field("email", { type: "email", dir: "ltr", placeholder: "البريد الإلكتروني" })}
            {field("password", { type: "password", dir: "ltr", placeholder: "كلمة المرور (8 أحرف فأكثر)" })}
          </div>
        )}

        {/* ————— STEP 3 — التأكيد ————— */}
        {step === 3 && (
          <div className="mt-6">
            <div className="grid gap-3 rounded-2xl p-4 sm:grid-cols-2" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
              <div>
                <p className="text-[11px] font-black" style={{ color: "var(--brand-deep)" }}>الباقة</p>
                <p className="text-sm font-black">{info.label}</p>
                <p className="text-[12px]" style={{ color: "var(--ink-soft)" }}>
                  {info.monthly === 0 ? "مجاناً للأبد" : `${iqd(info.monthly)} / شهرياً · تجربة ${TRIAL_DAYS} أيام`}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-black" style={{ color: "var(--brand-deep)" }}>القالب المختار</p>
                <p className="text-sm font-black">{chosen.n}. {chosen.name}</p>
                <p className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{chosen.desc}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[11px] font-black" style={{ color: "var(--brand-deep)" }}>الرابط النهائي</p>
                <p dir="ltr" className="text-start text-sm font-bold">menuplus.rest/{f.slug}</p>
              </div>
            </div>

            <p className="mt-4 text-[13px] font-extrabold">المنيو الجاهز</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {starter?.cats.map((c) => (
                <span key={c.name} className="rounded-full px-3 py-1.5 text-[12px] font-bold" style={{ background: "var(--brand-soft)", border: "1px solid var(--line)" }}>
                  {c.name} · {c.items.length} أصناف
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px]" style={{ color: "var(--ink-soft)" }}>كل الأصناف والأسعار قابلة للتعديل من لوحة التحكم.</p>

            {err && <p className="mt-3 text-sm text-red-500">{err}</p>}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button type="button" onClick={() => setStep(2)} className="rounded-2xl px-5 py-3 text-sm font-bold" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>رجوع</button>
              <button type="button" disabled={busy} onClick={submit} className="shimmer flex-1 rounded-2xl py-3.5 font-extrabold text-white disabled:opacity-60" style={{ background: "var(--grad)", boxShadow: "var(--shadow-brand)" }}>
                {busy ? "جارٍ الإنشاء…" : "أنشئ المنيو"}
              </button>
            </div>
          </div>
        )}

        {/* ————— navigation (1–2) ————— */}
        {step < 3 && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="rounded-2xl px-5 py-3 text-sm font-bold disabled:opacity-40"
              style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
            >
              رجوع
            </button>
            <button type="button" onClick={next} className="shimmer rounded-2xl px-8 py-3 text-sm font-extrabold text-white" style={{ background: "var(--grad)", boxShadow: "var(--shadow-brand)" }}>
              التالي
            </button>
          </div>
        )}

        <p className="mt-5 text-center text-xs" style={{ color: "var(--ink-soft)" }}>
          لديك حساب؟ <Link href="/sign-in" className="font-bold" style={{ color: "var(--brand-deep)" }}>سجّل دخولك</Link>
        </p>
      </div>
    </main>
  );
}
