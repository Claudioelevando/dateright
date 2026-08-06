import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/lib/db";

import { adminProcedure, router } from "../trpc";

const roleSchema = z.enum(["USER", "MODERATOR", "ADMIN"]);

export const adminRouter = router({
  listUsers: adminProcedure
    .input(z.object({ search: z.string().trim().max(200).optional() }))
    .query(async ({ input }) => {
      return prisma.profile.findMany({
        where: input.search
          ? {
              OR: [
                { name: { contains: input.search, mode: "insensitive" } },
                { email: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : undefined,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isPremium: true,
          suspendedAt: true,
          suspendedReason: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }),

  setRole: adminProcedure
    .input(z.object({ profileId: z.string().uuid(), role: roleSchema }))
    .mutation(async ({ ctx, input }) => {
      if (input.profileId === ctx.userId && input.role !== "ADMIN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível remover seu próprio acesso de administrador.",
        });
      }
      await prisma.profile.update({ where: { id: input.profileId }, data: { role: input.role } });
      return { role: input.role };
    }),

  setSuspension: adminProcedure
    .input(
      z.object({
        profileId: z.string().uuid(),
        suspended: z.boolean(),
        reason: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await prisma.profile.update({
        where: { id: input.profileId },
        data: input.suspended
          ? { suspendedAt: new Date(), suspendedReason: input.reason ?? "Suspenso pela administração." }
          : { suspendedAt: null, suspendedReason: null },
      });
      return { suspended: input.suspended };
    }),
});
