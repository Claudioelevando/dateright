# DateRight — Plano de Execução

> Baseado em [docs/PRD.md](PRD.md) e [CLAUDE.md](../CLAUDE.md).

Estratégia: cada milestone vira uma branch a partir da `main`. Ao concluir todas as entregas, roda-se o "commit final" indicado, abre-se PR para `main` e faz-se merge antes de iniciar o próximo milestone. A Fase 1 constrói toda a interface com dados mockados; a Fase 2 substitui os mocks por backend real, milestone a milestone, na mesma ordem das telas já construídas.

---

## Fase 0 — Setup

### M0. Setup do Projeto

**Branch:** `chore/00-setup`
**Objetivo:** Inicializar o repositório e o ambiente de desenvolvimento com toda a stack configurada, pronta para receber UI e, depois, backend.

**Entregas:**

- [ ] Criar projeto Next.js (App Router) com TypeScript
- [ ] Configurar Tailwind CSS + shadcn/ui
- [ ] Configurar ESLint + Prettier
- [ ] Criar estrutura de pastas conforme `CLAUDE.md`
- [ ] Configurar variáveis de ambiente (`.env.example`)
- [ ] Configurar repositório Git + GitHub, branch `main` protegida
- [ ] Linkar projeto na Vercel (sem deploy de produção ainda)

**Commit final:** `chore: setup inicial do projeto Next.js + Tailwind + shadcn/ui`

---

## Fase 1 — Interface (UI com dados mockados)

### M1. Design System / UI Kit

**Branch:** `feat/01-design-system`
**Objetivo:** Estabelecer tokens visuais (cor, tipografia, espaçamento) e componentes base antes de construir as telas.

**Entregas:**

- [ ] Definir paleta de cores (neutra + cor de destaque) no `tailwind.config`
- [ ] Definir tipografia (fontes e escalas)
- [ ] Instalar e customizar componentes base do shadcn/ui (Button, Input, Card, Avatar, Badge, Dialog, Tabs)
- [ ] Criar componentes compartilhados (Logo, EmptyState, LoadingSpinner)
- [ ] Implementar dark mode
- [ ] Criar rota interna `/design-system` para visualizar tokens e componentes

**Commit final:** `feat: design system e componentes base de UI`

### M2. Autenticação (UI)

**Branch:** `feat/02-auth-ui`
**Objetivo:** Telas de login, cadastro e recuperação de senha, com validação client-side e dados mockados (sem integração real ainda).

**Entregas:**

- [ ] Tela de Login
- [ ] Tela de Cadastro
- [ ] Tela de recuperação de senha
- [ ] Validação de formulário (client-side)
- [ ] Layout `(auth)` do App Router
- [ ] Estados de erro/loading mockados

**Commit final:** `feat: telas de autenticação (UI)`

### M3. Onboarding e Perfil (UI)

**Branch:** `feat/03-profile-ui`
**Objetivo:** Fluxo de criação/edição de perfil (fotos, bio, preferências) com dados mockados.

**Entregas:**

- [ ] Fluxo de onboarding multi-step
- [ ] Upload de fotos (UI, preview local sem envio real)
- [ ] Formulário de biografia e preferências
- [ ] Tela de visualização/edição de perfil
- [ ] Componente de card de perfil reutilizável (será usado no discovery)

**Commit final:** `feat: telas de onboarding e perfil (UI)`

### M4. Questionário de Valores (UI)

**Branch:** `feat/04-questionnaire-ui`
**Objetivo:** Interface do questionário de valores e compatibilidade.

**Entregas:**

- [ ] Estrutura de perguntas (mock em JSON local)
- [ ] Componente de pergunta com opções (escolha única/múltipla, escala)
- [ ] Barra de progresso
- [ ] Tela de resumo/resultado de compatibilidade (mock)

**Commit final:** `feat: questionário de valores (UI)`

### M5. Descoberta / Swipe (UI)

