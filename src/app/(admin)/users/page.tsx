"use client";

import { useState } from "react";
import { Loader2, ShieldAlert, Users as UsersIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { trpc } from "@/lib/trpc/client";

const ROLE_LABELS = { USER: "Usuário", MODERATOR: "Moderador", ADMIN: "Admin" } as const;

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [reasonByUser, setReasonByUser] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();
  const { data: users, isLoading, error } = trpc.admin.listUsers.useQuery({ search: search || undefined });
  const setRole = trpc.admin.setRole.useMutation({ onSuccess: () => utils.admin.listUsers.invalidate() });
  const setSuspension = trpc.admin.setSuspension.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });

  if (error?.data?.code === "FORBIDDEN") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Acesso restrito a administradores"
        description="Só administradores podem gerenciar usuários."
      />
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Usuários</h1>

      <Input
        placeholder="Buscar por nome ou e-mail..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mb-6 max-w-sm"
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner label="Carregando usuários..." />
        </div>
      ) : users && users.length > 0 ? (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-muted-foreground text-xs">{user.email}</p>
                {user.suspendedAt && (
                  <p className="text-destructive text-xs">
                    Suspenso{user.suspendedReason && `: ${user.suspendedReason}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {user.isPremium && <Badge variant="secondary">Premium</Badge>}

                <Select
                  value={user.role}
                  onValueChange={(role) =>
                    setRole.mutate({
                      profileId: user.id,
                      role: role as "USER" | "MODERATOR" | "ADMIN",
                    })
                  }
                >
                  <SelectTrigger size="sm" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {user.suspendedAt ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={setSuspension.isPending}
                    onClick={() => setSuspension.mutate({ profileId: user.id, suspended: false })}
                  >
                    Reativar
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Suspender
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Suspender {user.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A conta perde acesso a descoberta, matches e chat até ser reativada.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <Textarea
                        placeholder="Motivo (opcional)"
                        rows={2}
                        value={reasonByUser[user.id] ?? ""}
                        onChange={(event) =>
                          setReasonByUser((prev) => ({ ...prev, [user.id]: event.target.value }))
                        }
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={setSuspension.isPending}
                          onClick={() =>
                            setSuspension.mutate({
                              profileId: user.id,
                              suspended: true,
                              reason: reasonByUser[user.id] || undefined,
                            })
                          }
                        >
                          {setSuspension.isPending && <Loader2 className="size-4 animate-spin" />}
                          Suspender
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={UsersIcon} title="Nenhum usuário encontrado" />
      )}
    </div>
  );
}
