-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';
ALTER TABLE "profiles" ADD COLUMN "suspendedAt" TIMESTAMP(3);
ALTER TABLE "profiles" ADD COLUMN "suspendedReason" TEXT;

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('FAKE_PROFILE', 'INAPPROPRIATE_CONTENT', 'HARASSMENT', 'SCAM', 'MINOR', 'OTHER');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'DISMISSED', 'ACTIONED');

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "reportedId" UUID NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reports_no_self_report_check" CHECK ("reporterId" <> "reportedId")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" UUID NOT NULL,
    "blockerId" UUID NOT NULL,
    "blockedId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "blocks_no_self_block_check" CHECK ("blockerId" <> "blockedId")
);

-- CreateIndex
CREATE INDEX "reports_status_createdAt_idx" ON "reports"("status", "createdAt");
CREATE INDEX "reports_reportedId_idx" ON "reports"("reportedId");
CREATE UNIQUE INDEX "blocks_blockerId_blockedId_key" ON "blocks"("blockerId", "blockedId");
CREATE INDEX "blocks_blockedId_idx" ON "blocks"("blockedId");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: mesma lógica de defesa em profundidade das migrations anteriores — a aplicação acessa
-- o banco via Prisma (role com bypassrls), autorização primária é feita nos procedures tRPC.
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select_own" ON "reports" FOR SELECT TO authenticated
    USING ((select auth.uid()) = "reporterId");
CREATE POLICY "reports_insert_own" ON "reports" FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = "reporterId");

CREATE POLICY "blocks_select_own" ON "blocks" FOR SELECT TO authenticated
    USING ((select auth.uid()) = "blockerId");
CREATE POLICY "blocks_insert_own" ON "blocks" FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = "blockerId");
CREATE POLICY "blocks_delete_own" ON "blocks" FOR DELETE TO authenticated
    USING ((select auth.uid()) = "blockerId");
