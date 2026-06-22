# Fase 2 — Grupos de Trabalho e Prompts de Execução

Este documento divide as 62 tasks da Fase 2 (`TASK-84` a `TASK-145`, detalhadas em `.agent/prd/PRD.md` seção 13 e em `.agent/tasks/`) em **20 grupos de trabalho**. Cada grupo foi dimensionado para ser implementado por uma única sessão de agente (ou desenvolvedor) e entregue como **um PR só**, na ordem em que as tasks devem ser feitas dentro do grupo.

Critério de agrupamento: cada grupo corresponde a uma das funcionalidades listadas na seção 13 do PRD (`.agent/prd/PRD.md`, seções 1–5 do levantamento original). Isso mantém os PRs pequenos e revisáveis, em vez de um PR gigante por sprint.

## Como usar este documento

Cada seção abaixo tem um bloco "Prompt para a IA" pronto para ser colado no início de uma sessão (Claude Code ou outro agente). O prompt é autocontido — repete o contexto necessário do projeto — então pode ser usado por um agente sem histórico da conversa que gerou as tasks.

**Regra geral para todos os grupos**: o agente abre o PR para revisão humana — **não mergeia sozinho**. Nenhum grupo deve usar `--no-verify`, force-push, ou pular hooks.

## Ordem de execução entre grupos

1. **Grupo 0 (pré-requisitos) é bloqueante** — todos os outros grupos dependem dele.
2. Depois do Grupo 0, **todos os grupos podem ser feitos em paralelo** (por agentes/desenvolvedores diferentes), com **uma exceção**: o **Grupo 7 (Programa de indicação)** depende do **Grupo 3 (Cupons de desconto)** já estar mesclado em `main`, porque a TASK-106 reaproveita o padrão de desconto via Stripe criado na TASK-90.
3. Dentro de cada grupo, as tasks devem ser feitas na ordem listada — a ordem já respeita as `dependencies` declaradas em cada `TASK-X.json`.

| # | Grupo | Tasks | Depende de | Branch sugerida |
|---|---|---|---|---|
| 0 | Pré-requisitos da Fase 2 | TASK-84 | — | (sem PR de código) |
| 1 | Trial gratuito concedido pelo admin | TASK-85 a 87 | Grupo 0 | `feat/fase2-trial-manual-admin` |
| 2 | Página pública de instrutor | TASK-88 a 89 | Grupo 0 | `feat/fase2-perfil-instrutor` |
| 3 | Cupons de desconto | TASK-90 a 91 | Grupo 0 | `feat/fase2-cupons-desconto` |
| 4 | Materiais complementares por aula | TASK-92 a 94 | Grupo 0 | `feat/fase2-materiais-aula` |
| 5 | Compra avulsa de curso | TASK-95 a 99 | Grupo 0 | `feat/fase2-compra-avulsa` |
| 6 | Upsell contextual | TASK-100 a 102 | Grupo 0 | `feat/fase2-upsell-contextual` |
| 7 | Programa de indicação | TASK-103 a 107 | Grupo 0 **e Grupo 3** | `feat/fase2-programa-indicacao` |
| 8 | Relatórios financeiros | TASK-108 a 111 | Grupo 0 | `feat/fase2-relatorios-financeiros` |
| 9 | E-mail de retomada | TASK-112 a 114 | Grupo 0 | `feat/fase2-email-retomada` |
| 10 | Notificação de cobrança falhada | TASK-115 a 116 | Grupo 0 | `feat/fase2-cobranca-falhada` |
| 11 | Avaliação de curso | TASK-117 a 120 | Grupo 0 | `feat/fase2-avaliacao-curso` |
| 12 | Streak de estudo | TASK-121 a 122 | Grupo 0 | `feat/fase2-streak-estudo` |
| 13 | Legendas/transcrição de vídeo | TASK-123 a 125 | Grupo 0 | `feat/fase2-legendas-video` |
| 14 | Quiz por módulo | TASK-126 a 130 | Grupo 0 | `feat/fase2-quiz-modulo` |
| 15 | Busca dentro do curso | TASK-131 a 132 | Grupo 0 | `feat/fase2-busca-curso` |
| 16 | Retomar do ponto exato + velocidade | TASK-133 a 136 | Grupo 0 | `feat/fase2-retomar-posicao` |
| 17 | Área própria do instrutor | TASK-137 a 139 | Grupo 0 | `feat/fase2-painel-instrutor` |
| 18 | Exportação de dados (CSV) | TASK-140 a 142 | Grupo 0 | `feat/fase2-exportacao-csv` |
| 19 | Auditoria de ações admin | TASK-143 a 145 | Grupo 0 | `feat/fase2-auditoria-admin` |

---

## Grupo 0 — Pré-requisitos da Fase 2

**Tasks**: TASK-84
**Resultado**: não gera PR de código — é configuração/verificação que desbloqueia todos os outros grupos.

### Prompt para a IA

```
Você vai executar a TASK-84 do projeto "Plataforma de Cursos" (Next.js 16 + Prisma 7 + Neon + Stripe + Bunny Stream).
Leia primeiro CLAUDE.md e AGENTS.md na raiz do repo para contexto geral, depois leia o spec completo em
.agent/tasks/TASK-84.json.

Esta task verifica os pré-requisitos da Fase 2 antes que qualquer outro grupo de trabalho comece:
1. Adicionar `CRON_SECRET=TODO_FILL_MANUALLY` ao `.env.local` (NUNCA escreva um valor real — apenas o placeholder).
2. Confirmar manualmente que "Promotion Codes" está habilitado no Stripe Dashboard (Settings → Checkout and
   Payment Links). Se não estiver, apenas reporte — não é algo que se resolve por código.
3. Fazer uma chamada de teste ao endpoint de Captions da API do Bunny Stream (usando BUNNY_STREAM_API_KEY e
   BUNNY_STREAM_LIBRARY_ID já configurados) e confirmar que a conta tem acesso a esse recurso.
4. Marcar cada step do `.agent/tasks/TASK-84.json` como `"pass": true` somente após verificar de fato, e
   atualizar a entrada correspondente em `.agent/tasks.json` para `"passes": true`.

Não abra PR para esta task — é só configuração local/verificação. Ao final, reporte um resumo de cada item:
confirmado, pendente, ou bloqueado (e por quê).
```

