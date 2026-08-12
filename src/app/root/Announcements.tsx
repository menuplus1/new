"use client";

/** كونسول المنصّة — الإعلانات التي تظهر داخل لوحات المطاعم.
 *
 *  الحفظ استدعاء واحد (saveAnnouncement) للإنشاء والتعديل وتبديل التفعيل معاً،
 *  فالمفتاح الوحيد هنا هو id: موجود = تعديل، غائب = إنشاء.
 *  ponytail: datetime-local بلا منطقة زمنية — يُقرأ ويُكتب كما هو (UTC في القاعدة)،
 *  فرق الساعات ظاهر للمدير فقط. أضف تحويلاً محليّاً لو صار مزعجاً. */

import { useCallback, useEffect, useState } from "react";
import {
  deleteAnnouncement,
  listAnnouncements,
  listRestaurants,
  saveAnnouncement,
  type Audience,
  type AnnouncementKind,
} from "@/lib/platform";
import { PLAN_INFO, type Plan } from "@/lib/plans";
import { CARD, FIELD, Toggle } from "@/app/admin/ui";
import { BRAND, Chip, Empty, TD, Table } from "./ui";

type Ann = {
  id: string;
  title: string;
  body: string;
  kind: AnnouncementKind;
  audience: Audience;
  plan: Plan | null;
  restaurant_id: string | null;
  restaurant_name: string | null;
  cta_label: string | null;
  cta_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
};

