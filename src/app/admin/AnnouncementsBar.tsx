"use client";

/** إعلانات المنصّة أعلى لوحة المطعم — تُغلق لكل مستخدم على حدة (announcement_reads).
 *  الإغلاق متفائل: نُزيلها محليّاً فوراً ثم نسجّلها؛ فشل التسجيل يعني عودتها لاحقاً فقط. */

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dismissAnnouncement, liveAnnouncements } from "@/lib/support";
import type { Rest } from "./ui";

type Ann = {
  id: string;
  title: string;
  body: string;
  kind: "info" | "offer" | "warning";
  cta_label: string | null;
  cta_url: string | null;
};

export function AnnouncementsBar({ client, rest }: { client: SupabaseClient; rest: Rest }) {
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<Ann[]>([]);

  useEffect(() => {
    (async () => {
      const t = (await client.auth.getSession()).data.session?.access_token;
      if (!t) return;
      setToken(t);
      const res = await liveAnnouncements({ accessToken: t, restaurantId: rest.id });
      if ("ok" in res && res.ok) setRows(res.announcements as Ann[]);
    })();
  }, [client, rest.id]);

  const close = async (id: string) => {
    setRows((r) => r.filter((a) => a.id !== id));
    if (token) await dismissAnnouncement({ accessToken: token, id });
  };

  if (!rows.length) return null;

  return (
    <div className="mb-5 space-y-3">
      {rows.map((a) => {
        const c = a.kind === "offer" ? "#eab308" : a.kind === "warning" ? "#ef4444" : rest.primary_color;
        return (
          <div
            key={a.id}
            className="rounded-2xl border p-4"
            style={{ borderColor: `color-mix(in srgb, ${c} 40%, transparent)`, background: `color-mix(in srgb, ${c} 10%, transparent)` }}
          >
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 font-extrabold" style={{ color: c }}>{a.title}</p>
              <button onClick={() => close(a.id)} aria-label="إغلاق الإعلان" className="shrink-0 text-sm text-[#a6a6a3] transition hover:text-[#f2f2f0]">
                ✕
              </button>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[#a6a6a3]">{a.body}</p>
            {a.cta_url && (
              <a
                href={a.cta_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block rounded-xl px-3 py-1.5 text-sm font-extrabold text-[#0d0d0d]"
                style={{ background: c }}
              >
                {a.cta_label || "التفاصيل"} ↗
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