---

## Grupo 1 — Trial gratuito concedido pelo admin

**Tasks**: TASK-85, TASK-86, TASK-87
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Trial gratuito concedido pelo admin" da Fase 2 da Plataforma de Cursos (Next.js
16 App Router + Prisma 7 + Neon + Stripe + Bunny Stream). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de
começar — eles documentam os padrões obrigatórios do projeto (rotas, Zod v4, Prisma, etc.).

Contexto: a plataforma NÃO oferece trial gratuito para todo mundo que assina — decisão de produto explícita
para evitar abuso (criar conta nova a cada trial) e não distorcer a métrica de conversão do checkout. Em vez
disso, o admin pode conceder manualmente 7 dias de teste grátis a um usuário específico (ex: parceria,
reativação de cliente, atendimento a um caso pontual de suporte). Quando esse usuário específico assina, o
checkout aplica o trial e consome a concessão; para todos os outros, a cobrança continua imediata, como hoje.

Tasks deste grupo, na ordem (leia o spec completo de cada uma em .agent/tasks/TASK-<id>.json antes de codar):
1. TASK-85 — Admin concede trial gratuito manualmente (campo + endpoint + UI em /admin/usuarios)
2. TASK-86 — Checkout aplica o trial concedido (e o consome após o uso)
3. TASK-87 — Aviso de fim do trial por e-mail + indicação no dashboard do aluno

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- `src/app/api/subscriptions/checkout/route.ts` e `src/lib/stripe-handlers.ts` seguem a API version
  `2026-05-27.dahlia` do Stripe — `current_period_start`/`end` ficam em `subscription.items.data[0]`, não no
  nível da Subscription (ver AGENTS.md, seção de webhooks).
- `src/lib/access.ts` tem DUAS funções que checam `status !== 'active'` — `checkLessonAccess` e
  `checkCourseAccess` — as duas precisam tratar `trialing` como acesso liberado, não só a primeira.
- `PATCH /api/admin/users/[id]` já existe e já registra em `AdminAuditLog` via `logAdminAction` (ver
  `src/lib/audit.ts`) as mudanças de `role`/`isActive` — siga exatamente esse padrão para o novo campo de
  trial, em vez de criar um endpoint novo.
- `UserTable.tsx` já tem um fluxo de ação com modal de confirmação (`deactivate`/`reactivate`/`change-role`) —
  adicione a concessão/revogação de trial como uma nova `action` nesse mesmo fluxo, não um componente do zero.
- Use Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) para testar localmente o
  evento `customer.subscription.trial_will_end` da TASK-87.

Como trabalhar:
1. Crie a branch `feat/fase2-trial-manual-admin` a partir de `main` atualizada.
2. Implemente TASK-85, depois TASK-86, depois TASK-87, nessa ordem.
3. Depois de cada task, confira uma a uma as `acceptanceCriteria` do spec correspondente antes de seguir para a
   próxima.
4. Valide o código: `npx tsc --noEmit` e `npx vitest run` devem passar sem erros novos.
5. Suba o dev server (`npx next dev --port 3000`) e teste manualmente o fluxo completo: como admin, conceda o
   trial a um usuário de teste em `/admin/usuarios`; logado como esse usuário, complete o checkout e confirme
   que a assinatura entra como `trialing` sem cobrança imediata; confirme o badge de trial em
   `/dashboard/assinatura`; confirme que a concessão foi consumida (cancele e assine de novo com o mesmo
   usuário — NÃO deve ganhar trial automaticamente na segunda vez). Confirme também que um usuário sem a
   concessão continua sendo cobrado imediatamente, como hoje, e que `/planos` não menciona trial.
6. Marque `"pass": true` em cada step dos três JSONs de task e `"passes": true` nas entradas correspondentes de
   `.agent/tasks.json`, só depois de validar de fato.
7. Commit(s) com mensagens claras (uma por task ou um commit único para o grupo, seguindo o estilo dos commits
   existentes no repositório — confira `git log` para o padrão).
8. Abra um PR para `main` com `gh pr create`. Título: "feat: trial gratuito concedido manualmente pelo admin
   (TASK-85 a 87)". Na descrição, liste as 3 tasks concluídas, o que foi testado manualmente, e link para a
   seção 13.1 do PRD (`.agent/prd/PRD.md`). Não faça merge — deixe para revisão humana.

Definition of Done: as acceptanceCriteria de TASK-85, 86 e 87 atendidas e marcadas; tsc e vitest passando;
fluxo concessão → checkout → consumo do trial testado manualmente; PR aberto.
```

---

## Grupo 2 — Página pública de instrutor

**Tasks**: TASK-88, TASK-89
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Página pública de instrutor" da Fase 2 da Plataforma de Cursos (Next.js 16 App
Router + Prisma 7 + Neon). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: o model `Instructor` já tem um campo `slug` único no banco, mas nunca foi usado — não existe nenhuma
rota pública de perfil de instrutor. Este grupo cria essa página e linka o nome do instrutor a ela nas telas
de curso.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-88 — Rota pública /instrutores/[slug]
2. TASK-89 — Linkar instrutor nas páginas de curso

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- `params` é uma Promise em page components no Next.js 16 (`const { slug } = await params`) — ver AGENTS.md.
- Use `notFound()` do Next.js para slug inexistente, não um redirect manual.
- Reaproveite o card de curso já usado em `/cursos` em vez de criar um novo componente do zero.

Como trabalhar:
1. Crie a branch `feat/fase2-perfil-instrutor` a partir de `main` atualizada.
2. Implemente TASK-88 primeiro (a página em si), depois TASK-89 (os links a partir de outras páginas).
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` sem erros novos.
5. Suba o dev server e verifique manualmente no navegador: acessar /instrutores/<slug-real-do-seed>, confirmar
   bio/foto/lista de cursos publicados, e confirmar 404 para um slug inexistente. Confirme também que o nome do
   instrutor em /cursos/[slug] agora é um link funcional.
