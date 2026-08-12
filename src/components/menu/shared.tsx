"use client";

/** Shared brain for all 6 menu templates: state (cart/order/booking/review),
 *  language, tracking, and every modal. Templates are layout-only — they call
 *  useMenu() and render; MenuModals/CartBar are mounted once by the dispatcher. */

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Category, Lang, MenuData, MenuItem, OrderType, Restaurant } from "@/lib/types";
import { DAY_NAMES, isOpenNow, orderProblem, reviewProblem, reservationProblem, tr } from "@/lib/types";
import { can, hasApp } from "@/lib/plans";
import { placeOrder, reserveTable, submitReview, trackVisit } from "@/lib/actions";

/* ————— UI strings ————— */
const UI = {
  ar: {
    menu: "المنيو", table: "طاولة", viewCart: "عرض السلة", cart: "سلة الطلب", total: "الإجمالي",
    checkout: "إتمام الطلب", sending: "جارٍ الإرسال…", addToCart: "أضف للسلة", name: "الاسم",
    phone: "رقم الهاتف", phoneOpt: "رقم الهاتف (اختياري)", address: "عنوان التوصيل (الحي، الشارع، أقرب نقطة دالة)",
    note: "ملاحظة", orderSent: "تم إرسال طلبك", orderNo: "رقم الطلب", another: "طلب آخر",
    reserve: "احجز طاولة", date: "التاريخ", time: "الوقت", guests: "عدد الأشخاص",
    confirmRes: "تأكيد الحجز", resSent: "تم استلام طلب الحجز", resCallback: "سيتواصل معك المطعم للتأكيد.",
    ok: "تمام", open: "مفتوح الآن", closed: "مغلق", rate: "قيّم تجربتك", comment: "تعليق (اختياري)",
    send: "إرسال", thanks: "شكراً لتقييمك!", reviewNote: "يظهر تقييمك بعد موافقة المطعم.",
    about: "نبذة عنا", hoursTitle: "أوقات العمل", back: "رجوع", poweredBy: "يعمل بواسطة منيو بلس",
    makeYours: "أنشئ منيو مطعمك مجاناً على منيو بلس", health: "الإجازة الصحية",
    dine_in: "صالة", delivery: "دلفري", takeaway: "سفري", resNote: "ملاحظة (مناسبة، طاولة بالخارج…)",
  },
  en: {
    menu: "Menu", table: "Table", viewCart: "View cart", cart: "Your order", total: "Total",
    checkout: "Place order", sending: "Sending…", addToCart: "Add to cart", name: "Name",
    phone: "Phone number", phoneOpt: "Phone (optional)", address: "Delivery address",
    note: "Note", orderSent: "Order sent", orderNo: "Order number", another: "New order",
    reserve: "Book a table", date: "Date", time: "Time", guests: "Guests",
    confirmRes: "Confirm booking", resSent: "Booking received", resCallback: "The restaurant will call to confirm.",
    ok: "Done", open: "Open now", closed: "Closed", rate: "Rate us", comment: "Comment (optional)",
    send: "Send", thanks: "Thanks for your review!", reviewNote: "Your review appears after approval.",
    about: "About us", hoursTitle: "Opening hours", back: "Back", poweredBy: "Powered by MenuPlus",
    makeYours: "Create your restaurant menu free on MenuPlus", health: "Health certificate",
    dine_in: "Dine-in", delivery: "Delivery", takeaway: "Takeaway", resNote: "Note (occasion, outdoor table…)",
  },
  ckb: {
    menu: "مینیو", table: "مێز", viewCart: "بینینی سەبەتە", cart: "سەبەتەی داواکاری", total: "کۆی گشتی",
    checkout: "تەواوکردنی داواکاری", sending: "ناردن…", addToCart: "زیادکردن بۆ سەبەتە", name: "ناو",
    phone: "ژمارەی مۆبایل", phoneOpt: "ژمارەی مۆبایل (ئارەزوومەندانە)", address: "ناونیشانی گەیاندن",
    note: "تێبینی", orderSent: "داواکاریەکەت نێردرا", orderNo: "ژمارەی داواکاری", another: "داواکاری نوێ",
    reserve: "مێز حیجز بکە", date: "بەروار", time: "کات", guests: "ژمارەی کەسان",
    confirmRes: "پشتڕاستکردنەوە", resSent: "حیجزەکە وەرگیرا", resCallback: "چێشتخانەکە پەیوەندیت پێوە دەکات.",
    ok: "باشە", open: "ئێستا کراوەیە", closed: "داخراوە", rate: "هەڵسەنگاندن", comment: "تێبینی (ئارەزوومەندانە)",
    send: "ناردن", thanks: "سوپاس بۆ هەڵسەنگاندنەکەت!", reviewNote: "هەڵسەنگاندنەکەت دوای پەسەندکردن دەردەکەوێت.",
    about: "دەربارەی ئێمە", hoursTitle: "کاتەکانی کارکردن", back: "گەڕانەوە", poweredBy: "بە منيو بلس کاردەکات",
    makeYours: "مینیوی چێشتخانەکەت بە خۆڕایی دروست بکە", health: "مۆڵەتی تەندروستی",
    dine_in: "لە هۆڵ", delivery: "گەیاندن", takeaway: "لەگەڵ بردن", resNote: "تێبینی",
  },
} as const;
export type UIKey = keyof typeof UI.ar;

