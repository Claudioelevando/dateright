import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  label?: string;
}

export function LoadingSpinner({ className, label }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      className={cn("text-muted-foreground flex items-center justify-center gap-2", className)}
    >
      <Loader2 className="size-5 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
      <span className="sr-only">Carregando</span>
    </div>
  );
}