6. Marque `"pass": true` nos steps dos dois JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: página pública de perfil de instrutor (TASK-88 a
   89)". Descrição com o que foi testado e link para a seção 13.4 do PRD.

Definition of Done: acceptanceCriteria de TASK-88 e 89 atendidas e marcadas; tsc passando; testado no navegador;
PR aberto.
```

---

## Grupo 3 — Cupons de desconto

**Tasks**: TASK-90, TASK-91
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Cupons de desconto" da Fase 2 da Plataforma de Cursos. Leia CLAUDE.md e
AGENTS.md na raiz do repo antes de começar.

Contexto: hoje não há nenhuma forma de aplicar desconto no checkout. Este grupo habilita o campo nativo de
cupom do Stripe Checkout — é uma mudança pequena, mas é pré-requisito de outro grupo (Programa de indicação),
então deve ser mesclada antes daquele.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-90 — Habilitar allow_promotion_codes no Checkout
2. TASK-91 — Documentar processo de criação de cupons (docs/wiki/cupons-stripe.md)

Dependências externas: nenhuma — pode começar imediatamente. IMPORTANTE: o grupo "Programa de indicação"
depende deste aqui — avise se notar que ele já foi iniciado em paralelo, para evitar conflito de merge em
`src/app/api/subscriptions/checkout/route.ts`.

Como trabalhar:
1. Crie a branch `feat/fase2-cupons-desconto` a partir de `main` atualizada.
2. Implemente TASK-90: adicione `allow_promotion_codes: true` à criação da Checkout Session em
   `src/app/api/subscriptions/checkout/route.ts`.
3. Crie um cupom de teste no Stripe Dashboard (modo teste) e valide manualmente o fluxo completo de checkout
   com o código aplicado — descreva o teste no PR.
4. Implemente TASK-91: escreva `docs/wiki/cupons-stripe.md` com o passo a passo de criação de Coupon + Promotion
   Code, e onde ver relatórios de uso no Stripe Dashboard.
5. Valide: `npx tsc --noEmit` sem erros novos.
6. Marque `"pass": true` nos steps dos dois JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: habilitar cupons de desconto no checkout (TASK-90 a
   91)". Descrição com o teste manual feito e link para a seção 13.1 do PRD.

Definition of Done: acceptanceCriteria de TASK-90 e 91 atendidas e marcadas; teste manual de cupom documentado
no PR; PR aberto.
```

---

## Grupo 4 — Materiais complementares por aula

**Tasks**: TASK-92, TASK-93, TASK-94
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Materiais complementares por aula" da Fase 2 da Plataforma de Cursos (Next.js 16
+ Prisma 7). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: aulas não têm hoje nenhuma forma de anexar materiais de apoio (slides, exercícios, código-fonte).
Este grupo adiciona uma lista simples de links com rótulo por aula.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-92 — Campo attachments em Lesson (schema + migration)
2. TASK-93 — Editor de anexos no LessonEditor (admin)
3. TASK-94 — Exibir anexos na página da aula (aluno)

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- Migration: `npx prisma migrate dev --name add_lesson_attachments`, depois `npx prisma generate`.
- `LessonEditor` é um formulário admin — use inputs nativos estilizados com Tailwind, NÃO `lui-input` (o
  shadow DOM do design system é incompatível com formulários de validação — ver AGENTS.md).
- Valide o novo campo no schema Zod do `PATCH /api/admin/lessons/[id]` (array de `{ label, url }`).

Como trabalhar:
1. Crie a branch `feat/fase2-materiais-aula` a partir de `main` atualizada.
2. Implemente TASK-92, depois TASK-93, depois TASK-94, nessa ordem.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Suba o dev server e teste manualmente: no admin, adicione 2 anexos a uma aula e salve; depois, como aluno,
   acesse a página da aula e confirme que os links aparecem e abrem em nova aba. Teste também uma aula sem
   anexos (a seção não deve aparecer).
6. Marque `"pass": true` nos steps dos três JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: materiais complementares por aula (TASK-92 a 94)".
   Descrição com o que foi testado e link para a seção 13.4 do PRD.

Definition of Done: acceptanceCriteria de TASK-92, 93 e 94 atendidas e marcadas; migration aplicada; testado no
navegador (admin e aluno); PR aberto.
```

---

## Grupo 5 — Compra avulsa de curso

**Tasks**: TASK-95, TASK-96, TASK-97, TASK-98, TASK-99
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Compra avulsa de curso" da Fase 2 da Plataforma de Cursos (Next.js 16 + Prisma 7
+ Stripe). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: hoje o único caminho de acesso a conteúdo é assinatura recorrente. Este grupo permite que um curso
específico seja vendido em pagamento único (sem assinatura), criando matrícula direta via webhook.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-95 — Campos de compra avulsa em Course (schema + migration)
2. TASK-96 — POST /api/courses/[slug]/purchase (Checkout Session mode=payment)
3. TASK-97 — Webhook de compra avulsa cria enrollment direto
4. TASK-98 — CTA "Comprar este curso" na página de detalhe
5. TASK-99 — Acesso reconhece compra avulsa (checkLessonAccess/ensureEnrollment)

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- `src/lib/stripe-handlers.ts` já trata `checkout.session.completed` para `mode: 'subscription'` — a TASK-97
  precisa ramificar por `session.mode` sem quebrar o fluxo de assinatura existente.
- Webhooks do Stripe podem ser reentregues — use `upsert`, nunca `create` puro, ao criar o `CourseEnrollment`.
- `checkLessonAccess` está em `src/lib/access.ts` — a TASK-99 deve checar enrollment direto ANTES de checar
  plano/assinatura.
- Teste o webhook localmente com `stripe listen --forward-to localhost:3000/api/webhooks/stripe` e
  `stripe trigger checkout.session.completed`.

Como trabalhar:
1. Crie a branch `feat/fase2-compra-avulsa` a partir de `main` atualizada.
2. Implemente as 5 tasks na ordem listada — TASK-99 depende do enrollment já estar sendo criado pela TASK-97.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente o fluxo completo: configure um curso de teste com `allowOneTimePurchase: true`, complete a
   compra com o Stripe CLI/cartão de teste, confirme o enrollment criado e o acesso ao conteúdo sem assinatura
   ativa.
6. Marque `"pass": true` nos steps dos cinco JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: compra avulsa de curso via Stripe (TASK-95 a 99)".
   Descrição detalhando o teste end-to-end feito e link para a seção 13.1 do PRD.

Definition of Done: acceptanceCriteria de TASK-95 a 99 atendidas e marcadas; fluxo de compra avulsa testado de
ponta a ponta (checkout → webhook → acesso liberado); PR aberto.
```

