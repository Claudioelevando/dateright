"use client";

import { cn } from "@/lib/utils";

interface InterestPickerProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export function InterestPicker({ options, value, onChange, className }: InterestPickerProps) {
  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            aria-pressed={isSelected}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
