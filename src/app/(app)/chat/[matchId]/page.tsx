"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, MessageCircle, Send } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { MessageList } from "@/components/chat/message-list";
import { trpc } from "@/lib/trpc/client";

export default function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [body, setBody] = useState("");

  const { data: match, isLoading: matchLoading, error: matchError } = trpc.match.getById.useQuery({
    matchId,
  });
  const { data: messages } = trpc.message.list.useQuery(
    { matchId },
    { refetchInterval: 3000, refetchIntervalInBackground: false },
  );

  const utils = trpc.useUtils();
  const sendMutation = trpc.message.send.useMutation({
    onSuccess: () => utils.message.list.invalidate({ matchId }),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate({ matchId, body: trimmed });
    setBody("");
  }

  if (matchLoading || messages === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <LoadingSpinner label="Carregando conversa..." />
      </div>
    );
  }

  if (matchError || !match) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <EmptyState icon={MessageCircle} title="Match não encontrado" />
      </div>
    );
  }

  const { profile } = match;

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col">
      <div className="border-border flex items-center gap-3 border-b px-4 py-3">
        <Avatar size="lg">
          <AvatarImage src={profile.photos[0]} alt={`Foto de ${profile.name}`} />
          <AvatarFallback>{profile.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold">
            {profile.name}, {profile.age}
          </p>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <MapPin className="size-3" />
            {profile.city}
          </p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6">
          <EmptyState
            icon={MessageCircle}
            title="Nenhuma mensagem ainda"
            description={`Mande a primeira mensagem para ${profile.name}.`}
          />
        </div>
      ) : (
        <MessageList messages={messages} otherParticipantId={profile.id} />
      )}

      <form onSubmit={handleSubmit} className="border-border flex items-center gap-2 border-t p-3">
        <Input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Escreva uma mensagem..."
          disabled={sendMutation.isPending}
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={!body.trim() || sendMutation.isPending} aria-label="Enviar">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
