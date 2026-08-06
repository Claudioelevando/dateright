-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_matchId_createdAt_idx" ON "messages"("matchId", "createdAt");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: mesma lógica de defesa em profundidade — acesso primário via Prisma (bypassrls) nos
-- procedures tRPC; RLS aqui é defesa em profundidade caso o banco seja acessado via
-- PostgREST/supabase-js diretamente.
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;

-- Sem policy de insert/update/delete: mensagens só são criadas pelo procedure tRPC
-- message.send, após verificar que o remetente é participante do match — nunca diretamente
-- via PostgREST/supabase-js. Participantes só podem ler mensagens dos próprios matches.
CREATE POLICY "messages_select_participant" ON "messages" FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM "matches"
    WHERE "matches"."id" = "messages"."matchId"
      AND (select auth.uid()) IN ("matches"."userAId", "matches"."userBId")
  )
);