export const TYPE_ICON: Record<OrderType, string> = { dine_in: "🍽️", delivery: "🛵", takeaway: "🥡" };

/** dark vars used by the shared modals (independent of template skin) */
export const DARK: CSSProperties = {
  "--accent": "#d18b4a",
  "--panel": "#1e1e21",
  "--panelsoft": "#19191c",
  "--text": "#f2f2f0",
  "--muted": "#a6a6a3",
  "--line": "rgba(255,255,255,0.09)",
  "--activeink": "#141414",
} as CSSProperties;

type Line = { key: string; item_id: string; variant_id: string | null; name: string; unit_price: number; qty: number };

type Ctx = {
  data: MenuData;
  r: Restaurant;
  cats: Category[];
  table: string | null;
  accent: string;
  /* language */
  lang: Lang;
  setLang: (l: Lang) => void;
  langs: Lang[];
  dir: "rtl" | "ltr";
  t: (k: UIKey) => string;
  name: (o: { name: string; i18n: MenuData["restaurant"]["i18n"] }) => string;
  desc: (it: MenuItem) => string | null;
  rName: string;
  rTagline: string | null;
  money: (n: number) => string;
  /* capabilities (plan ∩ toggles) */
  ordering: boolean;
  booking: boolean;
  reviewsOn: boolean;
  showBranding: boolean;
  showAd: boolean;
  openNow: boolean | null;
  /** true inside the landing/admin preview frames — images must not lazy-load there */
  eager: boolean;
  /* cart */
  lines: Line[];
  count: number;
  total: number;
  onPlus: (it: MenuItem) => void;
  step: (key: string, d: number) => void;
  /* ui */
  openItem: (it: MenuItem) => void;
  setCartOpen: (b: boolean) => void;
  openReserve: () => void;
  openReview: () => void;
  openInfo: () => void;
  hasInfo: boolean;
  selectCat: (c: Category) => void;
  /* internal for MenuModals/CartBar */
  _s: ReturnType<typeof useMenuState>;
};

const MenuCtx = createContext<Ctx | null>(null);
export const useMenu = () => useContext(MenuCtx)!;

function useMenuState() {
  const [cart, setCart] = useState<Record<string, Line>>({});
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [modalVar, setModalVar] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [otype, setOtype] = useState<OrderType>("dine_in");
  const [cname, setCname] = useState("");
  const [address, setAddress] = useState("");
  const [resOpen, setResOpen] = useState(false);
  const [res, setRes] = useState({ name: "", phone: "", date: "", time: "", guests: 2, note: "" });
  const [today, setToday] = useState("");
  const [resDone, setResDone] = useState<string | null>(null);
  const [revOpen, setRevOpen] = useState(false);
  const [rev, setRev] = useState({ stars: 0, name: "", comment: "" });
  const [revDone, setRevDone] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  return {
    cart, setCart, modalItem, setModalItem, modalVar, setModalVar, cartOpen, setCartOpen,
    phone, setPhone, note, setNote, busy, setBusy, confirmed, setConfirmed, err, setErr,
    otype, setOtype, cname, setCname, address, setAddress,
    resOpen, setResOpen, res, setRes, today, setToday, resDone, setResDone,
    revOpen, setRevOpen, rev, setRev, revDone, setRevDone, infoOpen, setInfoOpen,
  };
}

