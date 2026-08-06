"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/shared/field-error";
import { FormAlert } from "@/components/shared/form-alert";
import { ProfileCard } from "@/components/shared/profile-card";
import { ProgressBar } from "@/components/shared/progress-bar";
import { QuestionCard } from "@/components/shared/question-card";
import { MOCK_MATCH_PREVIEW } from "@/lib/mock/profile";
import { trpc } from "@/lib/trpc/client";
import type { Answer, Answers, Question, QuestionType } from "@/types/questionnaire";

const TYPE_MAP: Record<string, QuestionType> = {
  SINGLE: "single",
  MULTIPLE: "multiple",
  SCALE: "scale",
};

function toClientQuestion(q: {
  id: string;
  category: string;
  type: string;
  text: string;
  options: unknown;
  minSelections: number | null;
  minLabel: string | null;
  maxLabel: string | null;
}): Question {
  const type = TYPE_MAP[q.type];
  if (type === "multiple") {
    return {
      id: q.id,
      category: q.category,
      type,
      text: q.text,
      options: (q.options as string[] | null) ?? [],
      minSelections: q.minSelections ?? 1,
    };
  }
  if (type === "scale") {
    return {
      id: q.id,
      category: q.category,
      type,
      text: q.text,
      minLabel: q.minLabel ?? "",
      maxLabel: q.maxLabel ?? "",
    };
  }
  return {
    id: q.id,
    category: q.category,
    type: "single",
    text: q.text,
    options: (q.options as string[] | null) ?? [],
  };
}

function categoryScore(questions: Question[], category: string, answers: Answers) {
  const scores = questions
    .filter((question) => question.category === category && question.type === "scale")
    .map((question) => answers[question.id])
    .filter((value): value is number => typeof value === "number");

  if (scores.length === 0) return 0;
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(((average - 1) / 4) * 100);
}

function categoryChoices(questions: Question[], category: string, answers: Answers) {
  return questions
    .filter((question) => question.category === category && question.type !== "scale")
    .flatMap((question) => {
      const value = answers[question.id];
      if (Array.isArray(value)) return value;
      if (typeof value === "string") return [value];
      return [];
    });
}

export default function QuestionnairePage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: rawQuestions, isLoading } = trpc.questionnaire.listQuestions.useQuery();
  const submitAnswers = trpc.questionnaire.submitAnswers.useMutation();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  if (isLoading || !rawQuestions) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  const questions = rawQuestions.map(toClientQuestion);
  const categories = Array.from(new Set(questions.map((question) => question.category)));
  const question = questions[index];
  const progress = Math.round((index / questions.length) * 100);

  function setAnswer(value: Answer) {
    setAnswers((current) => ({ ...current, [question.id]: value }));
    setError(null);
  }

  function isAnswered() {
    const value = answers[question.id];
    if (question.type === "multiple") {
      return Array.isArray(value) && value.length >= question.minSelections;
    }
    return value !== undefined;
  }

  async function goNext() {
    if (!isAnswered()) {
      setError(
        question.type === "multiple"
          ? `Selecione pelo menos ${question.minSelections} opções.`
          : "Selecione uma resposta para continuar.",
      );
      return;
    }

    if (index < questions.length - 1) {
      setIndex((current) => current + 1);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await submitAnswers.mutateAsync({ answers });
      await utils.questionnaire.myAnswers.invalidate();
      setIsComplete(true);
    } catch {
      setSubmitError("Não foi possível salvar suas respostas. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function goBack() {
    setError(null);
    setIndex((current) => Math.max(current - 1, 0));
  }

  if (isComplete) {
    return (
      <div className="mx-auto w-full max-w-lg flex-1 space-y-6 px-6 py-10">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Seu perfil de valores</h1>
          <p className="text-muted-foreground text-sm">
            Respostas salvas. O algoritmo de compatibilidade completo chega com o milestone de
            matching.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-5 pt-6">
            {categories.map((category) => {
              const score = categoryScore(questions, category, answers);
              const choices = categoryChoices(questions, category, answers);
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{category}</span>
                    <span className="text-muted-foreground">{score}%</span>
                  </div>
                  <ProgressBar value={score} />
                  {choices.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {choices.map((choice) => (
                        <span
                          key={choice}
                          className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium"
                        >
                          {choice}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="text-primary size-4" />
            Prévia de compatibilidade (exemplo)
          </div>
          <ProfileCard
            className="mx-auto max-w-xs"
            profile={{ ...MOCK_MATCH_PREVIEW, compatibility: 87 }}
          />
        </div>

        <Button size="lg" className="h-11 w-full" onClick={() => router.push("/profile")}>
          Ir para o meu perfil
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
      <ProgressBar
        value={progress}
        label={`Pergunta ${index + 1} de ${questions.length}`}
        className="mb-8"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm font-medium">
            {question.category}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <QuestionCard question={question} value={answers[question.id]} onChange={setAnswer} />
          <FieldError message={error ?? undefined} />
          {submitError && <FormAlert variant="error">{submitError}</FormAlert>}
        </CardContent>
        <CardContent className="flex items-center justify-between pt-0">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={index === 0}
            className="gap-1.5"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
          <Button type="button" onClick={goNext} disabled={isSubmitting} className="gap-1.5">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {index === questions.length - 1 ? "Ver resultado" : "Próxima"}
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
