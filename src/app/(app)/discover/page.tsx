"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ProfileCard } from "@/components/shared/profile-card";
import { trpc } from "@/lib/trpc/client";

export default function DiscoverPage() {
  const utils = trpc.useUtils();
  const { data: candidates, isLoading, refetch } = trpc.discover.getCandidates.useQuery({});
  const swipe = trpc.match.swipe.useMutation();

  const [index, setIndex] = useState(0);
  const [matchModal, setMatchModal] = useState<{ matchId: string; name: string } | null>(null);

  // Reinicia o índice quando um novo lote de candidatos chega (ex: após "Buscar novamente") —
  // ajuste de estado durante a renderização, não em efeito (mesmo padrão de src/app/(app)/profile/page.tsx).
  const [syncedCandidates, setSyncedCandidates] = useState(candidates);
  if (candidates !== syncedCandidates) {
    setSyncedCandidates(candidates);
    setIndex(0);
  }

  const current = candidates?.[index];

  async function handleAction(action: "LIKE" | "PASS") {
    if (!current || swipe.isPending) return;

    const result = await swipe.mutateAsync({ targetProfileId: current.id, action });
    if (result.matched) {
      setMatchModal({ matchId: result.matchId, name: current.name });
    }
    setIndex((i) => i + 1);
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <LoadingSpinner label="Buscando perfis..." />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-6 py-10">
      <h1 className="mb-6 text-center text-2xl font-semibold">Descobrir</h1>

      {current ? (
        <div className="space-y-6">
          <ProfileCard profile={current} onBlocked={() => utils.discover.getCandidates.invalidate()} />
          <div className="flex justify-center gap-6">
            <Button
              variant="outline"
              size="icon"
              className="size-14 rounded-full"
              disabled={swipe.isPending}
              onClick={() => handleAction("PASS")}
              aria-label="Passar"
            >
              <X className="size-6" />
            </Button>
            <Button
              size="icon"
              className="size-14 rounded-full"
              disabled={swipe.isPending}
              onClick={() => handleAction("LIKE")}
              aria-label="Curtir"
            >
              <Heart className="size-6" />
            </Button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="Sem mais perfis por enquanto"
          description="Volte mais tarde ou busque novamente para ver se há gente nova por perto."
          action={<Button onClick={() => refetch()}>Buscar novamente</Button>}
        />
      )}

      <Dialog open={!!matchModal} onOpenChange={(open) => !open && setMatchModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>É um match! 🎉</DialogTitle>
            <DialogDescription>
              Você e {matchModal?.name} curtiram um ao outro. Que tal puxar assunto?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMatchModal(null)}>
              Continuar vendo perfis
            </Button>
            <Button asChild>
              <Link href={`/chat/${matchModal?.matchId}`}>Conversar</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
