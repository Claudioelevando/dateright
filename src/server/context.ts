import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// A Vercel sobrescreve x-forwarded-for/x-real-ip na borda com o IP real da conexão e não
// repassa valores vindos do cliente (https://vercel.com/docs/headers/request-headers#x-forwarded-for)
// — não é um header forjável aqui como seria atrás de um proxy genérico.
function getClientIp(req: Request) {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwardedFor = req.headers.get("x-forwarded-for");
  return forwardedFor ? forwardedFor.split(",")[0]!.trim() : "unknown";
}

export async function createContext({ req }: FetchCreateContextFnOptions) {
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
    ip: getClientIp(req),
    supabase,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
