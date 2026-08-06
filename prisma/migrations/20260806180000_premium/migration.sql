-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "isPremium" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "profiles" ADD COLUMN "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_stripeCustomerId_key" ON "profiles"("stripeCustomerId");
CREATE UNIQUE INDEX "profiles_stripeSubscriptionId_key" ON "profiles"("stripeSubscriptionId");
