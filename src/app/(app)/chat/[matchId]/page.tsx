"use client";

import { useParams } from "next/navigation";
import { MapPin, MessageCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { trpc } from "@/lib/trpc/client";

export default function ChatStubPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: match, isLoading, error } = trpc.match.getById.useQuery({ matchId });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <LoadingSpinner label="Carregando conversa..." />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <EmptyState icon={MessageCircle} title="Match não encontrado" />
      </div>
    );
  }

  const { profile } = match;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Card>
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-t-xl">
          {profile.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photos[0]}
              alt={`Foto de ${profile.name}`}
              className="size-full object-cover"
            />
          ) : (
            <div className="bg-muted size-full" />
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-xl">
            {profile.name}, {profile.age}
          </CardTitle>
          <p className="text-muted-foreground flex items-center gap-1 text-sm">
            <MapPin className="size-3.5" />
            {profile.city}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.bio && <p className="text-sm">{profile.bio}</p>}
          {profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          <div className="border-border bg-muted/50 flex items-center gap-3 rounded-xl border border-dashed p-4">
            <MessageCircle className="text-muted-foreground size-5 shrink-0" />
            <p className="text-muted-foreground text-sm">
              O chat chega em breve 💬 — por enquanto, aproveite pra revisar o perfil de vocês dois.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
