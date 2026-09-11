import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// O connection pooler do Supabase (Supavisor, porta 6543) apresenta uma cadeia de
// certificado que não é validável contra as CAs públicas padrão — isso acontece em
// qualquer ambiente, não só em dev, então a verificação estrita de certificado é
// desabilitada em todos os ambientes. A conexão continua criptografada via TLS.
function connectionOptions(url: string) {
  const parsed = new URL(url);
  parsed.searchParams.delete("sslmode");
  return { connectionString: parsed.toString(), ssl: { rejectUnauthorized: false } };
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
