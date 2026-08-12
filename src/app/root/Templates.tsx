"use client";

/** كونسول المنصّة — القوالب.
 *
 *  القائمة تأتي مدموجة من الخادم: الشيفرة (TPLS) هي الأساس وplatform_templates
 *  طبقة تخصيص فوقها. لذلك نحرّر الصفوف في مكانها ثم نحفظ الصفّ كاملاً، وبعد كل
 *  حفظ نعيد التحميل حتى ينقلب المصدر إلى «معدّل». */

import { useCallback, useEffect, useState } from "react";
import { listTemplateRows, resetTemplate, saveTemplate, type TemplateRow } from "@/lib/platform";
import { CARD, FIELD, Toggle } from "@/app/admin/ui";
import { BRAND, Chip } from "./ui";

const BTN = "rounded-xl border border-white/15 px-3 py-1.5 text-sm font-bold transition hover:bg-white/5 disabled:opacity-40";
const BTN_ON = "rounded-xl px-4 py-2 text-sm font-black text-[#0d0d0d] transition disabled:opacity-40";

export function Templates({ token }: { token: string }) {
  const [rows, setRows] = useState<TemplateRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await listTemplateRows(token);
    if (!("ok" in res) || !res.ok) {
      setErr("error" in res ? String(res.error) : "تعذّر تحميل القوالب.");
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
    setSaved(null);
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

  /** تعديل محلي فقط — لا يُكتب حتى «حفظ» */
  const patch = (n: number, p: Partial<TemplateRow>) => setRows(rows.map((t) => (t.n === n ? { ...t, ...p } : t)));

  const save = async (t: TemplateRow, active = t.active) => {
    const res = await run(
      saveTemplate({
        accessToken: token,
        n: t.n,
        name: t.name,
        description: t.description,
        accent: t.accent,
        sort: t.sort,
        active,
      }),
    );
    if (res) setSaved(t.n);
  };

  const reset = async (t: TemplateRow) => {
    if (!window.confirm(`استرجاع القالب ${t.n.toLocaleString("en-US")} إلى ما في الشيفرة؟ سيُحذف التخصيص.`)) return;
    await run(resetTemplate({ accessToken: token, n: t.n }));
  };

  return (
    <div className="space-y-4">
      {err && <p className="text-sm text-red-400">{err}</p>}

      <div className={CARD}>
        <p className="font-extrabold">حدود هذه الشاشة</p>
        <p className="mt-1 text-sm leading-relaxed text-[#a6a6a3]">
          تخطيط القالب نفسه شيفرة في المنصّة. من هنا تتحكّم بظهوره واسمه ووصفه ولونه وترتيبه — أما إضافة تخطيط جديد فتحتاج إصدار برمجي.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((t) => (
          <div key={t.n} className={`${CARD} space-y-3`}>
            <span className="block h-1.5 w-full rounded-full" style={{ background: t.accent }} />

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-black text-[#a6a6a3]" dir="ltr">
                {t.n.toLocaleString("en-US")}
              </span>
              <span className="min-w-0 flex-1 truncate font-black">{t.name}</span>
              <Chip label={t.source === "override" ? "معدّل" : "من الشيفرة"} tone={t.source === "override" ? "brand" : "neutral"} />
              <Toggle on={t.active} onClick={() => void save(t, !t.active)} accent={BRAND} disabled={busy} />
            </div>

            <p className="text-sm text-[#a6a6a3]">{t.description || "—"}</p>

            <div className="grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">الاسم</span>
                <input value={t.name} onChange={(e) => patch(t.n, { name: e.target.value })} className={FIELD} />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">الوصف</span>
                <textarea
                  value={t.description}
                  onChange={(e) => patch(t.n, { description: e.target.value })}
                  rows={2}
                  className={`${FIELD} resize-y`}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">اللون</span>
                <span className="flex items-center gap-2">
                  <input
                    type="color"
                    value={t.accent}
                    onChange={(e) => patch(t.n, { accent: e.target.value })}
                    aria-label="لون القالب"
                    className="size-10 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-[#141416] p-1"
                  />
                  <span dir="ltr" className="font-mono text-xs text-[#a6a6a3]">{t.accent}</span>
                </span>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#a6a6a3]">الترتيب</span>
                <input
                  type="number"
                  value={t.sort}
                  onChange={(e) => patch(t.n, { sort: Number(e.target.value) })}
                  dir="ltr"
                  className={FIELD}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button disabled={busy} onClick={() => save(t)} className={BTN_ON} style={{ background: BRAND }}>
                حفظ
              </button>
              {t.source === "override" && (
                <button disabled={busy} onClick={() => reset(t)} className={BTN}>استرجاع الأصل</button>
              )}
              <a href={`/sham?tpl=${t.n}&preview=1`} target="_blank" rel="noreferrer" className={`${BTN} ms-auto`}>
                معاينة ↗
              </a>
              {saved === t.n && <span className="text-xs font-bold" style={{ color: BRAND }}>✓ حُفظ</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
