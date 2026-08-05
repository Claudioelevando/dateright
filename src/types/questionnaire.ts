export type QuestionType = "single" | "multiple" | "scale";

interface BaseQuestion {
  id: string;
  category: string;
  text: string;
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: "single";
  options: string[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple";
  options: string[];
  minSelections: number;
}

export interface ScaleQuestion extends BaseQuestion {
  type: "scale";
  minLabel: string;
  maxLabel: string;
}

export type Question = SingleChoiceQuestion | MultipleChoiceQuestion | ScaleQuestion;

export type Answer = string | string[] | number;

export type Answers = Record<string, Answer>;
