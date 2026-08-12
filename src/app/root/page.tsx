"use client";

/** كونسول مدير المنصّة — قشرة الصفحة فقط: تحقّق من الصلاحية، ثم التبويبات.
 *  كل قراءة/كتابة تمرّ عبر server actions في src/lib/platform.ts. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { platformSession, listSubscriptions } from "@/lib/platform";
import { Logo } from "@/components/Logo";
import { BRAND, Chip } from "./ui";
import { Overview } from "./Overview";
import { Restaurants } from "./Restaurants";
import { Accounts } from "./Accounts";
import { Billing } from "./Billing";
import { OrdersFeed } from "./OrdersFeed";
import { Audit } from "./Audit";

type TabKey = "overview" | "restaurants" | "accounts" | "billing" | "orders" | "audit";

const TAB: Record<TabKey, { label: string; icon: string; hint: string }> = {
  overview: { label: "نظرة عامة", icon: "📊", hint: "أرقام المنصّة كلها في مكان واحد" },
  restaurants: { label: "المطاعم", icon: "🏪", hint: "كل مطعم مشترك: الباقة والحالة والتحكّم" },
  accounts: { label: "المسجّلون", icon: "👤", hint: "حسابات المستخدمين وارتباطها بالمطاعم" },
  billing: { label: "الاشتراكات", icon: "💳", hint: "التجديدات والفواتير والاشتراكات القاربة على الانتهاء" },
  orders: { label: "الطلبات", icon: "🛎️", hint: "آخر الطلبات عبر كل المطاعم" },
  audit: { label: "سجل النشاط", icon: "🧾", hint: "كل تعديل تمّ من هذا الكونسول" },
};

const GROUPS: { title: string; keys: TabKey[] }[] = [
  { title: "المنصّة", keys: ["overview"] },
  { title: "العملاء", keys: ["restaurants", "accounts"] },
  { title: "المال", keys: ["billing"] },
  { title: "التشغيل", keys: ["orders"] },
  { title: "السجل", keys: ["audit"] },
];

export default function RootConsole() {
  const router = useRouter();
  const client = sb();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"loading" | "denied" | "ok">("loading");
  const [expiring, setExpiring] = useState(0);
  const [tab, setTab] = useState<TabKey>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const [nonce, setNonce] = useState(0); // «تحديث» يعيد تركيب الشاشة الحالية

  useEffect(() => {
    (async () => {
      if (!client) return setState("denied");
      const { data } = await client.auth.getSession();
      const t = data.session?.access_token;
      if (!t) return router.replace("/sign-in");
      const me = await platformSession(t);
      if (!("ok" in me) || !me.ok) return setState("denied");
      setToken(t);
      setEmail(me.email);
      setState("ok");
      const subs = await listSubscriptions({ accessToken: t, days: 7 });
      if ("ok" in subs && subs.ok) setExpiring(subs.expiring.length);
    })();
  }, [client, router]);

  const signOut = useCallback(() => {
    void client?.auth.signOut().then(() => router.replace("/sign-in"));
  }, [client, router]);

  if (state === "loading")
    return (
      <main dir="rtl" className="grid min-h-dvh place-items-center bg-[#121214] text-[#a6a6a3]">
        جارٍ التحميل…
      </main>
    );

  if (state === "denied" || !token)
    return (
      <main dir="rtl" className="grid min-h-dvh place-items-center bg-[#121214] p-5 text-[#f2f2f0]">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1b1b1e] p-6 text-center">
          <p className="text-lg font-black">هذا الحساب ليس مدير منصّة</p>
          <p className="mt-2 text-sm text-[#a6a6a3]">هذه الصفحة مخصّصة لإدارة منيو بلس. إن كنت صاحب مطعم فلوحتك في مكان آخر.</p>
          <div className="mt-5 flex gap-2">
            <button onClick={signOut} className="flex-1 rounded-xl border border-white/15 py-2 text-sm font-bold transition hover:bg-white/5">
              خروج
            </button>
            <Link href="/admin" className="flex-1 rounded-xl py-2 text-sm font-bold text-[#0d0d0d]" style={{ background: BRAND }}>
              لوحة المطعم
            </Link>
          </div>
        </div>
      </main>
    );

  const t = token;

  return (
    // نفس هيكل /admin: القشرة تملك التمرير لأن body عنده overflow-x hidden
    <div dir="rtl" className="flex h-dvh overflow-hidden bg-[#121214] text-[#f2f2f0]">
      {navOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* ————— القائمة الجانبية ————— */}
      <aside
        className={`fixed bottom-0 start-0 top-0 z-40 flex w-[264px] max-w-[84vw] flex-col overflow-y-auto border-e border-white/10 bg-[#0f1a19] transition-transform duration-300 lg:static lg:w-[248px] lg:max-w-none lg:shrink-0 lg:translate-x-0 ${navOpen ? "translate-x-0" : "pointer-events-none translate-x-full lg:pointer-events-auto"}`}
      >
        <div className="shrink-0 px-4 pb-4 pt-5">
          <div className="flex items-center gap-2.5">
            <span style={{ "--brand": BRAND } as React.CSSProperties}>
              <Logo height={30} tone="light" />
            </span>
            <Chip label="منصّة" tone="brand" />
          </div>
          <p className="mt-2 truncate text-[11px] text-[#a6a6a3]" dir="ltr" title={email}>
            {email}
          </p>
        </div>

        <nav className="shrink-0 space-y-4 px-3">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="px-3 pb-1 text-[10px] font-black tracking-wide text-[#6f7a79]">{g.title}</p>
              <div className="space-y-1">
                {g.keys.map((k) => {
                  const on = tab === k;
                  const pill = k === "billing" && expiring > 0 ? expiring : 0;
                  return (
                    <button
                      key={k}
                      onClick={() => {
                        setTab(k);
                        setNavOpen(false);
                      }}
                      aria-current={on ? "page" : undefined}
                      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-extrabold transition ${on ? "" : "text-[#a6a6a3] hover:bg-white/5 hover:text-[#f2f2f0]"}`}
                      style={on ? { background: `color-mix(in srgb, ${BRAND} 16%, transparent)`, color: BRAND } : undefined}
                    >
                      {on && <span className="absolute bottom-2 start-0 top-2 w-[3px] rounded-full" style={{ background: BRAND }} />}
                      <span className="text-base leading-none">{TAB[k].icon}</span>
                      <span className="flex-1 text-start">{TAB[k].label}</span>
                      {pill > 0 && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-black text-[#0d0d0d]" style={{ background: "#eab308" }}>
                          {pill.toLocaleString("en-US")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto shrink-0 p-3 pt-6">
          <div className="flex gap-2">
            <button onClick={() => setNonce((n) => n + 1)} className="flex-1 rounded-xl border border-white/15 py-2 text-xs font-bold transition hover:bg-white/5">
              تحديث
            </button>
            <button onClick={signOut} className="flex-1 rounded-xl border border-white/15 py-2 text-xs font-bold transition hover:bg-white/5">
              خروج
            </button>
          </div>
          <p className="mt-3 text-center text-[10px] text-[#a6a6a3]" dir="ltr">menuplus.rest</p>
        </div>
      </aside>

      {/* ————— المحتوى ————— */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* الخط العلوي: إشارة دائمة أنّك في كونسول المنصّة لا في لوحة مطعم */}
        <span
          className="h-[3px] shrink-0"
          style={{ background: `linear-gradient(90deg, ${BRAND}, color-mix(in srgb, ${BRAND} 25%, transparent) 55%, ${BRAND})` }}
        />

        <div className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-[#121214]/90 px-4 py-3 backdrop-blur lg:hidden">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="فتح القائمة"
              aria-expanded={navOpen}
              className="rounded-xl border border-white/15 px-3 py-1.5 text-lg leading-none"
            >
              ☰
            </button>
            <span className="min-w-0 flex-1 truncate font-extrabold" style={{ color: BRAND }}>
              {TAB[tab].label}
            </span>
            <Chip label="منصّة" tone="brand" />
          </header>

          <main className="mx-auto w-full max-w-5xl px-5 py-6 lg:px-10 lg:py-10">
            <div className="mb-6">
              <h1 className="text-2xl font-black">{TAB[tab].label}</h1>
              <p className="mt-1 text-sm text-[#a6a6a3]">{TAB[tab].hint}</p>
            </div>

            {tab === "overview" && <Overview key={nonce} token={t} />}
            {tab === "restaurants" && <Restaurants key={nonce} token={t} />}
            {tab === "accounts" && <Accounts key={nonce} token={t} />}
            {tab === "billing" && <Billing key={nonce} token={t} />}
            {tab === "orders" && <OrdersFeed key={nonce} token={t} />}
            {tab === "audit" && <Audit key={nonce} token={t} />}
          </main>
        </div>
      </div>
    </div>
  );
}
