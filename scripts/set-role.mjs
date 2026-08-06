/**
 * Bootstrap de role de plataforma (MODERATOR/ADMIN). Não existe fluxo de auto-promoção via UI
 * (seria uma falha de segurança) — este script é a única forma de criar o primeiro Admin.
 *
 * Uso: node scripts/set-role.mjs <email> <USER|MODERATOR|ADMIN>
 */
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const [, , email, role] = process.argv;
const VALID_ROLES = ["USER", "MODERATOR", "ADMIN"];

if (!email || !VALID_ROLES.includes(role)) {
  console.error(`Uso: node scripts/set-role.mjs <email> <${VALID_ROLES.join("|")}>`);
  process.exit(1);
}

function connectionOptions(url) {
  const parsed = new URL(url);
  parsed.searchParams.delete("sslmode");
  return { connectionString: parsed.toString(), ssl: { rejectUnauthorized: false } };
}

const client = new pg.Client(connectionOptions(process.env.DIRECT_URL));
await client.connect();

const result = await client.query(
  `UPDATE "profiles" SET "role" = $1 WHERE "email" = $2 RETURNING "email", "role"`,
  [role, email],
);
await client.end();

if (result.rowCount === 0) {
  console.error(`Nenhum profile encontrado com email=${email}.`);
  process.exit(1);
}

console.log(`OK: ${result.rows[0].email} agora é ${result.rows[0].role}.`);
