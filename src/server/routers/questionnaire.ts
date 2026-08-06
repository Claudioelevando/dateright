import { z } from "zod";

import { prisma } from "@/lib/db";

import { protectedProcedure, router } from "../trpc";

const answerValueSchema = z.union([z.string(), z.array(z.string()), z.number()]);

export const questionnaireRouter = router({
  listQuestions: protectedProcedure.query(() => {
    return prisma.questionnaireQuestion.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
  }),

  myAnswers: protectedProcedure.query(async ({ ctx }) => {
    const answers = await prisma.questionnaireAnswer.findMany({
      where: { profileId: ctx.userId },
    });
    return Object.fromEntries(answers.map((a) => [a.questionId, a.value]));
  }),

  submitAnswers: protectedProcedure
    .input(z.object({ answers: z.record(z.string().uuid(), answerValueSchema) }))
    .mutation(async ({ ctx, input }) => {
      const entries = Object.entries(input.answers);

      const questions = await prisma.questionnaireQuestion.findMany({
        where: { id: { in: entries.map(([questionId]) => questionId) } },
      });
      if (questions.length !== entries.length) {
        throw new Error("Pergunta inválida.");
      }

      await prisma.$transaction(
        entries.map(([questionId, value]) =>
          prisma.questionnaireAnswer.upsert({
            where: { profileId_questionId: { profileId: ctx.userId, questionId } },
            create: { profileId: ctx.userId, questionId, value },
            update: { value, answeredAt: new Date() },
          }),
        ),
      );

      return { count: entries.length };
    }),
});
