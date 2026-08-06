"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { trpc } from "@/lib/trpc/client";

const REASON_LABELS: Record<string, string> = {
  FAKE_PROFILE: "Perfil falso",
  INAPPROPRIATE_CONTENT: "Conteúdo inadequado",
  HARASSMENT: "Assédio ou comportamento abusivo",
  SCAM: "Golpe ou spam",
  MINOR: "Menor de idade",
  OTHER: "Outro",
};

const STATUS_TABS = [
  { value: "PENDING", label: "Pendentes" },
  { value: "ACTIONED", label: "Suspensões aplicadas" },
  { value: "DISMISSED", label: "Dispensadas" },
] as const;

export default function ReportsPage() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]["value"]>("PENDING");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();
  const { data: reports, isLoading } = trpc.moderation.listReports.useQuery({ status });
  const reviewReport = trpc.moderation.reviewReport.useMutation({
    onSuccess: () => utils.moderation.listReports.invalidate(),
  });

  function handleReview(reportId: string, action: "DISMISS" | "SUSPEND") {
    reviewReport.mutate({ reportId, action, resolutionNote: notes[reportId] || undefined });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Moderação</h1>

      <Tabs value={status} onValueChange={(value) => setStatus(value as typeof status)} className="mb-6">
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner label="Carregando denúncias..." />
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base font-medium">
                  <span className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarImage src={report.reporter.photos[0]} alt={report.reporter.name} />
                      <AvatarFallback>{report.reporter.name[0]}</AvatarFallback>
                    </Avatar>
                    {report.reporter.name}
                  </span>
                  <span className="text-muted-foreground">denunciou</span>
                  <span className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarImage src={report.reported.photos[0]} alt={report.reported.name} />
                      <AvatarFallback>{report.reported.name[0]}</AvatarFallback>
                    </Avatar>
                    {report.reported.name}
                  </span>
                  {report.reported.suspendedAt && <Badge variant="secondary">Já suspenso</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <Flag className="text-destructive size-3.5" />
                  {REASON_LABELS[report.reason] ?? report.reason}
                </p>
                {report.details && <p className="text-muted-foreground text-sm">{report.details}</p>}
                {report.resolutionNote && (
                  <p className="text-muted-foreground text-sm italic">Nota: {report.resolutionNote}</p>
                )}

                {status === "PENDING" && (
                  <div className="space-y-2 pt-2">
                    <Textarea
                      placeholder="Nota de resolução (opcional)"
                      rows={2}
                      value={notes[report.id] ?? ""}
                      onChange={(event) =>
                        setNotes((prev) => ({ ...prev, [report.id]: event.target.value }))
                      }
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reviewReport.isPending}
                        onClick={() => handleReview(report.id, "DISMISS")}
                      >
                        {reviewReport.isPending && <Loader2 className="size-4 animate-spin" />}
                        Dispensar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={reviewReport.isPending}
                        onClick={() => handleReview(report.id, "SUSPEND")}
                      >
                        {reviewReport.isPending && <Loader2 className="size-4 animate-spin" />}
                        Suspender perfil
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Flag} title="Nenhuma denúncia por aqui" />
      )}
    </div>
  );
}
