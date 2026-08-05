# DateRight — Briefing do Projeto

> Referência completa do produto: [docs/PRD.md](docs/PRD.md)

## O que é

Aplicativo de relacionamentos que faz matching por compatibilidade de valores, princípios e visão de mundo — não só localização e interesses. A tese: apps tradicionais só revelam incompatibilidade de valores _depois_ do match, gerando frustração; o DateRight resolve isso desde o início com um questionário de valores que alimenta o algoritmo de matching.

Personas: **Usuário** (busca relacionamento por afinidade de valores), **Administrador** (gestão da plataforma), **Moderador** (denúncias e conformidade com diretrizes da comunidade).

## Stack Técnica

| Camada                 | Tecnologia                                                       |
| ---------------------- | ---------------------------------------------------------------- |
| Frontend               | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend                | Node.js, tRPC                                                    |
| Banco de dados         | PostgreSQL + Prisma                                              |
| Autenticação e Storage | Supabase (+ Supabase Storage para mídia)                         |
| Pagamentos             | Stripe (plano Premium)                                           |
| E-mails                | Resend                                                           |
| Push Notifications     | Firebase Cloud Messaging (FCM)                                   |
| Deploy                 | Vercel                                                           |
| Analytics              | PostHog                                                          |
| Monitoramento de erros | Sentry                                                           |
| Mapas e Geolocalização | Google Maps API                                                  |
| Cache e Filas          | Redis (Upstash)                                                  |
| Versionamento          | Git + GitHub                                                     |
| Dev com IA             | Claude Code                                                      |

**Regra geral:** tipagem ponta a ponta (Prisma → tRPC → React), sem endpoints REST soltos fora do router tRPC salvo integrações externas (webhooks Stripe/Supabase).

## Convenções

### Código

- TypeScript estrito (`strict: true`); evitar `any`.
- Componentes React em `PascalCase`, hooks em `camelCase` prefixados com `use`.
- Nada de comentários explicando o óbvio — só o "porquê" quando não for evidente.
- Server Components por padrão no App Router; `"use client"` só quando houver interatividade, estado local ou browser APIs.
- Mutações e queries de dados via routers tRPC, nunca fetch direto ao Prisma dentro de componentes.
- Validação de input com Zod nos procedures tRPC (fronteira do sistema).

### Estilo visual (Tailwind + shadcn/ui)

- Usar tokens do design system (ver seção Identidade Visual) em vez de valores mágicos.
- Componentes shadcn/ui como base; customizar via `tailwind.config` e variantes, não sobrescrever com CSS solto.

### Dados sensíveis

- Fotos, biografia e respostas do questionário de valores são dados sensíveis de usuário — nunca logar em texto plano, sempre passar por RLS (Row Level Security) no Supabase/Postgres.
- Denúncias e ações de moderação exigem trilha de auditoria (quem, quando, o quê).

### Commits

- Mensagens em português ou inglês (seguir o que já estiver no histórico), formato imperativo curto descrevendo o "porquê".

## Estrutura de Pastas (proposta)

```
dateright/
├── docs/
│   └── PRD.md
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # login, cadastro
│   │   ├── (app)/                # área logada
│   │   │   ├── discover/         # swipe / descoberta
│   │   │   ├── matches/
│   │   │   ├── chat/[matchId]/
│   │   │   ├── profile/
│   │   │   ├── questionnaire/    # questionário de valores
│   │   │   └── premium/
│   │   ├── (admin)/              # dashboard admin/moderador
│   │   │   ├── users/
│   │   │   ├── reports/          # denúncias
│   │   │   └── settings/
│   │   └── api/
│   │       ├── trpc/[trpc]/
│   │       └── webhooks/         # stripe, supabase
│   ├── server/
│   │   ├── routers/              # routers tRPC por domínio (user, match, chat, report...)
│   │   ├── trpc.ts
│   │   └── services/             # regras de negócio (matching algorithm, moderação)
│   ├── components/
│   │   ├── ui/                   # shadcn/ui
│   │   └── shared/
│   ├── lib/                      # clients (supabase, stripe, resend, posthog, redis)
│   ├── hooks/
│   └── types/
├── public/
├── CLAUDE.md
└── package.json
```

## Identidade Visual

**Referências:** Tinder (swipe/descoberta), Bumble (interface limpa), Hinge (perfis completos), Apple HIG (minimalismo), Material Design 3 (consistência).

**Estilo:** minimalista, elegante, moderno — prioriza simplicidade, acessibilidade e fluidez de uso sobre densidade de informação.

**Diretrizes práticas:**

- Espaço em branco generoso; hierarquia tipográfica clara (1–2 famílias de fonte, no máximo).
- Paleta neutra como base (fundo claro/escuro) + uma cor de destaque única para CTAs, match e ações primárias — evitar poluição visual característica de apps de namoro genéricos.
- Cantos arredondados e cards como unidade central de UI (perfil, match, mensagem).
- Microinterações sutis (like, match, swipe) — feedback visual imediato sem exagero.
- Acessibilidade: contraste AA mínimo, alvos de toque ≥44px, suporte a dark mode.
- Fotos de perfil sempre como protagonistas visuais; texto e badges de compatibilidade em camadas discretas sobre a imagem.

## Processo de Build

- Dividir o app em milestones lógicos e entregáveis (não big-bang).
- Priorizar o núcleo funcional primeiro: auth → perfil → questionário de valores → matching → chat. Premium, notificações push e moderação avançada vêm depois.
- Testar cada milestone antes de avançar para o próximo.
