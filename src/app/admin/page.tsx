"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { ORDER_TYPE_LABEL, type OrderType } from "@/lib/types";
import { PLAN_INFO } from "@/lib/plans";
import { platformSession } from "@/lib/platform";
import { MenuEditor } from "./MenuEditor";
import { Tables } from "./Tables";
import { Stats } from "./Stats";
import { Reviews } from "./Reviews";
import { Store } from "./Store";
import { Settings } from "./Settings";
import type { Rest } from "./ui";

type Line = { name: string; qty: number; unit_price: number };
type Order = {
  id: string;
  order_seq: number;
  order_type: OrderType;
  table_label: string | null;
  customer_name: string | null;
  phone: string | null;
  address: string | null;
  note: string | null;
  total: number;
  status: string;
  created_at: string;
  lines: Line[];
};
type Booking = {
  id: string;
  name: string;
  phone: string;
  res_date: string;
  res_time: string;
  guests: number;
  note: string | null;
  status: string;
};

const TAB = {
  orders: "الطلبات",
  bookings: "الحجوزات",
  menu: "المنيو",
  tables: "الطاولات",
  stats: "الإحصائيات",
  reviews: "التقييمات",
  store: "المتجر",
  settings: "الإعدادات",
} as const;

type TabKey = keyof typeof TAB;

const ICON: Record<TabKey, string> = {
  orders: "🛎️",
  bookings: "📅",
  menu: "📖",
  tables: "🪑",
  stats: "📊",
  reviews: "⭐",
  store: "🧩",
  settings: "⚙️",
};

const HINT: Record<TabKey, string> = {
  orders: "الطلبات الواردة من المنيو، فوريّة",
  bookings: "حجوزات الطاولات القادمة من صفحة المنيو",
  menu: "الأقسام والأصناف والأسعار والصور",
  tables: "طاولات المطعم ورمز QR الخاص بكل طاولة",
  stats: "الزيارات والطلبات خلال آخر ٦٠ يوماً",
  reviews: "آراء الزبائن على صفحة المنيو",
  store: "تطبيقات إضافية تفعّلها على منيوك",
  settings: "هوية المطعم والباقة والإعدادات العامة",
};