export function MenuProvider({ data, table, children }: { data: MenuData; table: string | null; children: ReactNode }) {
  const r = data.restaurant;
  const s = useMenuState();
  const langs = useMemo<Lang[]>(
    () => (can(r.plan, "languages") ? (["ar", "en", "ckb"] as Lang[]).filter((l) => r.languages.includes(l)) : ["ar"]),
    [r.plan, r.languages],
  );
  const [lang, setLang] = useState<Lang>("ar");
  // preview frames (landing showcase, admin picker) are small and offscreen —
  // lazy images would never fetch there, so render them eagerly
  const [eager, setEager] = useState(false);
  useEffect(() => {
    (async () => {
      if (new URLSearchParams(window.location.search).has("preview")) setEager(true);
    })();
  }, []);
  const t = (k: UIKey) => UI[lang][k] ?? UI.ar[k];

  const ordering = r.ordering && can(r.plan, "ordering");
  const booking = r.reservations && hasApp(r, "booking");
  const reviewsOn = can(r.plan, "reviews");
  const openNow = can(r.plan, "hours") ? isOpenNow(r.hours) : null;

  // visit tracking (server action → service-role rpc); dedupe per day / per session
  const tracked = useRef(new Set<string>());
  useEffect(() => {
    const key = `mpv-${r.slug}-${new Date().toDateString()}`;
    if (r.id && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      void trackVisit(r.id, "menu");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.id]);
  const track = (kind: "cat" | "item", ref: string) => {
    const k = `${kind}:${ref}`;
    if (tracked.current.has(k)) return;
    tracked.current.add(k);
    void trackVisit(r.id, kind, ref);
  };

  const lines = Object.values(s.cart);
  const value: Ctx = {
    data,
    r,
    cats: data.categories,
    table,
    accent: r.primary_color,
    lang,
    setLang,
    langs,
    dir: lang === "en" ? "ltr" : "rtl",
    t,
    name: (o) => tr(o.i18n, lang, "name", o.name) ?? o.name,
    desc: (it) => tr(it.i18n, lang, "description", it.description),
    rName: tr(r.i18n, lang, "name", r.name) ?? r.name,
    rTagline: can(r.plan, "about") ? tr(r.i18n, lang, "tagline", r.tagline) : null,
    money: (n) => `${n.toLocaleString("en-US")} ${r.currency}`,
    ordering,
    booking,
    reviewsOn,
    showBranding: !(r.hide_branding && can(r.plan, "hide_branding")),
    showAd: !can(r.plan, "no_ads"),
    openNow,
    eager,
    lines,
    count: lines.reduce((n, l) => n + l.qty, 0),
    total: lines.reduce((n, l) => n + l.unit_price * l.qty, 0),
    onPlus: (it) => {
      if (!ordering) return;
      if (it.variants.length > 0) {
        s.setModalItem(it);
        s.setModalVar(it.variants[0]?.id ?? null);
      } else {
        s.setCart((c) => ({
          ...c,
          [it.id]: { key: it.id, item_id: it.id, variant_id: null, name: tr(it.i18n, lang, "name", it.name) ?? it.name, unit_price: it.price, qty: (c[it.id]?.qty ?? 0) + 1 },
        }));
      }
    },
    step: (key, d) =>
      s.setCart((c) => {
        const l = c[key];
        if (!l) return c;
        const qty = l.qty + d;
        if (qty <= 0) {
          const n = { ...c };
          delete n[key];
          return n;
        }
        return { ...c, [key]: { ...l, qty } };
      }),
    openItem: (it) => {
      track("item", it.name);
      s.setModalItem(it);
      s.setModalVar(it.variants[0]?.id ?? null);
    },
    setCartOpen: s.setCartOpen,
    openReserve: () => {
      s.setToday(new Date().toLocaleDateString("en-CA"));
      s.setErr(null);
      s.setResOpen(true);
    },
    openReview: () => {
      s.setErr(null);
      s.setRevOpen(true);
    },
    openInfo: () => s.setInfoOpen(true),
    hasInfo: Boolean((can(r.plan, "about") && r.about) || (can(r.plan, "hours") && r.hours) || Object.keys(r.socials).length || (can(r.plan, "health_badge") && r.health_cert)),
    selectCat: (c) => track("cat", c.name),
    _s: s,
  };

  return (
    <MenuCtx.Provider value={value}>
      <div dir={value.dir}>{children}</div>
    </MenuCtx.Provider>
  );
}

/* ————— small shared pieces templates can use ————— */

const isGradient = (u: string) => u.startsWith("linear-gradient") || u.startsWith("radial-gradient");

/** cover image/gradient — auto-advancing when multiple */
export function CoverHero({ rounded = true, h = "h-40 sm:h-56" }: { rounded?: boolean; h?: string }) {
  const { r } = useMenu();
  const covers = r.covers;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (covers.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % covers.length), 4000);
    return () => clearInterval(id);
  }, [covers.length]);
  if (!covers.length) return null;
  const c = covers[i];
  return (
    <div className={`relative w-full overflow-hidden ${rounded ? "rounded-3xl" : ""} ${h}`}>
      {isGradient(c) ? (
        <div className="h-full w-full" style={{ background: c }} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c} alt="" className="h-full w-full object-cover" />
      )}
      {covers.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {covers.map((_, j) => (
            <span key={j} className={`h-1.5 rounded-full bg-white transition-all ${j === i ? "w-5" : "w-1.5 opacity-50"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/** active promotions strip */
export function PromoStrip() {
  const { data, r, accent } = useMenu();
  if (!data.promos.length || !hasApp(r, "promos")) return null;
  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
      {data.promos.map((p) => (
        <div key={p.id} className="relative min-w-[240px] flex-1 overflow-hidden rounded-2xl p-4 text-white" style={{ background: p.image_url ?? `linear-gradient(120deg, ${accent}, #00000088)` }}>
          <p className="text-[15px] font-black leading-snug">{p.title}</p>
          {p.description && <p className="mt-1 text-[12px] font-bold opacity-85">{p.description}</p>}
        </div>
      ))}
    </div>
  );
}

export function HoursBadge({ className = "" }: { className?: string }) {
  const { openNow, t } = useMenu();
  if (openNow === null) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-black ${className}`} style={{ background: openNow ? "rgba(34,193,132,.15)" : "rgba(224,90,90,.15)", color: openNow ? "#22c184" : "#e05a5a" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
      {openNow ? t("open") : t("closed")}
    </span>
  );
}

export function LangSwitch({ className = "" }: { className?: string }) {
  const { langs, lang, setLang } = useMenu();
  if (langs.length < 2) return null;
  return (
    <div className={`flex gap-1 rounded-full p-1 ${className}`} style={{ background: "rgba(127,127,127,.15)" }}>
      {langs.map((l) => (
        <button key={l} onClick={() => setLang(l)} className={`rounded-full px-3 py-1 text-[12px] font-black transition ${lang === l ? "bg-white text-black shadow" : "opacity-70"}`}>
          {l === "ar" ? "ع" : l === "en" ? "EN" : "کو"}
        </button>
      ))}
    </div>
  );
}

export function RatingBadge({ className = "" }: { className?: string }) {
  const { data, reviewsOn, openReview } = useMenu();
  if (!reviewsOn) return null;
  return (
    <button onClick={openReview} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-black ${className}`} style={{ background: "rgba(250,190,50,.15)", color: "#eab308" }}>
      ★ {data.rating ? `${data.rating.avg} (${data.rating.count})` : "—"}
    </button>
  );
}

