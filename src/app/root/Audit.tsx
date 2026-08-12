"use client";

/** سجل النشاط — للقراءة فقط، يُكتب تلقائياً بعد كل عملية في platform.ts */

import { useEffect, useState } from "react";
import { listAudit } from "@/lib/platform";
import { Chip, Empty, Table, TD } from "./ui";

type Row = {
  id: string;
  created_at: string;
  actor_email: string | null;
  action: string;
  target: string | null;
  meta: Record<string, unknown> | null;
};

const COLS = ["الوقت", "المنفّذ", "العملية", "الهدف", "التفاصيل"];

const ACTION: Record<string, string> = {
  "plan.set": "تغيير باقة",
  "trial.extend": "تمديد اشتراك",
  "restaurant.suspend": "تعليق مطعم",
  "restaurant.activate": "تفعيل مطعم",
  "restaurant.delete": "حذف مطعم",
  "apps.set": "تفعيل تطبيقات",
  "subscription.renew": "تسجيل تجديد",
  "note.add": "إضافة ملاحظة",
};

const val = (v: unknown) => (Array.isArray(v) ? v.join("، ") : v === null || v === undefined ? "—" : String(v));

export function Audit({ token }: { token: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await listAudit({ accessToken: token, limit: 200 });
      if (!("ok" in res) || !res.ok) {
        setErr("error" in res ? res.error : "تعذّر تحميل السجل.");
        return;
      }
      setRows(res.rows as Row[]);
    })();
  }, [token]);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!rows) return <p className="text-[#a6a6a3]">جارٍ التحميل…</p>;
  if (!rows.length) return <Empty>لا نشاط مسجّل بعد.</Empty>;

  return (
    <Table cols={COLS}>
      {rows.map((r) => {
        const at = new Date(r.created_at);
        return (
          <tr key={r.id}>
            <td className={`${TD} whitespace-nowrap text-xs text-[#a6a6a3]`} dir="ltr">
              {at.toLocaleDateString("en-GB")} {at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </td>
            <td className={`${TD} text-xs`} dir="ltr">
              {r.actor_email ?? "—"}
            </td>
            <td className={`${TD} whitespace-nowrap font-bold`}>{ACTION[r.action] ?? r.action}</td>
            <td className={`${TD} text-xs text-[#a6a6a3]`} dir="ltr" title={r.target ?? ""}>
              {r.target ? r.target.slice(0, 8) : "—"}
            </td>
            <td className={TD}>
              <div className="flex flex-wrap gap-1">
                {Object.entries(r.meta ?? {}).map(([k, v]) => (
                  <Chip key={k} label={`${k}: ${val(v)}`} />
                ))}
              </div>
            </td>
          </tr>
        );
      })}
    </Table>
  );
}
