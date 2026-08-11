"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CARD } from "./ui";

type Review = { id: string; stars: number; name: string; comment: string | null; approved: boolean; created_at: string };

export function Reviews({ client, restaurantId, accent }: { client: SupabaseClient; restaurantId: string; accent: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await client
      .from("reviews")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(100);
    setMissing(Boolean(error)); // table may not exist yet (migration 0006) — treat as empty
    setReviews((data ?? []) as Review[]);
    setLoading(false);
  }, [client, restaurantId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  /** optimistic: apply locally first; on error surface the message and reload */
  async function mutate(next: Review[], fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setReviews(next);
    setErr(null);
    const { error } = await fn();
    if (error) {
      setErr(error.message);
      await load();
    }
  }

  const setApproved = (r: Review, approved: boolean) =>
    mutate(reviews.map((x) => (x.id === r.id ? { ...x, approved } : x)), () => client.from("reviews").update({ approved }).eq("id", r.id));
  const remove = (r: Review) => mutate(reviews.filter((x) => x.id !== r.id), () => client.from("reviews").delete().eq("id", r.id));

  if (loading) return <p className="text-[#a6a6a3]">جارٍ التحميل…</p>;

  const pending = reviews.filter((r) => !r.approved);
  const published = reviews.filter((r) => r.approved);
  const del = (r: Review) => (
    <button onClick={() => remove(r)} className="rounded-xl border border-red-400/40 px-3 py-1.5 text-sm font-bold text-red-400">حذف</button>
  );

  return (
    <div className="space-y-5">
      {err && <p className="text-sm text-red-400">{err}</p>}
      {missing && (
        <p className="text-sm text-[#a6a6a3]">
          جدول التقييمات غير موجود بعد — شغّل ملف الترحيل <span dir="ltr">0006</span> في Supabase.
        </p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-extrabold">بانتظار الموافقة ({pending.length.toLocaleString("en-US")})</h2>
        {!pending.length && <p className="text-[#a6a6a3]">لا يوجد جديد.</p>}
        <ul className="space-y-3">
          {pending.map((r) => (
            <ReviewCard key={r.id} r={r}>
              <button onClick={() => setApproved(r, true)} className="rounded-xl px-3 py-1.5 text-sm font-bold text-[#0d0d0d]" style={{ background: accent }}>نشر</button>
              {del(r)}
            </ReviewCard>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">المنشورة ({published.length.toLocaleString("en-US")})</h2>
        {!published.length && <p className="text-[#a6a6a3]">لا توجد تقييمات بعد.</p>}
        <ul className="space-y-3">
          {published.map((r) => (
            <ReviewCard key={r.id} r={r}>
              <button onClick={() => setApproved(r, false)} className="rounded-xl border border-white/15 px-3 py-1.5 text-sm font-bold">إخفاء</button>
              {del(r)}
            </ReviewCard>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ReviewCard({ r, children }: { r: Review; children: React.ReactNode }) {
  const n = Math.max(0, Math.min(5, r.stars));
  return (
    <li className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-lg leading-none">
          <span style={{ color: "#eab308" }}>{"★".repeat(n)}</span>
          <span className="text-white/20">{"★".repeat(5 - n)}</span>
        </span>
        <span className="text-sm text-[#a6a6a3]">{new Date(r.created_at).toLocaleDateString("en-GB")}</span>
      </div>
      <p className="mt-1 font-bold">{r.name}</p>
      {r.comment && <p className="mt-1 text-sm text-[#a6a6a3]">{r.comment}</p>}
      <div className="mt-3 flex justify-end gap-2">{children}</div>
    </li>
  );
}
