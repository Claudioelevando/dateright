export type QuestionKind = "SINGLE" | "MULTIPLE" | "SCALE";

export interface CompatibilityQuestion {
  id: string;
  type: QuestionKind;
}

export interface CompatibilityAnswer {
  questionId: string;
  value: string | string[] | number;
}

function similarity(type: QuestionKind, a: string | string[] | number, b: string | string[] | number) {
  if (type === "SCALE" && typeof a === "number" && typeof b === "number") {
    return 1 - Math.abs(a - b) / 4;
  }

  if (type === "SINGLE" && typeof a === "string" && typeof b === "string") {
    return a === b ? 1 : 0;
  }

  if (type === "MULTIPLE" && Array.isArray(a) && Array.isArray(b)) {
    const setA = new Set(a);
    const setB = new Set(b);
    const union = new Set([...setA, ...setB]);
    if (union.size === 0) return 1;
    const intersectionSize = [...setA].filter((v) => setB.has(v)).length;
    return intersectionSize / union.size;
  }

  return 0;
}

/** Score de compatibilidade 0-100, simétrico, calculado só sobre perguntas respondidas por ambos. */
export function calculateCompatibility(
  questions: CompatibilityQuestion[],
  answersA: CompatibilityAnswer[],
  answersB: CompatibilityAnswer[],
): number {
  const typeByQuestionId = new Map(questions.map((q) => [q.id, q.type]));
  const answersBByQuestionId = new Map(answersB.map((a) => [a.questionId, a.value]));

  const similarities: number[] = [];
  for (const answerA of answersA) {
    const type = typeByQuestionId.get(answerA.questionId);
    const valueB = answersBByQuestionId.get(answerA.questionId);
    if (!type || valueB === undefined) continue;
    similarities.push(similarity(type, answerA.value, valueB));
  }

  if (similarities.length === 0) return 0;

  const mean = similarities.reduce((sum, s) => sum + s, 0) / similarities.length;
  return Math.max(0, Math.min(100, Math.round(mean * 100)));
}
