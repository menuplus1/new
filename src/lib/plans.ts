/** Single source of truth for plans, prices (IQD) and feature gates.
 *  The DB mirrors these limits in triggers (0005_plans.sql) — keep in sync. */
export type Plan = "free" | "basic" | "premium" | "ultimate";
export type AppKey = "booking" | "promos";

export const PLAN_INFO: Record<
  Plan,
  { label: string; monthly: number; itemLimit: number | null; catLimit: number | null; admins: number }
> = {
  free: { label: "باقة الانطلاق", monthly: 0, itemLimit: 15, catLimit: 5, admins: 1 },
  basic: { label: "الباقة الأساسية", monthly: 25000, itemLimit: 100, catLimit: 15, admins: 1 },
  premium: { label: "باقة التميز", monthly: 35000, itemLimit: null, catLimit: null, admins: 3 },
  ultimate: { label: "باقة شاملة", monthly: 50000, itemLimit: null, catLimit: null, admins: 10 },
};

/** yearly = 10 × monthly (شهران مجاناً) */
export const YEARLY_MONTHS = 10;

export type Feature =
  | "no_ads"
  | "stats"
  | "seo"
  | "templates"
  | "languages"
  | "about"
  | "hours"
  | "reviews"
  | "ordering"
  | "tables"
  | "multi_covers"
  | "multi_item_images"
  | "health_badge"
  | "hide_branding";

const RANK: Record<Plan, number> = { free: 0, basic: 1, premium: 2, ultimate: 3 };

/** the minimum plan that unlocks each feature (mirrors the pricing matrix) */
const MIN: Record<Feature, Plan> = {
  no_ads: "basic",
  stats: "basic",
  seo: "basic",
  templates: "basic",
  languages: "basic",
  about: "basic",
  hours: "basic",
  reviews: "basic",
  ordering: "premium",
  tables: "premium",
  multi_covers: "premium",
  multi_item_images: "premium",
  health_badge: "premium",
  hide_branding: "ultimate",
};

export const can = (plan: Plan, f: Feature) => RANK[plan] >= RANK[MIN[f]];
export const minPlanFor = (f: Feature): Plan => MIN[f];

/** store apps: included in شاملة, activatable from the store in أساسية/تميز, locked in the free plan */
export const hasApp = (r: { plan: Plan; apps: string[] }, app: AppKey) =>
  r.plan === "ultimate" || (RANK[r.plan] >= 1 && r.apps.includes(app));

export const iqd = (n: number) => `${n.toLocaleString("en-US")} د.ع`;

/** paid signups start as a 7-day trial; expired trial behaves as free */
export const TRIAL_DAYS = 7;
export function effectivePlan(plan: Plan, trial_ends: string | null | undefined): Plan {
  if (trial_ends && new Date(trial_ends).getTime() < Date.now()) return "free";
  return plan;
}
