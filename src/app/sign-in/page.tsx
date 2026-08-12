"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { sb } from "@/lib/supabase-browser";

const INPUT = { background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" } as const;

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // follow the landing's live theme (same localStorage key as ThemeSwitcher)
  useEffect(() => {
    (async () => {
      const t = localStorage.getItem("emenu-theme") || "turquoise";
      if (t === "turquoise") delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = t;
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const client = sb();
    if (!client) return setErr("لم يتم ربط قاعدة البيانات بعد.");
    setBusy(true);
    setErr(null);
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setErr("البريد أو كلمة المرور غير صحيحة.");
    router.replace("/admin");
  }

  return (
    <main dir="rtl" className="relative flex min-h-dvh items-center justify-center overflow-hidden p-6" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-[480px] w-[480px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--glow), transparent 65%)" }} />
      <form onSubmit={submit} className="relative w-full max-w-sm rounded-3xl p-7" style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-lg)" }}>
        <Link href="/" className="mb-4 inline-flex">
          <Logo height={40} />
        </Link>
        <h1 className="text-2xl font-extrabold">دخول المطعم</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>لوحة إدارة المنيو الخاص بك</p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          dir="ltr"
          placeholder="البريد الإلكتروني"
          className="mt-5 w-full rounded-xl px-3 py-3 text-sm outline-none"
          style={INPUT}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          dir="ltr"
          placeholder="كلمة المرور"
          className="mt-2 w-full rounded-xl px-3 py-3 text-sm outline-none"
          style={INPUT}
        />
        {err && <p className="mt-3 text-sm text-red-500">{err}</p>}
        <button disabled={busy} className="shimmer mt-4 w-full rounded-2xl py-3.5 font-extrabold text-white disabled:opacity-60" style={{ background: "var(--grad)", boxShadow: "var(--shadow-brand)" }}>
          {busy ? "جارٍ الدخول…" : "دخول"}
        </button>
        <p className="mt-4 text-center text-xs" style={{ color: "var(--ink-soft)" }}>
          ليس لديك حساب؟ <Link href="/sign-up" className="font-bold" style={{ color: "var(--brand-deep)" }}>أنشئ منيو مطعمك مجاناً</Link>
        </p>
      </form>
    </main>
  );
}
