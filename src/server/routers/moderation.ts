import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { signCoverPhoto } from "@/lib/storage";

import { moderatorProcedure, protectedProcedure, router } from "../trpc";

const reportReasonSchema = z.enum([
  "FAKE_PROFILE",
  "INAPPROPRIATE_CONTENT",
  "HARASSMENT",
  "SCAM",
  "MINOR",
  "OTHER",
]);

const createReportInput = z.object({
  reportedProfileId: z.string().uuid(),
  reason: reportReasonSchema,
  details: z.string().trim().max(1000).optional(),
  alsoBlock: z.boolean().default(true),
});

export const moderationRouter = router({
  createReport: protectedProcedure.input(createReportInput).mutation(async ({ ctx, input }) => {
    if (input.reportedProfileId === ctx.userId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Não é possível denunciar o próprio perfil." });
    }

    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.report.create({
        data: {
          reporterId: ctx.userId,
          reportedId: input.reportedProfileId,
          reason: input.reason,
          details: input.details,
        },
      });

      if (input.alsoBlock) {
        await tx.block.upsert({
          where: { blockerId_blockedId: { blockerId: ctx.userId, blockedId: input.reportedProfileId } },
          create: { blockerId: ctx.userId, blockedId: input.reportedProfileId },
          update: {},
        });
      }

      return created;
    });

    return { id: report.id };
  }),

  block: protectedProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.profileId === ctx.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Não é possível bloquear o próprio perfil." });
      }
      await prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId: ctx.userId, blockedId: input.profileId } },
        create: { blockerId: ctx.userId, blockedId: input.profileId },
        update: {},
      });
      return { blocked: true as const };
    }),

  unblock: protectedProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.block.deleteMany({
        where: { blockerId: ctx.userId, blockedId: input.profileId },
      });
      return { blocked: false as const };
    }),

  listBlocked: protectedProcedure.query(async ({ ctx }) => {
    const blocks = await prisma.block.findMany({
      where: { blockerId: ctx.userId },
      orderBy: { createdAt: "desc" },
      include: { blocked: { include: { photos: { orderBy: { position: "asc" }, take: 1 } } } },
    });

    return Promise.all(
      blocks.map(async (block) => ({
        profileId: block.blocked.id,
        name: block.blocked.name,
        photos: await signCoverPhoto(block.blocked.photos[0]?.storagePath),
      })),
    );
  }),

  listReports: moderatorProcedure
    .input(z.object({ status: z.enum(["PENDING", "DISMISSED", "ACTIONED"]).default("PENDING") }))
    .query(async ({ input }) => {
      const reports = await prisma.report.findMany({
        where: { status: input.status },
        orderBy: { createdAt: "asc" },
        take: 100,
        include: {
          reporter: { include: { photos: { orderBy: { position: "asc" }, take: 1 } } },
          reported: { include: { photos: { orderBy: { position: "asc" }, take: 1 } } },
        },
      });

      return Promise.all(
        reports.map(async (report) => ({
          id: report.id,
          reason: report.reason,
          details: report.details ?? undefined,
          status: report.status,
          resolutionNote: report.resolutionNote ?? undefined,
          createdAt: report.createdAt,
          reporter: {
            id: report.reporter.id,
            name: report.reporter.name,
            photos: await signCoverPhoto(report.reporter.photos[0]?.storagePath),
          },
          reported: {
            id: report.reported.id,
            name: report.reported.name,
            suspendedAt: report.reported.suspendedAt,
            photos: await signCoverPhoto(report.reported.photos[0]?.storagePath),
          },
        })),
      );
    }),

  reviewReport: moderatorProcedure
    .input(
      z.object({
        reportId: z.string().uuid(),
        action: z.enum(["DISMISS", "SUSPEND"]),
        resolutionNote: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const report = await prisma.report.findUnique({ where: { id: input.reportId } });
      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Denúncia não encontrada." });
      }
      if (report.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta denúncia já foi analisada." });
      }

      await prisma.$transaction(async (tx) => {
        await tx.report.update({
          where: { id: input.reportId },
          data: {
            status: input.action === "DISMISS" ? "DISMISSED" : "ACTIONED",
            reviewedById: ctx.userId,
            reviewedAt: new Date(),
            resolutionNote: input.resolutionNote,
          },
        });

        if (input.action === "SUSPEND") {
          await tx.profile.update({
            where: { id: report.reportedId },
            data: {
              suspendedAt: new Date(),
              suspendedReason: input.resolutionNote ?? "Violação das diretrizes da comunidade.",
            },
          });
        }
      });

      return { status: input.action === "DISMISS" ? ("DISMISSED" as const) : ("ACTIONED" as const) };
    }),
});
