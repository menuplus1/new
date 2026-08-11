"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
    <main dir="rtl" className="flex min-h-dvh items-center justify-center bg-[#121214] p-6 text-[#f2f2f0]">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1b1b1e] p-7">
        <h1 className="text-2xl font-extrabold">دخول المطعم</h1>
        <p className="mt-1 text-sm text-[#a6a6a3]">لوحة إدارة منيو مطعمك</p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          dir="ltr"
          placeholder="البريد الإلكتروني"
          className="mt-5 w-full rounded-xl border border-white/10 bg-[#141416] px-3 py-3 text-sm outline-none"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          dir="ltr"
          placeholder="كلمة المرور"
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#141416] px-3 py-3 text-sm outline-none"
        />
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        <button disabled={busy} className="mt-4 w-full rounded-2xl bg-[#22c1a4] py-3.5 font-extrabold text-[#0d0d0d] disabled:opacity-60">
          {busy ? "جارٍ الدخول…" : "دخول"}
        </button>
        <p className="mt-4 text-center text-xs text-[#a6a6a3]">الحساب يُنشئه مزوّد المنصّة لكل مطعم.</p>
      </form>
    </main>
  );
}
