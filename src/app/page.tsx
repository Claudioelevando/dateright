import Link from "next/link";
import { Heart, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const values = [
  {
    icon: Sparkles,
    title: "Questionário de valores",
    description:
      "Antes de qualquer match, você responde sobre princípios e visão de mundo — não só preferências superficiais.",
  },
  {
    icon: Heart,
    title: "Matching por compatibilidade",
    description:
      "O algoritmo prioriza afinidade real de valores, reduzindo a frustração de conhecer alguém incompatível só depois do match.",
  },
  {
    icon: MessageCircle,
    title: "Conversas com propósito",
    description:
      "Menos swipe sem sentido, mais conversas com quem já compartilha o que importa pra você.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-6 px-6 py-20 text-center sm:py-28">
        <span className="border-border bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
          <ShieldCheck className="size-3.5" />
          Feito para relacionamentos com propósito
        </span>

        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Matching por compatibilidade de valores, não só de localização
        </h1>

        <p className="text-muted-foreground max-w-xl text-lg text-balance">
          O DateRight resolve desde o início o que outros apps só revelam depois do match: se vocês
          compartilham os mesmos princípios e visão de mundo.
        </p>

        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" className="h-11 px-6" disabled title="Cadastro em breve">
            Criar conta
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-6">
            <Link href="/design-system">Ver design system</Link>
          </Button>
        </div>
      </section>

      <section className="border-border border-t">
        <div className="mx-auto grid max-w-4xl gap-6 px-6 py-16 sm:grid-cols-3">
          {values.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-none shadow-none">
              <CardHeader>
                <div className="bg-muted mb-2 flex size-10 items-center justify-center rounded-full">
                  <Icon className="text-primary size-5" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
