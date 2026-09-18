import { z } from "zod";

import { prisma } from "@/lib/db";
import { sendPushToProfile } from "@/lib/notifications/push";

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
    const match = await assertParticipant(input.matchId, ctx.userId);

    const [message, sender] = await Promise.all([
      prisma.message.create({
        data: { matchId: input.matchId, senderId: ctx.userId, body: input.body },
      }),
      prisma.profile.findUnique({ where: { id: ctx.userId }, select: { name: true } }),
    ]);

    const otherId = match.userAId === ctx.userId ? match.userBId : match.userAId;
    await sendPushToProfile(otherId, {
      title: sender?.name ?? "Nova mensagem",
      body: input.body.length > 100 ? `${input.body.slice(0, 100)}…` : input.body,
      url: `/chat/${input.matchId}`,
    });

    return {
      id: message.id,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt,
    };
  }),
});
