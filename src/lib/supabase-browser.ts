import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Browser client for the manager dashboard: the anon key + the signed-in
 *  session, so RLS decides what each restaurant account can see. Null when the
 *  project has no database configured yet (demo mode). */
let client: SupabaseClient | null = null;

export function sb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key);
  return client;
}
