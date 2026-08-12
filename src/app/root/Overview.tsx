"use client";

/** لوحة مدير المنصّة — نظرة عامة. قراءة واحدة من overview(token) لا غير. */

import { useEffect, useState } from "react";
import { overview, type Overview as Data } from "@/lib/platform";
import { iqd } from "@/lib/plans";
import { BRAND, CARD, StatCard, TopList } from "./ui";

const num = (n: number) => n.toLocaleString("en-US");
const delta = (cur: number, prev: number) => (prev === 0 ? null : Math.round(((cur - prev) / prev) * 100));

export function Overview({ token, onJump }: { token: string; onJump?: (tab: string) => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await overview(token);
      if (!("ok" in res) || !res.ok) {
        setErr("error" in res ? res.error : "تعذّر تحميل البيانات.");
        return;
      }
      setData(res);
    })();
  }, [token]);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return <p className="text-[#a6a6a3]">جارٍ التحميل…</p>;

  const k = data.kpis;
  const a = data.alerts;

  return (
    <div className="space-y-3">
      <Alert n={a.expiring} text={`${num(a.expiring)} تجربة تنتهي هذا الأسبوع`} tab="billing" onJump={onJump} />
      <Alert n={a.expired} text={`${num(a.expired)} اشتراك منتهٍ`} tab="billing" onJump={onJump} />
      <Alert n={a.openTickets} text={`${num(a.openTickets)} تذكرة دعم مفتوحة`} tab="support" onJump={onJump} />

      {!k.restaurants ? (
        <div className={`${CARD} text-center text-[#a6a6a3]`}>لا توجد بيانات بعد</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <StatCard label="المطاعم" value={num(k.restaurants)} d={null} />
              <p className="mt-1 px-1 text-xs text-[#a6a6a3]">منها {num(k.active)} نشط</p>
            </div>
            <StatCard label="تسجيلات هذا الشهر" value={num(k.signupsMonth)} d={delta(k.signupsMonth, k.signupsPrevMonth)} />
            <div>
              <StatCard label="الإيراد الشهري" value={iqd(k.mrr)} d={null} />
              <p className="mt-1 px-1 text-xs text-[#a6a6a3]">مع التجارب لو تحوّلت كلها: {iqd(k.mrrIfTrialsConvert)}</p>
            </div>
            <StatCard label="تجارب تنتهي خلال ٧ أيام" value={num(k.trialsEnding7)} d={null} />
            <StatCard label="طلبات ٣٠ يوماً" value={num(k.orders30)} d={delta(k.orders30, k.orders30Prev)} />
            <StatCard label="زيارات ٣٠ يوماً" value={num(k.visits30)} d={delta(k.visits30, k.visits30Prev)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <TopList title="تسجيلات آخر ٨ أسابيع" rows={data.weeks} empty="لا تسجيلات بعد." />
            <TopList title="توزيع الباقات" rows={data.plans} empty="لا مطاعم بعد." />
          </div>
        </>
      )}
    </div>
  );
}

function Alert({ n, text, tab, onJump }: { n: number; text: string; tab: string; onJump?: (tab: string) => void }) {
  if (!n) return null;
  return (
    <button
      onClick={() => onJump?.(tab)}
      className={`${CARD} flex w-full items-center justify-between gap-3 py-3 text-start transition hover:border-white/25`}
    >
      <span className="text-sm font-bold">{text}</span>
      <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-black" style={{ color: BRAND, background: `${BRAND}26` }}>
        عرض ←
      </span>
    </button>
  );
}
