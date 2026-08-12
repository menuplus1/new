"use client";

/** كونسول المنصّة — الكوبونات.
 *
 *  الكود نفسه هو المفتاح (id = code كما في platform.ts)، والتحقّق هنا نسخة حرفيّة
 *  عن تحقّق saveCoupon حتى تظهر الرسالة تحت الحقل قبل الذهاب للخادم — الخادم يبقى
 *  الحكم النهائي وأي خطأ منه يُعرض كما هو. */

import { useCallback, useEffect, useState } from "react";
import { deleteCoupon, listCoupons, saveCoupon, type CouponRow } from "@/lib/platform";
import { PLAN_INFO, iqd, type Plan } from "@/lib/plans";
import { CARD, FIELD, Toggle } from "@/app/admin/ui";
import { BRAND, Chip, Empty, TD, Table, planTone } from "./ui";

const PLANS = Object.keys(PLAN_INFO) as Plan[];
const COLS = ["الكود", "القيمة", "الباقة", "ينتهي", "الاستخدام", "الحالة", "حذف"];

const num = (n: number) => n.toLocaleString("en-US");
const date = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB") : "—");

const BTN = "rounded-xl border border-white/15 px-3 py-1.5 text-sm font-bold transition hover:bg-white/5 disabled:opacity-40";
const BTN_ON = "rounded-xl px-4 py-2 text-sm font-black text-[#0d0d0d] transition disabled:opacity-40";

type Field = "code" | "value" | "maxUses";
type Form = {
  id: string | null;
  code: string;
  kind: "percent" | "amount";
  value: string;
  plan: "" | Plan;
  expiresAt: string;
  maxUses: string;
  active: boolean;
  note: string | null; // لا يُحرَّر هنا — نمرّره كما هو حتى لا يمحوه الحفظ
};

const EMPTY: Form = { id: null, code: "", kind: "percent", value: "", plan: "", expiresAt: "", maxUses: "", active: true, note: null };

const toForm = (c: CouponRow): Form => ({
  id: c.id,
  code: c.code,
  kind: c.percent !== null ? "percent" : "amount",
  value: String(c.percent ?? c.amount ?? ""),
  plan: c.plan ?? "",
  expiresAt: c.expires_at ? c.expires_at.slice(0, 10) : "",
  maxUses: c.max_uses === null ? "" : String(c.max_uses),
  active: c.active,
  note: c.note,
});

/** نفس شروط saveCoupon — نوع الخصم اختيار واحد فلا حاجة لقاعدة «واحد فقط» */
function validate(f: Form): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (!/^[A-Z0-9-]{3,24}$/.test(f.code.trim().toUpperCase())) e.code = "الكود من ٣ إلى ٢٤ حرفاً: A-Z و0-9 وشرطة.";
  const v = Number(f.value);
  if (!f.value.trim() || !Number.isFinite(v)) e.value = f.kind === "percent" ? "أدخل نسبة الخصم." : "أدخل مبلغ الخصم.";
  else if (f.kind === "percent" && (v < 1 || v > 100)) e.value = "النسبة بين ١ و١٠٠.";
  else if (f.kind === "amount" && v <= 0) e.value = "المبلغ أكبر من صفر.";
  if (f.maxUses.trim() && !(Number(f.maxUses) >= 1)) e.maxUses = "حدّ الاستخدام واحد فأكثر.";
  return e;
}

