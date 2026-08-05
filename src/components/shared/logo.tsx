import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Heart className="fill-primary text-primary size-6" />
      {!iconOnly && <span className="text-lg font-semibold tracking-tight">DateRight</span>}
    </div>
  );
}
