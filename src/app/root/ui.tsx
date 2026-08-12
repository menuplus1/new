"use client";

/** القطع المشتركة لكونسول مدير المنصّة.
 *
 *  اللون هنا ثابت (تركوازي) ولا يأتي أبداً من لون مطعم — هذه هي العلامة البصرية
 *  التي تفرّق الكونسول عن لوحة المطعم. البطاقات والحقول نفسها المستعملة في /admin. */

export { CARD, FIELD } from "@/app/admin/ui";

export const BRAND = "#10b3a3";

type Tone = "neutral" | "brand" | "good" | "warn" | "bad";

const TONE: Record<Tone, string> = {
  neutral: "#a6a6a3",
  brand: BRAND,
  good: "#22c184",
  warn: "#eab308",
  bad: "#e05a5a",
};

export function Chip({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const c = TONE[tone];
  return (
    <span
      className="inline-block rounded-full px-2.5 py-1 text-[11px] font-black"
      style={{ color: c, background: tone === "neutral" ? "rgba(255,255,255,0.1)" : `color-mix(in srgb, ${c} 18%, transparent)` }}
    >
      {label}
    </span>
  );
}

/* ————— بطاقات الأرقام (نسخة من لوحة المطعم بلون المنصّة) ————— */

const CARD_C = "rounded-2xl border border-white/10 bg-[#1b1b1e] p-4";

export function StatCard({ label, value, d }: { label: string; value: string; d: number | null }) {
  return (
    <div className={CARD_C}>
      <p className="text-xs text-[#a6a6a3]">{label}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-2xl font-extrabold">{value}</p>
        <DeltaPill d={d} />
      </div>
    </div>
  );
}

export function DeltaPill({ d }: { d: number | null }) {
  if (d === null) return <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-[#a6a6a3]">—</span>;
  const up = d >= 0;
  const c = up ? "#22c184" : "#e05a5a";
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ color: c, background: `${c}26` }}>
      {up ? "↗" : "↘"} {up ? "+" : ""}{d.toLocaleString("en-US")}%
    </span>
  );
}

export function TopList({ title, rows, empty }: { title: string; rows: [string, number][]; empty: string }) {
  const max = Math.max(1, ...rows.map(([, n]) => n)); // الصفوف ليست دائماً مرتّبة (الأسابيع زمنيّة)
  return (
    <div className={CARD_C}>
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
              <div className="h-1.5 rounded-full" style={{ width: `${(hits / max) * 100}%`, background: BRAND }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ————— جدول ————— */

/** صفّ الجدول: كل شاشة تكتب <tr>/<td> بنفسها وتستعمل TD للحشو والحدود */
export const TD = "border-b border-white/5 px-3 py-2.5 align-middle";

export function Table({ cols, children }: { cols: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#1b1b1e]">
      <table className="w-full min-w-[620px] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-[#1b1b1e]">
          <tr>
            {cols.map((c) => (
              <th key={c} className="border-b border-white/10 px-3 py-2.5 text-start text-xs font-black text-[#a6a6a3]">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-[#a6a6a3]">{children}</p>;
}

/* ————— حالات ————— */

export function planTone(plan: string): "neutral" | "brand" | "good" {
  return plan === "free" ? "neutral" : plan === "ultimate" ? "good" : "brand";
}

const DAY = 86400000;

/** حالة المطعم كما تُعرض في الجداول — الترتيب مهم: الإيقاف يسبق كل شيء */
export function restStatus(
  r: { active: boolean; plan: string; trial_ends: string | null },
  nowMs: number,
): { label: string; tone: Tone } {
  if (!r.active) return { label: "موقوف", tone: "bad" };
  if (r.plan === "free") return { label: "مجاني", tone: "neutral" };
  const end = r.trial_ends ? Date.parse(r.trial_ends) : null;
  if (end === null) return { label: "نشط", tone: "good" };
  if (end <= nowMs) return { label: "منتهي", tone: "bad" };
  if (end < nowMs + 7 * DAY) return { label: `ينتهي خلال ${Math.ceil((end - nowMs) / DAY).toLocaleString("en-US")} يوم`, tone: "warn" };
  return { label: `مدفوع حتى ${new Date(end).toLocaleDateString("en-GB")}`, tone: "good" };
}
