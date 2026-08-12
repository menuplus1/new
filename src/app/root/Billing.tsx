"use client";

/** الاشتراكات — من ينتهي قريباً، وتسجيل الدفعات.
 *  التجديد عملية واحدة في platform.ts: يكتب الفاتورة ويمدّد «مدفوع حتى» ويضبط
 *  الباقة، فلا نلمس أي جدول من هنا. */

import { Fragment, useCallback, useEffect, useState } from "react";
import { listSubscriptions, renewSubscription, type Method } from "@/lib/platform";
import { PLAN_INFO, YEARLY_MONTHS, iqd, type Plan } from "@/lib/plans";
import { CARD, FIELD } from "@/app/admin/ui";
import { BRAND, Chip, Empty, TD, Table, planTone } from "./ui";

type Expiring = { id: string; slug: string; name: string; plan: Plan; trial_ends: string | null; daysLeft: number };
type Rest = { id: string; slug: string; name: string };
type Sub = {
  id: string;
  restaurant_id: string;
  plan: Plan;
  period_start: string;
  period_end: string;
  months: number;
  amount: number;
  method: string;
  status: string;
  note: string | null;
  created_at: string;
};

const COLS_UP = ["المطعم", "الباقة", "ينتهي", "باقٍ", "تجديد"];
const COLS_PAY = ["التاريخ", "المطعم", "الباقة", "المدة", "المبلغ", "الطريقة", "ملاحظة"];

const WINDOWS: [number, string][] = [[7, "٧ أيام"], [14, "١٤ يوماً"], [30, "٣٠ يوماً"]];
const MONTHS: [number, string][] = [[1, "شهر واحد"], [3, "٣ أشهر"], [6, "٦ أشهر"], [12, "١٢ شهراً"]];
const PAY: [Method, string][] = [["cash", "نقداً"], ["transfer", "حوالة"], ["zaincash", "زين كاش"]];
const METHOD: Record<string, string> = { cash: "نقداً", transfer: "حوالة", zaincash: "زين كاش", gift: "هدية", trial: "تجربة" };
const PLANS = Object.keys(PLAN_INFO) as Plan[];

const date = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB") : "—");
/** ١٢ شهراً = ١٠ أشهر سعراً (شهران مجاناً) */
const priceFor = (plan: Plan, months: number) => PLAN_INFO[plan].monthly * (months === 12 ? YEARLY_MONTHS : months);

type Form = { id: string; plan: Plan; months: number; amount: number; method: Method; note: string };