**Branch:** `feat/05-discovery-ui`
**Objetivo:** Tela principal de descoberta com swipe e filtros de busca.

**Entregas:**

- [ ] Componente de card com gesto de swipe (touch/mouse)
- [ ] Ações de like / dislike / super like
- [ ] Painel de filtros (idade, localização, preferências)
- [ ] Estado vazio (sem mais perfis)
- [ ] Dados de perfis mockados

**Commit final:** `feat: tela de descoberta com swipe (UI)`

### M6. Matches e Chat (UI)

**Branch:** `feat/06-matches-chat-ui`
**Objetivo:** Lista de matches, tela de conversa e notificação de novo match.

**Entregas:**

- [ ] Modal/animação de "Novo Match"
- [ ] Lista de matches
- [ ] Tela de chat com mensagens mockadas
- [ ] Input de mensagem com estado otimista
- [ ] Entry point de bloqueio/denúncia na UI

**Commit final:** `feat: telas de matches e chat (UI)`

### M7. Plano Premium (UI)

**Branch:** `feat/07-premium-ui`
**Objetivo:** Paywall e tela de planos.

**Entregas:**

- [ ] Tela de comparação de planos
- [ ] Componente de paywall/upsell
- [ ] Badge de usuário premium nos componentes existentes

**Commit final:** `feat: tela de plano premium (UI)`

### M8. Dashboards Admin e Moderador (UI)

**Branch:** `feat/08-admin-ui`
**Objetivo:** Interface administrativa para gestão de usuários e denúncias.

**Entregas:**

- [ ] Layout `(admin)` com navegação lateral
- [ ] Dashboard com métricas (mockadas)
- [ ] Listagem e detalhe de usuários
- [ ] Fila de denúncias com ações (mock)
- [ ] Tela de configurações da plataforma

**Commit final:** `feat: dashboards de admin e moderador (UI)`

---

## Fase 2 — Backend

### M9. Infraestrutura de Backend

**Branch:** `feat/09-backend-setup`
**Objetivo:** Configurar banco de dados, schema Prisma e conexão com Supabase.

**Entregas:**

- [ ] Provisionar projeto Supabase (Postgres + Auth + Storage)
- [ ] Modelar schema Prisma (User, Profile, Preference, Question, Answer, Match, Message, Report, Subscription)
- [ ] Rodar migrations iniciais
- [ ] Configurar tRPC (server, router raiz, context)
- [ ] Configurar RLS (Row Level Security) básica no Supabase

**Commit final:** `feat: infraestrutura de backend com Prisma, Postgres e Supabase`

### M10. Autenticação Real

**Branch:** `feat/10-auth-backend`
**Objetivo:** Integrar Supabase Auth ao fluxo de login/cadastro construído na M2.

**Entregas:**

- [ ] Integração com Supabase Auth (email/senha; OAuth opcional)
- [ ] Middleware de sessão e proteção de rotas
- [ ] Router tRPC de auth (`me`, `logout`)
- [ ] Conectar telas de login/cadastro/recuperação de senha ao backend real
- [ ] Tratamento de erros reais (credenciais inválidas, etc.)

**Commit final:** `feat: autenticação real com Supabase Auth`

### M11. Perfil e Upload de Mídia

**Branch:** `feat/11-profile-backend`
**Objetivo:** Persistir perfil e conectar upload real de fotos.

**Entregas:**

- [ ] Router tRPC de profile (`create`, `update`, `get`)
- [ ] Upload de fotos para Supabase Storage
- [ ] Validação de dados com Zod
- [ ] Conectar telas de onboarding/perfil (M3) ao backend

**Commit final:** `feat: persistência de perfil e upload de mídia`

### M12. Questionário e Algoritmo de Matching

**Branch:** `feat/12-matching-backend`
**Objetivo:** Persistir respostas do questionário e implementar o algoritmo de compatibilidade de valores.

**Entregas:**

