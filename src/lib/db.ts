import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Em desenvolvimento local, algumas redes fazem inspeção/interceptação de TLS e
// apresentam um certificado próprio na cadeia para o Postgres do Supabase — o que quebra
// a verificação estrita de certificado. Relaxamos apenas em dev; em produção (Vercel) a
// verificação do certificado continua ativa.
function connectionOptions(url: string) {
  const parsed = new URL(url);
  if (process.env.NODE_ENV !== "production") {
    parsed.searchParams.delete("sslmode");
    return { connectionString: parsed.toString(), ssl: { rejectUnauthorized: false } };
  }
  return { connectionString: url };
}

function createPrismaClient() {
  const adapter = new PrismaPg(connectionOptions(process.env.DATABASE_URL!));
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