---

## Grupo 6 — Upsell contextual

**Tasks**: TASK-100, TASK-101, TASK-102
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Upsell contextual" da Fase 2 da Plataforma de Cursos (Next.js 16 + Prisma 7).
Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: o componente `UpgradePrompt` já existe e aparece quando um aluno Básico tenta acessar conteúdo
Premium, mas hoje essa exibição não é registrada em nenhum lugar. Este grupo registra o evento e dispara um
e-mail automático de upsell para quem viu o prompt repetidamente sem converter.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-100 — Tabela UpgradePromptEvent (schema + migration)
2. TASK-101 — Registrar evento ao exibir UpgradePrompt
3. TASK-102 — E-mail automático de upsell (endpoint de cron protegido por CRON_SECRET)

Dependências externas: nenhuma — pode começar imediatamente (TASK-84 já deve ter deixado `CRON_SECRET` no
`.env.local`).

Atenção a padrões do projeto:
- `src/components/course/UpgradePrompt.tsx` é client component — dispare a chamada de registro em `useEffect`
  com guarda (`useRef`) para não duplicar em re-renders.
- O endpoint de cron deve validar `Authorization: Bearer ${CRON_SECRET}` e retornar 401 sem ele, igual ao
  padrão que será usado no Grupo 9 (E-mail de retomada) — não precisa coordenar com aquele grupo, mas mantenha
  o mesmo padrão de proteção.
- Configure o cron em `vercel.ts` (schedule mensal, `0 9 1 * *`) — não precisa rodar em produção agora, só
  deixar configurado.

Como trabalhar:
1. Crie a branch `feat/fase2-upsell-contextual` a partir de `main` atualizada.
2. Implemente as 3 tasks na ordem listada.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: acesse uma aula fora do plano como aluno Básico, confirme que o evento foi gravado no
   banco; chame o endpoint de cron manualmente com o `CRON_SECRET` correto e confirme que o e-mail é
   disparado (verifique no log/Ethereal, conforme `src/lib/email.ts`) apenas para eventos com mais de 3 dias.
6. Marque `"pass": true` nos steps dos três JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: upsell contextual com e-mail automático (TASK-100 a
   102)". Descrição com o teste manual e link para a seção 13.1 do PRD.

Definition of Done: acceptanceCriteria de TASK-100, 101 e 102 atendidas e marcadas; endpoint de cron testado
manualmente; PR aberto.
```

---

## Grupo 7 — Programa de indicação

**Tasks**: TASK-103, TASK-104, TASK-105, TASK-106, TASK-107
**Depende de**: Grupo 0 **e Grupo 3 (Cupons de desconto) já mesclado em `main`**

### Prompt para a IA

```
Você vai implementar o grupo "Programa de indicação" da Fase 2 da Plataforma de Cursos (Next.js 16 + Prisma 7
+ Stripe). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

PRÉ-REQUISITO OBRIGATÓRIO: confirme que o grupo "Cupons de desconto" (TASK-90/91) já está mesclado em `main`
antes de começar — a TASK-106 deste grupo depende do padrão de desconto via Stripe criado naquele grupo. Se
não estiver mesclado, pare e avise, não implemente por cima de uma branch não mesclada.

Contexto: este grupo cria um programa de indicação simples (1 nível): cada aluno tem um código único; quem se
cadastra com esse código ganha desconto na primeira assinatura; quem indicou ganha um crédito quando o
indicado assina.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-103 — Tabela ReferralCode (schema + migration)
2. TASK-104 — Gerar código de indicação único por aluno
3. TASK-105 — Exibir código de indicação no perfil
4. TASK-106 — Aplicar cupom ao indicado via ?ref= (precisa de um Coupon fixo criado manualmente no Stripe
   Dashboard — crie um cupom de teste e documente o ID em `STRIPE_COUPON_ID_REFERRAL` no `.env.local`, placeholder)
5. TASK-107 — Crédito ao indicador via Stripe balance transaction

Dependências externas: Grupo 3 (Cupons de desconto) mesclado — ver acima.

Atenção a padrões do projeto:
- TASK-106: Stripe NÃO permite `allow_promotion_codes: true` e `discounts` na mesma Checkout Session — escolha
  um dos dois por sessão, dependendo se há `referralCode` válido no request.
- TASK-107 usa `stripe.customers.createBalanceTransaction` — é uma operação financeira real mesmo em modo
  teste; valide cuidadosamente antes de considerar a task pronta, e não rode contra customers de produção.
- Webhooks: siga o padrão de `src/lib/stripe-handlers.ts` (API version `2026-05-27.dahlia`, ver AGENTS.md).

Como trabalhar:
1. Confirme o pré-requisito (Grupo 3 mesclado) antes de criar a branch.
2. Crie a branch `feat/fase2-programa-indicacao` a partir de `main` atualizada (já incluindo o Grupo 3).
3. Implemente as 5 tasks na ordem listada.
4. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
5. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
6. Teste manualmente o fluxo completo com contas e cupom de teste do Stripe: gerar código, acessar
   `/planos?ref=CODIGO` com outro usuário, completar o checkout com desconto aplicado, e confirmar o crédito
   no Stripe Customer do indicador.
7. Marque `"pass": true` nos steps dos cinco JSONs de task e `"passes": true` em `.agent/tasks.json`.
8. Commit(s) e abra PR com `gh pr create`. Título: "feat: programa de indicação com crédito automático
   (TASK-103 a 107)". Descrição com o teste end-to-end e link para a seção 13.1 do PRD.