export function Coupons({ token }: { token: string }) {
  const [rows, setRows] = useState<CouponRow[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [errs, setErrs] = useState<Partial<Record<Field, string>>>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await listCoupons(token);
    if (!("ok" in res) || !res.ok) {
      setErr("error" in res ? String(res.error) : "تعذّر تحميل الكوبونات.");
      setRows([]);
      return;
    }
    setRows(res.rows);
  }, [token]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

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
    return res as Extract<T, { ok: true }>;
  }

  if (rows === null) return <p className="text-[#a6a6a3]">جارٍ التحميل…</p>;

  /** الحفظ upsert كامل، فالتبديل السريع يعيد إرسال بقيّة الحقول كما هي */
  const toggleActive = (c: CouponRow) =>
    run(
      saveCoupon({
        accessToken: token,
        id: c.id,
        code: c.code,
        percent: c.percent,
        amount: c.amount,
        plan: c.plan,
        expiresAt: c.expires_at,
        maxUses: c.max_uses,
        active: !c.active,
        note: c.note,
      }),
    );

  const remove = async (c: CouponRow) => {
    if (!window.confirm(`حذف الكوبون «${c.code}» نهائياً؟`)) return;
    const res = await run(deleteCoupon({ accessToken: token, id: c.id }));
    if (res && form?.id === c.id) setForm(null);
  };

  const submit = async (f: Form) => {
    const e = validate(f);
    setErrs(e);
    if (Object.keys(e).length) return;
    const v = Math.round(Number(f.value));
    const res = await run(
      saveCoupon({
        accessToken: token,
        id: f.id,
        code: f.code,
        percent: f.kind === "percent" ? v : null,
        amount: f.kind === "amount" ? v : null,
        plan: f.plan || null,
        expiresAt: f.expiresAt || null,
        maxUses: f.maxUses.trim() ? Math.round(Number(f.maxUses)) : null,
        active: f.active,
        note: f.note,
      }),
    );
    if (res) setForm(null);
  };

  const edit = (c: CouponRow) => {
    setErrs({});
    setForm(toForm(c));
  };

  return (
    <div className="space-y-4">
      {err && <p className="text-sm text-red-400">{err}</p>}

      {/* ————— شريط الأدوات ————— */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setErrs({});
            setForm(form && form.id === null ? null : EMPTY);
          }}
          className={BTN_ON}
          style={{ background: BRAND }}
        >
          {form && form.id === null ? "إغلاق" : "＋ كوبون جديد"}
        </button>
        <span className="text-sm text-[#a6a6a3]">{num(rows.length)} كوبون</span>
      </div>

      <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs font-bold leading-relaxed text-amber-300">
        الكوبونات تُسجَّل هنا وتُطبَّق يدوياً عند التجديد من شاشة الاشتراكات — لا يوجد دفع إلكتروني بعد.
      </p>

      {/* ————— نموذج الإنشاء/التعديل ————— */}
      {form && (
        <div className={`${CARD} space-y-4`}>
          <p className="text-lg font-black">{form.id ? `تعديل «${form.id}»` : "كوبون جديد"}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">الكود</span>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                dir="ltr"
                placeholder="RAMADAN-25"
                className={`${FIELD} font-mono uppercase`}
              />
              {errs.code && <span className="mt-1 block text-[11px] font-bold text-red-400">{errs.code}</span>}
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">نوع الخصم</span>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as Form["kind"], value: "" })}
                className={FIELD}
              >
                <option value="percent">نسبة ٪</option>
                <option value="amount">مبلغ ثابت</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">
                {form.kind === "percent" ? "النسبة (١–١٠٠)" : "المبلغ (د.ع)"}
              </span>
              <input
                type="number"
                min={1}
                max={form.kind === "percent" ? 100 : undefined}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                dir="ltr"
                className={FIELD}
              />
              {errs.value ? (
                <span className="mt-1 block text-[11px] font-bold text-red-400">{errs.value}</span>
              ) : (
                form.kind === "amount" &&
                Number(form.value) > 0 && <span className="mt-1 block text-[11px] text-[#a6a6a3]">{iqd(Math.round(Number(form.value)))}</span>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">الباقة</span>
              <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as "" | Plan })} className={FIELD}>
                <option value="">كل الباقات</option>
                {PLANS.map((p) => (
                  <option key={p} value={p}>{PLAN_INFO[p].label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">تاريخ الانتهاء</span>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                dir="ltr"
                className={FIELD}
              />
              <span className="mt-1 block text-[11px] text-[#a6a6a3]">اتركه فارغاً لكوبون بلا تاريخ انتهاء.</span>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">حدّ الاستخدام</span>
              <input
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                dir="ltr"
                placeholder="بلا حدّ"
                className={FIELD}
              />
              {errs.maxUses && <span className="mt-1 block text-[11px] font-bold text-red-400">{errs.maxUses}</span>}
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <span className="text-sm font-bold">مفعّل</span>
            <Toggle on={form.active} onClick={() => setForm({ ...form, active: !form.active })} accent={BRAND} disabled={busy} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => submit(form)} className={BTN_ON} style={{ background: BRAND }}>
              {busy ? "جارٍ الحفظ…" : "حفظ"}
            </button>
            <button disabled={busy} onClick={() => setForm(null)} className={BTN}>إلغاء</button>
          </div>
        </div>
      )}

      {/* ————— الجدول ————— */}
      {!rows.length ? (
        <Empty>لا توجد كوبونات بعد.</Empty>
      ) : (
        <Table cols={COLS}>
          {rows.map((c) => (
            <tr
              key={c.id}
              onClick={() => edit(c)}
              className={`cursor-pointer transition hover:bg-white/5 ${c.id === form?.id ? "bg-white/[0.06]" : ""}`}
            >
              <td className={TD}>
                <span dir="ltr" className="block font-mono font-bold uppercase">{c.code}</span>
              </td>
              <td className={`${TD} whitespace-nowrap font-bold`}>
                {c.percent !== null ? `${num(c.percent)}٪` : iqd(c.amount ?? 0)}
              </td>
              <td className={TD}>
                {c.plan ? <Chip label={PLAN_INFO[c.plan].label} tone={planTone(c.plan)} /> : <span className="text-[#a6a6a3]">كل الباقات</span>}
              </td>
              <td className={`${TD} whitespace-nowrap text-xs text-[#a6a6a3]`} dir="ltr">{date(c.expires_at)}</td>
              <td className={`${TD} whitespace-nowrap`}>
                <span dir="ltr" className="font-bold">
                  {num(c.used_count)}{c.max_uses !== null ? ` / ${num(c.max_uses)}` : ""}
                </span>
                {c.max_uses === null && <span className="ms-1 text-[11px] text-[#a6a6a3]">بلا حدّ</span>}
              </td>
              <td className={TD} onClick={(e) => e.stopPropagation()}>
                <Toggle on={c.active} onClick={() => void toggleActive(c)} accent={BRAND} disabled={busy} />
              </td>
              <td className={TD} onClick={(e) => e.stopPropagation()}>
                <button
                  disabled={busy}
                  onClick={() => remove(c)}
                  className="rounded-xl border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:bg-red-500/10 disabled:opacity-40"
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
