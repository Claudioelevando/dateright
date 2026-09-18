-- CreateTable
CREATE TABLE "push_tokens" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");
CREATE INDEX "push_tokens_profileId_idx" ON "push_tokens"("profileId");

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: mesma lógica de defesa em profundidade das migrations anteriores — a aplicação acessa
-- o banco via Prisma (role com bypassrls), autorização primária é feita nos procedures tRPC.
ALTER TABLE "push_tokens" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_select_own" ON "push_tokens" FOR SELECT TO authenticated
    USING ((select auth.uid()) = "profileId");
CREATE POLICY "push_tokens_insert_own" ON "push_tokens" FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = "profileId");
CREATE POLICY "push_tokens_delete_own" ON "push_tokens" FOR DELETE TO authenticated
    USING ((select auth.uid()) = "profileId");
