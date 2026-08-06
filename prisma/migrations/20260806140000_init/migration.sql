-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMININO');

-- CreateEnum
CREATE TYPE "InterestedIn" AS ENUM ('MASCULINO', 'FEMININO', 'AMBOS');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE', 'MULTIPLE', 'SCALE');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "city" TEXT NOT NULL,
    "bio" TEXT,
    "gender" "Gender" NOT NULL,
    "interestedIn" "InterestedIn" NOT NULL,
    "ageRangeMin" INTEGER NOT NULL DEFAULT 18,
    "ageRangeMax" INTEGER NOT NULL DEFAULT 99,
    "maxDistanceKm" INTEGER NOT NULL DEFAULT 50,
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_photos" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "storagePath" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interests" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_interests" (
    "profileId" UUID NOT NULL,
    "interestId" UUID NOT NULL,

    CONSTRAINT "profile_interests_pkey" PRIMARY KEY ("profileId","interestId")
);

-- CreateTable
CREATE TABLE "questionnaire_questions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB,
    "minSelections" INTEGER,
    "minLabel" TEXT,
    "maxLabel" TEXT,
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "questionnaire_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_answers" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "value" JSONB NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questionnaire_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profile_photos_profileId_position_key" ON "profile_photos"("profileId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "interests_slug_key" ON "interests"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_questions_code_key" ON "questionnaire_questions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_answers_profileId_questionId_key" ON "questionnaire_answers"("profileId", "questionId");

-- AddForeignKey
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interests" ADD CONSTRAINT "profile_interests_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interests" ADD CONSTRAINT "profile_interests_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_answers" ADD CONSTRAINT "questionnaire_answers_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_answers" ADD CONSTRAINT "questionnaire_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questionnaire_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FK real para auth.users (gerenciado pelo Supabase Auth; fora do schema do Prisma)
ALTER TABLE "profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- RLS: defesa em profundidade nas tabelas com dados sensíveis (fotos, bio, respostas
-- do questionário). A aplicação acessa o banco via Prisma (role com bypassrls), então a
-- autorização primária é feita nos procedures tRPC — RLS aqui protege contra qualquer
-- acesso futuro via Supabase Data API/PostgREST ou supabase-js direto no client.
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profile_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profile_interests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "questionnaire_answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "interests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "questionnaire_questions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON "profiles" FOR SELECT TO authenticated
    USING ((select auth.uid()) = "id");
CREATE POLICY "profiles_insert_own" ON "profiles" FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = "id");
CREATE POLICY "profiles_update_own" ON "profiles" FOR UPDATE TO authenticated
    USING ((select auth.uid()) = "id") WITH CHECK ((select auth.uid()) = "id");
CREATE POLICY "profiles_delete_own" ON "profiles" FOR DELETE TO authenticated
    USING ((select auth.uid()) = "id");

CREATE POLICY "profile_photos_select_own" ON "profile_photos" FOR SELECT TO authenticated
    USING ((select auth.uid()) = "profileId");
CREATE POLICY "profile_photos_insert_own" ON "profile_photos" FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = "profileId");
CREATE POLICY "profile_photos_update_own" ON "profile_photos" FOR UPDATE TO authenticated
    USING ((select auth.uid()) = "profileId") WITH CHECK ((select auth.uid()) = "profileId");
CREATE POLICY "profile_photos_delete_own" ON "profile_photos" FOR DELETE TO authenticated
    USING ((select auth.uid()) = "profileId");

CREATE POLICY "profile_interests_select_own" ON "profile_interests" FOR SELECT TO authenticated
    USING ((select auth.uid()) = "profileId");
CREATE POLICY "profile_interests_insert_own" ON "profile_interests" FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = "profileId");
CREATE POLICY "profile_interests_delete_own" ON "profile_interests" FOR DELETE TO authenticated
    USING ((select auth.uid()) = "profileId");

CREATE POLICY "questionnaire_answers_select_own" ON "questionnaire_answers" FOR SELECT TO authenticated
    USING ((select auth.uid()) = "profileId");
CREATE POLICY "questionnaire_answers_insert_own" ON "questionnaire_answers" FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = "profileId");
CREATE POLICY "questionnaire_answers_update_own" ON "questionnaire_answers" FOR UPDATE TO authenticated
    USING ((select auth.uid()) = "profileId") WITH CHECK ((select auth.uid()) = "profileId");

-- Dados de referência (lista de interesses e perguntas do questionário): leitura pública
-- para qualquer usuário autenticado, sem escrita via RLS (gerenciados via seed/admin).
CREATE POLICY "interests_select_all" ON "interests" FOR SELECT TO authenticated
    USING (true);
CREATE POLICY "questionnaire_questions_select_all" ON "questionnaire_questions" FOR SELECT TO authenticated
    USING (true);
