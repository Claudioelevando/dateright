import { cn } from "@/lib/utils";

interface FormAlertProps {
  variant: "error" | "success";
  children: React.ReactNode;
  className?: string;
}

export function FormAlert({ variant, children, className }: FormAlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm",
        variant === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-primary/30 bg-primary/10 text-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}
