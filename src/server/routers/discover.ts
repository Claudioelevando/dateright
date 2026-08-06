import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { calculateAge } from "@/lib/age";
import { prisma } from "@/lib/db";
import { calculateCompatibility, type CompatibilityAnswer } from "@/lib/matching/compatibility";
import { createAdminClient } from "@/lib/supabase/admin";

import { protectedProcedure, router } from "../trpc";

const getCandidatesInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
});

// Aproximação de faixa de nascimento a partir de idade min/max (±1 dia no limite do ano,
// aceitável para filtro de descoberta — não precisa da precisão exata de calculateAge).
function birthDateBounds(minAge: number, maxAge: number, today: Date) {
  const earliest = new Date(today);
  earliest.setFullYear(today.getFullYear() - maxAge - 1);
  const latest = new Date(today);
  latest.setFullYear(today.getFullYear() - minAge);
  return { earliest, latest };
}

// QuestionnaireAnswer.value é Json no banco, mas por convenção da aplicação sempre
// string | string[] | number (ver comentário em prisma/schema.prisma).
function toCompatibilityAnswer(answer: { questionId: string; value: unknown }): CompatibilityAnswer {
  return { questionId: answer.questionId, value: answer.value as string | string[] | number };
}

async function signCoverPhoto(storagePath: string | undefined) {
  if (!storagePath) return [];
  const admin = createAdminClient();
  const { data } = await admin.storage.from("profile-photos").createSignedUrl(storagePath, 3600);
  return data?.signedUrl ? [data.signedUrl] : [];
}

export const discoverRouter = router({
  getCandidates: protectedProcedure.input(getCandidatesInput).query(async ({ ctx, input }) => {
    const me = await prisma.profile.findUnique({ where: { id: ctx.userId } });
    if (!me) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Complete seu perfil primeiro." });
    }

    const myAge = calculateAge(me.birthDate);
    const today = new Date();
    const { earliest, latest } = birthDateBounds(me.ageRangeMin, me.ageRangeMax, today);

    const swiped = await prisma.swipe.findMany({
      where: { swiperId: ctx.userId },
      select: { swipedId: true },
    });
    const excludeIds = [ctx.userId, ...swiped.map((s) => s.swipedId)];

    const candidates = await prisma.profile.findMany({
      where: {
        id: { notIn: excludeIds },
        onboardingCompletedAt: { not: null },
        ...(me.interestedIn !== "AMBOS" ? { gender: me.interestedIn } : {}),
        OR: [{ interestedIn: me.gender }, { interestedIn: "AMBOS" }],
        ageRangeMin: { lte: myAge },
        ageRangeMax: { gte: myAge },
        birthDate: { gte: earliest, lte: latest },
      },
      include: {
        photos: { orderBy: { position: "asc" }, take: 1 },
        interests: { include: { interest: true } },
      },
      take: input.limit,
      orderBy: { createdAt: "desc" },
    });

    if (candidates.length === 0) return [];

    const [questions, myAnswers, candidateAnswers] = await Promise.all([
      prisma.questionnaireQuestion.findMany({ select: { id: true, type: true } }),
      prisma.questionnaireAnswer.findMany({ where: { profileId: ctx.userId } }),
      prisma.questionnaireAnswer.findMany({
        where: { profileId: { in: candidates.map((c) => c.id) } },
      }),
    ]);

    const answersByProfileId = new Map<string, typeof candidateAnswers>();
    for (const answer of candidateAnswers) {
      const list = answersByProfileId.get(answer.profileId) ?? [];
      list.push(answer);
      answersByProfileId.set(answer.profileId, list);
    }

    return Promise.all(
      candidates.map(async (candidate) => ({
        id: candidate.id,
        name: candidate.name,
        age: calculateAge(candidate.birthDate),
        city: candidate.city,
        bio: candidate.bio ?? undefined,
        photos: await signCoverPhoto(candidate.photos[0]?.storagePath),
        interests: candidate.interests.map((ci) => ci.interest.label),
        compatibility: calculateCompatibility(
          questions,
          myAnswers.map(toCompatibilityAnswer),
          (answersByProfileId.get(candidate.id) ?? []).map(toCompatibilityAnswer),
        ),
      })),
    );
  }),
});
