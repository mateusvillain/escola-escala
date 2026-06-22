# Guia de Agente — Plataforma de Cursos

## Next.js 16.2.9 — Leia antes de escrever qualquer código

Esta versão tem breaking changes em relação ao Next.js 13/14/15. Consulte `node_modules/next/dist/docs/` quando houver dúvida sobre APIs específicas.

### Diferenças críticas

**`proxy.ts`, não `middleware.ts`**
O arquivo de middleware foi renomeado. O projeto usa `src/proxy.ts`. Nunca crie `src/middleware.ts` — está deprecated e causará comportamento indefinido com o cache do Turbopack.

**`params` é uma Promise em page components e route handlers**
```ts
// Page component
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}

// Route handler
export async function GET(_req: NextRequest, ctx: RouteContext<'/api/admin/courses/[id]'>) {
  const { id } = await ctx.params
}
```

**Route groups `(group)` NÃO adicionam segmento à URL**
- `src/app/(app)/dashboard/` → `/dashboard`
- `src/app/admin/cursos/` → `/admin/cursos` ← use pasta simples para `/admin/*`

**`useSearchParams()` exige `<Suspense>` no componente pai**

---

## Autenticação

### Padrão nos route handlers
```ts
const auth = requireRole(request, ['admin'])
if (auth instanceof NextResponse) return auth  // ← sempre checar com instanceof
const { user } = auth
```

- `requireRole` retorna `{ user: JwtPayload } | NextResponse`
- `getAuthUser` retorna `JwtPayload | null` (sem verificação de role)
- Token armazenado no cookie `auth-token`
- `proxy.ts` verifica **apenas autenticação** — verificação de role é feita em cada layout e route handler individualmente

### Tipos JWT (`src/lib/jwt.ts`)
```ts
interface JwtPayload {
  userId: string
  email: string
  name: string
  role: 'admin' | 'instructor' | 'student'
}
```

---

## Prisma

- **Client gerado em:** `@/generated/prisma/client`
- **Singleton em:** `@/lib/prisma` → `import { prisma } from '@/lib/prisma'`
- **Adapter:** `PrismaPg` (não usa a string de conexão padrão do Prisma — usa o adapter `@prisma/adapter-pg`)
- **Banco:** Neon PostgreSQL (serverless)

### Padrões do schema
- Soft-delete em cursos: `status = 'archived'` (nunca deletar fisicamente)
- Hard-delete em módulos e aulas: CASCADE configurado via `onDelete: Cascade` nas relações
- Campo `order: Int` em `Module` e `Lesson` (1-indexed, sem unique constraint em lessons)
- Slugs únicos em `Course.slug` (gerados em `src/lib/utils/slug.ts` com normalização NFD para acentos)

### Migrations
```bash
npx prisma migrate dev --name descricao_da_mudanca
```

---

## LetsUI — Design System

Componentes web (`lui-*`) registrados globalmente via `src/components/LetsUIProvider.tsx`.

### Componentes disponíveis
```tsx
<lui-button variant="primary|secondary|ghost|danger" size="lg|md" disabled loading>
<lui-input label="..." placeholder="..." error error-text="..." hint="...">
<lui-tag label="..." variant="primary|secondary|success|danger|caution|info" tag-style="surface|subtle|outline" size="xl|lg|md|sm">
<lui-alert variant="success|caution|danger|info" title="..." content="...">
<lui-heading level="1-6" size="xl|lg|md|sm">
<lui-body size="..." weight="...">
<lui-card>
<lui-divider>
```

### Shadow DOM — leitura de valores
Os `lui-input` usam shadow DOM. Para ler o valor:
```ts
const value = el?.shadowRoot?.querySelector('input')?.value
```

### Formulários com validação
**Não use `lui-input` com react-hook-form** — o shadow DOM é incompatível com `register()`. Para formulários admin com validação, use `<input>` e `<textarea>` nativos estilizados com Tailwind. `lui-input` é adequado para formulários públicos simples (sem biblioteca de formulários).

---

## Estrutura de rotas

```
src/app/
├── (auth)/              # /login, /cadastro, /recuperar-senha, /redefinir-senha
├── (app)/               # /dashboard, /perfil, /curso/*
├── admin/               # /admin, /admin/cursos, /admin/cursos/[id]
│   └── cursos/
│       ├── page.tsx     # listagem
│       ├── novo/        # criação
│       └── [id]/        # edição (CourseForm + ModuleList + LessonList)
└── api/
    ├── auth/            # login, logout, register, forgot/reset-password
    ├── admin/           # courses, modules, lessons, users, videos
    └── users/me
```

