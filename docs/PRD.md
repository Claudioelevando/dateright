# PROJECT ARCHITECTURE: DateRight

## 1. CONTEXT & PROBLEM

Pessoas que consideram seus valores políticos e de vida essenciais para um relacionamento perdem tempo e se frustram em aplicativos tradicionais, onde essa compatibilidade só é descoberta depois do match. O Date Right conecta usuários com princípios semelhantes desde o início, aumentando a chance de relacionamentos duradouros.

## 2. PROPOSED SOLUTION

Desenvolver um aplicativo de relacionamentos que conecta pessoas com base na compatibilidade de valores, preferências e visão de mundo, utilizando um algoritmo de matching que prioriza afinidade além de localização e interesses.

## 3. FUNCTIONAL REQUIREMENTS

- Login e Autenticação
- Dashboards
- Notificações
- Chat / Mensagens
- Upload de Arquivos

Cadastro e autenticação de usuários.
Criação de perfil com fotos, biografia e preferências.
Questionário de valores e compatibilidade.
Sistema de match por interesse mútuo.
Chat entre usuários com match.
Filtros de busca (idade, localização e preferências).
Plano Premium com recursos exclusivos.
Denúncia, bloqueio e moderação de usuários.

## 4. USER PERSONAS

Usuário: Pessoa que busca um relacionamento com alguém que compartilhe valores e objetivos de vida semelhantes.
Administrador: Responsável por gerenciar usuários, denúncias, conteúdo e configurações da plataforma.
Moderador: Analisa denúncias, aplica medidas contra perfis inadequados e garante o cumprimento das diretrizes da comunidade.

## 5. TECHNICAL STACK

- Next.js
- Supabase
- Stripe
- Vercel
- Prisma
- PostgreSQL
- Claude Code

Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
Backend: Node.js, tRPC
Banco de Dados: PostgreSQL + Prisma
Autenticação e Storage: Supabase
Pagamentos: Stripe
E-mails: Resend
Deploy: Vercel
Desenvolvimento com IA: Claude Code
Versionamento: Git + GitHub
Push Notifications: Firebase Cloud Messaging (FCM)
Armazenamento de mídia: Supabase Storage
Analytics: PostHog
Monitoramento de erros: Sentry
Mapas e Geolocalização: Google Maps API
Cache e Filas (escalabilidade): Redis (Upstash)

## 6. DESIGN LANGUAGE

Tinder (UX de swipe e descoberta)
Bumble (interface limpa e moderna)
Hinge (perfis mais completos)
Apple Human Interface Guidelines (minimalismo)
Material Design 3 (consistência e usabilidade)

Estilo visual: Minimalista, elegante, moderno, com foco em simplicidade, acessibilidade e boa experiência do usuário.

## 7. PROCESS

- Break app build into logical milestones (steps)
- Each milestone should be a deliverable increment
- Prioritize core functionality first, then iterate
- Test each milestone before moving to the next
