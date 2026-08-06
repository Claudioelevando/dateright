import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function createContext() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = (data?.claims?.sub as string | undefined) ?? null;

  const profile = userId
    ? await prisma.profile.findUnique({ where: { id: userId }, select: { role: true, suspendedAt: true } })
    : null;

  return {
    userId,
    email: (data?.claims?.email as string | undefined) ?? null,
    role: profile?.role ?? "USER",
    isSuspended: profile?.suspendedAt != null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