### Admin layout
`src/app/admin/layout.tsx` verifica JWT + role admin no servidor antes de renderizar qualquer página admin.

---

## Componentes admin (`src/components/admin/`)

| Componente | Responsabilidade |
|---|---|
| `AdminSidebar` | Sidebar com navegação, usa `usePathname()` para link ativo |
| `CourseTable` | Listagem de cursos com filtros, busca, paginação e ações de status |
| `CourseForm` | Criação/edição de curso (react-hook-form, native inputs) |
| `ModuleList` | Lista de módulos expandível, inline edit, reordenação, exclusão |
| `LessonList` | Lista de aulas dentro de um módulo expandido, badges de status, reordenação |

**Padrão de reordenação:**
- Módulos: `PATCH /api/admin/modules/[id]` com `{ order: N }` — o backend reordena todos os irmãos automaticamente
- Aulas: swap manual de dois `PATCH /api/admin/lessons/[id]` em paralelo (sem lógica server-side de reordenação)

**Padrão de refetch:**
Após mutações, componentes chamam `GET /api/admin/courses/[id]` e atualizam o estado local. `ModuleList` e `LessonList` recebem `onUpdate` callback para propagar refetch ao pai.

---

## API — Padrões estabelecidos

### Route handlers
```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/admin/courses/[id]'>) {
  const auth = requireRole(request, ['admin'])
  if (auth instanceof NextResponse) return auth

  const { id } = await ctx.params

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', issues: parsed.error.issues }, { status: 400 })
  }
  // ...
}
```

### Endpoints admin implementados
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/admin/courses` | Listagem com filtros status/search, paginação |
| POST | `/api/admin/courses` | Criar curso (gera slug único) |
| GET | `/api/admin/courses/[id]` | Curso com módulos, aulas, instrutor, enrollments |
| PATCH | `/api/admin/courses/[id]` | Atualizar campos; publicar exige ≥1 módulo + ≥1 aula |
| DELETE | `/api/admin/courses/[id]` | Soft-delete (status → archived) |
| POST | `/api/admin/courses/[id]/modules` | Criar módulo (order = count + 1) |
| PATCH | `/api/admin/modules/[id]` | Atualizar módulo; reordena todos os irmãos se order mudar |
| DELETE | `/api/admin/modules/[id]` | Hard-delete com gap-closing dos irmãos |
| POST | `/api/admin/modules/[id]/lessons` | Criar aula (order = count + 1) |
| GET | `/api/admin/lessons/[id]` | Detalhes da aula |
| PATCH | `/api/admin/lessons/[id]` | Atualizar qualquer campo da aula |
| DELETE | `/api/admin/lessons/[id]` | Hard-delete (LessonProgress cascade) |
| GET | `/api/admin/users?role=instructor` | Lista instrutores para select |
| GET/PATCH/DELETE | `/api/admin/users/[id]` | Detalhe/edição/desativação de usuário |
| GET | `/api/admin/subscriptions` | Listagem de assinaturas (admin) |
| GET | `/api/admin/metrics` | Métricas para o dashboard admin |
| POST | `/api/admin/videos/upload` | Upload de vídeo para Bunny Stream — **ver armadilha do limite de 4.5MB abaixo** |

### Endpoints públicos / área do aluno

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/courses` / `/api/courses/[slug]` | Catálogo público de cursos |
| GET/POST | `/api/enrollments/[courseId]` | Matrícula (via `ensureEnrollment`, automática conforme assinatura ativa) |
| GET/POST | `/api/progress/[lessonId]` | Progresso de aula (watch %, conclusão manual/automática em 80%) |
| GET | `/api/dashboard` | Dados do dashboard do aluno (cursos em andamento/concluídos) |
| GET/POST | `/api/certificates/[courseId]` | Geração idempotente de certificado ao concluir 100% do curso |
| GET | `/api/certificates/[courseId]/download` | Download do PDF do certificado |
| POST | `/api/subscriptions/checkout` | Cria Stripe Checkout Session |
| POST | `/api/subscriptions/portal` | Cria sessão do Stripe Customer Portal |
| POST | `/api/webhooks/stripe` | Webhook do Stripe — ver padrão abaixo |

