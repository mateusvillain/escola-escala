@AGENTS.md

# Plataforma de Cursos — Contexto do Projeto

Plataforma B2C de cursos online por assinatura. Stack: Next.js 16.2.9 (App Router + Turbopack), Prisma 7 + Neon PostgreSQL, LetsUI design system, Stripe para assinaturas, Bunny Stream para vídeos.

## O que já foi implementado

A Fase 1 (B2C) está **essencialmente completa** — 80 das 83 tasks geradas no PRD original já foram implementadas. Restam apenas itens de infraestrutura/deploy (ver "O que ainda falta").

**Auth completa:** registro, login, logout, recuperação de senha via e-mail (SMTP Resend), JWT em cookie `auth-token`, edição de perfil e troca de senha (`/perfil`).

**Admin — gestão de cursos:**
- Listagem com filtros, busca e paginação (`/admin/cursos`)
- Criação e edição de curso com formulário completo (`/admin/cursos/novo`, `/admin/cursos/[id]`)
- Editor de módulos inline com reordenação (`ModuleList`)
- Editor de aulas com upload de vídeo para Bunny Stream e player embed (`/admin/aulas/[id]`, `LessonEditor`)
- Gestão de usuários (`/admin/usuarios`) e de assinaturas (`/admin/assinaturas`)
- Dashboard admin com métricas (`AdminDashboard`, `GET /api/admin/metrics`)
- APIs REST completas para courses, modules, lessons, users, subscriptions, videos

**Assinaturas (Stripe) — completo:**
- Página de planos (`/planos`), checkout (`POST /api/subscriptions/checkout`), portal do cliente (`POST /api/subscriptions/portal`)
- Webhooks (`POST /api/webhooks/stripe` → `src/lib/stripe-handlers.ts`): checkout completo, renovação, falha de pagamento, atualização/cancelamento de assinatura
- Controle de acesso por plano (`src/lib/access.ts`): `basic` acessa cursos `planAccess: basic`, `premium` acessa tudo, admin sempre tem acesso
- Mensagens diferenciadas para assinatura `past_due` vs `canceled` (TASK-78)
- Gestão de assinatura pelo aluno em `/dashboard/assinatura`

**Área do aluno — completo:**
- Catálogo público com filtros (`/cursos`)
- Player de aula com embed Bunny Stream, navegação prev/next, sidebar com progresso (`/cursos/[slug]/aulas/[lessonId]`)
- Tracking de progresso por eventos do player + conclusão manual, auto-completa aula em 80% assistido
- Dashboard do aluno com cursos em andamento/concluídos (`/dashboard`)
- Detecção automática de conclusão de curso (100% das aulas) → gera certificado automaticamente
- Certificados em PDF (`pdf-lib`), card de download no dashboard (`GET /api/certificates/[courseId]/download`)
- `UpgradePrompt` para aulas fora do plano do usuário; aulas `isPreview` são liberadas sem assinatura

**Infraestrutura:**
- Middleware de autenticação em `src/proxy.ts`
- Admin layout com verificação de role server-side
- Prisma schema com soft-delete em cursos e CASCADE em módulos/aulas
- Rate limiting em memória para rotas sensíveis (`src/lib/rate-limit.ts`)

## O que ainda falta (principais)

- `TASK-81`: Restringir domínio de embed no Bunny Stream (whitelist) — config no painel, sem código
- `TASK-82`: Deploy de produção na Vercel (env vars, domínio, webhook Stripe de produção, smoke test)
- `TASK-83`: **Importante antes do deploy** — migrar upload de vídeo para TUS direto do navegador. O endpoint atual (`POST /api/admin/videos/upload`) recebe o arquivo via FormData no servidor Next.js, mas a Vercel limita payload de Functions a 4.5MB em todos os planos — inutilizável em produção para vídeos reais de aula
- Testes E2E: Playwright está como devDependency mas **não há testes escritos nem `playwright.config.ts`** ainda — apenas testes unitários com Vitest (`src/lib/__tests__/`, `src/app/api/auth/logout/__tests__/`)

## Arquivos-chave para referência rápida

| Arquivo | O que é |
|---|---|
| `src/proxy.ts` | Middleware de autenticação (proxy, não middleware) |
| `src/lib/auth.ts` | `requireRole()` e `getAuthUser()` |
| `src/lib/prisma.ts` | Singleton do Prisma client |
| `src/lib/jwt.ts` | `signToken()` e `verifyToken()` |
| `src/lib/utils/slug.ts` | `generateSlug()` e `getUniqueSlug()` |
| `src/lib/access.ts` | `checkLessonAccess()` — controle de acesso por plano/assinatura |
| `src/lib/stripe.ts` / `stripe-handlers.ts` | Cliente Stripe e handlers dos eventos de webhook |
| `src/lib/bunny.ts` | Integração com API do Bunny Stream (criação/upload/embed de vídeo) |
| `src/lib/certificate.ts` | Geração de certificado em PDF (`pdf-lib`) e armazenamento idempotente |
| `src/lib/progress.ts` / `enrollment.ts` | Progresso de aula/curso e matrícula automática por assinatura |
| `src/lib/rate-limit.ts` | Rate limiting em memória (resets a cada deploy) |
| `src/types/lets-ui.d.ts` | Tipos TypeScript dos web components LetsUI |
| `prisma/schema.prisma` | Schema completo do banco |
| `.env.local` | Variáveis de ambiente (não commitado) |
| `docs/bunny-stream-pricing.md` | Referência de custos do Bunny Stream |
| `.agent/tasks/` | Tasks pendentes de implementação (TASK-81, 82, 83) |
| `.agent/tasks/completed/` | Tasks já implementadas (80 tasks) |