const SOCIAL_ICON: Record<string, string> = { instagram: "📸", whatsapp: "💬", facebook: "👍", tiktok: "🎵" };
export function SocialRow({ className = "" }: { className?: string }) {
  const { r } = useMenu();
  const entries = Object.entries(r.socials).filter(([, v]) => v);
  if (!entries.length) return null;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {entries.map(([k, v]) => (
        <a key={k} href={v} target="_blank" rel="noreferrer" aria-label={k} className="flex h-8 w-8 items-center justify-center rounded-full text-[14px]" style={{ background: "rgba(127,127,127,.15)" }}>
          {SOCIAL_ICON[k] ?? "🔗"}
        </a>
      ))}
    </div>
  );
}

/** «يعمل بواسطة منيو بلس» + free-plan upgrade strip. Templates render this at
 *  the bottom of their scroll content. */
export function BrandingFooter() {
  const { showBranding, showAd, t } = useMenu();
  if (!showBranding && !showAd) return null;
  return (
    <div className="px-4 pb-6 pt-4 text-center">
      {showAd && (
        <Link href="/" className="mb-2 block rounded-xl px-4 py-2.5 text-[12px] font-black text-white" style={{ background: "linear-gradient(120deg,#10b3a3,#0d8a7e)" }}>
          ✦ {t("makeYours")}
        </Link>
      )}
      {showBranding && (
        <Link href="/" className="text-[11px] font-bold opacity-50">
          {t("poweredBy")} · menuplus.rest
        </Link>
      )}
    </div>
  );
}

