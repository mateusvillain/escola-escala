@AGENTS.md

# Plataforma de Cursos — Contexto do Projeto

Plataforma B2C de cursos online por assinatura. Stack: Next.js 16.2.9 (App Router + Turbopack), Prisma 7 + Neon PostgreSQL, LetsUI design system, Stripe para assinaturas/compra avulsa, Bunny Stream para vídeos, Sentry para monitoramento de erros.

## O que já foi implementado

**Fase 1 (B2C, 83 tasks) e Fase 2 (crescimento, 62 tasks — TASK-84 a TASK-145) estão completas.** Fase 3 está em andamento por grupos de trabalho (ver `docs/fase3-grupos-de-trabalho.md`) — alguns grupos já entregues, outros ainda pendentes (ver "O que ainda falta"). No total, **151 das 201 tasks geradas até agora já foram implementadas** (28 despriorizadas/removidas em `.agent/tasks/deprecated/`, 22 ainda pendentes em `.agent/tasks/`).

**Auth completa:** registro, login, logout, recuperação de senha via e-mail (SMTP Resend), JWT em cookie `auth-token`, edição de perfil e troca de senha (`/perfil`). Checkout integrado ao cadastro via Stripe Embedded Checkout (`ui_mode: 'embedded'`, `EmbeddedCheckoutForm`) — quem ainda não é assinante escolhe plano e paga na própria tela de cadastro.

**Admin — gestão de cursos e trilhas:**
- Listagem com filtros, busca e paginação (`/admin/cursos`)
- Criação e edição de curso com formulário completo (`/admin/cursos/novo`, `/admin/cursos/[id]`)
- Editor de módulos inline com reordenação (`ModuleList`) e editor de quiz por módulo (`QuizEditor`)
- Editor de aulas com upload de vídeo direto do navegador para o Bunny Stream via TUS (`/admin/aulas/[id]`, `LessonEditor` + `tus-js-client`) e player embed
- **Trilhas (`/admin/trilhas`)**: agrupam cursos publicados em sequência, com opção de venda como bundle em pagamento único (`TrackTable`/`TrackForm`/`TrackCourseList`, mesmo padrão de reordenação/gap-closing dos módulos). Publicar exige ≥2 cursos.
- Gestão de usuários (`/admin/usuarios`), assinaturas (`/admin/assinaturas`, com export CSV) e log de auditoria de ações admin (`/admin/auditoria`)
- Dashboard admin com métricas (`AdminDashboard`, `GET /api/admin/metrics`)
- APIs REST completas para courses, modules, lessons, tracks, users, subscriptions, videos

**Assinaturas e compras (Stripe) — completo:**
- Página de planos (`/planos`), checkout de assinatura (`POST /api/subscriptions/checkout`, hospedado ou embedded), portal do cliente (`POST /api/subscriptions/portal`)
- Compra avulsa de curso individual (`POST /api/courses/[slug]/purchase`) e de trilha/bundle (`POST /api/tracks/[slug]/purchase`) — `mode: 'payment'`, só cartão (Boleto removido da Fase 3, ver `docs/fase3-grupos-de-trabalho.md`)
- Webhooks (`POST /api/webhooks/stripe` → `src/lib/stripe-handlers.ts`): checkout de assinatura, compra avulsa individual, compra de bundle (matrícula em lote idempotente), renovação, falha de pagamento, atualização/cancelamento de assinatura
- Controle de acesso por plano (`src/lib/access.ts`): `basic` acessa cursos `planAccess: basic`, `premium` acessa tudo, admin sempre tem acesso; matrícula avulsa/bundle dá acesso permanente independente do plano
- Mensagens diferenciadas para assinatura `past_due` vs `canceled` (TASK-78)
- Programa de indicação com código de referência e crédito automático (`src/lib/referral.ts`)
- Gestão de assinatura pelo aluno em `/dashboard/assinatura`

**Área do aluno — completo:**
- Catálogo público com filtros, separado em **Trilhas** e **Cursos sem trilha** (`/cursos`) — preço/CTA de bundle some para quem já tem assinatura ativa ou é admin
- Página pública de trilha com progresso agregado e CTA de compra do bundle (`/trilhas/[slug]`)
- Páginas públicas de instrutor (`/instrutores/[slug]`, `/instrutor/[id]`) e painel do instrutor (somente leitura)
- Player de aula com embed Bunny Stream, navegação prev/next, sidebar com progresso (`/cursos/[slug]/aulas/[lessonId]`)
- Quiz por módulo com tentativas registradas (`/cursos/[slug]/modulos/[moduleId]/quiz`)
- Tracking de progresso por eventos do player + conclusão manual, auto-completa aula em 80% assistido
- Avaliações de curso pelo aluno (`CourseReview`, `src/lib/reviews.ts`)
- Dashboard do aluno com cursos em andamento/concluídos (`/dashboard`)
- Detecção automática de conclusão de curso (100% das aulas) → gera certificado automaticamente
- Certificados em PDF (`pdf-lib`), card de download no dashboard (`GET /api/certificates/[courseId]/download`)
- `UpgradePrompt` para aulas fora do plano do usuário; aulas `isPreview` são liberadas sem assinatura