Definition of Done: acceptanceCriteria de TASK-103 a 107 atendidas e marcadas; fluxo de indicação testado de
ponta a ponta em modo teste do Stripe; PR aberto.
```

---

## Grupo 8 — Relatórios financeiros

**Tasks**: TASK-108, TASK-109, TASK-110, TASK-111
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Relatórios financeiros" da Fase 2 da Plataforma de Cursos (Next.js 16 + Prisma
7). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: `GET /api/admin/metrics` hoje só retorna contagens simples (alunos, assinaturas, cursos). Este grupo
adiciona MRR, churn mensal e LTV médio por plano, exibidos no AdminDashboard.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-108 — Calcular MRR em /api/admin/metrics
2. TASK-109 — Calcular churn mensal
3. TASK-110 — Calcular LTV médio por plano
4. TASK-111 — Exibir MRR/churn/LTV no AdminDashboard

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- `src/app/api/admin/metrics/route.ts` já existe — estenda, não recrie.
- O cálculo de churn/LTV é uma aproximação histórica (não há tabela de snapshot mensal) — isso já está
  documentado como limitação conhecida na seção 13.1 do PRD, não precisa resolver isso de forma mais robusta
  nesta rodada.
- Trate divisão por zero em todos os três cálculos (planos/períodos sem dados).

Como trabalhar:
1. Crie a branch `feat/fase2-relatorios-financeiros` a partir de `main` atualizada.
2. Implemente as 4 tasks na ordem listada.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: acesse `/admin` como admin e confirme que os 3 novos cards aparecem com valores
   plausíveis (compare manualmente com os dados de assinatura existentes no seed, se necessário).
6. Marque `"pass": true` nos steps dos quatro JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: métricas de MRR, churn e LTV no admin (TASK-108 a
   111)". Descrição com os valores conferidos manualmente e link para a seção 13.1 do PRD.

Definition of Done: acceptanceCriteria de TASK-108 a 111 atendidas e marcadas; valores conferidos manualmente
contra os dados existentes; PR aberto.
```

---

## Grupo 9 — E-mail de retomada

**Tasks**: TASK-112, TASK-113, TASK-114
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "E-mail de retomada" da Fase 2 da Plataforma de Cursos (Next.js 16 + Prisma 7).
Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: alunos que pararam de assistir um curso incompleto não recebem nenhum lembrete. Este grupo identifica
esses alunos mensalmente e envia um e-mail convidando a retomar o curso.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-112 — Identificar alunos inativos com curso incompleto
2. TASK-113 — Template de e-mail "continue de onde parou"
3. TASK-114 — Endpoint de cron protegido por CRON_SECRET (cria a tabela EmailLog de controle de envio)

Dependências externas: nenhuma — pode começar imediatamente (TASK-84 já deve ter deixado `CRON_SECRET` no
`.env.local`).

Atenção a padrões do projeto:
- Siga o padrão de templates já existentes em `src/lib/email-templates.ts` (boas-vindas, recuperação de
  senha) para manter consistência visual.
- O endpoint de cron deve validar `Authorization: Bearer ${CRON_SECRET}` e retornar 401 sem ele.
- Configure o cron em `vercel.ts` com schedule mensal (`0 9 1 * *`).

Como trabalhar:
1. Crie a branch `feat/fase2-email-retomada` a partir de `main` atualizada.
2. Implemente as 3 tasks na ordem listada.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: crie um progresso de aula com `lastWatchedAt` antigo (>7 dias) em um curso incompleto via
   seed/SQL de teste, chame o endpoint de cron com o `CRON_SECRET` correto, e confirme que o e-mail é
   disparado uma única vez (rodar o endpoint duas vezes não deve duplicar o envio).
6. Marque `"pass": true` nos steps dos três JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: e-mail de retomada para alunos inativos (TASK-112 a
   114)". Descrição com o teste de não-duplicidade e link para a seção 13.2 do PRD.

Definition of Done: acceptanceCriteria de TASK-112 a 114 atendidas e marcadas; teste de não-duplicidade de
envio confirmado; PR aberto.
```

---

## Grupo 10 — Notificação de cobrança falhada

**Tasks**: TASK-115, TASK-116
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Notificação de cobrança falhada" da Fase 2 da Plataforma de Cursos (Next.js 16 +
Stripe). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: hoje, quando uma cobrança falha, a assinatura é marcada `past_due` silenciosamente — o aluno só
descobre ao perder acesso ao conteúdo. Este grupo avisa por e-mail no momento da falha.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-115 — E-mail de cobrança falhada (editar handleInvoicePaymentFailed)
2. TASK-116 — Template de e-mail de cobrança falhada

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- `handleInvoicePaymentFailed` já existe em `src/lib/stripe-handlers.ts` — apenas adicione o disparo de
  e-mail, sem alterar a lógica de marcação `past_due` já existente.
- Envolva o envio de e-mail em try/catch com log, sem interromper o processamento do webhook — siga o mesmo
  padrão usado no e-mail de boas-vindas (`handleCheckoutSessionCompleted`).
- O link do e-mail deve apontar para o Stripe Customer Portal, igual ao gerado por
  `POST /api/subscriptions/portal`.

Como trabalhar:
1. Crie a branch `feat/fase2-cobranca-falhada` a partir de `main` atualizada.
2. Implemente TASK-116 (template) e depois TASK-115 (integração no handler) — ou na ordem inversa, tanto faz,
   mas teste os dois juntos antes de finalizar.
3. Confira as acceptanceCriteria de cada task.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente com Stripe CLI: `stripe trigger invoice.payment_failed` e confirme o e-mail disparado
   (verifique no log/Ethereal) com o link do portal correto.
6. Marque `"pass": true` nos steps dos dois JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: e-mail de aviso em cobrança falhada (TASK-115 a
   116)". Descrição com o teste via Stripe CLI e link para a seção 13.2 do PRD.

Definition of Done: acceptanceCriteria de TASK-115 e 116 atendidas e marcadas; testado via `stripe trigger`;
PR aberto.
```

---

