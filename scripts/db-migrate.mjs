/**
 * Fallback para aplicar migrations do Prisma quando `prisma migrate deploy` trava.
 *
 * Nesta rede de desenvolvimento, o schema-engine (binário Rust) do Prisma trava
 * indefinidamente ao conectar no Postgres do Supabase — há inspeção/interceptação de TLS
 * na rede que quebra a verificação de certificado (o node-postgres falha rápido com
 * "self-signed certificate in certificate chain"; o schema-engine, sem essa opção, apenas
 * trava). Este script aplica as migrations pendentes diretamente via `pg`, com a mesma
 * flexibilização de TLS usada em src/lib/db.ts, e registra cada uma em `_prisma_migrations`
 * para manter o histórico compatível com o Prisma CLI.
 *
 * Se `npx prisma migrate deploy` funcionar normalmente no seu ambiente, prefira-o —
 * use este script só como último recurso.
 */
import { config } from "dotenv";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const MIGRATIONS_DIR = join(import.meta.dirname, "..", "prisma", "migrations");

function connectionOptions(url) {
  const parsed = new URL(url);
  parsed.searchParams.delete("sslmode");
  return { connectionString: parsed.toString(), ssl: { rejectUnauthorized: false } };
}

const client = new pg.Client(connectionOptions(process.env.DIRECT_URL));
await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  );
`);

const applied = new Set(
  (await client.query(`SELECT migration_name FROM "_prisma_migrations"`)).rows.map(
    (r) => r.migration_name,
  ),
);

const migrationDirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

let appliedCount = 0;
for (const name of migrationDirs) {
  if (applied.has(name)) continue;

  const sql = readFileSync(join(MIGRATIONS_DIR, name, "migration.sql"), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");

  console.log(`Aplicando ${name}...`);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(
      `INSERT INTO "_prisma_migrations"
        (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
       VALUES ($1, $2, now(), $3, now(), 1)`,
      [randomUUID(), checksum, name],
    );
    await client.query("COMMIT");
    appliedCount += 1;
    console.log(`  ok (checksum ${checksum.slice(0, 12)}...)`);
  } catch (err) {
    await client.query("ROLLBACK");
    await client.end();
    throw err;
  }
}

await client.end();
console.log(
  appliedCount === 0
    ? "Nenhuma migration pendente."
    : `${appliedCount} migration(ões) aplicada(s).`,
);
