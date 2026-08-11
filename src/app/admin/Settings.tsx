"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CARD, FIELD, LockBadge, Toggle, type Rest } from "./ui";
import { PLAN_INFO, can, hasApp, iqd } from "@/lib/plans";
import { DAY_NAMES, LANG_LABEL, ORDER_TYPE_LABEL, type DayHours, type Lang, type OrderType } from "@/lib/types";
import { addAdmin, removeAdmin } from "@/lib/actions";

const ALL_TYPES: OrderType[] = ["dine_in", "delivery", "takeaway"];
const ALL_LANGS: Lang[] = ["ar", "en", "ckb"];
const SUM = "cursor-pointer font-extrabold";

/** tiny css sketches of the 6 menu templates */
const TPLS: { n: number; name: string; sketch: React.ReactNode }[] = [
  {
    n: 1,
    name: "اللوحي الداكن",
    sketch: (
      <div className="flex h-[60px] gap-1 rounded-lg bg-[#0d0d0d] p-1.5">
        <div className="w-3 rounded bg-white/25" />
        <div className="flex-1 space-y-1">
          <div className="h-3 rounded bg-white/20" />
          <div className="h-3 w-2/3 rounded bg-white/10" />
        </div>
      </div>
    ),
  },
  {
    n: 2,
    name: "بطاقات الأقسام",
    sketch: (
      <div className="h-[60px] space-y-1 rounded-lg bg-[#141416] p-1.5">
        <div className="h-3.5 rounded bg-white/25" />
        <div className="h-3.5 rounded bg-white/15" />
        <div className="h-3.5 rounded bg-white/10" />
      </div>
    ),
  },
  {
    n: 3,
    name: "الفاخر",
    sketch: (
      <div className="h-[60px] rounded-lg bg-[#17130e] p-1.5">
        <div className="mx-auto h-2 w-1/2 rounded bg-amber-300/60" />
        <div className="mt-2 h-2.5 rounded bg-white/15" />
        <div className="mx-auto mt-1 h-2.5 w-3/4 rounded bg-white/10" />
      </div>
    ),
  },
  {
    n: 4,
    name: "الداكن السريع",
    sketch: (
      <div className="grid h-[60px] grid-cols-3 gap-1 rounded-lg bg-[#0d0d0d] p-1.5">
        <div className="rounded bg-white/25" />
        <div className="rounded bg-white/15" />
        <div className="rounded bg-white/10" />
        <div className="rounded bg-white/10" />
        <div className="rounded bg-white/15" />
        <div className="rounded bg-white/25" />
      </div>
    ),
  },
  {
    n: 5,
    name: "المدمج",
    sketch: (
      <div className="h-[60px] space-y-1 rounded-lg bg-[#141416] p-1.5">
        <div className="h-2 rounded bg-white/25" />
        <div className="h-2 rounded bg-white/15" />
        <div className="h-2 rounded bg-white/15" />
        <div className="h-2 rounded bg-white/10" />
      </div>
    ),
  },
  {
    n: 6,
    name: "الدافئ",
    sketch: (
      <div className="h-[60px] rounded-lg bg-[#2a1f16] p-1.5">
        <div className="h-6 rounded-lg bg-orange-300/30" />
        <div className="mt-1.5 h-2.5 w-2/3 rounded bg-white/20" />
      </div>
    ),
  },
];

const DEFAULT_HOURS = (): DayHours[] => Array.from({ length: 7 }, () => ({ closed: false, open: "09:00", close: "23:00" }));