## Grupo 11 — Avaliação de curso

**Tasks**: TASK-117, TASK-118, TASK-119, TASK-120
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Avaliação de curso" da Fase 2 da Plataforma de Cursos (Next.js 16 + Prisma 7).
Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: não há hoje nenhuma forma de prova social no catálogo. Este grupo permite que o aluno avalie (nota
1-5 + comentário opcional) um curso que já concluiu, e exibe essa avaliação na página do curso.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-117 — Tabela CourseReview (schema + migration)
2. TASK-118 — POST/GET /api/courses/[slug]/reviews
3. TASK-119 — Modal de avaliação ao concluir curso (dashboard)
4. TASK-120 — Exibir nota média e reviews na página do curso

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- O `POST` só deve ser aceito se `CourseEnrollment.completedAt` estiver preenchido para aquele curso/usuário —
  reaproveite a lógica já usada em `checkCourseCompletion` (`src/lib/progress.ts`) para entender quando isso
  acontece.
- Use upsert por `userId_courseId` (reenviar atualiza, não duplica).
- TASK-119 é client component (modal no dashboard) — cuidado para não reabrir o modal repetidamente; controle
  isso checando se já existe `CourseReview` do usuário para aquele curso.

Como trabalhar:
1. Crie a branch `feat/fase2-avaliacao-curso` a partir de `main` atualizada.
2. Implemente as 4 tasks na ordem listada.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: conclua um curso de teste como aluno, confirme que o modal aparece no dashboard, envie
   uma avaliação, confirme que ela aparece na página do curso com a nota média atualizada, e confirme que o
   modal não reaparece depois de enviado.
6. Marque `"pass": true` nos steps dos quatro JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: avaliação de curso pelo aluno (TASK-117 a 120)".
   Descrição com o fluxo testado e link para a seção 13.2 do PRD.

Definition of Done: acceptanceCriteria de TASK-117 a 120 atendidas e marcadas; fluxo completo testado no
navegador; PR aberto.
```

---

## Grupo 12 — Streak de estudo

**Tasks**: TASK-121, TASK-122
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Streak de estudo" da Fase 2 da Plataforma de Cursos (Next.js 16 + Prisma 7).
Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: este grupo calcula e exibe quantos dias consecutivos o aluno estudou, como motivador de engajamento
leve (sem entrar em gamificação pesada, que está fora de escopo).

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-121 — Calcular streak de dias consecutivos (em src/lib/progress.ts, exposto via GET /api/dashboard)
2. TASK-122 — Indicador de streak no dashboard

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- A função deve agrupar `LessonProgress.lastWatchedAt` por dia para o usuário — cuidado com fuso horário ao
  comparar datas (Postgres armazena em UTC).
- O indicador só deve aparecer quando `studyStreak >= 2` (streak de 0 ou 1 não é motivador, conforme decisão
  já registrada na task).

Como trabalhar:
1. Crie a branch `feat/fase2-streak-estudo` a partir de `main` atualizada.
2. Implemente TASK-121, depois TASK-122.
3. Confira as acceptanceCriteria de cada task.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: gere progresso em dias consecutivos para um usuário de teste (via seed/SQL) e confirme
   que o streak calculado está correto; confirme também que um dia sem atividade zera o streak.
6. Marque `"pass": true` nos steps dos dois JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: streak de dias consecutivos de estudo (TASK-121 a
   122)". Descrição com o teste do cálculo e link para a seção 13.2 do PRD.

Definition of Done: acceptanceCriteria de TASK-121 e 122 atendidas e marcadas; cálculo de streak validado
manualmente com dados de teste; PR aberto.
```

---

## Grupo 13 — Legendas/transcrição de vídeo

**Tasks**: TASK-123, TASK-124, TASK-125
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Legendas/transcrição de vídeo" da Fase 2 da Plataforma de Cursos (Next.js 16 +
Bunny Stream). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: o Bunny Stream tem suporte nativo a legendas (.vtt) por vídeo, mas o projeto nunca usou esse recurso.
Este grupo permite que o admin envie uma legenda por aula.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-123 — Função uploadCaption em src/lib/bunny.ts
2. TASK-124 — Upload de legenda no LessonEditor (admin)
3. TASK-125 — Confirmar seletor de legendas no player (validação, sem código)

Dependências externas: nenhuma — pode começar imediatamente (TASK-84 já deve ter confirmado acesso à API de
Captions do Bunny Stream).

Atenção a padrões do projeto:
- Siga o padrão de erro já usado em `createVideo`/`getVideoInfo` em `src/lib/bunny.ts` ao implementar
  `uploadCaption`.
- Arquivos `.vtt` são texto puro e pequenos — não há o problema de limite de 4.5MB da Vercel que afeta o
  upload de vídeo (TASK-83, ainda pendente) — não é necessário nenhum workaround de upload aqui.
- `LessonEditor` é formulário admin — use input nativo de arquivo, não componente do design system.

Como trabalhar:
1. Crie a branch `feat/fase2-legendas-video` a partir de `main` atualizada.
2. Implemente as 3 tasks na ordem listada.
3. Confira as acceptanceCriteria de cada task.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: envie um arquivo `.vtt` de teste para uma aula com vídeo já processado no Bunny Stream e
   confirme que o controle de legenda aparece no player da aula.
6. Marque `"pass": true` nos steps dos três JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: upload de legendas via Bunny Stream Captions
   (TASK-123 a 125)". Descrição com o teste manual e link para a seção 13.3 do PRD.

