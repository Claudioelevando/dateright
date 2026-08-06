"use client";

import { useState } from "react";
import { Flag, Loader2, MoreVertical, ShieldOff } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/components/shared/form-alert";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

const REPORT_REASONS = [
  { value: "FAKE_PROFILE", label: "Perfil falso" },
  { value: "INAPPROPRIATE_CONTENT", label: "Conteúdo inadequado" },
  { value: "HARASSMENT", label: "Assédio ou comportamento abusivo" },
  { value: "SCAM", label: "Golpe ou spam" },
  { value: "MINOR", label: "Menor de idade" },
  { value: "OTHER", label: "Outro" },
] as const;

interface ReportBlockMenuProps {
  profileId: string;
  profileName: string;
  onDone?: () => void;
  className?: string;
  /** Uso sobre foto (ProfileCard): botão claro sobre fundo escuro semitransparente. */
  overlay?: boolean;
}

export function ReportBlockMenu({
  profileId,
  profileName,
  onDone,
  className,
  overlay = false,
}: ReportBlockMenuProps) {
  const utils = trpc.useUtils();
  const [reportOpen, setReportOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]["value"]>("FAKE_PROFILE");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);

  // onDone roda antes do invalidate (não aguardado): navegar embora após bloquear não pode
  // ficar preso esperando o refetch de queries que agora retornam FORBIDDEN (ex: mensagens do
  // match que acabou de ser bloqueado) — o invalidate acontece em segundo plano.
  const createReport = trpc.moderation.createReport.useMutation({
    onSuccess: () => {
      setReportOpen(false);
      setDetails("");
      onDone?.();
      utils.invalidate();
    },
  });

  const block = trpc.moderation.block.useMutation({
    onSuccess: () => {
      setBlockConfirmOpen(false);
      onDone?.();
      utils.invalidate();
    },
  });

  function handleReportSubmit(event: React.FormEvent) {
    event.preventDefault();
    createReport.mutate({ reportedProfileId: profileId, reason, details: details || undefined, alsoBlock });
  }

  return (
    <div className={cn(className)} onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Denunciar ou bloquear ${profileName}`}
            className={cn(
              "size-8 rounded-full",
              overlay
                ? "bg-black/40 text-white hover:bg-black/60 hover:text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={(event) => event.preventDefault()}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setReportOpen(true)}>
            <Flag className="size-4" />
            Denunciar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setBlockConfirmOpen(true)}>
            <ShieldOff className="size-4" />
            Bloquear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent onClick={(event) => event.stopPropagation()}>
          <form onSubmit={handleReportSubmit}>
            <DialogHeader>
              <DialogTitle>Denunciar {profileName}</DialogTitle>
              <DialogDescription>
                Sua denúncia é analisada pela nossa moderação. Detalhes ajudam a agilizar a análise.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {createReport.isError && (
                <FormAlert variant="error">Não foi possível enviar a denúncia. Tente novamente.</FormAlert>
              )}
              <Select value={reason} onValueChange={(value) => setReason(value as typeof reason)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Detalhes (opcional)"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={3}
                maxLength={1000}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={alsoBlock}
                  onChange={(event) => setAlsoBlock(event.target.checked)}
                  className="accent-primary"
                />
                Bloquear {profileName} também
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setReportOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createReport.isPending} className="gap-1.5">
                {createReport.isPending && <Loader2 className="size-4 animate-spin" />}
                Enviar denúncia
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={blockConfirmOpen} onOpenChange={setBlockConfirmOpen}>
        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear {profileName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {profileName} não vai mais aparecer pra você, e vocês não vão mais poder trocar
              mensagens. Você pode desbloquear a qualquer momento em &quot;Perfis bloqueados&quot; no
              seu perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={block.isPending} onClick={() => block.mutate({ profileId })}>
              {block.isPending && <Loader2 className="size-4 animate-spin" />}
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
