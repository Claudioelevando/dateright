"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ProfileCard } from "@/components/shared/profile-card";
import { trpc } from "@/lib/trpc/client";

export default function MatchesPage() {
  const { data: matches, isLoading } = trpc.match.listMatches.useQuery();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <LoadingSpinner label="Carregando matches..." />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Matches</h1>

      {matches && matches.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {matches.map((match) => (
            <Link key={match.matchId} href={`/chat/${match.matchId}`} className="block">
              <ProfileCard profile={match.profile} className="aspect-square" />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="Você ainda não tem matches"
          description="Curta perfis em Descobrir para começar a formar matches."
          action={
            <Button asChild>
              <Link href="/discover">Descobrir perfis</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
