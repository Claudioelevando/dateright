import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a service role key — ignora RLS. Uso restrito a código server-only
 * (routers tRPC, route handlers, scripts). Nunca importar em um Client Component.
 */
export function createAdminClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
