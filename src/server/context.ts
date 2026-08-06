import { createClient } from "@/lib/supabase/server";

export async function createContext() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return {
    userId: (data?.claims?.sub as string | undefined) ?? null,
    email: (data?.claims?.email as string | undefined) ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
