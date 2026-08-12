"use client";

/** Dispatcher: picks the tenant's template (1–16) and mounts the shared
 *  cart bar + modals once. ?tpl=N previews another template (paid plans).
 *  7–16 all render <Odd/> — same layout, different skin (the ten cloned
 *  menus differ by skin + accent + seeded data, not by structure). */

import type { MenuData } from "@/lib/types";
import { can } from "@/lib/plans";
import { oddSkin } from "@/lib/odd-meta";
import { clampTpl } from "@/lib/templates";
import { CartBar, MenuModals, MenuProvider } from "./menu/shared";
import { T1 } from "./menu/T1";
import { T2 } from "./menu/T2";
import { T3 } from "./menu/T3";
import { T4 } from "./menu/T4";
import { T5 } from "./menu/T5";
import { T6 } from "./menu/T6";
import { Odd } from "./menu/Odd";

const TEMPLATES = [T1, T2, T3, T4, T5, T6];

export function TenantMenu({ data, table = null, tpl }: { data: MenuData; table?: string | null; tpl?: number }) {
  const r = data.restaurant;
  const n = can(r.plan, "templates") ? clampTpl(tpl || r.template || 1) : 1;
  const skin = oddSkin(n);
  const T = TEMPLATES[n - 1];
  return (
    <MenuProvider data={data} table={table}>
      {skin ? <Odd skin={skin} /> : <T />}
      <CartBar />
      <MenuModals />
    </MenuProvider>
  );
}
