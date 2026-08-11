"use client";

/** Dispatcher: picks the tenant's template (1–6) and mounts the shared
 *  cart bar + modals once. ?tpl=N previews another template (paid plans). */

import type { MenuData } from "@/lib/types";
import { can } from "@/lib/plans";
import { CartBar, MenuModals, MenuProvider } from "./menu/shared";
import { T1 } from "./menu/T1";
import { T2 } from "./menu/T2";
import { T3 } from "./menu/T3";
import { T4 } from "./menu/T4";
import { T5 } from "./menu/T5";
import { T6 } from "./menu/T6";

const TEMPLATES = [T1, T2, T3, T4, T5, T6];

export function TenantMenu({ data, table = null, tpl }: { data: MenuData; table?: string | null; tpl?: number }) {
  const r = data.restaurant;
  const wanted = tpl && tpl >= 1 && tpl <= 6 ? tpl : r.template;
  const n = can(r.plan, "templates") ? Math.min(6, Math.max(1, wanted || 1)) : 1;
  const T = TEMPLATES[n - 1];
  return (
    <MenuProvider data={data} table={table}>
      <T />
      <CartBar />
      <MenuModals />
    </MenuProvider>
  );
}
