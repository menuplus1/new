"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CARD } from "./ui";

type Visit = { day: string; kind: string; ref: string; hits: number };
type Order = { total: number; status: string; created_at: string };

const DAY = 86400000;
const isoDay = (msAgo: number) => new Date(Date.now() - msAgo).toISOString().slice(0, 10);

export function Stats({ client, restaurantId, currency, accent }: { client: SupabaseClient; restaurantId: string; currency: string; accent: string }) {
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(0); // snapshotted at load time — render stays pure

  const load = useCallback(async () => {
    const [v, o] = await Promise.all([
      client.from("visits").select("day, kind, ref, hits").eq("restaurant_id", restaurantId).gte("day", isoDay(60 * DAY)),
      client.from("orders").select("total, status, created_at").eq("restaurant_id", restaurantId).gte("created_at", new Date(Date.now() - 60 * DAY).toISOString()),
    ]);
    // visits table may not exist yet (migration 0006) — treat any error as "no data"
    setNowMs(Date.now());
    setVisits((v.data ?? []) as Visit[]);
    setOrders((o.data ?? []) as Order[]);
    setErr(o.error?.message ?? null);
  }, [client, restaurantId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  if (visits === null) return <p className="text-[#a6a6a3]">جارٍ التحميل…</p>;

  if (!visits.length && !orders.length)
    return (
      <div className={`${CARD} text-center`}>
        {err && <p className="mb-2 text-sm text-red-400">{err}</p>}
        <p className="text-[#a6a6a3]">لا توجد بيانات بعد — تظهر الإحصائيات مع أول زيارات لمنيوك.</p>
        <p className="mt-2 text-xs text-[#a6a6a3]">شغّل ملف <span dir="ltr">0006_engagement.sql</span> إن لم تكن فعلت.</p>
      </div>
    );

  const cut30Ms = nowMs - 30 * DAY;
  const cut30 = new Date(cut30Ms).toISOString().slice(0, 10);

  const menuHits = (current: boolean) =>
    visits.filter((x) => x.kind === "menu" && x.day >= cut30 === current).reduce((s, x) => s + x.hits, 0);
  const split = (current: boolean) => orders.filter((o) => new Date(o.created_at).getTime() >= cut30Ms === current);
  const revenue = (os: Order[]) => os.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const delta = (cur: number, prev: number) => (prev === 0 ? null : Math.round(((cur - prev) / prev) * 100));

  const oCur = split(true);
  const oPrev = split(false);

  /** top 5 refs by summed hits in the current window */
  const top = (kind: string): [string, number][] => {
    const m = new Map<string, number>();
    for (const v of visits) if (v.kind === kind && v.day >= cut30) m.set(v.ref, (m.get(v.ref) ?? 0) + v.hits);
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  return (
    <div className="space-y-3">
      {err && <p className="text-sm text-red-400">{err}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="زيارات المنيو" value={menuHits(true).toLocaleString("en-US")} d={delta(menuHits(true), menuHits(false))} />
        <StatCard label="الطلبات (٣٠ يوماً)" value={oCur.length.toLocaleString("en-US")} d={delta(oCur.length, oPrev.length)} />
        <StatCard label="الإيرادات (٣٠ يوماً)" value={`${revenue(oCur).toLocaleString("en-US")} ${currency}`} d={delta(revenue(oCur), revenue(oPrev))} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TopList title="الأقسام الأعلى زيارة" rows={top("cat")} accent={accent} empty="لا زيارات للأقسام بعد." />
        <TopList title="الأصناف الأعلى مشاهدة" rows={top("item")} accent={accent} empty="لا مشاهدات للأصناف بعد." />
      </div>
    </div>
  );
}

function StatCard({ label, value, d }: { label: string; value: string; d: number | null }) {
  return (
    <div className={CARD}>
      <p className="text-xs text-[#a6a6a3]">{label}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-2xl font-extrabold">{value}</p>
        <DeltaPill d={d} />
      </div>
    </div>
  );
}

function DeltaPill({ d }: { d: number | null }) {
  if (d === null) return <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-[#a6a6a3]">—</span>;
  const up = d >= 0;
  const c = up ? "#22c184" : "#e05a5a";
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ color: c, background: `${c}26` }}>
      {up ? "↗" : "↘"} {up ? "+" : ""}{d.toLocaleString("en-US")}%
    </span>
  );
}

function TopList({ title, rows, accent, empty }: { title: string; rows: [string, number][]; accent: string; empty: string }) {
  const max = rows[0]?.[1] ?? 1; // sorted desc, so first is the max
  return (
    <div className={CARD}>
      <p className="mb-3 font-extrabold">{title}</p>
      {!rows.length && <p className="text-sm text-[#a6a6a3]">{empty}</p>}
      <ul className="space-y-3">
        {rows.map(([name, hits]) => (
          <li key={name}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{name}</span>
              <span className="font-bold text-[#a6a6a3]">{hits.toLocaleString("en-US")}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10">
              <div className="h-1.5 rounded-full" style={{ width: `${(hits / max) * 100}%`, background: accent }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
