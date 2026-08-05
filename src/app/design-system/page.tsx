import { Heart, Inbox } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

const colorTokens = [
  { name: "background", label: "Background" },
  { name: "foreground", label: "Foreground" },
  { name: "primary", label: "Primary (destaque)" },
  { name: "secondary", label: "Secondary" },
  { name: "muted", label: "Muted" },
  { name: "accent", label: "Accent" },
  { name: "destructive", label: "Destructive" },
  { name: "border", label: "Border" },
];

function ColorSwatch({ name, label }: { name: string; label: string }) {
  return (
    <div className="space-y-2">
      <div
        className="border-border h-16 w-full rounded-xl border"
        style={{ backgroundColor: `var(--color-${name})` }}
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">--color-{name}</p>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Design System</h1>
        <p className="text-muted-foreground">
          Tokens visuais e componentes base do DateRight — paleta neutra com uma cor de destaque
          única para CTAs e ações primárias, tipografia em Geist e suporte a dark mode.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cores</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {colorTokens.map((token) => (
            <ColorSwatch key={token.name} {...token} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tipografia</h2>
        <div className="border-border space-y-3 rounded-xl border p-6">
          <p className="text-4xl font-semibold tracking-tight">Heading 1 / text-4xl</p>
          <p className="text-3xl font-semibold tracking-tight">Heading 2 / text-3xl</p>
          <p className="text-2xl font-semibold">Heading 3 / text-2xl</p>
          <p className="text-xl font-medium">Heading 4 / text-xl</p>
          <p className="text-base">
            Corpo de texto / text-base — usado para parágrafos e conteúdo padrão.
          </p>
          <p className="text-muted-foreground text-sm">
            Texto pequeno / text-sm — legendas e metadados.
          </p>
          <p className="text-muted-foreground text-xs">Caption / text-xs — rótulos auxiliares.</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Botões</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button size="icon" aria-label="Curtir">
            <Heart className="size-4" />
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Inputs &amp; Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="seu@email.com" className="max-w-xs" />
          <Badge>Novo match</Badge>
          <Badge variant="secondary">Premium</Badge>
          <Badge variant="outline">Verificado</Badge>
          <Badge variant="destructive">Denúncia</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Avatar</h2>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="Foto de perfil" />
            <AvatarFallback>DR</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JP</AvatarFallback>
          </Avatar>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Card</h2>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Compatibilidade de valores</CardTitle>
            <CardDescription>92% de afinidade com base no questionário</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Cards são a unidade central de UI para perfis, matches e mensagens.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tabs</h2>
        <Tabs defaultValue="perfil" className="max-w-sm">
          <TabsList>
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="valores">Valores</TabsTrigger>
          </TabsList>
          <TabsContent value="perfil" className="text-muted-foreground text-sm">
            Conteúdo do perfil.
          </TabsContent>
          <TabsContent value="valores" className="text-muted-foreground text-sm">
            Conteúdo do questionário de valores.
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Abrir dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bloquear usuário</DialogTitle>
              <DialogDescription>
                Essa ação impede que este perfil veja o seu ou entre em contato.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Estados</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <EmptyState
            icon={Inbox}
            title="Nenhum match ainda"
            description="Continue explorando perfis para encontrar sua próxima conversa."
            action={<Button size="sm">Descobrir perfis</Button>}
          />
          <div className="border-border flex items-center justify-center rounded-2xl border p-12">
            <LoadingSpinner label="Carregando perfis..." />
          </div>
        </div>
      </section>
    </div>
  );
}
