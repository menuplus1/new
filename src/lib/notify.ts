/** Restaurant notifications. Today the dashboard gets live updates via Supabase
 *  Realtime (see admin/page.tsx); this module is the seam for push channels.
 *  ponytail: WhatsApp sender is a no-op until a provider is wired — set
 *  WHATSAPP_TOKEN + WHATSAPP_PHONE_ID (Meta Cloud API) and implement send(). */

type Payload = { restaurantName: string; to: string | null | undefined; text: string };

async function send({ to, text }: Payload) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID || !to) return;
  // Meta Cloud API call goes here when the provider account exists.
  void text;
}

export function notifyNewOrder(r: { name: string; whatsapp_phone?: string | null }, orderNumber: string, type: string) {
  void send({ restaurantName: r.name, to: r.whatsapp_phone, text: `طلب جديد #${orderNumber} (${type})` }).catch(() => {});
}

export function notifyNewReservation(r: { name: string; whatsapp_phone?: string | null }, who: string, when: string) {
  void send({ restaurantName: r.name, to: r.whatsapp_phone, text: `حجز جديد: ${who} — ${when}` }).catch(() => {});
}
