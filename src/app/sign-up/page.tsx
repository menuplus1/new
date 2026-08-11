"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { signUpRestaurant } from "@/lib/actions";
import { PLAN_INFO, TRIAL_DAYS, iqd, type Plan } from "@/lib/plans";

const FIELD = "mt-2 w-full rounded-xl border border-white/10 bg-[#141416] px-3 py-3 text-sm outline-none";
const PLANS: Plan[] = ["free", "basic", "premium", "ultimate"];

export default function SignUpPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("free");
  const [f, setF] = useState({ name: "", slug: "", color: "#10b3a3", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // preselect from /sign-up?plan=premium (pricing cards link here)
  useEffect(() => {
    (async () => {
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

  return (
    <main dir="rtl" className="flex min-h-dvh items-center justify-center bg-[#121214] p-6 text-[#f2f2f0]">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1b1b1e] p-7">
        <h1 className="text-2xl font-extrabold">أنشئ منيو مطعمك</h1>
        <p className="mt-1 text-sm text-[#a6a6a3]">ابدأ خلال دقيقة — بدون بطاقة.</p>

        {/* الباقة */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {PLANS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlan(p)}
              className={`rounded-xl border p-3 text-start ${plan === p ? "border-[#22c1a4] bg-[#22c1a4]/10" : "border-white/10"}`}
            >
              <span className="block text-sm font-extrabold">{PLAN_INFO[p].label}</span>
              <span className="block text-xs text-[#a6a6a3]">
                {PLAN_INFO[p].monthly === 0 ? "مجاناً للأبد" : `${iqd(PLAN_INFO[p].monthly)} / شهرياً`}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#a6a6a3]">
          {plan === "free"
            ? "القالب الأساسي مجاني دائماً — 15 عنصراً و5 أقسام."
            : `تجربة مجانية ${TRIAL_DAYS} أيام بكل مزايا الباقة، ثم يتواصل معك فريقنا للتفعيل.`}
        </p>

        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="اسم المطعم (مثال: قهوة النخلة)" className={`${FIELD} mt-4`} />
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[#141416] px-3" dir="ltr">
          <span className="text-xs text-[#a6a6a3]">menuplus.rest/</span>
          <input
            value={f.slug}
            onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
            placeholder="my-cafe"
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
        </div>
        <label className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-[#141416] px-3 py-2.5 text-sm">
          <span className="text-[#a6a6a3]">لون علامتك</span>
          <input type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} className="h-8 w-14 cursor-pointer rounded border-0 bg-transparent" />
        </label>
        <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} type="email" dir="ltr" placeholder="البريد الإلكتروني" className={FIELD} />
        <input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} type="password" dir="ltr" placeholder="كلمة المرور (8 أحرف فأكثر)" className={FIELD} />

        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        <button disabled={busy} className="mt-4 w-full rounded-2xl bg-[#22c1a4] py-3.5 font-extrabold text-[#0d0d0d] disabled:opacity-60">
          {busy ? "جارٍ الإنشاء…" : plan === "free" ? "ابدأ مجاناً" : "ابدأ التجربة المجانية"}
        </button>
        <p className="mt-4 text-center text-xs text-[#a6a6a3]">
          لديك حساب؟ <Link href="/sign-in" className="font-bold text-[#22c1a4]">سجّل دخولك</Link>
        </p>
      </form>
    </main>
  );
}
