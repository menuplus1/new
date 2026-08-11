"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { signUpRestaurant } from "@/lib/actions";
import { PLAN_INFO, TRIAL_DAYS, iqd, type Plan } from "@/lib/plans";

const PLANS: Plan[] = ["free", "basic", "premium", "ultimate"];
const INPUT = { background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" } as const;

/** auth pages follow the landing's live theme (same localStorage key as ThemeSwitcher) */
function applySavedTheme() {
  const t = localStorage.getItem("emenu-theme") || "turquoise";
  if (t === "turquoise") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

export default function SignUpPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("free");
  const [f, setF] = useState({ name: "", slug: "", color: "#10b3a3", email: "", password: "" });
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const client = sb();
    if (!client) return setErr("المنصّة غير مربوطة بقاعدة بيانات بعد.");
    setBusy(true);
    setErr(null);
    const res = await signUpRestaurant({ ...f, plan });
    if (!res.ok) {
      setBusy(false);
      return setErr(res.error);
    }
    const { error } = await client.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
    setBusy(false);
    if (error) return router.replace("/sign-in");
    router.replace("/admin");
  }

  const info = PLAN_INFO[plan];

  return (
    <main dir="rtl" className="relative flex min-h-dvh items-center justify-center overflow-hidden p-6" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-[480px] w-[480px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--glow), transparent 65%)" }} />
      <form onSubmit={submit} className="relative w-full max-w-md rounded-3xl p-7" style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-lg)" }}>
        <Link href="/" className="mb-4 inline-flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: "var(--grad)" }}>
            <span className="text-base font-black text-white">+</span>
          </span>
          <span className="text-lg font-black">منيو بلس</span>
        </Link>
        <h1 className="text-2xl font-extrabold">أنشئ منيو مطعمك</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>ابدأ خلال دقيقة — بدون بطاقة.</p>

        {/* الباقة المختارة من جدول الأسعار — تُعرض ولا يُعاد السؤال عنها */}
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl p-4" style={{ background: "var(--brand-soft)", border: "1px solid var(--line)" }}>
          <div>
            <p className="text-[11px] font-black tracking-wide" style={{ color: "var(--brand-deep)" }}>الباقة المختارة</p>
            <p className="text-lg font-black">{info.label}</p>
            <p className="text-[12px]" style={{ color: "var(--ink-soft)" }}>
              {info.monthly === 0
                ? "مجاناً للأبد — القالب الأساسي، 15 عنصراً و5 أقسام"
                : `${iqd(info.monthly)} / شهرياً · تجربة ${TRIAL_DAYS} أيام مجاناً بكل المزايا`}
            </p>
          </div>
          <Link href="/#pricing" className="shrink-0 text-[12px] font-bold underline" style={{ color: "var(--brand-deep)" }}>
            تغيير
          </Link>
        </div>

        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="اسم المطعم (مثال: قهوة النخلة)" className="mt-4 w-full rounded-xl px-3 py-3 text-sm outline-none" style={INPUT} />
        <div className="mt-2 flex items-center gap-2 rounded-xl px-3" dir="ltr" style={INPUT}>
          <span className="text-xs" style={{ color: "var(--ink-soft)" }}>menuplus.rest/</span>
          <input
            value={f.slug}
            onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
            placeholder="my-cafe"
            className="w-full bg-transparent py-3 text-sm outline-none"
            style={{ color: "var(--ink)" }}
          />
        </div>
        <label className="mt-2 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm" style={INPUT}>
          <span style={{ color: "var(--ink-soft)" }}>لون علامتك</span>
          <input type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} className="h-8 w-14 cursor-pointer rounded border-0 bg-transparent" />
        </label>
        <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} type="email" dir="ltr" placeholder="البريد الإلكتروني" className="mt-2 w-full rounded-xl px-3 py-3 text-sm outline-none" style={INPUT} />
        <input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} type="password" dir="ltr" placeholder="كلمة المرور (8 أحرف فأكثر)" className="mt-2 w-full rounded-xl px-3 py-3 text-sm outline-none" style={INPUT} />

        {err && <p className="mt-3 text-sm text-red-500">{err}</p>}
        <button disabled={busy} className="shimmer mt-4 w-full rounded-2xl py-3.5 font-extrabold text-white disabled:opacity-60" style={{ background: "var(--grad)", boxShadow: "var(--shadow-brand)" }}>
          {busy ? "جارٍ الإنشاء…" : plan === "free" ? "ابدأ مجاناً" : "ابدأ التجربة المجانية"}
        </button>
        <p className="mt-4 text-center text-xs" style={{ color: "var(--ink-soft)" }}>
          لديك حساب؟ <Link href="/sign-in" className="font-bold" style={{ color: "var(--brand-deep)" }}>سجّل دخولك</Link>
        </p>
      </form>
    </main>
  );
}
