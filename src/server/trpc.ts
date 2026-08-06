import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import type { Context } from "./context";

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

// Além de autenticado, exige que a conta não esteja suspensa — usado nas superfícies de
// interação com outros usuários (descoberta, match, chat). Perfil/Premium/moderação continuam
// em protectedProcedure puro: um usuário suspenso ainda precisa ver e entender sua suspensão.
export const activeProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.isSuspended) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Sua conta foi suspensa e não pode interagir com outros usuários.",
    });
  }
  return next({ ctx });
});

export const moderatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "MODERATOR" && ctx.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
