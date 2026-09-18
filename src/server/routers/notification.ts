import { z } from "zod";

import { prisma } from "@/lib/db";

import { protectedProcedure, router } from "../trpc";

export const notificationRouter = router({
  registerToken: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // upsert por token (não por profileId+token): o mesmo token pode ter pertencido a outra
      // conta antes (logout/login com usuário diferente no mesmo navegador).
      await prisma.pushToken.upsert({
        where: { token: input.token },
        create: { token: input.token, profileId: ctx.userId },
        update: { profileId: ctx.userId },
      });
      return { ok: true as const };
    }),

  unregisterToken: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await prisma.pushToken.deleteMany({ where: { token: input.token, profileId: ctx.userId } });
      return { ok: true as const };
    }),
});
