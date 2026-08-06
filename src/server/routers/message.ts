import { z } from "zod";

import { prisma } from "@/lib/db";

import { assertParticipant } from "./match";
import { activeProcedure, router } from "../trpc";

const listInput = z.object({ matchId: z.string().uuid() });

const sendInput = z.object({
  matchId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

export const messageRouter = router({
  list: activeProcedure.input(listInput).query(async ({ ctx, input }) => {
    await assertParticipant(input.matchId, ctx.userId);

    const messages = await prisma.message.findMany({
      where: { matchId: input.matchId },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    return messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      body: m.body,
      createdAt: m.createdAt,
    }));
  }),

  send: activeProcedure.input(sendInput).mutation(async ({ ctx, input }) => {
    await assertParticipant(input.matchId, ctx.userId);

    const message = await prisma.message.create({
      data: { matchId: input.matchId, senderId: ctx.userId, body: input.body },
    });

    return {
      id: message.id,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt,
    };
  }),
});
