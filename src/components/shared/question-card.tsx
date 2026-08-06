"use client";

import { cn } from "@/lib/utils";
import type { Answer, Question } from "@/types/questionnaire";

interface QuestionCardProps {
  question: Question;
  value: Answer | undefined;
  onChange: (value: Answer) => void;
  className?: string;
}

const SCALE_VALUES = [1, 2, 3, 4, 5];

export function QuestionCard({ question, value, onChange, className }: QuestionCardProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-lg font-medium">{question.text}</p>

      {question.type === "single" && (
        <div role="radiogroup" aria-label={question.text} className="space-y-2">
          {question.options.map((option) => {
            const isSelected = value === option;
            return (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={isSelected}
                  onChange={() => onChange(option)}
                  className="accent-primary size-4"
                />
                {option}
              </label>
            );
          })}
        </div>
      )}

      {question.type === "multiple" && (
        <div className="space-y-2">
          {question.options.map((option) => {
            const selected = Array.isArray(value) ? value : [];
            const isSelected = selected.includes(option);
            return (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    onChange(
                      isSelected
                        ? selected.filter((item) => item !== option)
                        : [...selected, option],
                    );
                  }}
                  className="accent-primary size-4"
                />
                {option}
              </label>
            );
          })}
        </div>
      )}

      {question.type === "scale" && (
        <div className="space-y-2">
          <div role="radiogroup" aria-label={question.text} className="flex items-center gap-2">
            {SCALE_VALUES.map((score) => {
              const isSelected = value === score;
              return (
                <label
                  key={score}
                  className={cn(
                    "flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg border px-2 py-3 text-sm font-medium transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={score}
                    checked={isSelected}
                    onChange={() => onChange(score)}
                    className="sr-only"
                  />
                  {score}
                </label>
              );
            })}
          </div>
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>{question.minLabel}</span>
            <span>{question.maxLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}