**Infraestrutura:**
- Middleware de autenticação em `src/proxy.ts`
- Admin layout com verificação de role server-side
- Prisma schema com soft-delete em cursos e CASCADE em módulos/aulas
- Rate limiting em memória para rotas sensíveis (`src/lib/rate-limit.ts`) — ainda não distribuído (Fase 3, pendente)
- Monitoramento de erro com Sentry (`sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation*.ts`) nas rotas financeiramente críticas, com Alert Rule configurada (ver `docs/wiki/sentry.md`)

## O que ainda falta (principais)

- `TASK-81`: Restringir domínio de embed no Bunny Stream (whitelist) — config no painel, sem código
- `TASK-82`: Deploy de produção na Vercel (env vars, domínio, webhook Stripe de produção, smoke test) — **bloqueia `TASK-201`** (restringir o Alert Rule do Sentry ao ambiente `production`, hoje em "All Environments" porque esse ambiente ainda não existe no Sentry)
- Fase 3 — grupos de trabalho ainda pendentes (`docs/fase3-grupos-de-trabalho.md`):
  - Grupo 7 — Conteúdo programado / drip content (TASK-174 a 178)
  - Grupo 8 — Testes E2E com Playwright (TASK-179 a 184): Playwright está como devDependency mas **não há `playwright.config.ts` nem specs** ainda — apenas testes unitários com Vitest (`src/lib/__tests__/`, `src/app/api/auth/logout/__tests__/`)
  - Grupo 9 — Rate limiting distribuído (TASK-185 a 187), depende também da `TASK-82`
  - Grupo 11 — Event tracking de produto (TASK-191 a 195)
- Fora de escopo ativo por decisão de produto (não é pendência técnica): Boleto via Stripe (Grupo 1) removido, B2B/licenciamento corporativo (Grupos 2-5) despriorizado — ambos em `.agent/tasks/deprecated/`, retomáveis se a demanda justificar (ver seção 14.6 do PRD)

## Arquivos-chave para referência rápida

| Arquivo | O que é |
|---|---|
| `src/proxy.ts` | Middleware de autenticação (proxy, não middleware) |
| `src/lib/auth.ts` | `requireRole()` e `getAuthUser()` |
| `src/lib/prisma.ts` | Singleton do Prisma client |
| `src/lib/jwt.ts` | `signToken()` e `verifyToken()` |
| `src/lib/utils/slug.ts` | `generateSlug()` e `getUniqueSlug()` |
| `src/lib/access.ts` | `checkLessonAccess()` — controle de acesso por plano/assinatura/compra avulsa |
| `src/lib/stripe.ts` / `stripe-handlers.ts` | Cliente Stripe e handlers dos eventos de webhook (assinatura, compra avulsa, bundle de trilha) |
| `src/lib/bunny.ts` | Integração com API do Bunny Stream (criação de vídeo, credenciais TUS, embed) |
| `src/lib/certificate.ts` | Geração de certificado em PDF (`pdf-lib`) e armazenamento idempotente |
| `src/lib/progress.ts` / `enrollment.ts` | Progresso de aula/curso e matrícula automática por assinatura/compra |
| `src/lib/referral.ts` | Código de indicação e crédito automático |
| `src/lib/reviews.ts` | Avaliações de curso |
| `src/lib/audit.ts` | Log de auditoria de ações admin |
| `src/lib/rate-limit.ts` | Rate limiting em memória (resets a cada deploy, ainda não distribuído) |
| `src/types/lets-ui.d.ts` | Tipos TypeScript dos web components LetsUI |
| `prisma/schema.prisma` | Schema completo do banco |
| `.env.local` | Variáveis de ambiente (não commitado) |
| `docs/pricing/` | Referência de custos (Bunny Stream, Stripe, Resend) |
| `docs/wiki/sentry.md` | Setup e operação do monitoramento de erro |
| `docs/fase3-grupos-de-trabalho.md` | Quebra da Fase 3 em grupos de trabalho/PRs, com prompt de execução de cada grupo |
| `.agent/tasks/` | Tasks pendentes de implementação (22 — ver "O que ainda falta") |
| `.agent/tasks/completed/` | Tasks já implementadas (151) |
| `.agent/tasks/deprecated/` | Tasks despriorizadas/removidas por decisão de produto (28 — Boleto, B2B) |