type Form = {
  id: string | null;
  title: string;
  body: string;
  kind: AnnouncementKind;
  audience: Audience;
  plan: Plan;
  restaurantId: string;
  ctaLabel: string;
  ctaUrl: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

const PLANS = Object.keys(PLAN_INFO) as Plan[];

const KIND: Record<AnnouncementKind, { label: string; tone: "brand" | "good" | "warn"; color: string }> = {
  info: { label: "معلومة", tone: "brand", color: BRAND },
  offer: { label: "عرض", tone: "good", color: "#22c184" },
  warning: { label: "تنبيه", tone: "warn", color: "#eab308" },
};

const AUDIENCES: [Audience, string][] = [
  ["all", "كل المطاعم"],
  ["plan", "حسب الباقة"],
  ["one", "مطعم واحد"],
];

const COLS = ["الإعلان", "النوع", "الجمهور", "المدّة", "نشط", ""];
const BTN = "rounded-xl border border-white/15 px-3 py-1.5 text-xs font-bold transition hover:bg-white/5 disabled:opacity-40";
const BTN_ON = "rounded-xl px-4 py-2 text-sm font-black text-[#0d0d0d] transition disabled:opacity-40";

const date = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB") : null);
/** ISO من القاعدة → قيمة datetime-local (والعكس بلا تحويل: القاعدة تقرأها UTC) */
const dt = (s: string | null) => (s ? s.slice(0, 16) : "");

const blank = (): Form => ({
  id: null,
  title: "",
  body: "",
  kind: "info",
  audience: "all",
  plan: "basic",
  restaurantId: "",
  ctaLabel: "",
  ctaUrl: "",
  startsAt: "",
  endsAt: "",
  active: true,
});

const toForm = (a: Ann): Form => ({
  id: a.id,
  title: a.title,
  body: a.body,
  kind: a.kind,
  audience: a.audience,
  plan: a.plan ?? "basic",
  restaurantId: a.restaurant_id ?? "",
  ctaLabel: a.cta_label ?? "",
  ctaUrl: a.cta_url ?? "",
  startsAt: dt(a.starts_at),
  endsAt: dt(a.ends_at),
  active: a.active,
});

function audienceLabel(a: Ann) {
  if (a.audience === "plan") return a.plan ? PLAN_INFO[a.plan].label : "باقة غير محدّدة";
  if (a.audience === "one") return a.restaurant_name ?? "مطعم محذوف";
  return "كل المطاعم";
}

export function Announcements({ token }: { token: string }) {
  const [rows, setRows] = useState<Ann[] | null>(null);
  const [rests, setRests] = useState<{ id: string; name: string }[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await listAnnouncements(token);
    if (!("ok" in res) || !res.ok) {
      setErr("error" in res ? String(res.error) : "تعذّر تحميل الإعلانات.");
      setRows([]);
      return;
    }
    setRows(res.rows as Ann[]);
  }, [token]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  /** قائمة المطاعم ثقيلة (تجلب بريد كل مالك) — لا نحمّلها إلا عند استهداف مطعم واحد */
  const needRests = form?.audience === "one";
  useEffect(() => {
    if (!needRests || rests) return;
    (async () => {
      const res = await listRestaurants(token);
      setRests(!("ok" in res) || !res.ok ? [] : res.rows.map((r) => ({ id: r.id, name: r.name })));
    })();
  }, [needRests, rests, token]);

  async function run<T extends { ok: boolean }>(p: Promise<T>) {
    setErr(null);
    setBusy(true);
    const res = await p;
    setBusy(false);
    if (!("ok" in res) || !res.ok) {
      setErr("error" in res ? String(res.error) : "فشل التنفيذ.");
      return null;
    }
    await load();
    return res;
  }

  if (rows === null) return <p className="text-[#a6a6a3]">جارٍ التحميل…</p>;

  const save = async (f: Form) => {
    const res = await run(
      saveAnnouncement({
        accessToken: token,
        id: f.id,
        title: f.title,
        body: f.body,
        kind: f.kind,
        audience: f.audience,
        plan: f.audience === "plan" ? f.plan : null,
        restaurantId: f.audience === "one" ? f.restaurantId || null : null,
        ctaLabel: f.ctaLabel,
        ctaUrl: f.ctaUrl,
        startsAt: f.startsAt || null,
        endsAt: f.endsAt || null,
        active: f.active,
      }),
    );
    if (res) setForm(null);
  };

  const toggle = (a: Ann) =>
    run(
      saveAnnouncement({
        accessToken: token,
        id: a.id,
        title: a.title,
        body: a.body,
        kind: a.kind,
        audience: a.audience,
        plan: a.plan,
        restaurantId: a.restaurant_id,
        ctaLabel: a.cta_label,
        ctaUrl: a.cta_url,
        startsAt: a.starts_at,
        endsAt: a.ends_at,
        active: !a.active,
      }),
    );

  const remove = async (a: Ann) => {
    if (!window.confirm(`حذف إعلان «${a.title}» نهائياً؟`)) return;
    const res = await run(deleteAnnouncement({ accessToken: token, id: a.id }));
    if (res && form?.id === a.id) setForm(null);
  };

  return (
    <div className="space-y-4">
      {err && <p className="text-sm text-red-400">{err}</p>}

      {!form && (
        <button onClick={() => setForm(blank())} className={BTN_ON} style={{ background: BRAND }}>
          إعلان جديد
        </button>
      )}

      {/* ————— نموذج الإنشاء/التعديل ————— */}
      {form && (
        <div className={`${CARD} space-y-4`}>
          <p className="text-lg font-black">{form.id ? "تعديل الإعلان" : "إعلان جديد"}</p>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">العنوان</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={80}
              placeholder="مثال: خصم ٢٠٪ على التجديد السنوي"
              className={FIELD}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">النص</span>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={3}
              maxLength={500}
              placeholder="ما الذي يجب أن يقرأه صاحب المطعم؟"
              className={`${FIELD} resize-y`}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">النوع</span>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as AnnouncementKind })}
                className={FIELD}
              >
                {(Object.keys(KIND) as AnnouncementKind[]).map((k) => (
                  <option key={k} value={k}>{KIND[k].label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">الجمهور</span>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value as Audience })}
                className={FIELD}
              >
                {AUDIENCES.map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </label>

            {form.audience === "plan" && (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">الباقة المستهدَفة</span>
                <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as Plan })} className={FIELD}>
                  {PLANS.map((p) => (
                    <option key={p} value={p}>{PLAN_INFO[p].label}</option>
                  ))}
                </select>
              </label>
            )}

            {form.audience === "one" && (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">المطعم المستهدَف</span>
                <select
                  value={form.restaurantId}
                  onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}
                  className={FIELD}
                >
                  <option value="">{rests === null ? "جارٍ التحميل…" : "اختر مطعماً"}</option>
                  {(rests ?? []).map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">نص الزر (اختياري)</span>
              <input value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} placeholder="مثال: جدّد الآن" className={FIELD} />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">رابط الزر (اختياري)</span>
              <input value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} dir="ltr" placeholder="https://" className={FIELD} />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">يبدأ (اختياري)</span>
              <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} dir="ltr" className={FIELD} />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">ينتهي (اختياري)</span>
              <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} dir="ltr" className={FIELD} />
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <span className="text-sm font-extrabold">نشط</span>
            <Toggle on={form.active} onClick={() => setForm({ ...form, active: !form.active })} accent={BRAND} disabled={busy} />
          </div>

          {/* المعاينة كما يراها المطعم */}
          <div>
            <p className="mb-2 text-xs font-bold text-[#a6a6a3]">المعاينة داخل لوحة المطعم</p>
            <Banner
              kind={form.kind}
              title={form.title || "عنوان الإعلان"}
              body={form.body || "نص الإعلان كما سيقرأه صاحب المطعم."}
              ctaLabel={form.ctaLabel}
            />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <button disabled={busy} onClick={() => save(form)} className={BTN_ON} style={{ background: BRAND }}>
              {busy ? "جارٍ الحفظ…" : "حفظ الإعلان"}
            </button>
            <button disabled={busy} onClick={() => setForm(null)} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold transition hover:bg-white/5 disabled:opacity-40">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* ————— القائمة ————— */}
      {!rows.length ? (
        <Empty>لا توجد إعلانات بعد.</Empty>
      ) : (
        <Table cols={COLS}>
          {rows.map((a) => (
            <tr key={a.id} className={a.active ? "" : "opacity-60"}>
              <td className={TD}>
                <p className="truncate font-extrabold">{a.title}</p>
                <p className="truncate text-[11px] text-[#a6a6a3]">{a.body}</p>
              </td>
              <td className={TD}><Chip label={KIND[a.kind].label} tone={KIND[a.kind].tone} /></td>
              <td className={`${TD} whitespace-nowrap text-xs`}>{audienceLabel(a)}</td>
              <td className={`${TD} whitespace-nowrap text-xs text-[#a6a6a3]`}>
                {date(a.starts_at) ?? "فوراً"} — {date(a.ends_at) ?? "بلا نهاية"}
              </td>
              <td className={TD}>
                <Toggle on={a.active} onClick={() => void toggle(a)} accent={BRAND} disabled={busy} />
              </td>
              <td className={TD}>
                <span className="flex gap-1.5">
                  <button onClick={() => setForm(toForm(a))} className={BTN}>تعديل</button>
                  <button onClick={() => remove(a)} disabled={busy} className={`${BTN} text-red-300`}>حذف</button>
                </span>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

/** نفس شكل الشريط في لوحة المطعم: إطار ملوّن حسب النوع */
function Banner({ kind, title, body, ctaLabel }: { kind: AnnouncementKind; title: string; body: string; ctaLabel: string }) {
  const c = KIND[kind].color;
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: `color-mix(in srgb, ${c} 45%, transparent)`, background: `color-mix(in srgb, ${c} 10%, transparent)` }}
    >
      <p className="font-black" style={{ color: c }}>{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-[#f2f2f0]">{body}</p>
      {ctaLabel.trim() && (
        <span className="mt-3 inline-block rounded-xl px-4 py-2 text-sm font-black text-[#0d0d0d]" style={{ background: c }}>
          {ctaLabel}
        </span>
      )}
    </div>
  );
}
