-- CreateEnum
CREATE TYPE "SwipeAction" AS ENUM ('LIKE', 'PASS');

-- CreateTable
CREATE TABLE "swipes" (
    "id" UUID NOT NULL,
    "swiperId" UUID NOT NULL,
    "swipedId" UUID NOT NULL,
    "action" "SwipeAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "swipes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "swipes_no_self_swipe_check" CHECK ("swiperId" <> "swipedId")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "userAId" UUID NOT NULL,
    "userBId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "matches_canonical_order_check" CHECK ("userAId" < "userBId")
);

-- CreateIndex
CREATE UNIQUE INDEX "swipes_swiperId_swipedId_key" ON "swipes"("swiperId", "swipedId");

-- CreateIndex
CREATE INDEX "swipes_swipedId_idx" ON "swipes"("swipedId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_userAId_userBId_key" ON "matches"("userAId", "userBId");

-- CreateIndex
CREATE INDEX "matches_userBId_idx" ON "matches"("userBId");

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swiperId_fkey" FOREIGN KEY ("swiperId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swipedId_fkey" FOREIGN KEY ("swipedId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: mesma lógica de defesa em profundidade da migration inicial — a aplicação acessa o
-- banco via Prisma (role com bypassrls), autorização primária é feita nos procedures tRPC.
ALTER TABLE "swipes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "matches" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "swipes_select_own" ON "swipes" FOR SELECT TO authenticated
    USING ((select auth.uid()) = "swiperId");
CREATE POLICY "swipes_insert_own" ON "swipes" FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = "swiperId");
CREATE POLICY "swipes_update_own" ON "swipes" FOR UPDATE TO authenticated
    USING ((select auth.uid()) = "swiperId") WITH CHECK ((select auth.uid()) = "swiperId");

-- Sem policy de insert/update/delete em "matches": matches só são criados pelo procedure
-- tRPC match.swipe, após verificar curtida mútua nos dois sentidos — nunca diretamente via
-- PostgREST/supabase-js. Participantes só podem enxergar seus próprios matches.
CREATE POLICY "matches_select_participant" ON "matches" FOR SELECT TO authenticated
    USING ((select auth.uid()) IN ("userAId", "userBId"));
