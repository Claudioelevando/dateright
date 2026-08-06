"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/shared/field-error";
import { ProfileCard } from "@/components/shared/profile-card";
import { ProgressBar } from "@/components/shared/progress-bar";
import { QuestionCard } from "@/components/shared/question-card";
import { MOCK_MATCH_PREVIEW } from "@/lib/mock/profile";
import { QUESTIONNAIRE } from "@/lib/mock/questionnaire";
import type { Answer, Answers } from "@/types/questionnaire";

const CATEGORIES = Array.from(new Set(QUESTIONNAIRE.map((question) => question.category)));

function categoryScore(category: string, answers: Answers) {
  const scores = QUESTIONNAIRE.filter(
    (question) => question.category === category && question.type === "scale",
  )
    .map((question) => answers[question.id])
    .filter((value): value is number => typeof value === "number");

  if (scores.length === 0) return 0;
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(((average - 1) / 4) * 100);
}

function categoryChoices(category: string, answers: Answers) {
  return QUESTIONNAIRE.filter(
    (question) => question.category === category && question.type !== "scale",
  ).flatMap((question) => {
    const value = answers[question.id];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return [value];
    return [];
  });
}

export default function QuestionnairePage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const question = QUESTIONNAIRE[index];
  const progress = Math.round((index / QUESTIONNAIRE.length) * 100);

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

  function goNext() {
    if (!isAnswered()) {
      setError(
        question.type === "multiple"
          ? `Selecione pelo menos ${question.minSelections} opções.`
          : "Selecione uma resposta para continuar.",
      );
      return;
    }

    if (index === QUESTIONNAIRE.length - 1) {
      setIsComplete(true);
      return;
    }

    setIndex((current) => current + 1);
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
            Resultado calculado com dados simulados — o algoritmo real de compatibilidade chega com
            o backend (M12).
          </p>
        </div>

        <Card>
          <CardContent className="space-y-5 pt-6">
            {CATEGORIES.map((category) => {
              const score = categoryScore(category, answers);
              const choices = categoryChoices(category, answers);
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
        label={`Pergunta ${index + 1} de ${QUESTIONNAIRE.length}`}
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
          <Button type="button" onClick={goNext} className="gap-1.5">
            {index === QUESTIONNAIRE.length - 1 ? "Ver resultado" : "Próxima"}
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
