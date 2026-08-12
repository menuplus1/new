"use client";

/** كونسول المنصّة — شاشة المطاعم.
 *
 *  كل القراءة استدعاء واحد (listRestaurants) والفلترة كلّها في المتصفّح: القائمة
 *  بمئات الصفوف لا آلافها، فالفلترة من الخادم تكلفة بلا فائدة.
 *  ponytail: فلترة O(n) على كل حرف بحث — لو تجاوزت القائمة بضعة آلاف صفّ انقل
 *  البحث إلى الخادم مع debounce. */

import { useCallback, useEffect, useState } from "react";
import {
  addNote,
  deleteRestaurant,
  extendTrial,
  listNotes,
  listRestaurants,
  setActive,
  setApps,
  setPlan,
  type RestRow,
} from "@/lib/platform";
import { PLAN_INFO, iqd, type Plan } from "@/lib/plans";
import { CARD, FIELD, Toggle } from "@/app/admin/ui";
import { BRAND, Chip, Empty, TD, Table, planTone, restStatus } from "./ui";

type Note = { id: string; body: string; order_id: string | null; created_at: string };

const PLANS: Plan[] = ["free", "basic", "premium", "ultimate"];
const APPS: [string, string][] = [
  ["booking", "الحجوزات"],
  ["promos", "العروض"],
];
const STATUSES = ["نشط", "تجربة", "منتهي", "موقوف"] as const;
const DOWNGRADE = "التخفيض سيحذف الأغلفة الإضافية ويعيد اللغات للعربية فقط — لا يمكن التراجع";

/** مفتاح الفلترة مشتقّ من restStatus نفسها — فلا يختلف الفلتر أبداً عمّا تعرضه الشارة.
 *  (التجربة سبعة أيام، فالمنتهي قريباً = warn هو عمليّاً «تجربة») */
function statusOf(r: RestRow, nowMs: number): (typeof STATUSES)[number] {
  if (!r.active) return "موقوف";
  const { tone } = restStatus(r, nowMs);
  return tone === "bad" ? "منتهي" : tone === "warn" ? "تجربة" : "نشط";
}

const date = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB") : "—");
const num = (n: number) => n.toLocaleString("en-US");

const BTN = "rounded-xl border border-white/15 px-3 py-1.5 text-sm font-bold transition hover:bg-white/5 disabled:opacity-40";
const BTN_ON = "rounded-xl px-3 py-1.5 text-sm font-bold text-[#0d0d0d] transition disabled:opacity-40";