Definition of Done: acceptanceCriteria de TASK-123 a 125 atendidas e marcadas; legenda testada de ponta a
ponta no player; PR aberto.
```

---

## Grupo 14 — Quiz por módulo

**Tasks**: TASK-126, TASK-127, TASK-128, TASK-129, TASK-130
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Quiz por módulo" da Fase 2 da Plataforma de Cursos (Next.js 16 + Prisma 7). Este
é o grupo de maior complexidade da Fase 2 — leia CLAUDE.md e AGENTS.md na raiz do repo com atenção antes de
começar.

Contexto: hoje a conclusão de curso depende só de assistir 100% das aulas. Este grupo adiciona quizzes
opcionais por módulo; quando um módulo tem quiz, a aprovação (nota mínima 70%) passa a ser pré-requisito do
certificado.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-126 — Tabelas Quiz, QuizQuestion, QuizAttempt (schema + migration)
2. TASK-127 — Editor admin de quiz por módulo
3. TASK-128 — POST /api/modules/[id]/quiz/attempt (cálculo de nota)
4. TASK-129 — Tela de quiz para o aluno
5. TASK-130 — Certificado exige quiz aprovado (editar checkCourseCompletion)

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- TASK-130 edita `checkCourseCompletion` em `src/lib/progress.ts`, que hoje só olha para `LessonProgress`. A
  mudança precisa ser retroativamente segura: cursos cujos módulos NÃO têm quiz devem continuar funcionando
  exatamente como antes — só bloqueie a geração de certificado quando existir `Quiz` para o módulo E não
  houver `QuizAttempt` aprovado.
- Múltiplas tentativas de quiz são permitidas (sem unique constraint em `QuizAttempt`) — a melhor nota deve
  prevalecer nas consultas de status de aprovação.
- `QuizEditor` (admin) é formulário com validação — use inputs nativos, não `lui-input`.
- TASK-128 precisa reaproveitar a verificação de acesso ao curso (mesma lógica de `checkLessonAccess`) antes de
  aceitar uma tentativa.

Como trabalhar:
1. Crie a branch `feat/fase2-quiz-modulo` a partir de `main` atualizada.
2. Implemente as 5 tasks na ordem listada — não pule para TASK-130 antes de TASK-128 estar funcionando, já que
   ela depende do cálculo de aprovação.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente dois cenários: (a) um curso com módulo SEM quiz continua gerando certificado normalmente
   ao concluir 100% das aulas; (b) um curso com módulo COM quiz só gera certificado depois do quiz ser
   aprovado, mesmo com 100% das aulas concluídas. Teste também a reprovação (nota < 70%) e o refazer do quiz.
6. Marque `"pass": true` nos steps dos cinco JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: quiz por módulo como pré-requisito de certificado
   (TASK-126 a 130)". Descrição com os dois cenários testados (com e sem quiz) e link para a seção 13.3 do PRD.

Definition of Done: acceptanceCriteria de TASK-126 a 130 atendidas e marcadas; os dois cenários de regressão
(com e sem quiz) testados manualmente; PR aberto.
```

---

## Grupo 15 — Busca dentro do curso

**Tasks**: TASK-131, TASK-132
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Busca dentro do curso" da Fase 2 da Plataforma de Cursos (Next.js 16 + Prisma
7). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: cursos longos não têm hoje nenhuma forma de busca por conteúdo. Este grupo adiciona uma busca
textual simples (título/descrição/conteúdo das aulas) na sidebar do curso.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-131 — GET /api/courses/[slug]/search?q=
2. TASK-132 — Campo de busca na CourseSidebar com snippet destacado

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- Use `contains` (case-insensitive) do Prisma — não introduza Elasticsearch/tsvector, está fora de escopo
  desta task (documentado na seção 13.3 do PRD).
- O resultado da busca deve respeitar a mesma regra de acesso de `checkLessonAccess`/plano do curso — não
  exponha conteúdo de aulas que o usuário não teria permissão de ver.
- TASK-132 é client component — implemente debounce de 300ms antes de chamar o endpoint.

Como trabalhar:
1. Crie a branch `feat/fase2-busca-curso` a partir de `main` atualizada.
2. Implemente TASK-131, depois TASK-132.
3. Confira as acceptanceCriteria de cada task.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: busque um termo presente em uma aula específica e confirme o snippet e o link corretos;
   confirme também que, como aluno sem acesso a um módulo Premium, a busca não retorna resultados daquele
   módulo.
6. Marque `"pass": true` nos steps dos dois JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: busca textual dentro do curso (TASK-131 a 132)".
   Descrição com o teste de respeito ao controle de acesso e link para a seção 13.3 do PRD.

Definition of Done: acceptanceCriteria de TASK-131 e 132 atendidas e marcadas; controle de acesso na busca
validado manualmente; PR aberto.
```

---

## Grupo 16 — Retomar do ponto exato + velocidade

**Tasks**: TASK-133, TASK-134, TASK-135, TASK-136
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Retomar do ponto exato + velocidade" da Fase 2 da Plataforma de Cursos (Next.js
16 + Prisma 7 + Bunny Stream). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: hoje o progresso é só percentual (`watchPercentage`) — o player sempre recomeça do início. Este
grupo guarda a posição exata em segundos e faz o player retomar dali; também investiga se o controle de
velocidade de reprodução já existe nativamente no player.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-133 — Campo lastPositionSeconds em LessonProgress (schema + migration)
2. TASK-134 — PATCH /api/progress/[lessonId] salva posição exata
3. TASK-135 — Player retoma do ponto salvo
4. TASK-136 — Controle de velocidade de reprodução (validação — pode não exigir código)

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- `POST /api/progress/[lessonId]` já existe — apenas estenda o schema Zod para aceitar `positionSeconds`
  opcional, sem alterar o comportamento existente de `watchPercentage`/`isCompleted`.
- TASK-136: teste primeiro se o player embed atual (`getEmbedUrl` em `src/lib/bunny.ts`) já expõe controle de
  velocidade no menu nativo do Bunny Stream antes de assumir que é preciso trocar a implementação do player —
  é provável que já exista nativamente. Se não existir, documente como gap técnico no PRD em vez de tentar
  resolver trocando para Player.js nesta task.

Como trabalhar:
1. Crie a branch `feat/fase2-retomar-posicao` a partir de `main` atualizada.
2. Implemente as 4 tasks na ordem listada.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: assista parte de uma aula, saia, volte, e confirme que o player retoma no segundo
   correto (não do início, nem 100% do início do zero). Teste também o menu do player para velocidade.
6. Marque `"pass": true` nos steps dos quatro JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: retomar aula do ponto exato (TASK-133 a 136)".
   Descrição com o teste manual e, se aplicável, o gap técnico documentado para velocidade. Link para a seção
   13.3 do PRD.

Definition of Done: acceptanceCriteria de TASK-133 a 136 atendidas e marcadas (ou gap documentado para
TASK-136, conforme o resultado do teste); retomada testada manualmente; PR aberto.
```