export function Billing({ token }: { token: string }) {
  const [days, setDays] = useState(14);
  const [data, setData] = useState<{ expiring: Expiring[]; subs: Sub[]; rests: Rest[] } | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [done, setDone] = useState<{ name: string; until: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await listSubscriptions({ accessToken: token, days });
    if (!("ok" in res) || !res.ok) {
      setErr("error" in res ? res.error : "تعذّر تحميل الاشتراكات.");
      return;
    }
    setErr(null);
    setData({ expiring: res.expiring as Expiring[], subs: res.subs as Sub[], rests: res.rests as Rest[] });
  }, [token, days]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  async function submit(f: Form) {
    setBusy(true);
    const res = await renewSubscription({
      accessToken: token,
      restaurantId: f.id,
      plan: f.plan,
      months: f.months,
      amount: f.amount,
      method: f.method,
      note: f.note.trim() || null,
    });
    setBusy(false);
    if (!("ok" in res) || !res.ok) {
      setErr("error" in res ? res.error : "تعذّر تسجيل الدفعة.");
      return;
    }
    setDone({ name: res.name, until: res.until });
    setForm(null);
    await load();
  }

  if (err && !data) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return <p className="text-[#a6a6a3]">جارٍ التحميل…</p>;

  const nameOf = (id: string) => data.rests.find((r) => r.id === id)?.name ?? "مطعم محذوف";
  const collected = data.subs.filter((s) => s.status === "paid").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-8">
      {err && <p className="text-sm text-red-400">{err}</p>}

      {/* ————— تنتهي قريباً ————— */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-black">تنتهي قريباً</h2>
          <div className="ms-auto flex gap-1.5">
            {WINDOWS.map(([d, label]) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className="rounded-xl border px-3 py-1.5 text-xs font-black transition"
                style={
                  days === d
                    ? { background: `color-mix(in srgb, ${BRAND} 18%, transparent)`, color: BRAND, borderColor: BRAND }
                    : { borderColor: "rgba(255,255,255,0.15)", color: "#a6a6a3" }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {done && (
          <div className="rounded-2xl border p-4 text-sm font-bold" style={{ borderColor: "#22c18455", background: "#22c1841a", color: "#22c184" }}>
            ✓ سُجّلت الدفعة — {done.name} مدفوع حتى {date(done.until)}
          </div>
        )}

        {!data.expiring.length ? (
          <div className={CARD}>
            <Empty>لا توجد اشتراكات تنتهي خلال {days.toLocaleString("en-US")} يوماً — كل شيء تمام.</Empty>
          </div>
        ) : (
          <Table cols={COLS_UP}>
            {data.expiring.map((r) => (
              <Fragment key={r.id}>
                <tr>
                  <td className={TD}>
                    <p className="font-extrabold">{r.name}</p>
                    <p className="text-[11px] text-[#a6a6a3]" dir="ltr">/{r.slug}</p>
                  </td>
                  <td className={TD}>
                    <Chip label={PLAN_INFO[r.plan].label} tone={planTone(r.plan)} />
                  </td>
                  <td className={`${TD} whitespace-nowrap text-xs text-[#a6a6a3]`} dir="ltr">{date(r.trial_ends)}</td>
                  <td className={`${TD} whitespace-nowrap`}>
                    {r.daysLeft > 0 ? (
                      <Chip label={`${r.daysLeft.toLocaleString("en-US")} يوماً`} tone={r.daysLeft <= 3 ? "warn" : "neutral"} />
                    ) : (
                      <Chip
                        label={r.daysLeft === 0 ? "ينتهي اليوم" : `منتهٍ منذ ${(-r.daysLeft).toLocaleString("en-US")} يوماً`}
                        tone={r.daysLeft === 0 ? "warn" : "bad"}
                      />
                    )}
                  </td>
                  <td className={TD}>
                    <button
                      onClick={() =>
                        setForm((f) =>
                          f?.id === r.id ? null : { id: r.id, plan: r.plan, months: 1, amount: priceFor(r.plan, 1), method: "cash", note: "" },
                        )
                      }
                      className="whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-black text-[#0d0d0d]"
                      style={{ background: form?.id === r.id ? "#ffffff" : BRAND }}
                    >
                      {form?.id === r.id ? "إغلاق" : "تجديد"}
                    </button>
                  </td>
                </tr>

                {form?.id === r.id && (
                  <tr>
                    <td colSpan={COLS_UP.length} className="border-b border-white/5 px-3 pb-4">
                      <RenewForm form={form} setForm={setForm} busy={busy} onSubmit={() => submit(form)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </Table>
        )}
      </section>

      {/* ————— آخر الدفعات ————— */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-black">آخر الدفعات</h2>
          <span className="ms-auto text-sm font-black" style={{ color: BRAND }}>إجمالي المحصّل: {iqd(collected)}</span>
        </div>

        {!data.subs.length ? (
          <div className={CARD}>
            <Empty>لا توجد دفعات مسجّلة بعد.</Empty>
          </div>
        ) : (
          <Table cols={COLS_PAY}>
            {data.subs.map((s) => (
              <tr key={s.id}>
                <td className={`${TD} whitespace-nowrap text-xs text-[#a6a6a3]`} dir="ltr">{date(s.created_at)}</td>
                <td className={`${TD} font-bold`}>{nameOf(s.restaurant_id)}</td>
                <td className={TD}>
                  <Chip label={PLAN_INFO[s.plan]?.label ?? s.plan} tone={planTone(s.plan)} />
                </td>
                <td className={`${TD} whitespace-nowrap text-xs`}>{s.months.toLocaleString("en-US")} شهر</td>
                <td className={`${TD} whitespace-nowrap font-bold`}>{iqd(s.amount)}</td>
                <td className={`${TD} whitespace-nowrap text-xs text-[#a6a6a3]`}>{METHOD[s.method] ?? s.method}</td>
                <td className={`${TD} text-xs text-[#a6a6a3]`}>{s.note || "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </div>
  );
}

function RenewForm({
  form,
  setForm,
  busy,
  onSubmit,
}: {
  form: Form;
  setForm: (f: Form) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#141416] p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">الباقة</span>
          <select
            value={form.plan}
            onChange={(e) => {
              const plan = e.target.value as Plan;
              setForm({ ...form, plan, amount: priceFor(plan, form.months) });
            }}
            className={FIELD}
          >
            {PLANS.map((p) => <option key={p} value={p}>{PLAN_INFO[p].label}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">المدة</span>
          <select
            value={form.months}
            onChange={(e) => {
              const months = Number(e.target.value);
              setForm({ ...form, months, amount: priceFor(form.plan, months) });
            }}
            className={FIELD}
          >
            {MONTHS.map(([m, label]) => <option key={m} value={m}>{label}</option>)}
          </select>
          {form.months === 12 && <span className="mt-1 block text-[11px] font-bold" style={{ color: BRAND }}>شهران مجاناً</span>}
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">المبلغ</span>
          <input
            type="number"
            min={0}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            dir="ltr"
            className={FIELD}
          />
          <span className="mt-1 block text-[11px] text-[#a6a6a3]">{iqd(form.amount)}</span>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-[#a6a6a3]">طريقة الدفع</span>
        {PAY.map(([v, label]) => (
          <button
            key={v}
            onClick={() => setForm({ ...form, method: v })}
            aria-pressed={form.method === v}
            className="rounded-xl border px-3 py-1.5 text-xs font-black transition"
            style={
              form.method === v
                ? { background: `color-mix(in srgb, ${BRAND} 18%, transparent)`, color: BRAND, borderColor: BRAND }
                : { borderColor: "rgba(255,255,255,0.15)", color: "#a6a6a3" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">ملاحظة</span>
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="اختياري" className={FIELD} />
        </label>
        <button
          onClick={onSubmit}
          disabled={busy}
          className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-black text-[#0d0d0d] disabled:opacity-60"
          style={{ background: BRAND }}
        >
          {busy ? "جارٍ التسجيل…" : "تسجيل الدفعة"}
        </button>
      </div>
    </div>
  );
}