export function Restaurants({ token }: { token: string }) {
  const [rows, setRows] = useState<RestRow[] | null>(null);
  const [nowMs, setNowMs] = useState(0); // لقطة وقت التحميل — الرندر يبقى نقيّاً
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [q, setQ] = useState("");
  const [planF, setPlanF] = useState<"all" | Plan>("all");
  const [statF, setStatF] = useState<"all" | (typeof STATUSES)[number]>("all");

  const [sel, setSel] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [delSlug, setDelSlug] = useState("");
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await listRestaurants(token);
    setNowMs(Date.now());
    if (!("ok" in res) || !res.ok) {
      setErr("error" in res ? String(res.error) : "تعذّر تحميل المطاعم.");
      setRows([]);
      return;
    }
    setRows(res.rows);
  }, [token]);

  const loadNotes = useCallback(
    async (id: string) => {
      const res = await listNotes({ accessToken: token, restaurantId: id });
      setNotes("ok" in res && res.ok ? (res.notes as Note[]) : []);
    },
    [token],
  );

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  useEffect(() => {
    if (!sel) return;
    (async () => {
      setDelSlug("");
      setOkMsg(null);
      await loadNotes(sel);
    })();
  }, [sel, loadNotes]);

  /** كل تعديل: انتظر، اعرض الخطأ حرفيّاً، ثم أعد التحميل */
  async function run<T extends { ok: boolean }>(p: Promise<T>) {
    setErr(null);
    setOkMsg(null);
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

  const needle = q.trim().toLowerCase();
  const view = rows.filter(
    (r) =>
      (!needle || [r.name, r.slug, r.ownerEmail ?? ""].some((s) => s.toLowerCase().includes(needle))) &&
      (planF === "all" || r.plan === planF) &&
      (statF === "all" || statusOf(r, nowMs) === statF),
  );
  const cur = rows.find((r) => r.id === sel) ?? null;

  /* ————— أفعال ————— */

  const changePlan = async (r: RestRow, next: Plan) => {
    if (next === r.plan) return;
    const down = PLANS.indexOf(next) < PLANS.indexOf(r.plan) && (next === "free" || next === "basic");
    if (down && !window.confirm(`${DOWNGRADE}\n\nتأكيد تخفيض «${r.name}»؟`)) return;
    await run(setPlan({ accessToken: token, id: r.id, plan: next }));
  };

  const extend = async (r: RestRow, days: number) => {
    const res = await run(extendTrial({ accessToken: token, id: r.id, days }));
    if (res) setOkMsg(`مدفوع حتى ${new Date(res.until).toLocaleDateString("en-GB")}`);
  };

  const toggleApp = (r: RestRow, key: string) => {
    const apps = r.apps ?? [];
    return run(setApps({ accessToken: token, id: r.id, apps: apps.includes(key) ? apps.filter((a) => a !== key) : [...apps, key] }));
  };

  const toggleActive = async (r: RestRow) => {
    if (r.active && !window.confirm(`تعليق «${r.name}» سيُطفئ صفحة المنيو أمام الزبائن فوراً. متابعة؟`)) return;
    await run(setActive({ accessToken: token, id: r.id, active: !r.active }));
  };

  const saveNote = async (r: RestRow) => {
    const body = noteBody.trim();
    if (!body) return;
    const res = await run(addNote({ accessToken: token, restaurantId: r.id, body }));
    if (res) {
      setNoteBody("");
      await loadNotes(r.id);
    }
  };

  const remove = async (r: RestRow) => {
    if (!window.confirm(`حذف «${r.name}» نهائياً؟ لا يمكن التراجع.`)) return;
    const res = await run(deleteRestaurant({ accessToken: token, id: r.id, confirmSlug: delSlug }));
    if (res) setSel(null);
  };

  return (
    <div className="space-y-4">
      {err && <p className="text-sm text-red-400">{err}</p>}

      {/* ————— شريط الأدوات ————— */}
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث باسم المطعم أو الرابط أو بريد المالك…"
          className={`${FIELD} min-w-[220px] flex-1`}
        />
        <select value={planF} onChange={(e) => setPlanF(e.target.value as "all" | Plan)} className={`${FIELD} w-auto`}>
          <option value="all">كل الباقات</option>
          {PLANS.map((p) => (
            <option key={p} value={p}>{PLAN_INFO[p].label}</option>
          ))}
        </select>
        <select value={statF} onChange={(e) => setStatF(e.target.value as "all" | (typeof STATUSES)[number])} className={`${FIELD} w-auto`}>
          <option value="all">كل الحالات</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* ————— لوحة التفاصيل ————— */}
      {cur && (
        <div className={`${CARD} space-y-5`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-lg font-black">{cur.name}</p>
              <a href={`/${cur.slug}`} target="_blank" rel="noreferrer" dir="ltr" className="text-xs text-[#a6a6a3] underline-offset-2 hover:underline">
                /{cur.slug} ↗
              </a>
            </div>
            <button onClick={() => setSel(null)} className={BTN}>إغلاق ✕</button>
          </div>

          {okMsg && <p className="text-sm" style={{ color: BRAND }}>{okMsg}</p>}

          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <Fact k="المعرّف"><span dir="ltr" className="font-mono text-[11px] text-[#a6a6a3]">{cur.id}</span></Fact>
            <Fact k="التسجيل">{date(cur.created_at)}</Fact>
            <Fact k="مدفوع حتى">{date(cur.trial_ends)}</Fact>
            <Fact k="المالك">
              <span dir="ltr" className="block truncate">{cur.ownerEmail ?? "—"}</span>
              <span dir="ltr" className="block truncate font-mono text-[11px] text-[#a6a6a3]">{cur.owner ?? "—"}</span>
            </Fact>
            <Fact k="القالب">{num(cur.template)}</Fact>
            <Fact k="التطبيقات">{cur.apps?.length ? cur.apps.join("، ") : "—"}</Fact>
            <Fact k="أصناف">{num(cur.items)}</Fact>
            <Fact k="طلبات">{num(cur.orders)}</Fact>
            <Fact k="الحالة"><Chip {...restStatus(cur, nowMs)} /></Fact>
          </dl>

          {/* الباقة */}
          <Section title="الباقة">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={cur.plan}
                disabled={busy}
                onChange={(e) => changePlan(cur, e.target.value as Plan)}
                className={`${FIELD} w-auto`}
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>{PLAN_INFO[p].label}</option>
                ))}
              </select>
              <span className="text-sm text-[#a6a6a3]">{iqd(PLAN_INFO[cur.plan].monthly)} / شهر</span>
            </div>
            {PLANS.indexOf(cur.plan) > 0 && (
              <p className="mt-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-300">
                ⚠ {DOWNGRADE}
              </p>
            )}
          </Section>

          {/* الاشتراك */}
          <Section title="الاشتراك">
            <div className="flex flex-wrap gap-2">
              {([[7, "+٧ أيام"], [14, "+١٤ يوماً"], [30, "+٣٠ يوماً"]] as [number, string][]).map(([d, label]) => (
                <button key={d} disabled={busy} onClick={() => extend(cur, d)} className={BTN}>{label}</button>
              ))}
            </div>
          </Section>

          {/* التطبيقات */}
          <Section title="التطبيقات">
            <div className="space-y-2">
              {APPS.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold">{label}</span>
                  <Toggle on={(cur.apps ?? []).includes(key)} onClick={() => void toggleApp(cur, key)} accent={BRAND} disabled={busy} />
                </div>
              ))}
            </div>
          </Section>

          {/* الحالة */}
          <Section title="الحالة">
            <button
              disabled={busy}
              onClick={() => toggleActive(cur)}
              className={cur.active ? BTN : BTN_ON}
              style={cur.active ? undefined : { background: BRAND }}
            >
              {cur.active ? "تعليق المطعم" : "تفعيل المطعم"}
            </button>
          </Section>

          {/* الملاحظات */}
          <Section title="الملاحظات">
            <ul className="space-y-2">
              {!notes.length && <li className="text-sm text-[#a6a6a3]">لا ملاحظات على هذا المطعم.</li>}
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                  <p className="mt-1 text-[11px] text-[#a6a6a3]">{date(n.created_at)}</p>
                </li>
              ))}
            </ul>
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={3}
              placeholder="ملاحظة داخلية عن هذا المطعم…"
              className={`${FIELD} mt-2 resize-y`}
            />
            <button
              disabled={busy || !noteBody.trim()}
              onClick={() => saveNote(cur)}
              className={`${BTN_ON} mt-2`}
              style={{ background: BRAND }}
            >
              حفظ ملاحظة
            </button>
          </Section>

          {/* الحذف */}
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
            <p className="font-extrabold text-red-300">حذف نهائي</p>
            <p className="mt-1 text-xs text-[#a6a6a3]">
              اكتب رابط المطعم <span dir="ltr" className="font-mono">{cur.slug}</span> لتأكيد الحذف. لا يمكن التراجع.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                value={delSlug}
                onChange={(e) => setDelSlug(e.target.value)}
                dir="ltr"
                placeholder={cur.slug}
                className={`${FIELD} min-w-[180px] flex-1`}
              />
              <button
                disabled={busy || delSlug !== cur.slug}
                onClick={() => remove(cur)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-40"
              >
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ————— الجدول ————— */}
      {!rows.length ? (
        <Empty>لا توجد مطاعم بعد.</Empty>
      ) : !view.length ? (
        <Empty>لا نتائج مطابقة.</Empty>
      ) : (
        <Table cols={["المطعم", "الرابط", "الباقة", "الحالة", "المالك", "التسجيل", "أصناف", "طلبات"]}>
          {view.map((r) => (
            <tr
              key={r.id}
              onClick={() => setSel(r.id)}
              className={`cursor-pointer transition hover:bg-white/5 ${r.id === sel ? "bg-white/[0.06]" : ""}`}
            >
              <td className={TD}>
                <span className="flex items-center gap-2">
                  <span className="size-[10px] shrink-0 rounded-full" style={{ background: r.primary_color }} />
                  <span className="truncate font-bold">{r.name}</span>
                </span>
              </td>
              <td className={TD}>
                <a
                  href={`/${r.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  dir="ltr"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#a6a6a3] underline-offset-2 hover:underline"
                >
                  /{r.slug}
                </a>
              </td>
              <td className={TD}><Chip label={PLAN_INFO[r.plan].label} tone={planTone(r.plan)} /></td>
              <td className={TD}><Chip {...restStatus(r, nowMs)} /></td>
              <td className={TD}><span dir="ltr" className="block max-w-[180px] truncate text-[#a6a6a3]">{r.ownerEmail ?? "—"}</span></td>
              <td className={`${TD} whitespace-nowrap text-[#a6a6a3]`}>{date(r.created_at)}</td>
              <td className={TD}>{num(r.items)}</td>
              <td className={TD}>{num(r.orders)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

function Fact({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-[#a6a6a3]">{k}</dt>
      <dd className="mt-0.5 min-w-0 font-bold">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-white/10 pt-4">
      <p className="mb-2 text-sm font-extrabold">{title}</p>
      {children}
    </div>
  );
}