/* ————— fixed cart bar + all modals (mounted once by the dispatcher) ————— */

export function CartBar() {
  const { ordering, count, total, money, accent, t, _s } = useMenu();
  if (!ordering || count === 0 || _s.cartOpen || _s.confirmed || _s.modalItem) return null;
  return (
    <button onClick={() => _s.setCartOpen(true)} className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4 font-extrabold shadow-lg" style={{ background: accent, color: "#141414" }}>
      <span>🛒 {t("viewCart")} ({count})</span>
      <span>{money(total)}</span>
    </button>
  );
}

export function MenuModals() {
  const m = useMenu();
  const { r, t, accent, money, _s: s } = m;
  const field = "w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5 text-sm outline-none";

  const modalPrice = s.modalItem ? (s.modalItem.variants.find((v) => v.id === s.modalVar)?.price ?? s.modalItem.price) : 0;

  function addFromModal() {
    const it = s.modalItem!;
    const vr = it.variants.find((v) => v.id === s.modalVar) ?? null;
    const key = vr ? `${it.id}|${vr.id}` : it.id;
    const nm = (m.name(it) ?? it.name) + (vr ? ` — ${vr.name}` : "");
    s.setCart((c) => ({ ...c, [key]: { key, item_id: it.id, variant_id: vr?.id ?? null, name: nm, unit_price: vr?.price ?? it.price, qty: (c[key]?.qty ?? 0) + 1 } }));
    s.setModalItem(null);
  }

  async function checkout() {
    if (!m.lines.length || s.busy) return;
    const problem = orderProblem({ orderType: s.otype, phone: s.phone, address: s.address });
    if (problem) return s.setErr(problem);
    s.setBusy(true);
    s.setErr(null);
    const res = await placeOrder({
      restaurantId: r.id,
      table: m.table,
      lines: m.lines.map((l) => ({ item_id: l.item_id, variant_id: l.variant_id, name: l.name, qty: l.qty, unit_price: l.unit_price })),
      phone: s.phone.trim() || null,
      note: s.note.trim() || null,
      orderType: s.otype,
      name: s.cname.trim() || null,
      address: s.otype === "delivery" ? s.address.trim() : null,
    });
    s.setBusy(false);
    if (!res.ok) return s.setErr(res.error);
    s.setCart({});
    s.setNote("");
    s.setPhone("");
    s.setAddress("");
    s.setCname("");
    s.setCartOpen(false);
    s.setConfirmed(res.orderNumber);
  }

  async function sendReservation() {
    if (s.busy) return;
    const problem = reservationProblem(s.res);
    if (problem) return s.setErr(problem);
    s.setBusy(true);
    s.setErr(null);
    const res = await reserveTable({ restaurantId: r.id, ...s.res, note: s.res.note.trim() || null });
    s.setBusy(false);
    if (!res.ok) return s.setErr(res.error);
    s.setResOpen(false);
    s.setResDone(`${s.res.date} · ${s.res.time} · ${s.res.guests}`);
    s.setRes({ name: "", phone: "", date: "", time: "", guests: 2, note: "" });
  }

  async function sendReview() {
    if (s.busy) return;
    const problem = reviewProblem(s.rev);
    if (problem) return s.setErr(problem);
    s.setBusy(true);
    s.setErr(null);
    const res = await submitReview({ restaurantId: r.id, ...s.rev });
    s.setBusy(false);
    if (!res.ok) return s.setErr(res.error);
    s.setRevOpen(false);
    s.setRevDone(true);
    s.setRev({ stars: 0, name: "", comment: "" });
  }

  const types = r.order_types.length ? r.order_types : (["dine_in"] as OrderType[]);

  return (
    <>
      {/* item / size modal */}
      {s.modalItem && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center" onClick={() => s.setModalItem(null)}>
          <div style={DARK} className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[var(--panelsoft)] p-5 text-[var(--text)] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            {s.modalItem.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.modalItem.image_url} alt="" className="mb-4 h-44 w-full rounded-2xl object-cover" />
            )}
            <h2 className="text-lg font-extrabold">{m.name(s.modalItem)}</h2>
            {m.desc(s.modalItem) && <p className="mt-1 text-sm text-[var(--muted)]">{m.desc(s.modalItem)}</p>}
            {s.modalItem.variants.length > 0 && (
              <div className="mb-1 mt-4 flex flex-wrap gap-2">
                {s.modalItem.variants.map((v) => (
                  <button key={v.id} onClick={() => s.setModalVar(v.id)} className={`rounded-xl border px-4 py-2.5 font-bold ${s.modalVar === v.id ? "" : "border-[var(--line)]"}`} style={s.modalVar === v.id ? { background: accent, borderColor: accent, color: "#141414" } : undefined}>
                    {v.name} · {money(v.price)}
                  </button>
                ))}
              </div>
            )}
            {m.ordering ? (
              <button onClick={addFromModal} className="mt-4 w-full rounded-2xl py-4 text-lg font-extrabold" style={{ background: accent, color: "#141414" }}>
                {t("addToCart")} · {money(modalPrice)}
              </button>
            ) : (
              <p className="mt-4 text-center text-xl font-extrabold" style={{ color: accent }}>{money(modalPrice)}</p>
            )}
          </div>
        </div>
      )}

      {/* cart drawer */}
      {s.cartOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/60" onClick={() => s.setCartOpen(false)}>
          <div style={DARK} className="max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-[var(--panelsoft)] p-5 text-[var(--text)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 text-lg font-extrabold" style={{ color: accent }}>
              {t("cart")} {m.table ? `· ${t("table")} ${m.table}` : ""}
            </h2>
            <ul className="space-y-2">
              {m.lines.map((l) => (
                <li key={l.key} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{l.name}</p>
                    <p className="text-sm" style={{ color: accent }}>{money(l.unit_price * l.qty)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => m.step(l.key, -1)} className="rounded-full border border-[var(--line)] px-2.5 py-1 font-bold">−</button>
                    <span className="w-6 text-center font-bold">{l.qty}</span>
                    <button onClick={() => m.step(l.key, 1)} className="rounded-full border border-[var(--line)] px-2.5 py-1 font-bold">+</button>
                  </div>
                </li>
              ))}
            </ul>
            {types.length > 1 && (
              <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${types.length}, minmax(0,1fr))` }}>
                {types.map((ty) => (
                  <button key={ty} onClick={() => { s.setOtype(ty); s.setErr(null); }} className={`rounded-xl border py-3 text-sm font-extrabold ${s.otype === ty ? "" : "border-[var(--line)] text-[var(--text)]"}`} style={s.otype === ty ? { background: accent, borderColor: accent, color: "#141414" } : undefined}>
                    <span className="block text-lg">{TYPE_ICON[ty]}</span>
                    {t(ty)}
                  </button>
                ))}
              </div>
            )}
            {s.otype !== "dine_in" && <input value={s.cname} onChange={(e) => s.setCname(e.target.value)} placeholder={t("name")} className={`mt-3 ${field}`} />}
            <input value={s.phone} onChange={(e) => s.setPhone(e.target.value)} inputMode="tel" placeholder={s.otype === "dine_in" ? t("phoneOpt") : t("phone")} dir="ltr" className={`mt-2 ${field}`} />
            {s.otype === "delivery" && <textarea value={s.address} onChange={(e) => s.setAddress(e.target.value)} rows={2} placeholder={t("address")} className={`mt-2 ${field}`} />}
            <input value={s.note} onChange={(e) => s.setNote(e.target.value)} placeholder={t("note")} className={`mt-2 ${field}`} />
            {s.err && <p className="mt-2 text-sm text-red-400">{s.err}</p>}
            <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3">
              <span className="text-[var(--muted)]">{t("total")}</span>
              <span className="text-xl font-extrabold" style={{ color: accent }}>{money(m.total)}</span>
            </div>
            <button onClick={checkout} disabled={s.busy} className="mt-3 w-full rounded-2xl py-4 text-lg font-extrabold disabled:opacity-60" style={{ background: accent, color: "#141414" }}>
              {s.busy ? t("sending") : t("checkout")}
            </button>
          </div>
        </div>
      )}

      {/* order confirmed */}
      {s.confirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => s.setConfirmed(null)}>
          <div style={DARK} className="w-full max-w-sm rounded-3xl bg-[var(--panelsoft)] p-8 text-center text-[var(--text)]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex size-20 items-center justify-center rounded-full text-4xl" style={{ background: accent, color: "#141414" }}>✓</div>
            <h2 className="mt-4 text-2xl font-extrabold">{t("orderSent")}</h2>
            <p className="mt-2 text-[var(--muted)]">{t("orderNo")} · {t(s.otype)}</p>
            <p className="text-4xl font-extrabold" style={{ color: accent }}>{s.confirmed}</p>
            <button onClick={() => s.setConfirmed(null)} className="mt-5 w-full rounded-2xl border py-3 font-bold" style={{ borderColor: accent, color: accent }}>{t("another")}</button>
          </div>
        </div>
      )}

      {/* reservation */}
      {s.resOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center" onClick={() => s.setResOpen(false)}>
          <div style={DARK} className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[var(--panelsoft)] p-5 text-[var(--text)] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 text-lg font-extrabold" style={{ color: accent }}>{t("reserve")}</h2>
            <input value={s.res.name} onChange={(e) => s.setRes({ ...s.res, name: e.target.value })} placeholder={t("name")} className={field} />
            <input value={s.res.phone} onChange={(e) => s.setRes({ ...s.res, phone: e.target.value })} inputMode="tel" dir="ltr" placeholder={t("phone")} className={`mt-2 ${field}`} />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs text-[var(--muted)]">
                {t("date")}
                <input type="date" value={s.res.date} min={s.today} onChange={(e) => s.setRes({ ...s.res, date: e.target.value })} className={`mt-1 text-[var(--text)] ${field}`} />
              </label>
              <label className="text-xs text-[var(--muted)]">
                {t("time")}
                <input type="time" value={s.res.time} onChange={(e) => s.setRes({ ...s.res, time: e.target.value })} className={`mt-1 text-[var(--text)] ${field}`} />
              </label>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5">
              <span className="text-sm font-bold">{t("guests")}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => s.setRes({ ...s.res, guests: Math.max(1, s.res.guests - 1) })} className="rounded-full border border-[var(--line)] px-2.5 py-1 font-bold">−</button>
                <span className="w-6 text-center font-extrabold">{s.res.guests}</span>
                <button onClick={() => s.setRes({ ...s.res, guests: s.res.guests + 1 })} className="rounded-full border border-[var(--line)] px-2.5 py-1 font-bold">+</button>
              </div>
            </div>
            <input value={s.res.note} onChange={(e) => s.setRes({ ...s.res, note: e.target.value })} placeholder={t("resNote")} className={`mt-2 ${field}`} />
            {s.err && <p className="mt-2 text-sm text-red-400">{s.err}</p>}
            <button onClick={sendReservation} disabled={s.busy} className="mt-3 w-full rounded-2xl py-4 text-lg font-extrabold disabled:opacity-60" style={{ background: accent, color: "#141414" }}>
              {s.busy ? t("sending") : t("confirmRes")}
            </button>
          </div>
        </div>
      )}

      {s.resDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => s.setResDone(null)}>
          <div style={DARK} className="w-full max-w-sm rounded-3xl bg-[var(--panelsoft)] p-8 text-center text-[var(--text)]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex size-20 items-center justify-center rounded-full text-4xl" style={{ background: accent, color: "#141414" }}>✓</div>
            <h2 className="mt-4 text-2xl font-extrabold">{t("resSent")}</h2>
            <p className="mt-2 font-bold" style={{ color: accent }}>{s.resDone}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{t("resCallback")}</p>
            <button onClick={() => s.setResDone(null)} className="mt-5 w-full rounded-2xl border py-3 font-bold" style={{ borderColor: accent, color: accent }}>{t("ok")}</button>
          </div>
        </div>
      )}

      {/* review */}
      {s.revOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center" onClick={() => s.setRevOpen(false)}>
          <div style={DARK} className="w-full max-w-md rounded-t-3xl bg-[var(--panelsoft)] p-5 text-[var(--text)] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-extrabold" style={{ color: accent }}>{t("rate")}</h2>
            <div className="mb-4 flex justify-center gap-2" dir="ltr">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => s.setRev({ ...s.rev, stars: n })} className="text-3xl transition-transform active:scale-90" style={{ opacity: s.rev.stars >= n ? 1 : 0.3 }}>
                  ⭐
                </button>
              ))}
            </div>
            <input value={s.rev.name} onChange={(e) => s.setRev({ ...s.rev, name: e.target.value })} placeholder={t("name")} className={field} />
            <textarea value={s.rev.comment} onChange={(e) => s.setRev({ ...s.rev, comment: e.target.value })} rows={3} placeholder={t("comment")} maxLength={500} className={`mt-2 ${field}`} />
            {s.err && <p className="mt-2 text-sm text-red-400">{s.err}</p>}
            <button onClick={sendReview} disabled={s.busy} className="mt-3 w-full rounded-2xl py-3.5 text-lg font-extrabold disabled:opacity-60" style={{ background: accent, color: "#141414" }}>
              {s.busy ? t("sending") : t("send")}
            </button>
          </div>
        </div>
      )}

      {s.revDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => s.setRevDone(false)}>
          <div style={DARK} className="w-full max-w-sm rounded-3xl bg-[var(--panelsoft)] p-8 text-center text-[var(--text)]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex size-20 items-center justify-center rounded-full text-4xl" style={{ background: accent, color: "#141414" }}>⭐</div>
            <h2 className="mt-4 text-xl font-extrabold">{t("thanks")}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{t("reviewNote")}</p>
            <button onClick={() => s.setRevDone(false)} className="mt-5 w-full rounded-2xl border py-3 font-bold" style={{ borderColor: accent, color: accent }}>{t("ok")}</button>
          </div>
        </div>
      )}

      {/* info sheet: about / hours / socials / health */}
      {s.infoOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center" onClick={() => s.setInfoOpen(false)}>
          <div style={DARK} className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[var(--panelsoft)] p-5 text-[var(--text)] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-1 text-lg font-extrabold" style={{ color: accent }}>{m.rName}</h2>
            {m.rTagline && <p className="text-sm text-[var(--muted)]">{m.rTagline}</p>}
            {can(r.plan, "about") && r.about && (
              <>
                <h3 className="mt-4 text-sm font-extrabold">{t("about")}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{tr(r.i18n, m.lang, "about", r.about)}</p>
              </>
            )}
            {can(r.plan, "hours") && r.hours && (
              <>
                <h3 className="mt-4 text-sm font-extrabold">{t("hoursTitle")}</h3>
                <ul className="mt-1 space-y-1">
                  {r.hours.map((h, d) => (
                    <li key={d} className="flex justify-between text-sm text-[var(--muted)]">
                      <span>{DAY_NAMES[d]}</span>
                      <span dir="ltr">{h.closed ? t("closed") : `${h.open} – ${h.close}`}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {can(r.plan, "health_badge") && r.health_cert && (
              <p className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3 text-sm">
                🏥 <span className="font-bold">{t("health")}:</span> {r.health_cert}
              </p>
            )}
            <SocialRow className="mt-4 justify-center" />
          </div>
        </div>
      )}
    </>
  );
}