export default function AdminPage() {
  const router = useRouter();
  const client = sb();
  const [rests, setRests] = useState<Rest[]>([]);
  const [cur, setCur] = useState<Rest | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<TabKey>("orders");
  const [navOpen, setNavOpen] = useState(false);
  const [loading, setLoading] = useState(Boolean(client));
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(
    async (r: Rest) => {
      if (!client) return;
      const [{ data: ords }, { data: bks }] = await Promise.all([
        client.from("orders").select("*").eq("restaurant_id", r.id).order("created_at", { ascending: false }).limit(60),
        client.from("reservations").select("*").eq("restaurant_id", r.id).order("res_date").order("res_time").limit(60),
      ]);
      const ids = (ords ?? []).map((o) => o.id);
      const { data: items } = ids.length
        ? await client.from("order_items").select("order_id, name, qty, unit_price").in("order_id", ids)
        : { data: [] as { order_id: string; name: string; qty: number; unit_price: number }[] };
      setOrders(
        (ords ?? []).map((o) => ({ ...o, lines: (items ?? []).filter((i) => i.order_id === o.id).map(({ name, qty, unit_price }) => ({ name, qty, unit_price })) })) as Order[],
      );
      setBookings((bks ?? []) as Booking[]);
    },
    [client],
  );

  useEffect(() => {
    if (!client) return;
    (async () => {
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) return router.replace("/sign-in");
      // restaurants rows are publicly readable (the menu needs them), so filter to
      // what this account actually manages: owned + co-admin memberships
      const [{ data: owned }, { data: memberships }] = await Promise.all([
        client.from("restaurants").select("*").eq("owner", auth.user.id),
        client.from("restaurant_admins").select("restaurant_id").eq("user_id", auth.user.id),
      ]);
      const ids = (memberships ?? []).map((m) => m.restaurant_id).filter((id) => !(owned ?? []).some((r) => r.id === id));
      const { data: managed } = ids.length ? await client.from("restaurants").select("*").in("id", ids) : { data: [] };
      const list = [...(owned ?? []), ...(managed ?? [])].sort((a, b) => a.name.localeCompare(b.name)) as Rest[];
      // حساب مدير المنصّة لا يملك مطعماً — مكانه /root لا هنا
      if (!list.length) {
        const token = (await client.auth.getSession()).data.session?.access_token;
        if (token) {
          const me = await platformSession(token);
          if ("ok" in me && me.ok) return router.replace("/root");
        }
      }
      setRests(list);
      if (list[0]) {
        setCur(list[0]);
        await loadData(list[0]);
      }
      setLoading(false);
    })();
  }, [client, router, loadData]);

  // live: new orders/reservations appear without refresh (needs 0005 realtime publication)
  useEffect(() => {
    if (!client || !cur) return;
    const ping = (msg: string, r: Rest) => {
      setToast(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 5000);
      void loadData(r);
    };
    const ch = client
      .channel(`live-${cur.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_id=eq.${cur.id}` }, () => ping("🛎️ طلب جديد وصل الآن", cur))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reservations", filter: `restaurant_id=eq.${cur.id}` }, () => ping("📅 حجز جديد وصل الآن", cur))
      .subscribe();
    return () => {
      void client.removeChannel(ch);
    };
  }, [client, cur, loadData]);

  async function patch(fields: Partial<Rest>) {
    if (!client || !cur) return;
    const next = { ...cur, ...fields };
    setCur(next);
    setRests((rs) => rs.map((r) => (r.id === next.id ? next : r)));
    const { error } = await client.from("restaurants").update(fields).eq("id", cur.id);
    if (error) setErr(error.message);
  }

  async function setStatus(table: "orders" | "reservations", id: string, status: string) {
    if (!client) return;
    if (table === "orders") setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    else setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status } : b)));
    const { error } = await client.from(table).update({ status }).eq("id", id);
    if (error) setErr(error.message);
  }

  if (!client)
    return (
      <Shell>
        <p className="text-center text-[#a6a6a3]">
          لوحة الإدارة تحتاج قاعدة بيانات. أضف متغيّرات Supabase في <span dir="ltr">.env.local</span> ثم أعد التشغيل.
        </p>
      </Shell>
    );
  if (loading) return <Shell><p className="text-center text-[#a6a6a3]">جارٍ التحميل…</p></Shell>;
  if (!cur)
    return (
      <Shell>
        <p className="text-center text-[#a6a6a3]">لا يوجد مطعم مرتبط بهذا الحساب.</p>
        <p className="mt-2 text-center text-sm text-[#a6a6a3]">
          إن كنت صاحب مطعم فسجّل دخولك بالحساب الصحيح، أو{" "}
          <Link href="/sign-up" className="font-bold underline">أنشئ منيو مطعمك</Link>.
        </p>
        <button onClick={() => client.auth.signOut().then(() => router.replace("/sign-in"))} className="mx-auto mt-4 block rounded-xl border border-white/15 px-4 py-2 text-sm font-bold">خروج</button>
      </Shell>
    );

  const money = (n: number) => `${n.toLocaleString("en-US")} ${cur.currency}`;
  const accent = cur.primary_color;
  const planLabel = PLAN_INFO[cur.plan]?.label ?? cur.plan;
  const signOut = () => client.auth.signOut().then(() => router.replace("/sign-in"));
  const pendingOf = (k: TabKey) =>
    k === "orders" ? orders.filter((o) => o.status === "pending").length : k === "bookings" ? bookings.filter((b) => b.status === "pending").length : 0;

  return (
    // ponytail: app-shell owns the scroll (h-dvh + overflow-hidden) because globals.css
    // sets `body { overflow-x: hidden }`, which makes body a scrollport and kills
    // `position: sticky` for anything under it. Fix that CSS and this can go back to sticky.
    <div dir="rtl" className="flex h-dvh overflow-hidden bg-[#121214] text-[#f2f2f0]">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-extrabold text-[#0d0d0d] shadow-lg" style={{ background: accent }}>
          {toast}
        </div>
      )}

      {/* mobile backdrop */}
      {navOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* ————— sidebar (inline-start = right in RTL) ————— */}
      <aside
        className={`fixed bottom-0 start-0 top-0 z-40 flex w-[264px] max-w-[84vw] flex-col overflow-y-auto border-e border-white/10 bg-[#161618] transition-transform duration-300 lg:static lg:w-[248px] lg:max-w-none lg:shrink-0 lg:translate-x-0 ${navOpen ? "translate-x-0" : "pointer-events-none translate-x-full lg:pointer-events-auto"}`}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5 px-4 pb-4 pt-5">
          <span className="flex size-9 items-center justify-center rounded-[11px] text-lg font-black text-white" style={{ background: "var(--grad)" }}>+</span>
          <span className="text-xl font-black leading-none">منيو بلس</span>
        </Link>

        <div className="mx-3 shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2.5">
            {cur.logo_url ? (
              <span className="size-10 shrink-0 rounded-xl bg-white/5 bg-cover bg-center" style={{ backgroundImage: `url("${cur.logo_url}")` }} />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-black text-[#0d0d0d]" style={{ background: accent }}>
                {cur.name.trim().charAt(0)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{cur.name}</p>
              <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black text-[#a6a6a3]">{planLabel}</span>
            </div>
          </div>

          {rests.length > 1 && (
            <select
              value={cur.id}
              onChange={async (e) => {
                const r = rests.find((x) => x.id === e.target.value)!;
                setCur(r);
                await loadData(r);
              }}
              className="mt-3 w-full rounded-xl border border-white/15 bg-[#1b1b1e] px-2.5 py-2 text-xs font-bold"
            >
              {rests.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}

          <a
            href={`/${cur.slug}`}
            target="_blank"
            className="mt-3 block rounded-xl border border-white/10 py-1.5 text-center text-xs font-bold text-[#a6a6a3] transition hover:border-white/25 hover:text-[#f2f2f0]"
          >
            عرض المنيو ↗
          </a>
        </div>

        <nav className="mt-4 shrink-0 space-y-1 px-3">
          {(Object.keys(TAB) as TabKey[]).map((k) => {
            const on = tab === k;
            const n = pendingOf(k);
            return (
              <button
                key={k}
                onClick={() => {
                  setTab(k);
                  setNavOpen(false);
                }}
                aria-current={on ? "page" : undefined}
                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-extrabold transition ${on ? "" : "text-[#a6a6a3] hover:bg-white/5 hover:text-[#f2f2f0]"}`}
                style={on ? { background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent } : undefined}
              >
                {on && <span className="absolute bottom-2 start-0 top-2 w-[3px] rounded-full" style={{ background: accent }} />}
                <span className="text-base leading-none">{ICON[k]}</span>
                <span className="flex-1 text-start">{TAB[k]}</span>
                {n > 0 && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-black text-[#0d0d0d]" style={{ background: accent }}>{n}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto shrink-0 p-3 pt-6">
          <div className="flex gap-2">
            <button onClick={() => loadData(cur)} className="flex-1 rounded-xl border border-white/15 py-2 text-xs font-bold transition hover:bg-white/5">تحديث</button>
            <button onClick={signOut} className="flex-1 rounded-xl border border-white/15 py-2 text-xs font-bold transition hover:bg-white/5">خروج</button>
          </div>
          <p className="mt-3 text-center text-[10px] text-[#a6a6a3]" dir="ltr">menuplus.rest</p>
        </div>
      </aside>

      {/* ————— content ————— */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-[#121214]/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="فتح القائمة"
            aria-expanded={navOpen}
            className="rounded-xl border border-white/15 px-3 py-1.5 text-lg leading-none"
          >
            ☰
          </button>
          <span className="min-w-0 flex-1 truncate font-extrabold" style={{ color: accent }}>{cur.name}</span>
          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-[#a6a6a3]">{planLabel}</span>
        </header>

        <main className="mx-auto w-full max-w-3xl px-5 py-6 lg:px-10 lg:py-10">
          <div className="mb-6">
            <h1 className="text-2xl font-black">{TAB[tab]}</h1>
            <p className="mt-1 text-sm text-[#a6a6a3]">{HINT[tab]}</p>
          </div>

          {err && <p className="mb-3 text-sm text-red-400">{err}</p>}

          {tab === "orders" && (
            <ul className="space-y-3">
              {!orders.length && <li className="text-[#a6a6a3]">لا توجد طلبات بعد.</li>}
              {orders.map((o) => (
                <li key={o.id} className="rounded-2xl border border-white/10 bg-[#1b1b1e] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-lg font-extrabold" style={{ color: accent }}>#{o.order_seq} · {ORDER_TYPE_LABEL[o.order_type] ?? o.order_type}</span>
                    <span className="text-sm text-[#a6a6a3]">{new Date(o.created_at).toLocaleString("en-GB")}</span>
                  </div>
                  <p className="mt-1 text-sm text-[#a6a6a3]">
                    {o.table_label ? `طاولة ${o.table_label} · ` : ""}
                    {o.customer_name ? `${o.customer_name} · ` : ""}
                    {o.phone ? <span dir="ltr">{o.phone}</span> : "بلا رقم"}
                  </p>
                  {o.address && <p className="mt-1 text-sm">📍 {o.address}</p>}
                  {o.note && <p className="mt-1 text-sm">📝 {o.note}</p>}
                  <ul className="mt-2 space-y-0.5 text-sm">
                    {o.lines.map((l, i) => (
                      <li key={i} className="flex justify-between border-b border-white/5 py-1">
                        <span>{l.qty}× {l.name}</span>
                        <span className="text-[#a6a6a3]">{money(l.unit_price * l.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-extrabold" style={{ color: accent }}>{money(o.total)}</span>
                    {o.status === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => setStatus("orders", o.id, "done")} className="rounded-xl px-3 py-1.5 text-sm font-bold text-[#0d0d0d]" style={{ background: accent }}>تم التنفيذ</button>
                        <button onClick={() => setStatus("orders", o.id, "cancelled")} className="rounded-xl border border-white/15 px-3 py-1.5 text-sm font-bold">إلغاء</button>
                      </div>
                    ) : (
                      <span className="text-sm text-[#a6a6a3]">{o.status === "done" ? "✓ تم" : "ملغي"}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {tab === "bookings" && (
            <ul className="space-y-3">
              {!bookings.length && <li className="text-[#a6a6a3]">لا توجد حجوزات.</li>}
              {bookings.map((b) => (
                <li key={b.id} className="rounded-2xl border border-white/10 bg-[#1b1b1e] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold">{b.name} · {b.guests} أشخاص</span>
                    <span className="font-bold" style={{ color: accent }}>{b.res_date} · {b.res_time.slice(0, 5)}</span>
                  </div>
                  <p className="mt-1 text-sm text-[#a6a6a3]" dir="ltr">{b.phone}</p>
                  {b.note && <p className="mt-1 text-sm">📝 {b.note}</p>}
                  <div className="mt-3 flex justify-end">
                    {b.status === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => setStatus("reservations", b.id, "confirmed")} className="rounded-xl px-3 py-1.5 text-sm font-bold text-[#0d0d0d]" style={{ background: accent }}>تأكيد</button>
                        <button onClick={() => setStatus("reservations", b.id, "cancelled")} className="rounded-xl border border-white/15 px-3 py-1.5 text-sm font-bold">رفض</button>
                      </div>
                    ) : (
                      <span className="text-sm text-[#a6a6a3]">{b.status === "confirmed" ? "✓ مؤكّد" : "ملغي"}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {tab === "menu" && <MenuEditor key={cur.id} client={client} restaurantId={cur.id} currency={cur.currency} accent={accent} plan={cur.plan} languages={cur.languages ?? ["ar"]} />}

          {tab === "tables" && <Tables key={cur.id} client={client} rest={cur} accent={accent} />}

          {tab === "stats" && <Stats key={cur.id} client={client} restaurantId={cur.id} currency={cur.currency} accent={accent} />}

          {tab === "reviews" && <Reviews key={cur.id} client={client} restaurantId={cur.id} accent={accent} />}

          {tab === "store" && <Store key={cur.id} client={client} rest={cur} accent={accent} onPatch={patch} />}

          {tab === "settings" && <Settings key={cur.id} client={client} cur={cur} patch={patch} accent={accent} />}
        </main>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main dir="rtl" className="min-h-dvh bg-[#121214] p-5 text-[#f2f2f0]">
      <div className="mx-auto max-w-3xl py-6">{children}</div>
    </main>
  );
}