- [ ] Modelar perguntas/respostas no banco
- [ ] Router tRPC do questionário
- [ ] Algoritmo de score de compatibilidade de valores
- [ ] Conectar tela de questionário (M4) ao backend

**Commit final:** `feat: questionário de valores e algoritmo de matching`

### M13. Sistema de Match e Chat

**Branch:** `feat/13-match-chat-backend`
**Objetivo:** Lógica de match mútuo, filtros de busca e mensagens em tempo real.

**Entregas:**

- [ ] Router tRPC de discovery (candidatos com base no algoritmo + filtros)
- [ ] Lógica de like/match mútuo
- [ ] Router tRPC de chat com mensagens persistidas
- [ ] Realtime de mensagens (Supabase Realtime)
- [ ] Conectar telas de descoberta, matches e chat (M5, M6) ao backend

**Commit final:** `feat: sistema de match e chat com dados reais`

### M14. Denúncia, Bloqueio e Moderação

**Branch:** `feat/14-moderation-backend`
**Objetivo:** Backend de moderação e conexão com os dashboards admin.

**Entregas:**

- [ ] Router tRPC de reports (criar, listar, resolver)
- [ ] Ação de bloqueio de usuário
- [ ] Trilha de auditoria das ações de moderação
- [ ] Conectar dashboards de admin/moderador (M8) aos dados reais

**Commit final:** `feat: sistema de denúncia, bloqueio e moderação`

### M15. Pagamentos (Stripe / Premium)

**Branch:** `feat/15-payments`
**Objetivo:** Integrar Stripe ao plano Premium.

**Entregas:**

- [ ] Configurar produtos/preços no Stripe
- [ ] Checkout Session / Customer Portal
- [ ] Webhook do Stripe (ativação/cancelamento de assinatura)
- [ ] Conectar tela de premium (M7) ao fluxo real de pagamento
- [ ] Gate de features premium no backend

**Commit final:** `feat: integração de pagamentos com Stripe`

### M16. Notificações e E-mails

**Branch:** `feat/16-notifications`
**Objetivo:** Push notifications e e-mails transacionais.

**Entregas:**

- [ ] Configurar Firebase Cloud Messaging
- [ ] Notificações de novo match, nova mensagem e like recebido (premium)
- [ ] Configurar Resend para e-mails transacionais (boas-vindas, confirmação, reset de senha)

**Commit final:** `feat: notificações push e e-mails transacionais`

### M17. Observabilidade (Analytics, Erros, Cache)

**Branch:** `feat/17-observability`
**Objetivo:** Instrumentar o produto para dados de uso, erros e performance.

**Entregas:**

- [ ] Integrar PostHog (eventos-chave: cadastro, match, mensagem, upgrade)
- [ ] Integrar Sentry (frontend + backend)
- [ ] Configurar Redis/Upstash para cache e filas (ex.: fila de notificações, cache de discovery)

**Commit final:** `feat: analytics, monitoramento de erros e cache`

### M18. Testes e QA

**Branch:** `chore/18-qa`
**Objetivo:** Garantir cobertura de testes dos fluxos críticos antes do deploy.

**Entregas:**

- [ ] Testes unitários do algoritmo de matching
- [ ] Testes de integração dos routers tRPC críticos (auth, match, payments)
- [ ] Testes E2E do fluxo principal (cadastro → questionário → match → chat)
- [ ] Checklist manual de acessibilidade e responsividade

**Commit final:** `test: cobertura de testes dos fluxos críticos`

### M19. Deploy

**Branch:** `chore/19-deploy`
**Objetivo:** Publicar a aplicação em produção.

**Entregas:**

- [ ] Configurar variáveis de ambiente de produção na Vercel
- [ ] Configurar domínio customizado
- [ ] Rodar migrations em produção
- [ ] Deploy de produção via Vercel
- [ ] Smoke test pós-deploy dos fluxos críticos

**Commit final:** `chore: deploy de produção na Vercel`
