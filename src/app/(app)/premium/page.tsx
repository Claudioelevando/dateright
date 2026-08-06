"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Crown, Heart, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FormAlert } from "@/components/shared/form-alert";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ProfileCard } from "@/components/shared/profile-card";
import { trpc } from "@/lib/trpc/client";

export default function PremiumPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-16">
          <LoadingSpinner label="Carregando..." />
        </div>
      }
    >
      <PremiumPageContent />
    </Suspense>
  );
}

function PremiumPageContent() {
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();

  const { data: me, isLoading: isLoadingMe } = trpc.profile.me.useQuery();
  const { data: likersData, isLoading: isLoadingLikers } = trpc.premium.getLikers.useQuery();
  const checkout = trpc.premium.createCheckoutSession.useMutation();
  const portal = trpc.premium.createPortalSession.useMutation();
  const swipe = trpc.match.swipe.useMutation();

  const [matchModal, setMatchModal] = useState<{ matchId: string; name: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const checkoutStatus = searchParams.get("checkout");

  useEffect(() => {
    if (checkoutStatus !== "success") return;
    utils.profile.me.invalidate();
    // O webhook da Stripe é assíncrono e pode chegar um pouco depois do redirect de sucesso.
    const timeout = setTimeout(() => utils.profile.me.invalidate(), 2000);
    return () => clearTimeout(timeout);
  }, [checkoutStatus, utils]);

  async function handleSubscribe() {
    setActionError(null);
    try {
      const { url } = await checkout.mutateAsync();
      window.location.href = url;
    } catch {
      setActionError("Não foi possível iniciar o checkout. Tente novamente.");
    }
  }

  async function handleManage() {
    setActionError(null);
    try {
      const { url } = await portal.mutateAsync();
      window.location.href = url;
    } catch {
      setActionError("Não foi possível abrir o gerenciamento de assinatura. Tente novamente.");
    }
  }

  async function handleLikerAction(targetProfileId: string, name: string, action: "LIKE" | "PASS") {
    if (swipe.isPending) return;
    const result = await swipe.mutateAsync({ targetProfileId, action });
    utils.premium.getLikers.invalidate();
    if (result.matched) {
      setMatchModal({ matchId: result.matchId, name });
    }
  }

  if (isLoadingMe) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <LoadingSpinner label="Carregando..." />
      </div>
    );
  }

  const isPremium = me?.isPremium ?? false;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Premium</h1>

      <div className="mb-6 space-y-3">
        {checkoutStatus === "success" && (
          <FormAlert variant="success">
            Checkout concluído! Estamos confirmando seu pagamento — sua assinatura ativa em poucos
            segundos.
          </FormAlert>
        )}
        {checkoutStatus === "cancelled" && (
          <FormAlert variant="error">Checkout cancelado. Você pode assinar quando quiser.</FormAlert>
        )}
        {actionError && <FormAlert variant="error">{actionError}</FormAlert>}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Crown className="text-primary size-5" />
            {isPremium ? "Você é Premium" : "DateRight Premium"}
          </CardTitle>
          <CardDescription>
            {isPremium
              ? "Obrigado por apoiar o DateRight. Veja abaixo quem já curtiu seu perfil."
              : "Veja quem já curtiu seu perfil antes do match."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPremium ? (
            <Button variant="outline" onClick={handleManage} disabled={portal.isPending}>
              Gerenciar assinatura
            </Button>
          ) : (
            <Button onClick={handleSubscribe} disabled={checkout.isPending}>
              Assinar Premium
            </Button>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-4 text-lg font-semibold">Quem te curtiu</h2>

      {isLoadingLikers ? (
        <LoadingSpinner label="Carregando..." />
      ) : isPremium ? (
        likersData && likersData.likers.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {likersData.likers.map((liker) => (
              <div key={liker.id} className="space-y-2">
                <ProfileCard
                  profile={liker}
                  className="aspect-square"
                  onBlocked={() => utils.premium.getLikers.invalidate()}
                />
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={swipe.isPending}
                    onClick={() => handleLikerAction(liker.id, liker.name, "PASS")}
                    aria-label="Passar"
                  >
                    <X className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    disabled={swipe.isPending}
                    onClick={() => handleLikerAction(liker.id, liker.name, "LIKE")}
                    aria-label="Curtir de volta"
                  >
                    <Heart className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="Ninguém te curtiu ainda"
            description="Continue curtindo perfis em Descobrir — quando alguém te curtir, aparece aqui."
          />
        )
      ) : (
        <EmptyState
          icon={Sparkles}
          title={
            likersData && likersData.count > 0
              ? `${likersData.count} ${likersData.count === 1 ? "pessoa curtiu" : "pessoas curtiram"} seu perfil`
              : "Ninguém te curtiu ainda"
          }
          description={
            likersData && likersData.count > 0
              ? "Assine o Premium para ver quem são."
              : "Continue curtindo perfis em Descobrir."
          }
          action={
            likersData && likersData.count > 0 ? (
              <Button onClick={handleSubscribe} disabled={checkout.isPending}>
                Assinar Premium
              </Button>
            ) : undefined
          }
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
