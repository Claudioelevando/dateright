import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { calculateAge } from "@/lib/age";
import { prisma } from "@/lib/db";
import { geocodeCity } from "@/lib/geocoding";

import { protectedProcedure, publicProcedure, router } from "../trpc";

const genderSchema = z.enum(["MASCULINO", "FEMININO"]);
const interestedInSchema = z.enum(["MASCULINO", "FEMININO", "AMBOS"]);

const preferencesInput = z
  .object({
    bio: z.string().min(20).max(500),
    interestSlugs: z.array(z.string()).min(3),
    ageRangeMin: z.coerce.number().int().min(18).max(99),
    ageRangeMax: z.coerce.number().int().min(18).max(99),
    maxDistanceKm: z.coerce.number().int().min(5).max(100),
  })
  .refine((data) => data.ageRangeMax >= data.ageRangeMin, {
    message: "A idade máxima deve ser maior ou igual à mínima.",
    path: ["ageRangeMax"],
  });

const onboardingInput = z
  .object({
    name: z.string().min(2),
    birthDate: z.coerce.date(),
    city: z.string().min(2),
    gender: genderSchema,
    interestedIn: interestedInSchema,
  })
  .and(preferencesInput)
  .refine((data) => calculateAge(data.birthDate) >= 18, {
    message: "É preciso ter 18 anos ou mais.",
    path: ["birthDate"],
  });

async function resolveInterestIds(slugs: string[]) {
  const interests = await prisma.interest.findMany({ where: { slug: { in: slugs } } });
  if (interests.length !== slugs.length) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Interesse inválido." });
  }
  return interests.map((interest) => interest.id);
}

export const profileRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return prisma.profile.findUnique({
      where: { id: ctx.userId },
      include: {
        photos: { orderBy: { position: "asc" } },
        interests: { include: { interest: true }, orderBy: { interest: { order: "asc" } } },
      },
    });
  }),

  listInterests: publicProcedure.query(() => {
    return prisma.interest.findMany({ orderBy: { order: "asc" } });
  }),

  completeOnboarding: protectedProcedure.input(onboardingInput).mutation(async ({ ctx, input }) => {
    const [interestIds, coordinates] = await Promise.all([
      resolveInterestIds(input.interestSlugs),
      geocodeCity(input.city),
    ]);

    return prisma.profile.upsert({
      where: { id: ctx.userId },
      create: {
        id: ctx.userId,
        email: ctx.email ?? "",
        name: input.name,
        birthDate: input.birthDate,
        city: input.city,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        gender: input.gender,
        interestedIn: input.interestedIn,
        bio: input.bio,
        ageRangeMin: input.ageRangeMin,
        ageRangeMax: input.ageRangeMax,
        maxDistanceKm: input.maxDistanceKm,
        onboardingCompletedAt: new Date(),
        interests: { create: interestIds.map((interestId) => ({ interestId })) },
      },
      update: {
        name: input.name,
        birthDate: input.birthDate,
        city: input.city,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        gender: input.gender,
        interestedIn: input.interestedIn,
        bio: input.bio,
        ageRangeMin: input.ageRangeMin,
        ageRangeMax: input.ageRangeMax,
        maxDistanceKm: input.maxDistanceKm,
        interests: {
          deleteMany: {},
          create: interestIds.map((interestId) => ({ interestId })),
        },
      },
    });
  }),

  updatePreferences: protectedProcedure.input(preferencesInput).mutation(async ({ ctx, input }) => {
    const existing = await prisma.profile.findUnique({ where: { id: ctx.userId } });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Perfil ainda não criado." });
    }

    const interestIds = await resolveInterestIds(input.interestSlugs);

    return prisma.profile.update({
      where: { id: ctx.userId },
      data: {
        bio: input.bio,
        ageRangeMin: input.ageRangeMin,
        ageRangeMax: input.ageRangeMax,
        maxDistanceKm: input.maxDistanceKm,
        interests: {
          deleteMany: {},
          create: interestIds.map((interestId) => ({ interestId })),
        },
      },
    });
  }),

  addPhoto: protectedProcedure
    .input(z.object({ storagePath: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!input.storagePath.startsWith(`${ctx.userId}/`)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Caminho de foto inválido." });
      }

      const count = await prisma.profilePhoto.count({ where: { profileId: ctx.userId } });
      if (count >= 6) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Máximo de 6 fotos por perfil." });
      }
      return prisma.profilePhoto.create({
        data: { profileId: ctx.userId, storagePath: input.storagePath, position: count },
      });
    }),

  removePhoto: protectedProcedure
    .input(z.object({ photoId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const photo = await prisma.profilePhoto.findUnique({ where: { id: input.photoId } });
      if (!photo || photo.profileId !== ctx.userId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await prisma.$transaction(async (tx) => {
        await tx.profilePhoto.delete({ where: { id: input.photoId } });
        const remaining = await tx.profilePhoto.findMany({
          where: { profileId: ctx.userId },
          orderBy: { position: "asc" },
        });
        for (const [index, p] of remaining.entries()) {
          if (p.position !== index) {
            await tx.profilePhoto.update({ where: { id: p.id }, data: { position: index } });
          }
        }
      });

      return { photoId: input.photoId, storagePath: photo.storagePath };
    }),
});
