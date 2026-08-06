import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(label: string) {
  return label
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

const TYPE_MAP = { single: "SINGLE", multiple: "MULTIPLE", scale: "SCALE" } as const;

async function main() {
  // import dinâmico: garante que .env.local já foi carregado antes de src/lib/db.ts
  // instanciar o PrismaClient (imports estáticos são resolvidos antes do corpo do módulo).
  const { prisma } = await import("../src/lib/db");
  const { INTEREST_OPTIONS } = await import("../src/lib/mock/profile");
  const { QUESTIONNAIRE } = await import("../src/lib/mock/questionnaire");

  for (const [index, label] of INTEREST_OPTIONS.entries()) {
    await prisma.interest.upsert({
      where: { slug: slugify(label) },
      update: { label, order: index },
      create: { slug: slugify(label), label, order: index },
    });
  }
  console.log(`Seed: ${INTEREST_OPTIONS.length} interesses.`);

  for (const [index, question] of QUESTIONNAIRE.entries()) {
    await prisma.questionnaireQuestion.upsert({
      where: { code: question.id },
      update: {
        category: question.category,
        type: TYPE_MAP[question.type],
        text: question.text,
        options: "options" in question ? question.options : undefined,
        minSelections: "minSelections" in question ? question.minSelections : null,
        minLabel: "minLabel" in question ? question.minLabel : null,
        maxLabel: "maxLabel" in question ? question.maxLabel : null,
        order: index,
      },
      create: {
        code: question.id,
        category: question.category,
        type: TYPE_MAP[question.type],
        text: question.text,
        options: "options" in question ? question.options : undefined,
        minSelections: "minSelections" in question ? question.minSelections : null,
        minLabel: "minLabel" in question ? question.minLabel : null,
        maxLabel: "maxLabel" in question ? question.maxLabel : null,
        order: index,
      },
    });
  }
  console.log(`Seed: ${QUESTIONNAIRE.length} perguntas do questionário.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
