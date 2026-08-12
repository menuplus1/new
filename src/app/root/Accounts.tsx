"use client";

/** المسجّلون — كل حساب في auth وارتباطه بالمطاعم. قراءة فقط.
 *  `owned` من الـaction هو كل صفوف المطاعم (id, name, slug, owner) — نستعمله
 *  للملكية ولترجمة restaurant_id في العضويات، فلا حاجة لاستدعاء ثانٍ. */

import { useEffect, useState } from "react";
import { listAccounts } from "@/lib/platform";
import { CARD, FIELD } from "@/app/admin/ui";
import { BRAND, Chip, Empty, TD, Table } from "./ui";

type User = { id: string; email: string; created_at: string; last_sign_in_at: string | null };
type Rest = { id: string; name: string; slug: string; owner: string | null };
type Member = { user_id: string; restaurant_id: string; email: string; role: string };

const COLS = ["البريد", "التسجيل", "آخر دخول", "مطاعمه", "مشرف في"];
const ROLE: Record<string, string> = { owner: "مالك", manager: "مدير", staff: "موظّف" };
const date = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB") : "—");

export function Accounts({ token }: { token: string }) {
  const [data, setData] = useState<{ users: User[]; rests: Rest[]; members: Member[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [noRest, setNoRest] = useState(false);
  const [neverIn, setNeverIn] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await listAccounts(token);
      if (!("ok" in res) || !res.ok) {
        setErr("error" in res ? res.error : "تعذّر تحميل الحسابات.");
        return;
      }
      setData({ users: res.users, rests: res.owned as Rest[], members: res.memberships as Member[] });
    })();
  }, [token]);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return <p className="text-[#a6a6a3]">جارٍ التحميل…</p>;

  const ownedBy = (uid: string) => data.rests.filter((r) => r.owner === uid);
  const memberIn = (uid: string) => data.members.filter((m) => m.user_id === uid);
  const nameOf = (id: string) => data.rests.find((r) => r.id === id)?.name ?? "مطعم محذوف";

  const term = q.trim().toLowerCase();
  const rows = data.users.filter(
    (u) =>
      (!term || u.email.toLowerCase().includes(term)) &&
      (!noRest || ownedBy(u.id).length === 0) &&
      (!neverIn || !u.last_sign_in_at),
  );

  return (
    <div className="space-y-4">
      <div className={`${CARD} flex flex-wrap items-center gap-4`}>
        <div className="w-full sm:w-64">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالبريد" dir="ltr" className={FIELD} />
        </div>
        <Check label="بلا مطعم" on={noRest} set={setNoRest} />
        <Check label="لم يدخل أبداً" on={neverIn} set={setNeverIn} />
        <span className="ms-auto text-xs font-bold text-[#a6a6a3]">{rows.length.toLocaleString("en-US")} حساب</span>
      </div>

      {!rows.length ? (
        <div className={CARD}>
          <Empty>لا توجد حسابات.</Empty>
        </div>
      ) : (
        <Table cols={COLS}>
          {rows.map((u) => (
            <tr key={u.id}>
              <td className={`${TD} font-bold`} dir="ltr">{u.email}</td>
              <td className={`${TD} whitespace-nowrap text-xs text-[#a6a6a3]`} dir="ltr">{date(u.created_at)}</td>
              <td className={`${TD} whitespace-nowrap text-xs`}>
                {u.last_sign_in_at ? (
                  <span className="text-[#a6a6a3]" dir="ltr">{date(u.last_sign_in_at)}</span>
                ) : (
                  <span className="font-bold text-[#e05a5a]/70">لم يدخل بعد</span>
                )}
              </td>
              <td className={TD}>
                <div className="flex flex-wrap gap-1">
                  {ownedBy(u.id).map((r) => <Chip key={r.id} label={r.name} tone="brand" />)}
                  {!ownedBy(u.id).length && <span className="text-xs text-[#a6a6a3]">—</span>}
                </div>
              </td>
              <td className={TD}>
                <div className="flex flex-wrap gap-1">
                  {memberIn(u.id).map((m) => (
                    <Chip key={m.restaurant_id} label={`${nameOf(m.restaurant_id)} · ${ROLE[m.role] ?? m.role}`} />
                  ))}
                  {!memberIn(u.id).length && <span className="text-xs text-[#a6a6a3]">—</span>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <p className="text-center text-xs text-[#a6a6a3]">يعرض حتى ٢٠٠٠ حساب</p>
    </div>
  );
}

function Check({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} className="size-4" style={{ accentColor: BRAND }} />
      {label}
    </label>
  );
}
