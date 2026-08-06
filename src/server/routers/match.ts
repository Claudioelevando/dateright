import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { calculateAge } from "@/lib/age";
import { prisma } from "@/lib/db";
import { signCoverPhoto } from "@/lib/storage";

import { activeProcedure, router } from "../trpc";

const swipeInput = z.object({
  targetProfileId: z.string().uuid(),
  action: z.enum(["LIKE", "PASS"]),
});

function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function isBlockedPair(userAId: string, userBId: string) {
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId },
      ],
    },
  });
  return blocked != null;
}

export async function assertParticipant(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Match não encontrado." });
  }
  if (match.userAId !== userId && match.userBId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  const otherId = match.userAId === userId ? match.userBId : match.userAId;
  if (await isBlockedPair(userId, otherId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Esta conversa não está mais disponível." });
  }

  return match;
}

export const participantInclude = {
  photos: { orderBy: { position: "asc" as const }, take: 1 },
  interests: { include: { interest: true } },
};

export async function toMatchParticipant(profile: {
  id: string;
  name: string;
  birthDate: Date;
  city: string;
  bio: string | null;
  photos: { storagePath: string }[];
  interests: { interest: { label: string } }[];
}) {
  return {
    id: profile.id,
    name: profile.name,
    age: calculateAge(profile.birthDate),
    city: profile.city,
    bio: profile.bio ?? undefined,
    photos: await signCoverPhoto(profile.photos[0]?.storagePath),
    interests: profile.interests.map((pi) => pi.interest.label),
  };
}

export const matchRouter = router({
  swipe: activeProcedure.input(swipeInput).mutation(async ({ ctx, input }) => {
    if (input.targetProfileId === ctx.userId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Não é possível curtir o próprio perfil." });
    }

    // Verificado fora da transação (o par bloqueado já foi excluído da descoberta — isso é
    // só uma defesa contra um client com um id de candidato obtido antes do bloqueio).
    // NOT_FOUND, não FORBIDDEN, pra não revelar que houve bloqueio.
    if (await isBlockedPair(ctx.userId, input.targetProfileId)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado." });
    }

    const [lockA, lockB] = canonicalPair(ctx.userId, input.targetProfileId);

    return prisma.$transaction(async (tx) => {
      // Lock por par canonicalizado: sem isso, dois swipes recíprocos quase simultâneos
      // podem cada um ler o swipe do outro ainda não commitado e concluir "sem match" —
      // o lock serializa as duas transações desse par, garantindo que a segunda enxergue
      // o swipe da primeira já commitado.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${lockA}:${lockB}`}, 0))`;

      const target = await tx.profile.findUnique({
        where: { id: input.targetProfileId },
        select: { id: true },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado." });
      }

      await tx.swipe.upsert({
        where: { swiperId_swipedId: { swiperId: ctx.userId, swipedId: input.targetProfileId } },
        create: { swiperId: ctx.userId, swipedId: input.targetProfileId, action: input.action },
        update: { action: input.action, createdAt: new Date() },
      });

      if (input.action === "PASS") {
        return { matched: false as const };
      }

      const reciprocal = await tx.swipe.findUnique({
        where: { swiperId_swipedId: { swiperId: input.targetProfileId, swipedId: ctx.userId } },
      });
      if (!reciprocal || reciprocal.action !== "LIKE") {
        return { matched: false as const };
      }

      const [userAId, userBId] = canonicalPair(ctx.userId, input.targetProfileId);
      const match = await tx.match.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        create: { userAId, userBId },
        update: {},
      });

      return { matched: true as const, matchId: match.id };
    });
  }),

  listMatches: activeProcedure.query(async ({ ctx }) => {
    const [matches, blocks] = await Promise.all([
      prisma.match.findMany({
        where: { OR: [{ userAId: ctx.userId }, { userBId: ctx.userId }] },
        orderBy: { createdAt: "desc" },
        include: {
          userA: { include: participantInclude },
          userB: { include: participantInclude },
        },
      }),
      prisma.block.findMany({
        where: { OR: [{ blockerId: ctx.userId }, { blockedId: ctx.userId }] },
        select: { blockerId: true, blockedId: true },
      }),
    ]);
    const blockedIds = new Set(
      blocks.map((b) => (b.blockerId === ctx.userId ? b.blockedId : b.blockerId)),
    );

    return Promise.all(
      matches
        .filter((match) => {
          const otherId = match.userAId === ctx.userId ? match.userBId : match.userAId;
          return !blockedIds.has(otherId);
        })
        .map(async (match) => {
          const other = match.userAId === ctx.userId ? match.userB : match.userA;
          return {
            matchId: match.id,
            matchedAt: match.createdAt,
            profile: await toMatchParticipant(other),
          };
        }),
    );
  }),

  getById: activeProcedure
    .input(z.object({ matchId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertParticipant(input.matchId, ctx.userId);

      const match = await prisma.match.findUniqueOrThrow({
        where: { id: input.matchId },
        include: {
          userA: { include: participantInclude },
          userB: { include: participantInclude },
        },
      });

      const other = match.userAId === ctx.userId ? match.userB : match.userA;
      return {
        matchId: match.id,
        matchedAt: match.createdAt,
        profile: await toMatchParticipant(other),
      };
    }),
});