### Padrão de controle de acesso por plano

`src/lib/access.ts` (`checkLessonAccess`) é a fonte única de verdade: aulas com `isPreview: true` são liberadas sem autenticação; `premium` acessa qualquer curso; `basic` só acessa cursos com `planAccess: basic`; assinatura não-`active` bloqueia acesso. `src/lib/enrollment.ts` (`ensureEnrollment`) usa a mesma regra para matricular automaticamente o aluno quando ele acessa um curso ao qual tem direito.

### Padrão de webhooks Stripe

Handlers em `src/lib/stripe-handlers.ts`, um por tipo de evento. **Importante:** na API version usada (`2026-05-27.dahlia`, ver `src/lib/stripe.ts`), `current_period_start`/`current_period_end` **não existem mais no nível da Subscription** — estão no `SubscriptionItem` (`subscription.items.data[0].current_period_start`). Em `invoice.payment_succeeded`/`failed`, o ID da subscription vem de `invoice.parent.subscription_details`, não de `invoice.subscription`. Mapeamento de `priceId` → plano/ciclo é feito via `buildPriceMap()` lendo as env vars `STRIPE_PRICE_ID_*`.

---

## Validação com Zod v4

O projeto usa **Zod v4** (`zod: ^4.4.3`) — a API tem breaking changes em relação ao Zod v3:
```ts
// v4 — import padrão
import { z } from 'zod'

// parse de erros mudou — usar .issues ao invés de .errors
parsed.error.issues  // ✅ v4
parsed.error.errors  // ❌ não existe em v4
```

---

## Serviços externos

| Serviço | Status | Variáveis |
|---|---|---|
| Neon PostgreSQL | ✅ Configurado | `DATABASE_URL` |
| JWT Auth | ✅ Configurado | `JWT_SECRET`, `JWT_EXPIRES_IN` |
| SMTP (Resend) | ✅ Configurado | `SMTP_*` |
| Bunny Stream | ✅ Configurado | `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_CDN_HOSTNAME` |
| Stripe | ✅ Configurado (modo teste) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_*` |

Consulte `docs/pricing/bunny-stream-pricing.md` para referência de custos do Bunny Stream.

---

## Comandos úteis

```bash
# Dev server
npx next dev --port 3000

# Type check
npx tsc --noEmit

# Migrations
npx prisma migrate dev --name nome
npx prisma generate

# Testes (apenas unitário — Playwright ainda não tem config nem specs)
npx vitest run
```

## Armadilhas conhecidas

- **Cache Turbopack:** Se trocar `proxy.ts` ↔ `middleware.ts`, deletar `.next/` e reiniciar o servidor
- **Prisma import:** `import { prisma } from '@/lib/prisma'` — nunca instanciar `PrismaClient` diretamente
- **Prisma client path:** `@/generated/prisma/client` — não `@/generated/prisma`
- **`instructorId`** em Course referencia `Instructor.id`, não `User.id`
- **Lesson order:** sem unique constraint no DB — gap-closing após delete deve ser feito no cliente
- **Slug único:** usar `getUniqueSlug()` de `@/lib/utils/slug.ts`, nunca gerar manualmente
- **Upload de vídeo trava em produção:** `POST /api/admin/videos/upload` envia o arquivo via FormData direto pelo servidor Next.js. A Vercel limita payload de Serverless Functions a 4.5MB em todos os planos — não há como configurar isso em `next.config.ts`. Qualquer vídeo de aula real vai falhar em produção. Fix planejado em `TASK-83`: migrar para upload TUS direto do navegador para o Bunny Stream (`tus-js-client`), com o servidor apenas assinando as credenciais.
- **Stripe API version `2026-05-27.dahlia`:** `current_period_start`/`end` estão em `subscription.items.data[0]`, não em `subscription` — e o ID da subscription em invoices vem de `invoice.parent.subscription_details`, não de `invoice.subscription`. Ver `src/lib/stripe-handlers.ts`.
- **Certificado em PDF:** armazenado como data URL base64 em `Certificate.fileUrl` (MVP, sem blob storage configurado). Para volume maior, migrar para Vercel Blob ou similar antes de produção.
- **Rate limiting é em memória** (`src/lib/rate-limit.ts`) — zera a cada deploy/restart e não funciona entre múltiplas instâncias. Adequado para Fase 1, mas não é distribuído.
