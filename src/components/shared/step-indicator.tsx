import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      <ol className="flex items-center">
        {steps.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary/15 text-primary ring-primary ring-2",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? <Check className="size-4" /> : index + 1}
              </span>
              {index < steps.length - 1 && (
                <div className={cn("mx-2 h-px flex-1", isCompleted ? "bg-primary" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>
      <ol className="mt-2 flex">
        {steps.map((label, index) => (
          <li
            key={label}
            className={cn(
              "flex-1 text-center text-xs font-medium first:text-left last:flex-none last:text-right",
              index === currentStep ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
