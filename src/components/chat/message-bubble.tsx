import { cn } from "@/lib/utils";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

interface MessageBubbleProps {
  body: string;
  createdAt: Date;
  isOwn: boolean;
}

export function MessageBubble({ body, createdAt, isOwn }: MessageBubbleProps) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{body}</p>
        <p className={cn("mt-0.5 text-right text-[10px]", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {timeFormatter.format(createdAt)}
        </p>
      </div>
    </div>
  );
}