export function Settings({ client, cur, patch, accent }: { client: SupabaseClient; cur: Rest; patch: (fields: Partial<Rest>) => Promise<void>; accent: string }) {
  const info = PLAN_INFO[cur.plan];
  const canTpl = can(cur.plan, "templates");
  const canAbout = can(cur.plan, "about");
  const canCovers = can(cur.plan, "multi_covers");
  const canHours = can(cur.plan, "hours");
  const canLangs = can(cur.plan, "languages");
  const canSeo = can(cur.plan, "seo");
  const canOrder = can(cur.plan, "ordering");
  const canHealth = can(cur.plan, "health_badge");
  const canHide = can(cur.plan, "hide_branding");

  /* ————— section drafts (saved with حفظ, never per keystroke) ————— */
  const [ident, setIdent] = useState(() => ({
    primary_color: cur.primary_color,
    logo_url: cur.logo_url ?? "",
    tagline: cur.tagline ?? "",
    about: cur.about ?? "",
    socials: {
      instagram: cur.socials?.instagram ?? "",
      whatsapp: cur.socials?.whatsapp ?? "",
      facebook: cur.socials?.facebook ?? "",
      tiktok: cur.socials?.tiktok ?? "",
    },
    covers: cur.covers ?? [],
  }));
  const [newCover, setNewCover] = useState("");
  const [hours, setHours] = useState<DayHours[]>(() => (cur.hours?.length === 7 ? cur.hours.map((h) => ({ ...h })) : DEFAULT_HOURS()));
  const [seo, setSeo] = useState(() => ({ title: cur.seo?.title ?? "", description: cur.seo?.description ?? "" }));
  const [wa, setWa] = useState(cur.whatsapp_phone ?? "");
  const [health, setHealth] = useState(cur.health_cert ?? "");
  const [typeErr, setTypeErr] = useState<string | null>(null);

  /* ————— admins (owner only) ————— */
  const [uid, setUid] = useState<string | null>(null);
  const [admins, setAdmins] = useState<{ user_id: string; email: string }[]>([]);
  const [adminEmail, setAdminEmail] = useState("");
  const [tempPass, setTempPass] = useState<string | null>(null);
  const [adminErr, setAdminErr] = useState<string | null>(null);
  const [adminBusy, setAdminBusy] = useState(false);

  useEffect(() => {
    client.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, [client]);

  const isOwner = uid !== null && uid === cur.owner;

  const loadAdmins = useCallback(async () => {
    const { data } = await client.from("restaurant_admins").select("user_id, email").eq("restaurant_id", cur.id);
    setAdmins((data ?? []) as { user_id: string; email: string }[]);
  }, [client, cur.id]);

  useEffect(() => {
    if (!isOwner) return;
    (async () => {
      await loadAdmins();
    })();
  }, [isOwner, loadAdmins]);

  async function addOne() {
    const email = adminEmail.trim();
    if (!email) return;
    setAdminBusy(true);
    setAdminErr(null);
    setTempPass(null);
    const { data } = await client.auth.getSession();
    const res = await addAdmin({ accessToken: data.session!.access_token, restaurantId: cur.id, email });
    if (!res.ok) setAdminErr(res.error);
    else {
      setAdminEmail("");
      if (res.tempPassword) setTempPass(res.tempPassword);
      await loadAdmins();
    }
    setAdminBusy(false);
  }

  async function removeOne(userId: string) {
    setAdminErr(null);
    const { data } = await client.auth.getSession();
    const res = await removeAdmin({ accessToken: data.session!.access_token, restaurantId: cur.id, userId });
    if (!res.ok) setAdminErr(res.error);
    else await loadAdmins();
  }

  function toggleType(t: OrderType) {
    const on = cur.order_types.includes(t);
    const next = on ? cur.order_types.filter((x) => x !== t) : [...cur.order_types, t];
    if (!next.length) return setTypeErr("يجب إبقاء طريقة طلب واحدة على الأقل.");
    setTypeErr(null);
    patch({ order_types: ALL_TYPES.filter((x) => next.includes(x)) });
  }

  function toggleLang(l: Lang) {
    const set = new Set(cur.languages.includes(l) ? cur.languages.filter((x) => x !== l) : [...cur.languages, l]);
    set.add("ar");
    patch({ languages: ALL_LANGS.filter((x) => set.has(x)) });
  }

  function saveIdent() {
    patch({
      primary_color: ident.primary_color,
      logo_url: ident.logo_url.trim() || null,
      socials: Object.fromEntries(Object.entries(ident.socials).filter(([, v]) => v.trim())),
      covers: ident.covers,
      ...(canAbout ? { tagline: ident.tagline.trim() || null, about: ident.about.trim() || null } : {}),
    });
  }

  const hexOk = /^#[0-9a-fA-F]{6}$/.test(ident.primary_color);
  const saveBtn = "rounded-xl px-5 py-2.5 text-sm font-extrabold text-[#0d0d0d]";
  const setDay = (i: number, p: Partial<DayHours>) => setHours((hs) => hs.map((h, j) => (j === i ? { ...h, ...p } : h)));

  return (
    <div className="space-y-3">
      {/* 1 ————— الباقة الحالية ————— */}
      <div className={CARD}>
        <p className="text-xs text-[#a6a6a3]">الباقة الحالية</p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-2xl font-black" style={{ color: accent }}>{info.label}</p>
          <p className="font-bold">{info.monthly ? `${iqd(info.monthly)} / شهرياً` : "مجاناً"}</p>
        </div>
        <p className="mt-1 text-xs text-[#a6a6a3]">للترقية أو التغيير تواصل مع منيو بلس</p>
      </div>

      {/* 2 ————— القالب ————— */}
      <details className={CARD} open>
        <summary className={SUM}>القالب {!canTpl && <LockBadge feature="templates" />}</summary>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TPLS.map((t) => {
            const locked = !canTpl && t.n !== 1;
            const sel = cur.template === t.n;
            return (
              <div
                key={t.n}
                onClick={() => !locked && patch({ template: t.n })}
                className={`rounded-xl border p-2 ${locked ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${sel ? "" : "border-white/10"}`}
                style={sel ? { borderColor: accent, background: `${accent}1a` } : undefined}
              >
                {t.sketch}
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-bold">{t.name}</span>
                  <a href={`/${cur.slug}?tpl=${t.n}`} target="_blank" onClick={(e) => e.stopPropagation()} className="text-[11px] text-[#a6a6a3] underline">معاينة</a>
                </div>
              </div>
            );
          })}
        </div>
      </details>

      {/* 3 ————— الهوية ————— */}
      <details className={CARD}>
        <summary className={SUM}>الهوية</summary>
        <div className="mt-3 space-y-3">
          <div>
            <p className="mb-1 text-sm font-bold">اللون</p>
            <div className="flex gap-2">
              <input type="color" value={hexOk ? ident.primary_color : "#000000"} onChange={(e) => setIdent({ ...ident, primary_color: e.target.value })} className="h-10 w-14 shrink-0 rounded-xl border border-white/10 bg-[#141416]" />
              <input value={ident.primary_color} onChange={(e) => setIdent({ ...ident, primary_color: e.target.value })} dir="ltr" placeholder="#14b8a6" className={FIELD} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-bold">رابط الشعار</p>
            <input value={ident.logo_url} onChange={(e) => setIdent({ ...ident, logo_url: e.target.value })} dir="ltr" placeholder="https://…" className={FIELD} />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold">الشعار النصي {!canAbout && <LockBadge feature="about" />}</p>
            <input value={ident.tagline} onChange={(e) => setIdent({ ...ident, tagline: e.target.value })} disabled={!canAbout} placeholder="مثال: أطيب مشاوي في بغداد" className={`${FIELD} disabled:opacity-40`} />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold">نبذة عنا {!canAbout && <LockBadge feature="about" />}</p>
            <textarea value={ident.about} onChange={(e) => setIdent({ ...ident, about: e.target.value })} disabled={!canAbout} rows={3} placeholder="قصة مطعمك باختصار…" className={`${FIELD} disabled:opacity-40`} />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold">روابط التواصل</p>
            <div className="space-y-2">
              {(["instagram", "whatsapp", "facebook", "tiktok"] as const).map((k) => (
                <input key={k} value={ident.socials[k]} onChange={(e) => setIdent({ ...ident, socials: { ...ident.socials, [k]: e.target.value } })} dir="ltr" placeholder={k} className={FIELD} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-bold">صور الغلاف</p>
            <div className="space-y-2">
              {ident.covers.map((c, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141416] px-3 py-2">
                  <span dir="ltr" className="min-w-0 flex-1 truncate text-xs text-[#a6a6a3]">{c}</span>
                  <button onClick={() => setIdent({ ...ident, covers: ident.covers.filter((_, j) => j !== i) })} className="shrink-0 text-red-400">✕</button>
                </div>
              ))}
              {canCovers || ident.covers.length < 1 ? (
                <div className="flex gap-2">
                  <input value={newCover} onChange={(e) => setNewCover(e.target.value)} dir="ltr" placeholder="https://…" className={FIELD} />
                  <button
                    onClick={() => {
                      const u = newCover.trim();
                      if (!u) return;
                      setIdent({ ...ident, covers: [...ident.covers, u] });
                      setNewCover("");
                    }}
                    className="shrink-0 rounded-xl border border-white/15 px-4 text-sm font-bold"
                  >
                    إضافة
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#a6a6a3]">غلاف واحد في باقتك — التعدد من باقة التميز</p>
              )}
            </div>
          </div>
          <button onClick={saveIdent} className={saveBtn} style={{ background: accent }}>حفظ</button>
        </div>
      </details>

      {/* 4 ————— أوقات العمل ————— */}
      <details className={CARD}>
        <summary className={SUM}>أوقات العمل {!canHours && <LockBadge feature="hours" />}</summary>
        {canHours ? (
          <div className="mt-3 space-y-2">
            {hours.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-16 shrink-0 font-bold">{DAY_NAMES[i]}</span>
                <label className="flex shrink-0 items-center gap-1 text-xs text-[#a6a6a3]">
                  <input type="checkbox" checked={h.closed} onChange={(e) => setDay(i, { closed: e.target.checked })} style={{ accentColor: accent }} />
                  مغلق
                </label>
                <input type="time" value={h.open} disabled={h.closed} onChange={(e) => setDay(i, { open: e.target.value })} dir="ltr" className={`${FIELD} disabled:opacity-40`} />
                <input type="time" value={h.close} disabled={h.closed} onChange={(e) => setDay(i, { close: e.target.value })} dir="ltr" className={`${FIELD} disabled:opacity-40`} />
              </div>
            ))}
            <button onClick={() => patch({ hours })} className={saveBtn} style={{ background: accent }}>حفظ</button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#a6a6a3]">أظهر للزبائن متى تفتح ومتى تغلق — متاح مع الترقية.</p>
        )}
      </details>

      {/* 5 ————— اللغات ————— */}
      <details className={CARD}>
        <summary className={SUM}>اللغات {!canLangs && <LockBadge feature="languages" />}</summary>
        {canLangs ? (
          <div className="mt-3 flex flex-wrap gap-5">
            {ALL_LANGS.map((l) => (
              <label key={l} className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={l === "ar" || cur.languages.includes(l)} disabled={l === "ar"} onChange={() => toggleLang(l)} style={{ accentColor: accent }} />
                {LANG_LABEL[l]}
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#a6a6a3]">أضف الإنجليزية والكوردية للمنيو الخاص بك — متاح مع الترقية.</p>
        )}
      </details>

      {/* 6 ————— SEO ————— */}
      <details className={CARD}>
        <summary className={SUM}>SEO {!canSeo && <LockBadge feature="seo" />}</summary>
        {canSeo ? (
          <div className="mt-3 space-y-2">
            <input value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} placeholder="عنوان الصفحة" className={FIELD} />
            <textarea value={seo.description} onChange={(e) => setSeo({ ...seo, description: e.target.value })} rows={2} placeholder="الوصف" className={FIELD} />
            <button onClick={() => patch({ seo: { title: seo.title.trim() || undefined, description: seo.description.trim() || undefined } })} className={saveBtn} style={{ background: accent }}>حفظ</button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#a6a6a3]">تحكّم بظهور مطعمك في محركات البحث — متاح مع الترقية.</p>
        )}
      </details>

      {/* 7 ————— الطلبات والحجز ————— */}
      <details className={CARD}>
        <summary className={SUM}>الطلبات والحجز</summary>
        <div className="mt-3 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-bold">استقبال الطلبات</p>
              {!canOrder && <LockBadge feature="ordering" />}
            </div>
            <Toggle on={cur.ordering} onClick={() => patch({ ordering: !cur.ordering })} accent={accent} disabled={!canOrder} />
          </div>
          <div>
            <p className="mb-2 font-bold">طرق الطلب</p>
            <div className="grid grid-cols-3 gap-2">
              {ALL_TYPES.map((t) => {
                const on = cur.order_types.includes(t);
                return (
                  <button key={t} onClick={() => toggleType(t)} className={`rounded-xl border py-3 text-sm font-extrabold ${on ? "text-[#0d0d0d]" : "border-white/15 text-[#a6a6a3]"}`} style={on ? { background: accent, borderColor: accent } : undefined}>
                    {ORDER_TYPE_LABEL[t]}
                  </button>
                );
              })}
            </div>
            {typeErr && <p className="mt-2 text-sm text-red-400">{typeErr}</p>}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-bold">حجز الطاولات</p>
              {!hasApp(cur, "booking") && <p className="text-xs text-[#a6a6a3]">يتطلب تفعيل تطبيق الحجز من المتجر</p>}
            </div>
            <Toggle on={cur.reservations} onClick={() => patch({ reservations: !cur.reservations })} accent={accent} />
          </div>
          <div>
            <p className="mb-1 font-bold">رقم واتساب</p>
            <input value={wa} onChange={(e) => setWa(e.target.value)} dir="ltr" placeholder="+9647…" className={FIELD} />
            <p className="mt-1 text-xs text-[#a6a6a3]">لإشعارات الطلبات عبر واتساب (قريباً)</p>
          </div>
          <div>
            <p className="mb-1 font-bold">رقم الإجازة الصحية {!canHealth && <LockBadge feature="health_badge" />}</p>
            <input value={health} onChange={(e) => setHealth(e.target.value)} disabled={!canHealth} dir="ltr" className={`${FIELD} disabled:opacity-40`} />
          </div>
          <button onClick={() => patch({ whatsapp_phone: wa.trim() || null, ...(canHealth ? { health_cert: health.trim() || null } : {}) })} className={saveBtn} style={{ background: accent }}>حفظ</button>
        </div>
      </details>

      {/* 8 ————— المشرفون (owner only) ————— */}
      {isOwner && (
        <details className={CARD}>
          <summary className={SUM}>
            المشرفون <span className="text-sm font-normal text-[#a6a6a3]">({admins.length.toLocaleString("en-US")}/{info.admins.toLocaleString("en-US")})</span>
          </summary>
          <div className="mt-3 space-y-2">
            {!admins.length && <p className="text-sm text-[#a6a6a3]">لا يوجد مشرفون إضافيون — أضف بريداً ليساعدك في إدارة المطعم.</p>}
            {admins.map((a) => (
              <div key={a.user_id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#141416] px-3 py-2">
                <span dir="ltr" className="min-w-0 truncate text-sm">{a.email}</span>
                <button onClick={() => removeOne(a.user_id)} className="shrink-0 text-red-400">🗑</button>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addOne()} dir="ltr" placeholder="email@example.com" className={FIELD} />
              <button onClick={addOne} disabled={adminBusy} className="shrink-0 rounded-xl px-4 text-sm font-extrabold text-[#0d0d0d] disabled:opacity-60" style={{ background: accent }}>إضافة</button>
            </div>
            {tempPass && (
              <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-400">
                تم الإنشاء — كلمة المرور المؤقتة: <b dir="ltr">{tempPass}</b> (تظهر مرة واحدة، شاركها معه)
              </div>
            )}
            {adminErr && <p className="text-sm text-red-400">{adminErr}</p>}
          </div>
        </details>
      )}

      {/* 9 ————— إخفاء حقوق منيو بلس ————— */}
      <details className={CARD}>
        <summary className={SUM}>إخفاء حقوق منيو بلس</summary>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-[#a6a6a3]">يخفي شعار «منيو بلس» من أسفل صفحة المنيو</p>
            {!canHide && <LockBadge feature="hide_branding" />}
          </div>
          <Toggle on={cur.hide_branding} onClick={() => patch({ hide_branding: !cur.hide_branding })} accent={accent} disabled={!canHide} />
        </div>
      </details>
    </div>
  );
}
