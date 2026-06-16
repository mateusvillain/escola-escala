@AGENTS.md

# Plataforma de Cursos — Contexto do Projeto

Plataforma B2C de cursos online por assinatura. Stack: Next.js 16.2.9 (App Router + Turbopack), Prisma 7 + Neon PostgreSQL, LetsUI design system, Stripe para assinaturas, Bunny Stream para vídeos.

## O que já foi implementado

**Auth completa:** registro, login, logout, recuperação de senha via e-mail (SMTP Resend), JWT em cookie `auth-token`.

**Admin — gestão de cursos:**
- Listagem com filtros, busca e paginação (`/admin/cursos`)
- Criação e edição de curso com formulário completo (`/admin/cursos/novo`, `/admin/cursos/[id]`)
- Editor de módulos inline com reordenação (`ModuleList`)
- Editor de aulas por módulo com badges de status de vídeo (`LessonList`)
- APIs REST completas para courses, modules e lessons

**Infraestrutura:**
- Middleware de autenticação em `src/proxy.ts`
- Admin layout com verificação de role server-side
- Prisma schema com soft-delete em cursos e CASCADE em módulos/aulas

## O que ainda falta (principais)

- `TASK-27`: API de upload de vídeo para Bunny Stream (`POST /api/admin/videos/upload`) — aguarda credenciais
- `TASK-32`: Editor completo de aula com upload de vídeo e player Bunny Stream embed
- Stripe: assinaturas, checkout, webhooks
- Área do aluno: listagem de cursos, player de aula, progresso
- Certificados em PDF

## Arquivos-chave para referência rápida

| Arquivo | O que é |
|---|---|
| `src/proxy.ts` | Middleware de autenticação (proxy, não middleware) |
| `src/lib/auth.ts` | `requireRole()` e `getAuthUser()` |
| `src/lib/prisma.ts` | Singleton do Prisma client |
| `src/lib/jwt.ts` | `signToken()` e `verifyToken()` |
| `src/lib/utils/slug.ts` | `generateSlug()` e `getUniqueSlug()` |
| `src/types/lets-ui.d.ts` | Tipos TypeScript dos web components LetsUI |
| `prisma/schema.prisma` | Schema completo do banco |
| `.env.local` | Variáveis de ambiente (não commitado) |
| `docs/bunny-stream-pricing.md` | Referência de custos do Bunny Stream |
| `.agent/tasks/` | Tasks pendentes de implementação |
| `.agent/tasks/completed/` | Tasks já implementadas |
