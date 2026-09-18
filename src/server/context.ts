import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// x-forwarded-for pode trazer uma cadeia de proxies ("client, proxy1, proxy2") — o primeiro
// endereço é o do cliente original. Confiável aqui porque só a borda da Vercel escreve esse
// header antes de chegar na função.
function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
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
