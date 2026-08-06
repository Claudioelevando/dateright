import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { calculateAge } from "@/lib/age";
import { prisma } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

import { protectedProcedure, router } from "../trpc";

const swipeInput = z.object({
  targetProfileId: z.string().uuid(),
  action: z.enum(["LIKE", "PASS"]),
});

function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function signCoverPhoto(storagePath: string | undefined) {
  if (!storagePath) return [];
  const admin = createAdminClient();
  const { data } = await admin.storage.from("profile-photos").createSignedUrl(storagePath, 3600);
  return data?.signedUrl ? [data.signedUrl] : [];
}

const participantInclude = {
  photos: { orderBy: { position: "asc" as const }, take: 1 },
  interests: { include: { interest: true } },
};

async function toMatchParticipant(profile: {
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
  swipe: protectedProcedure.input(swipeInput).mutation(async ({ ctx, input }) => {
    if (input.targetProfileId === ctx.userId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Não é possível curtir o próprio perfil." });
    }

    return prisma.$transaction(async (tx) => {
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

  listMatches: protectedProcedure.query(async ({ ctx }) => {
    const matches = await prisma.match.findMany({
      where: { OR: [{ userAId: ctx.userId }, { userBId: ctx.userId }] },
      orderBy: { createdAt: "desc" },
      include: {
        userA: { include: participantInclude },
        userB: { include: participantInclude },
      },
    });

    return Promise.all(
      matches.map(async (match) => {
        const other = match.userAId === ctx.userId ? match.userB : match.userA;
        return {
          matchId: match.id,
          matchedAt: match.createdAt,
          profile: await toMatchParticipant(other),
        };
      }),
    );
  }),

  getById: protectedProcedure
    .input(z.object({ matchId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const match = await prisma.match.findUnique({
        where: { id: input.matchId },
        include: {
          userA: { include: participantInclude },
          userB: { include: participantInclude },
        },
      });
      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match não encontrado." });
      }
      if (match.userAId !== ctx.userId && match.userBId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const other = match.userAId === ctx.userId ? match.userB : match.userA;
      return {
        matchId: match.id,
        matchedAt: match.createdAt,
        profile: await toMatchParticipant(other),
      };
    }),
});
