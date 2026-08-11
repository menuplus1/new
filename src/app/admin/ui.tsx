"use client";

/** Shared bits for the admin dashboard panels. */

import type { DayHours, I18n, Lang, OrderType } from "@/lib/types";
import { PLAN_INFO, minPlanFor, type Feature, type Plan } from "@/lib/plans";

/** full restaurants row as the dashboard sees it */
export type Rest = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  currency: string;
  ordering: boolean;
  order_types: OrderType[];
  reservations: boolean;
  plan: Plan;
  apps: string[];
  template: number;
  tagline: string | null;
  about: string | null;
  socials: Record<string, string>;
  hours: DayHours[] | null;
  languages: Lang[];
  i18n: I18n;
  seo: { title?: string; description?: string };
  covers: string[];
  whatsapp_phone: string | null;
  hide_branding: boolean;
  health_cert: string | null;
  owner: string | null;
};

export const CARD = "rounded-2xl border border-white/10 bg-[#1b1b1e] p-4";
export const FIELD = "w-full rounded-xl border border-white/10 bg-[#141416] px-3 py-2.5 text-sm outline-none";

export function LockBadge({ feature }: { feature: Feature }) {
  return (
    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-[#a6a6a3]">
      🔒 متاح في {PLAN_INFO[minPlanFor(feature)].label}
    </span>
  );
}

export function Toggle({ on, onClick, accent, disabled = false }: { on: boolean; onClick: () => void; accent: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-pressed={on} className="h-8 w-14 shrink-0 rounded-full border border-white/15 p-1 transition disabled:opacity-40" style={on ? { background: accent, borderColor: accent } : undefined}>
      <span className={`block size-6 rounded-full bg-white transition ${on ? "translate-x-[-24px]" : ""}`} />
    </button>
  );
}
