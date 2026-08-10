"use server";

import { createClient } from "@supabase/supabase-js";

export type OrderLine = { name: string; qty: number; unit_price: number };

/** Place an order for a tenant. Persists to the DB when configured (via a
 *  SECURITY DEFINER rpc); otherwise returns a demo confirmation so the flow is
 *  demonstrable without a database. */
export async function placeOrder(input: {
  restaurantId: string;
  table: string | null;
  lines: OrderLine[];
  phone: string | null;
  note: string | null;
}): Promise<{ ok: true; orderNumber: string } | { ok: false; error: string }> {
  if (!input.lines.length) return { ok: false, error: "السلة فارغة." };

  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (URL && SERVICE) {
    try {
      const sb = createClient(URL, SERVICE);
      const total = input.lines.reduce((s, l) => s + l.unit_price * l.qty, 0);
      const { data, error } = await sb.rpc("place_order", {
        p_restaurant: input.restaurantId,
        p_table: input.table,
        p_lines: input.lines,
        p_total: total,
        p_phone: input.phone,
        p_note: input.note,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true, orderNumber: String(data) };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  // demo mode (no DB yet) — deterministic-ish placeholder number
  const n = 100 + (input.lines.reduce((s, l) => s + l.qty, 0) % 900);
  return { ok: true, orderNumber: String(n).padStart(3, "0") };
}