---

## Grupo 17 — Área própria do instrutor

**Tasks**: TASK-137, TASK-138, TASK-139
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Área própria do instrutor" da Fase 2 da Plataforma de Cursos (Next.js 16 +
Prisma 7). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: hoje só o admin tem painel — instrutores não veem métricas dos próprios cursos. Este grupo cria uma
área `/instrutor` somente leitura (listagem de cursos próprios, matrículas, taxa de conclusão). Edição de
conteúdo continua restrita ao admin nesta versão — não implemente edição aqui.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-137 — Layout /instrutor com verificação de role
2. TASK-138 — GET /api/instructor/courses e métricas
3. TASK-139 — Dashboard do instrutor

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- Siga o padrão de `src/app/admin/layout.tsx` para a verificação de role no servidor, mas permitindo
  `role === 'instructor' || role === 'admin'`.
- Adicione `/instrutor/:path*` ao matcher de `src/proxy.ts` (igual já existe para `/admin/:path*`).
- O instrutor só deve ver cursos cujo `instructorId` corresponde ao `Instructor` do próprio usuário — nunca
  cursos de outros instrutores.

Como trabalhar:
1. Crie a branch `feat/fase2-painel-instrutor` a partir de `main` atualizada.
2. Implemente as 3 tasks na ordem listada.
3. Confira as acceptanceCriteria de cada task.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: logue como instrutor de teste e confirme que só vê os próprios cursos com métricas
   corretas; confirme que um aluno tentando acessar `/instrutor` é bloqueado.
6. Marque `"pass": true` nos steps dos três JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: painel somente leitura do instrutor (TASK-137 a
   139)". Descrição com o teste de isolamento entre instrutores e link para a seção 13.4 do PRD.

Definition of Done: acceptanceCriteria de TASK-137 a 139 atendidas e marcadas; isolamento entre instrutores e
bloqueio de outros roles testados manualmente; PR aberto.
```

---

## Grupo 18 — Exportação de dados (CSV)

**Tasks**: TASK-140, TASK-141, TASK-142
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Exportação de dados (CSV)" da Fase 2 da Plataforma de Cursos (Next.js 16 +
Prisma 7). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: as listagens de assinaturas e usuários no admin não têm exportação. Este grupo adiciona exportação
em CSV para reconciliação financeira e campanhas.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-140 — GET /api/admin/subscriptions/export
2. TASK-141 — GET /api/admin/users/export
3. TASK-142 — Botão "Exportar CSV" em SubscriptionTable e UserTable

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- Reaproveite exatamente a mesma query/filtros de `GET /api/admin/subscriptions` e `GET /api/admin/users` —
  não crie uma lógica de filtro paralela que possa divergir.
- Escape corretamente vírgulas e aspas ao gerar o CSV (campos de texto livre como nome podem conter vírgula).
- Use os headers `Content-Type: text/csv` e `Content-Disposition: attachment` para forçar o download.

Como trabalhar:
1. Crie a branch `feat/fase2-exportacao-csv` a partir de `main` atualizada.
2. Implemente TASK-140, depois TASK-141, depois TASK-142.
3. Confira as acceptanceCriteria de cada task.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: exporte CSV de assinaturas e de usuários com e sem filtros aplicados, abra o arquivo e
   confirme que os dados e o escape de campos com vírgula estão corretos.
6. Marque `"pass": true` nos steps dos três JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: exportação CSV de assinaturas e usuários (TASK-140 a
   142)". Descrição com o teste manual dos arquivos exportados e link para a seção 13.4 do PRD.

Definition of Done: acceptanceCriteria de TASK-140 a 142 atendidas e marcadas; CSVs exportados e validados
manualmente (incluindo caracteres especiais); PR aberto.
```

---

## Grupo 19 — Auditoria de ações admin

**Tasks**: TASK-143, TASK-144, TASK-145
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Auditoria de ações admin" da Fase 2 da Plataforma de Cursos (Next.js 16 +
Prisma 7). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: não há hoje nenhum registro de quem alterou o quê no painel admin (ex: quem despublicou um curso,
quem alterou o role de um usuário). Este grupo adiciona um log de auditoria para as mutações mais sensíveis.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-143 — Tabela AdminAuditLog (schema + migration)
2. TASK-144 — Helper logAdminAction integrado às mutações sensíveis
3. TASK-145 — Tela /admin/auditoria

Dependências externas: nenhuma — pode começar imediatamente.

Atenção a padrões do projeto:
- O log deve ser best-effort: se a gravação do log falhar, a operação principal (ex: publicar curso, alterar
  role) NÃO deve ser interrompida — envolva em try/catch com log de erro, sem propagar a exceção.
- Integre apenas nos dois pontos descritos na task: mudança de `status` em `PATCH /api/admin/courses/[id]` e
  mudança de `role`/`isActive` em `PATCH /api/admin/users/[id]` — não instrumente todos os endpoints admin
  nesta rodada.
- Adicione o item "Auditoria" em `AdminSidebar`, seguindo o padrão visual dos itens existentes.

Como trabalhar:
1. Crie a branch `feat/fase2-auditoria-admin` a partir de `main` atualizada.
2. Implemente as 3 tasks na ordem listada.
3. Confira as acceptanceCriteria de cada task.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: publique/arquive um curso e altere o role de um usuário de teste; confirme que ambas as
   ações aparecem em `/admin/auditoria` com autor, ação, entidade e data corretos; teste os filtros por tipo de
   ação e intervalo de data.
6. Marque `"pass": true` nos steps dos três JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: log de auditoria de ações admin sensíveis (TASK-143
   a 145)". Descrição com o teste manual e link para a seção 13.4 do PRD.

Definition of Done: acceptanceCriteria de TASK-143 a 145 atendidas e marcadas; log testado para os dois tipos
de mutação sensível; PR aberto.
```
