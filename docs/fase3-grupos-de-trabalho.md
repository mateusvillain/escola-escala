# Fase 3 — Grupos de Trabalho e Prompts de Execução

Este documento divide as tasks **ativas** da Fase 3 (`TASK-146`, `TASK-167` a `TASK-200`, detalhadas em `.agent/prd/PRD.md` seção 14 e em `.agent/tasks/`) em **8 grupos de trabalho**. Cada grupo foi dimensionado para ser implementado por uma única sessão de agente (ou desenvolvedor) e entregue como **um PR só**, na ordem em que as tasks devem ser feitas dentro do grupo.

Critério de agrupamento: cada grupo corresponde a uma funcionalidade (ou a uma fatia coesa de uma funcionalidade maior) listada em `docs/fase3-oportunidades.md`.

> **B2B despriorizado (2026-06-21):** os 4 sub-grupos de B2B (Modelos, Membros/Acesso, Cobrança, Painel — TASK-151 a TASK-166, antigos Grupos 2 a 5) foram retirados da execução ativa. As tasks correspondentes foram movidas para `.agent/tasks/deprecated/`, e os prompts de execução ficam preservados na seção **"Grupos despriorizados — B2B"** ao final deste documento. Não é cancelamento — é decisão de priorização, pendente de validar a demanda real de clientes corporativos com o cliente do projeto (ver `.agent/prd/PRD.md` seção 14.6). Os números de grupo (2 a 5) ficam reservados para esse spec e não são reaproveitados pelos grupos ativos abaixo.

> **Boleto removido (2026-06-21):** o Grupo 1 (Boleto via Stripe, TASK-147 a TASK-150) foi removido da execução ativa. Motivo: o webhook de assinatura (`handleCheckoutSessionCompleted`) assume pagamento confirmado em `checkout.session.completed`, o que é falso para Boleto — habilitar sem o tratamento assíncrono completo concederia acesso pago antes da confirmação do pagamento (ver `.agent/prd/PRD.md` seção 14.6). O cliente optou por desabilitar Boleto direto no Stripe Dashboard em vez de implementar esse tratamento agora. As tasks foram movidas para `.agent/tasks/deprecated/`, e o prompt de execução fica preservado na seção **"Grupo despriorizado — Boleto"** ao final deste documento. O número de grupo (1) fica reservado para esse spec. O Grupo 6 (Trilhas e bundles), que reaproveitava a decisão de payment methods da TASK-147, foi ajustado para usar só cartão e não depende mais deste grupo.

## Como usar este documento

Cada seção abaixo tem um bloco "Prompt para a IA" pronto para ser colado no início de uma sessão (Claude Code ou outro agente). O prompt é autocontido — repete o contexto necessário do projeto — então pode ser usado por um agente sem histórico da conversa que gerou as tasks.

**Regra geral para todos os grupos**: o agente abre o PR para revisão humana — **não mergeia sozinho**. Nenhum grupo deve usar `--no-verify`, force-push, ou pular hooks.

## Ordem de execução entre grupos

1. **Grupo 0 (pré-requisitos) é bloqueante** — todos os outros grupos ativos dependem dele.
2. Depois do Grupo 0, todos os grupos ativos podem ser feitos em paralelo (por agentes/desenvolvedores diferentes) — não há mais dependências entre grupos ativos (o Grupo 6 dependia do Grupo 1/Boleto, mas esse acoplamento foi removido junto com a remoção do Grupo 1).
3. Dentro de cada grupo, as tasks devem ser feitas na ordem listada — a ordem já respeita as `dependencies` declaradas em cada `TASK-X.json`.
4. Os Grupos 2 a 5 (B2B) estão despriorizados e o Grupo 1 (Boleto) foi removido — ambos fora desta ordem de execução — ver "Grupos despriorizados/removidos" ao final deste documento antes de retomá-los.

| # | Grupo | Tasks | Depende de | Branch sugerida |
|---|---|---|---|---|
| 0 | Pré-requisitos da Fase 3 | TASK-146 | — | (sem PR de código) |
| 1 | ~~Boleto via Stripe~~ | TASK-147 a 150 | — | **removido** — ver seção ao final |
| 2-5 | ~~B2B — Modelos, Membros, Cobrança, Painel~~ | TASK-151 a 166 | — | **despriorizado** — ver seção ao final |
| 6 | Trilhas e bundles de cursos | TASK-167 a 173 | Grupo 0 | `feat/fase3-trilhas-bundles` |
| 7 | Conteúdo programado (drip content) | TASK-174 a 178 | Grupo 0 | `feat/fase3-conteudo-programado` |
| 8 | Testes E2E com Playwright | TASK-179 a 184 | Grupo 0 | `feat/fase3-testes-e2e` |
| 9 | Rate limiting distribuído | TASK-185 a 187 | Grupo 0 | `feat/fase3-rate-limit-redis` |
| 10 | Monitoramento de erro (Sentry) | TASK-188 a 190 | Grupo 0 | `feat/fase3-monitoramento-erro` |
| 11 | Event tracking de produto | TASK-191 a 195 | Grupo 0 | `feat/fase3-event-tracking` |
| 12 | Checkout integrado ao cadastro (Embedded Checkout) | TASK-196 a 200 | — | `feat/fase3-checkout-cadastro` |

---

## Grupo 0 — Pré-requisitos da Fase 3

**Tasks**: TASK-146
**Resultado**: não gera PR de código — é configuração/verificação que desbloqueia todos os outros grupos.

### Prompt para a IA

```
Você vai executar a TASK-146 do projeto "Plataforma de Cursos" (Next.js 16 + Prisma 7 + Neon + Stripe + Bunny
Stream). Leia primeiro CLAUDE.md e AGENTS.md na raiz do repo para contexto geral, depois leia o spec completo
em .agent/tasks/TASK-146.json e a seção 14 de .agent/prd/PRD.md.

Esta task verifica os pré-requisitos da Fase 3 antes que qualquer outro grupo de trabalho comece. Boleto foi
removido do planejamento ativo (ver `.agent/prd/PRD.md` seção 14.6) — não verificar/configurar nada relacionado
a ele:
1. Adicionar ao `.env.local` (SOMENTE placeholders, nunca valores reais): `STRIPE_PRICE_ID_B2B_SEAT_MONTHLY`,
   `STRIPE_PRICE_ID_B2B_SEAT_ANNUAL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SENTRY_DSN`,
   `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`.
2. Criar (ou confirmar que já existe) um produto B2B com dois preços recorrentes por seat (mensal e anual) no
   Stripe Dashboard, e preencher os Price IDs no `.env.local`.
3. Confirmar se a integração Upstash Redis foi adicionada ao projeto via Vercel Marketplace. Se ainda não foi,
   reporte como pendente — não é algo que se resolve só por código, requer ação no dashboard da Vercel.
4. Confirmar se existe um projeto Sentry criado para a aplicação. Se ainda não existe, reporte como pendente.
5. Marcar cada step do `.agent/tasks/TASK-146.json` como `"pass": true` somente após verificar de fato, e
   atualizar a entrada correspondente em `.agent/tasks.json` para `"passes": true`.

Não abra PR para esta task — é só configuração local/verificação. Ao final, reporte um resumo de cada item:
confirmado, pendente, ou bloqueado (e por quê). Itens pendentes (ex: Upstash/Sentry ainda não provisionados)
não impedem o início dos grupos que não dependem deles — reporte isso claramente para que o trabalho em
paralelo (ex: Grupo 6) não fique bloqueado por algo que só afeta os Grupos 9 e 10.
```

---

## Grupo 6 — Trilhas e bundles de cursos

**Tasks**: TASK-167, TASK-168, TASK-169, TASK-170, TASK-171, TASK-172, TASK-173
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Trilhas e bundles de cursos" da Fase 3 da Plataforma de Cursos (Next.js 16 +
Prisma 7 + Stripe). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: a estrutura de catálogo hoje é plana — um curso por vez, sem relação entre eles. Este grupo permite
agrupar cursos relacionados em uma trilha (sequência com progressão) e, opcionalmente, vender essa trilha como
bundle em pagamento único, reaproveitando o padrão de compra avulsa individual já existente (TASK-95 a 99 da
Fase 2).

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-167 — Modelos CourseTrack e CourseTrackItem (schema + migration)
2. TASK-168 — Campos de bundle em CourseTrack (isBundle, bundlePriceOneTime, stripePriceIdBundle)
3. TASK-169 — CRUD admin de trilhas e seus cursos (com reordenação e gap-closing)
4. TASK-170 — Tela admin /admin/trilhas
5. TASK-171 — Página pública /trilhas/[slug]
6. TASK-172 — Checkout de bundle de trilha (POST /api/tracks/[slug]/purchase)
7. TASK-173 — Matrícula em lote nos cursos da trilha ao comprar o bundle (webhook)

Dependências externas: nenhuma além do Grupo 0. Boleto foi removido do planejamento da Fase 3 (ver
`.agent/prd/PRD.md` seção 14.6) — TASK-172 usa só cartão (`mode: 'payment'`, sem `payment_method_types`
customizado), e este grupo não depende mais de nenhum grupo de Boleto.

Atenção a padrões do projeto:
- Reordenação e remoção de cursos da trilha devem seguir EXATAMENTE o mesmo padrão já usado em módulos:
  `PATCH /api/admin/modules/[id]` reordena os irmãos automaticamente, `DELETE /api/admin/modules/[id]` faz
  gap-closing de `order` — replique essa lógica para `CourseTrackItem`, não invente um padrão novo.
- `TrackForm`/`TrackCourseList` (admin) devem espelhar `CourseForm`/`ModuleList` em estrutura — reaproveite os
  mesmos padrões de inputs nativos com Tailwind e de refetch pós-mutação via `onUpdate` callback.
- Publicar uma trilha exige pelo menos 2 cursos associados — valide isso no `PATCH` do endpoint, não só na UI.
- O checkout de bundle (TASK-172) é `mode: 'payment'`, igual à compra avulsa individual — só cartão, sem
  `payment_method_types` customizado (Boleto removido da Fase 3, Pix adiado — ver `docs/pix-habilitacao.md`).
- O webhook de matrícula em lote (TASK-173) deve rotear por `session.metadata.trackId` ANTES de
  `session.metadata.courseId` em `handleCheckoutSessionCompleted`, e usar `upsert` por curso (idempotente,
  reentrega de webhook não pode duplicar nem falhar).

Como trabalhar:
1. Crie a branch `feat/fase3-trilhas-bundles` a partir de `main` atualizada.
2. Implemente as 7 tasks na ordem listada.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: crie uma trilha com 3 cursos publicados existentes via `/admin/trilhas`, reordene-os,
   publique a trilha, marque como bundle com um preço de teste, acesse `/trilhas/[slug]` como aluno, compre o
   bundle em modo teste com cartão, e confirme que o webhook matricula o aluno nos 3 cursos de uma vez.
6. Marque `"pass": true` nos steps dos sete JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: trilhas e bundles de cursos (TASK-167 a 173)".
   Descrição com o fluxo de ponta a ponta testado (criação → publicação → compra → matrícula em lote) e link
   para a seção 14.1 do PRD.

Definition of Done: acceptanceCriteria de TASK-167 a 173 atendidas e marcadas; fluxo completo de trilha e
bundle testado de ponta a ponta, incluindo matrícula em lote via webhook; PR aberto.
```

---

## Grupo 7 — Conteúdo programado (drip content)

**Tasks**: TASK-174, TASK-175, TASK-176, TASK-177, TASK-178
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Conteúdo programado (drip content)" da Fase 3 da Plataforma de Cursos (Next.js
16 + Prisma 7). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: hoje, ao se matricular, o aluno tem acesso a todos os módulos de um curso de uma vez. Este grupo
permite liberar módulos em datas fixas ou X dias após a matrícula — útil para cursos em formato de
cohort/turma e para dar ritmo a cursos longos. A granularidade é por MÓDULO, não por aula individual (decisão
de escopo já registrada na seção 14.6 do PRD).

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-174 — Campos de liberação programada em Module (releaseType, releaseDate, releaseAfterDays)
2. TASK-175 — Helper isModuleReleased (src/lib/drip-content.ts)
3. TASK-176 — Aplicar a checagem em checkLessonAccess (novo AccessReason: module_not_released)
4. TASK-177 — Indicador visual de módulo bloqueado (sidebar do curso + página da aula)
5. TASK-178 — Configuração admin de liberação programada por módulo (ModuleList)

Dependências externas: nenhuma além do Grupo 0 — pode começar imediatamente.

Atenção a padrões do projeto:
- `CourseEnrollment.enrolledAt` já existe e é a referência temporal correta para `days_after_enrollment` — não
  crie um campo novo de data de início, reaproveite esse.
- `checkLessonAccess`/`checkCourseAccess` (`src/lib/access.ts`) são a fonte única de verdade — a checagem de
  liberação programada é uma camada ADICIONAL sobre o controle de acesso por plano, nunca um substituto. Um
  módulo bloqueado por liberação programada deve continuar bloqueado mesmo para quem tem assinatura ativa.
- `role === 'admin'` deve ignorar a liberação programada (útil para revisar conteúdo antes da data) — mas
  aulas `isPreview: true` continuam liberadas independentemente, igual hoje.
- O `PATCH /api/admin/modules/[id]` precisa validar com Zod que `releaseDate` é obrigatório quando
  `releaseType: 'fixed_date'` e `releaseAfterDays` quando `releaseType: 'days_after_enrollment'` — use
  `.refine()` do Zod v4 para essa validação condicional.

Como trabalhar:
1. Crie a branch `feat/fase3-conteudo-programado` a partir de `main` atualizada.
2. Implemente as 5 tasks na ordem listada — a TASK-176 depende do helper da TASK-175 estar testado.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: configure um módulo com liberação `days_after_enrollment: 5` em um curso de teste,
   matricule um aluno de teste, confirme que o módulo aparece bloqueado na sidebar com a contagem de dias
   correta, e que o acesso direto à URL da aula é bloqueado com a mensagem adequada. Ajuste manualmente
   `enrolledAt` no banco para simular o prazo já passado e confirme que o módulo libera. Repita o teste com
   `fixed_date`. Confirme que o admin continua vendo tudo, independentemente da liberação.
6. Marque `"pass": true` nos steps dos cinco JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: conteúdo programado (drip content) por módulo
   (TASK-174 a 178)". Descrição com os testes de `fixed_date` e `days_after_enrollment` e link para a seção
   14.2 do PRD.

Definition of Done: acceptanceCriteria de TASK-174 a 178 atendidas e marcadas; os dois tipos de liberação
testados manualmente (incluindo a transição de bloqueado para liberado); bypass de admin confirmado; PR
aberto.
```

---

## Grupo 8 — Testes E2E com Playwright

**Tasks**: TASK-179, TASK-180, TASK-181, TASK-182, TASK-183, TASK-184
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Testes E2E com Playwright" da Fase 3 da Plataforma de Cursos (Next.js 16 +
Prisma 7 + Stripe). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: `playwright` está instalado como devDependency desde a Fase 1, mas não existe `playwright.config.ts`
nem nenhum spec escrito. Este grupo cobre os 4 fluxos críticos da plataforma (cadastro/login, checkout de
assinatura, player/progresso, conclusão de curso e certificado) — não depende de nenhuma feature nova da Fase
3, testa fluxos que já existem desde a Fase 1/2.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-179 — Configurar playwright.config.ts
2. TASK-180 — Spec E2E do fluxo de cadastro e login
3. TASK-181 — Spec E2E do fluxo de checkout de assinatura (Stripe modo teste)
4. TASK-182 — Spec E2E do player de aula e progresso
5. TASK-183 — Spec E2E de conclusão de curso e certificado
6. TASK-184 — Script npm run test:e2e e documentação de execução

Dependências externas: nenhuma além do Grupo 0 — pode começar imediatamente e em paralelo com qualquer outro
grupo, já que não toca nenhuma feature nova.

Atenção a padrões do projeto:
- Controlar o player de vídeo real (embed Bunny Stream) via Playwright é frágil — a TASK-182 simula progresso
  chamando `POST /api/progress/[lessonId]` diretamente via `request.post` do Playwright, em vez de tentar
  manipular o player. Faça o mesmo na TASK-183 para simular conclusão de todas as aulas.
- A TASK-181 (checkout) depende do webhook do Stripe estar acessível durante o teste — documente no spec que
  requer `stripe listen --forward-to localhost:3000/api/webhooks/stripe` rodando localmente, e implemente
  polling com timeout (não um `wait` fixo) ao validar a ativação da assinatura.
- Use e-mails únicos por execução (`teste+${Date.now()}@example.com`) nos specs que criam conta, para os
  testes poderem rodar repetidamente sem colidir com dados de execuções anteriores.
- `webServer` no `playwright.config.ts` deve iniciar `npx next dev` automaticamente — não exija que o
  desenvolvedor suba o servidor manualmente antes de rodar os testes (exceto o `stripe listen`, que é externo
  ao Next.js e não pode ser automatizado pelo Playwright).

Como trabalhar:
1. Crie a branch `feat/fase3-testes-e2e` a partir de `main` atualizada.
2. Implemente TASK-179 primeiro (configuração base) e valide com um spec de smoke antes de seguir.
3. Implemente TASK-180, TASK-181, TASK-182, TASK-183 nessa ordem.
4. Implemente TASK-184 por último (script + documentação).
5. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
6. Valide: `npx tsc --noEmit` sem erros novos.
7. Rode `npx playwright test` localmente (com `stripe listen` ativo para o spec de checkout) e confirme que
   todos os specs passam. Rode pelo menos duas vezes em sequência para confirmar que não há dados de teste
   colidindo entre execuções.
8. Marque `"pass": true` nos steps dos seis JSONs de task e `"passes": true` em `.agent/tasks.json`.
9. Commit(s) e abra PR com `gh pr create`. Título: "feat: testes E2E com Playwright para fluxos críticos
   (TASK-179 a 184)". Descrição com a lista dos 4 fluxos cobertos, a dependência do `stripe listen` para o
   spec de checkout, e link para a seção 14.3 do PRD.

Definition of Done: acceptanceCriteria de TASK-179 a 184 atendidas e marcadas; `npx playwright test` passa do
início ao fim, incluindo duas execuções consecutivas sem colisão de dados; PR aberto.
```

---

## Grupo 9 — Rate limiting distribuído

**Tasks**: TASK-185, TASK-186, TASK-187
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Rate limiting distribuído" da Fase 3 da Plataforma de Cursos (Next.js 16 +
Upstash Redis). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: `src/lib/rate-limit.ts` é em memória (`Map`) — zera a cada deploy e não protege nada quando a Vercel
roda múltiplas instâncias da função serverless concorrentemente. Este grupo migra para Upstash Redis,
provisionado via Vercel Marketplace, mantendo a mesma assinatura de função para minimizar mudança nos call
sites.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-185 — Provisionar Upstash Redis via Vercel Marketplace
2. TASK-186 — Migrar rate-limit.ts de memória para Upstash Redis
3. TASK-187 — Validar rate limiting distribuído entre múltiplas instâncias

Dependências externas: TASK-146 (Grupo 0) deve ter confirmado se a integração Upstash já existe no projeto da
Vercel. Se TASK-185 reportou como pendente, esta é a task que efetivamente provisiona.

Atenção a padrões do projeto:
- `rateLimit(ip, options)` hoje é síncrona — ao migrar para Redis ela passa a ser `async`. Busque TODOS os
  call sites (rotas de login, cadastro, recuperação de senha) e adicione `await` — não deixe nenhum sem
  atualizar, ou o rate limit vai silenciosamente não funcionar (Promise não aguardada).
- Use `INCR` + `EXPIRE` (ou o comando atômico equivalente do SDK `@upstash/redis`) por chave
  `ratelimit:${ip}` — não implemente a lógica de janela manualmente em JS, deixe o TTL do Redis cuidar disso.
- `getClientIp` (mesmo arquivo) não muda — só `rateLimit` é migrada.
- Atualize os testes existentes em `src/lib/__tests__/` que cobrem `rateLimit` para `async`/`await`.

Como trabalhar:
1. Crie a branch `feat/fase3-rate-limit-redis` a partir de `main` atualizada.
2. Implemente TASK-185 (provisionamento — pode já estar feito pelo Grupo 0, confirme antes de duplicar).
3. Implemente TASK-186, atualizando todos os call sites para `await`.
4. Implemente TASK-187 (validação entre múltiplas instâncias).
5. Confira as acceptanceCriteria de cada task.
6. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
7. Teste manualmente: rode duas instâncias do servidor de dev em portas diferentes (ou simule duas chamadas de
   processos `node` separados) contra a mesma rota protegida, confirmando que o limite é compartilhado entre
   elas — esse é o comportamento que a implementação em memória NÃO tinha.
8. Marque `"pass": true` nos steps dos três JSONs de task e `"passes": true` em `.agent/tasks.json`.
9. Commit(s) e abra PR com `gh pr create`. Título: "feat: rate limiting distribuído via Upstash Redis
   (TASK-185 a 187)". Descrição com o teste de múltiplas instâncias e link para a seção 14.3 do PRD.

Definition of Done: acceptanceCriteria de TASK-185 a 187 atendidas e marcadas; todos os call sites de
`rateLimit` usando `await`; comportamento distribuído validado entre duas instâncias; PR aberto.
```

---

## Grupo 10 — Monitoramento de erro em produção (Sentry)

**Tasks**: TASK-188, TASK-189, TASK-190
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Monitoramento de erro em produção" da Fase 3 da Plataforma de Cursos (Next.js
16 + Sentry). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: hoje não há nenhuma ferramenta de observação de erro além de log de console. Este grupo instala o
Sentry, instrumenta explicitamente os fluxos financeiramente críticos (webhook Stripe, checkout, certificado)
e configura alerta de erro em produção.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-188 — Instalar e configurar @sentry/nextjs
2. TASK-189 — Capturar erros de rotas críticas no Sentry (webhook, checkout, certificado)
3. TASK-190 — Configurar alerta de erro em produção no Sentry

Dependências externas: TASK-146 (Grupo 0) deve ter confirmado se já existe um projeto Sentry criado. Se
reportou como pendente, esta é a task que efetivamente cria/configura.

Atenção a padrões do projeto:
- Use o wizard oficial (`npx @sentry/wizard@latest -i nextjs`) em vez de configurar manualmente do zero — ele
  gera a configuração correta para App Router automaticamente.
- Ao instrumentar `POST /api/webhooks/stripe`, capture a exceção COM contexto (`eventType`) antes de
  retornar erro ao Stripe — não troque o comportamento de resposta do endpoint, só adicione a captura.
- Em `src/lib/certificate.ts`, a captura de erro deve coexistir com o comportamento de erro já existente
  (propagação/log) — não interrompa o fluxo, apenas adicione a telemetria.
- A rota de debug temporária usada para testar a integração (TASK-188, passo 3 do spec) DEVE ser removida
  antes de abrir o PR — não deixe endpoints de debug em produção.

Como trabalhar:
1. Crie a branch `feat/fase3-monitoramento-erro` a partir de `main` atualizada.
2. Implemente TASK-188, TASK-189, TASK-190, nessa ordem.
3. Confira as acceptanceCriteria de cada task.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: dispare um erro de teste e confirme que aparece no dashboard do Sentry com o contexto
   esperado; confirme que a Alert Rule da TASK-190 dispara a notificação configurada. Remova qualquer rota de
   debug criada para o teste antes do commit final.
6. Marque `"pass": true` nos steps dos três JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: monitoramento de erro em produção com Sentry
   (TASK-188 a 190)". Descrição com o teste de captura e de alerta, confirmação de que nenhuma rota de debug
   ficou no código, e link para a seção 14.3 do PRD.

Definition of Done: acceptanceCriteria de TASK-188 a 190 atendidas e marcadas; captura de erro com contexto e
alerta testados; nenhuma rota de debug remanescente; PR aberto.
```

---

## Grupo 11 — Event tracking de produto

**Tasks**: TASK-191, TASK-192, TASK-193, TASK-194, TASK-195
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "Event tracking de produto" da Fase 3 da Plataforma de Cursos (Next.js 16 +
Prisma 7). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

Contexto: as métricas atuais (`GET /api/admin/metrics`) são agregados financeiros (MRR, churn, LTV) — não há
rastreamento de eventos de uso. Este grupo cria um registro simples de eventos de produto e um funil básico de
conversão, para habilitar decisões orientadas a dado (onde o aluno abandona o checkout, quais aulas têm maior
drop-off), sem depender de nenhuma ferramenta de analytics externa.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-191 — Modelo ProductEvent (schema + migration)
2. TASK-192 — Helper trackEvent fire-and-forget (src/lib/events.ts)
3. TASK-193 — Instrumentar eventos-chave de checkout e consumo de aula
4. TASK-194 — GET /api/admin/events/funnel agregação de funil
5. TASK-195 — Seção de funil de conversão no AdminDashboard

Dependências externas: nenhuma além do Grupo 0 — pode começar imediatamente e em paralelo com qualquer outro
grupo, já que instrumenta rotas que já existem desde a Fase 1/2 (não cria fluxos novos).

Atenção a padrões do projeto:
- `trackEvent` é fire-and-forget — falha ao gravar o evento NUNCA deve lançar exceção para o caller, apenas
  logar. Nos call sites, use `void trackEvent(...)`, nunca `await trackEvent(...)`, para não atrasar a
  resposta da rota instrumentada.
- Instrumente exatamente os pontos descritos na TASK-193 (`plans_viewed`, `checkout_started`,
  `subscription_activated`, `lesson_started`) — não instrumente toda a aplicação nesta rodada, o documento de
  oportunidades pede um funil simples, não um sistema de analytics completo.
- O cálculo de drop-off de aula (TASK-194) é uma proxy simples (`lesson_started` sem `LessonProgress.
  isCompleted` correspondente) — não crie um evento dedicado de "abandono", calcule na agregação.
- Reaproveite `<lui-card>`/`<lui-heading>` do design system na seção de funil do `AdminDashboard` (TASK-195),
  consistente com o resto do painel admin.

Como trabalhar:
1. Crie a branch `feat/fase3-event-tracking` a partir de `main` atualizada.
2. Implemente as 5 tasks na ordem listada.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: navegue por `/planos`, inicie um checkout, complete-o, acesse uma aula — confirme que os
   4 eventos aparecem na tabela `ProductEvent`. Acesse `/admin` e confirme que a seção de funil mostra as
   contagens corretas e que a lista de aulas com maior abandono reflete os dados de teste.
6. Marque `"pass": true` nos steps dos cinco JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: event tracking de produto e funil de conversão
   (TASK-191 a 195)". Descrição com os eventos validados e a seção de funil testada no admin, e link para a
   seção 14.3 do PRD.

Definition of Done: acceptanceCriteria de TASK-191 a 195 atendidas e marcadas; os 4 eventos-chave confirmados
na tabela `ProductEvent`; seção de funil exibindo dados corretos no AdminDashboard; PR aberto.
```

---

## Grupo 12 — Checkout integrado ao cadastro (Embedded Checkout)

**Tasks**: TASK-196, TASK-197, TASK-198, TASK-199, TASK-200
**Depende de**: nenhum grupo — pode começar imediatamente, em paralelo com qualquer outro

### Prompt para a IA

```
Você vai implementar o grupo "Checkout integrado ao cadastro (Embedded Checkout)" da Fase 3 da Plataforma de
Cursos (Next.js 16 App Router + Prisma 7 + Stripe). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de
começar — eles documentam os padrões obrigatórios do projeto (rotas, Zod v4, Prisma, padrões de checkout
Stripe já existentes).

Contexto: hoje o cadastro (`/cadastro`, `RegisterForm.tsx`) só cria a conta e redireciona para `/dashboard` —
a escolha de plano só acontece numa visita separada a `/planos`, e quem ainda não tem conta e clica em
"Assinar" lá é mandado para `/login`, sem caminho direto para criar conta preservando a intenção de
assinatura. Este grupo junta os dois passos numa página só, usando o Embedded Checkout do Stripe
(`ui_mode: 'embedded'`) em vez do Checkout hospedado atual — o formulário de pagamento é renderizado num
iframe dentro da própria página, sem redirecionar para `checkout.stripe.com`. Decidido em conversa com o
cliente em 2026-06-21, fora do documento de oportunidades original (`docs/fase3-oportunidades.md`) — ver
seção 14.7 do PRD.

Tasks deste grupo, na ordem (leia o spec completo de cada uma em .agent/tasks/TASK-<id>.json antes de codar):
1. TASK-196 — `uiMode: 'embedded'` em `POST /api/subscriptions/checkout` (retorna `clientSecret`)
2. TASK-197 — Componente `EmbeddedCheckoutForm` reutilizável (`@stripe/stripe-js`/`@stripe/react-stripe-js`)
3. TASK-198 — `/planos` propaga plano/ciclo para `/cadastro` via query string quando não autenticado
4. TASK-199 — `RegisterForm` com segundo passo: cria conta → abre Embedded Checkout inline
5. TASK-200 — Rota de retorno (`return_url`) para confirmações que navegam para fora do iframe (3DS)

Dependências externas: nenhuma — `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` já está configurada em `.env.local`, e
o grupo não depende de Boleto/Pix/trilhas/B2B.

Atenção a padrões do projeto:
- `POST /api/auth/register` já autentica via cookie `auth-token` na resposta — não é preciso passo de login
  intermediário entre criar a conta e chamar `POST /api/subscriptions/checkout`.
- Não duplique a lógica de cupom de indicação, trial gratuito ou `allow_promotion_codes`/`discounts` — ela já
  é resolvida inteiramente no servidor em `src/app/api/subscriptions/checkout/route.ts`, independente de
  `uiMode`. Mude só a construção condicional de `sessionParams` (embedded vs. hosted) e o campo de resposta.
- `useSearchParams()` exige `<Suspense>` no componente pai (AGENTS.md) — ajuste `CadastroPage` de acordo ao
  ler `plan`/`billing`/`ref` da query string.
- Não há custo adicional do Stripe por usar Embedded em vez de Hosted Checkout — mesma Checkout Session, mesma
  tabela de taxas (`docs/stripe-pricing.md`); não é necessário criar nada novo no Dashboard do Stripe por
  causa do `ui_mode`.
- Escopo apenas da assinatura recorrente (planos Básico/Premium) — não estenda Embedded Checkout à compra
  avulsa de curso nem ao bundle de trilha nesta rodada.

Como trabalhar:
1. Crie a branch `feat/fase3-checkout-cadastro` a partir de `main` atualizada.
2. Implemente as 5 tasks na ordem listada — TASK-199 depende das três anteriores estarem prontas.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide o código: `npx tsc --noEmit` e `npx vitest run` devem passar sem erros novos.
5. Suba o dev server e rode `stripe listen --forward-to localhost:3000/api/webhooks/stripe` em paralelo. Teste
   manualmente: a partir de `/planos` deslogado, clique em "Criar conta e assinar" num plano, complete o
   cadastro, confirme que o Embedded Checkout aparece inline na mesma página (sem redirecionar para
   `checkout.stripe.com`), complete o pagamento com cartão de teste, e confirme que cai em
   `/dashboard?checkout=success` com a assinatura ativa. Repita com o cartão de teste que força desafio 3D
   Secure (`4000 0027 6000 3184`) para validar o fallback da TASK-200. Confirme também que `/cadastro` sem
   plano na query string continua funcionando exatamente como antes.
6. Marque `"pass": true` em cada step dos cinco JSONs de task e `"passes": true` nas entradas correspondentes
   de `.agent/tasks.json`, só depois de validar de fato.
7. Commit(s) com mensagens claras, seguindo o estilo dos commits existentes no repositório (confira `git log`).
8. Abra um PR para `main` com `gh pr create`. Título: "feat: checkout integrado ao cadastro com Embedded
   Checkout (TASK-196 a 200)". Na descrição, liste as 5 tasks concluídas, o fluxo testado manualmente
   (cadastro → checkout embutido → dashboard, incluindo o fallback de 3DS), e link para a seção 14.7 do PRD
   (`.agent/prd/PRD.md`). Não faça merge — deixe para revisão humana.

Definition of Done: acceptanceCriteria de TASK-196 a 200 atendidas e marcadas; fluxo completo testado
manualmente (cadastro → Embedded Checkout → dashboard com assinatura ativa, incluindo fallback de 3DS);
`/cadastro` sem plano continua funcionando sem alteração; tsc e vitest passando; PR aberto.
```

---

## Grupo despriorizado — Boleto via Stripe (Grupo 1)

> **Removido em 2026-06-21.** Durante a implementação do checkout integrado ao cadastro (Grupo 12), identificou-se que `handleCheckoutSessionCompleted` (`src/lib/stripe-handlers.ts`) assume que toda Checkout Session de assinatura completada já foi paga, o que é falso para Boleto (status real fica `incomplete` até a compensação, 1-3 dias úteis). Habilitar Boleto sem o tratamento assíncrono completo concederia acesso pago antes da confirmação do pagamento. O cliente optou por desabilitar Boleto direto no Stripe Dashboard em vez de implementar esse tratamento agora — ver decisão completa em `.agent/prd/PRD.md` seção 14.6. As tasks TASK-147 a TASK-150 foram movidas para `.agent/tasks/deprecated/`. O prompt abaixo continua completo e utilizável sem alteração — basta ser retomado (e os `specFilePath` em `.agent/tasks.json` apontados de volta para `.agent/tasks/`) se a decisão for revertida, condicionado a implementar o tratamento assíncrono completo (steps 1-3 da TASK-148) antes de reabilitar Boleto em qualquer Checkout Session de assinatura.

### Prompt para a IA

```
Você vai implementar o grupo "Boleto via Stripe" da Fase 3 da Plataforma de Cursos (Next.js 16 App Router +
Prisma 7 + Stripe). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar — eles documentam os padrões
obrigatórios do projeto (rotas, Zod v4, Prisma, webhooks Stripe).

ATENÇÃO — confirme antes de começar: este grupo foi removido do planejamento ativo da Fase 3 em 2026-06-21
porque o webhook de assinatura (`handleCheckoutSessionCompleted`) assume pagamento confirmado em
`checkout.session.completed`, o que é falso para Boleto — habilitar sem o tratamento assíncrono completo
(steps 1-3 abaixo) concederia acesso pago antes da confirmação do pagamento. Isso está documentado em
`.agent/prd/PRD.md` seção 14.6. Esta é uma decisão já tomada, não pendente de validação — só retome este grupo
se a decisão for revertida explicitamente pelo cliente do projeto.

Contexto: hoje o checkout só aceita cartão de crédito. Boleto é relevante porque parte significativa do
público brasileiro não tem ou prefere não usar cartão para pagamento. (Pix foi adiado desta rodada — exige
convite da Stripe para contas BR, ver `docs/pix-habilitacao.md` — não implemente Pix neste grupo.) A
complicação técnica é que Boleto é um método de pagamento ASSÍNCRONO — diferente do cartão, a confirmação não
chega no evento `checkout.session.completed`, chega depois em `checkout.session.async_payment_succeeded` (ou
`_failed`). O webhook atual (`src/lib/stripe-handlers.ts`) não trata isso e, sem o tratamento certo, a
matrícula do aluno nunca aconteceria para quem paga com Boleto (e, no caso da assinatura recorrente, o
problema é o inverso: concede acesso pago antes da confirmação).

Tasks deste grupo, na ordem (leia o spec completo de cada uma em .agent/tasks/deprecated/TASK-<id>.json antes
de codar):
1. TASK-147 — Habilitar Boleto na Checkout Session de compra avulsa (mode: 'payment')
2. TASK-148 — Tratar webhooks de pagamento assíncrono (async_payment_succeeded/failed)
3. TASK-149 — Página de retorno com estado "pagamento pendente" para Boleto
4. TASK-150 — Investigar e decidir sobre Boleto na assinatura recorrente (mode: 'subscription')

Dependências externas: TASK-146 (Grupo 0) deve confirmar Boleto habilitado na conta Stripe (foi desabilitado
em 2026-06-21 — precisa ser reabilitado no Dashboard antes de retomar este grupo).

Atenção a padrões do projeto:
- Boleto só tem suporte garantido em `mode: 'payment'` (compra avulsa, `src/app/api/courses/[slug]/
  purchase/route.ts`) — NÃO assuma que funciona em `mode: 'subscription'` sem confirmar na documentação
  oficial do Stripe primeiro (é exatamente o objetivo da TASK-150, que é uma investigação, não uma
  implementação garantida).
- Em `handleCheckoutSessionCompleted` (`src/lib/stripe-handlers.ts`), o branch `session.mode === 'payment'`
  hoje assume pagamento confirmado. Ajuste para só matricular quando `session.payment_status === 'paid'`;
  para `unpaid` (caso comum de Boleto recém-criado), aguarde o evento assíncrono da TASK-148.
- O MESMO problema existe hoje no branch de assinatura (`session.mode !== 'payment'`) de
  `handleCheckoutSessionCompleted`: `subscriptionStatus = subscription.status === 'trialing' ? 'trialing' :
  'active'` assume ativo incondicionalmente. A TASK-150 PRECISA corrigir isso (ou manter Boleto fora da
  assinatura) antes de qualquer habilitação — não é opcional, é a causa raiz da remoção deste grupo.
- Webhooks Stripe podem ser reentregues — use `upsert`, nunca `create` puro.
- Em produção, novos tipos de evento precisam ser habilitados manualmente em Developers → Webhooks no Stripe
  Dashboard (localmente, via `stripe listen`, já chegam todos os eventos automaticamente) — mesmo padrão já
  usado para `customer.subscription.trial_will_end` na Fase 2.
- A TASK-150 pode legitimamente concluir como "não habilitar boleto recorrente nesta rodada" — não force a
  feature se a documentação não confirmar suporte adequado ou se o comportamento de `past_due` durante a
  janela de compensação (1-3 dias úteis) se mostrar problemático no teste.
- Não inclua `pix` em `payment_method_types` — está fora de escopo deste grupo (ver `docs/pix-habilitacao.md`).
- Se retomado, TASK-172 (Grupo 6, já implementada sem Boleto) e `.agent/tasks.json` precisam ser atualizados de
  volta para incluir `payment_method_types: ['card', 'boleto']`, e os `specFilePath` de TASK-147 a 150 movidos
  de volta para `.agent/tasks/`.

Como trabalhar:
1. Crie a branch `feat/fase3-boleto` a partir de `main` atualizada.
2. Implemente TASK-147, depois TASK-148, depois TASK-149, nessa ordem — a TASK-149 só faz sentido com o
   webhook assíncrono já funcionando.
3. Implemente a TASK-150 por último, corrigindo também o branch de assinatura de
   `handleCheckoutSessionCompleted` antes de habilitar Boleto em qualquer Checkout Session de assinatura.
4. Depois de cada task, confira uma a uma as `acceptanceCriteria` do spec correspondente antes de seguir para
   a próxima.
5. Valide o código: `npx tsc --noEmit` e `npx vitest run` devem passar sem erros novos.
6. Suba o dev server e rode `stripe listen --forward-to localhost:3000/api/webhooks/stripe` em paralelo. Teste
   manualmente: complete uma compra avulsa de curso escolhendo Boleto em modo teste, confirme que a página de
   retorno mostra "pagamento pendente", marque o boleto como pago (o Stripe permite isso em modo teste), e
   confirme que a matrícula é criada e a página passa a refletir acesso liberado.
7. Marque `"pass": true` em cada step dos quatro JSONs de task e `"passes": true` nas entradas correspondentes
   de `.agent/tasks.json`, só depois de validar de fato.
8. Commit(s) com mensagens claras, seguindo o estilo dos commits existentes no repositório (confira `git log`).
9. Abra um PR para `main` com `gh pr create`. Título: "feat: Boleto na compra avulsa de curso (TASK-147 a
   150)". Na descrição, liste as 4 tasks concluídas (incluindo a decisão tomada na TASK-150, com justificativa),
   o que foi testado manualmente, e link para a seção 14.1 do PRD (`.agent/prd/PRD.md`). Não faça merge — deixe
   para revisão humana.

Definition of Done: acceptanceCriteria de TASK-147 a 150 atendidas e marcadas; decisão da TASK-150 documentada
no PRD com justificativa; o gap de status prematuro na assinatura corrigido; fluxo de compra avulsa com Boleto
testado manualmente até a matrícula ser criada; tsc e vitest passando; PR aberto.
```

---

## Grupos despriorizados — B2B (Grupos 2 a 5)

> **Despriorizado em 2026-06-21.** A demanda real de clientes corporativos ainda não foi validada com o cliente do projeto (ver `.agent/prd/PRD.md` seção 14.6) — em vez de manter estes 4 sub-grupos na rotação ativa só com essa ressalva, eles foram retirados da ordem de execução da seção acima. As tasks TASK-151 a TASK-166 foram movidas para `.agent/tasks/deprecated/`. Os prompts abaixo continuam completos e utilizáveis sem alteração — bastam ser retomados (e os specFilePath em `.agent/tasks.json` apontados de volta para `.agent/tasks/`) se a direção for confirmada com o stakeholder. **Antes de retomar qualquer um destes 4 sub-grupos, confirme a demanda com o stakeholder do projeto — não é um bloqueio técnico, é um bloqueio de produto.**

## Grupo 2 — B2B: Modelos de dados

**Tasks**: TASK-151, TASK-152, TASK-153, TASK-154
**Depende de**: Grupo 0

### Prompt para a IA

```
Você vai implementar o grupo "B2B — Modelos de dados" da Fase 3 da Plataforma de Cursos (Next.js 16 + Prisma
7 + Neon). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

ATENÇÃO — confirme antes de começar: a demanda real de clientes corporativos (B2B) ainda NÃO foi validada com
o cliente do projeto. Isso está documentado em `.agent/prd/PRD.md` seção 14.6. Esta é uma decisão de produto,
não técnica — se o stakeholder ainda não confirmou que vale investir nisso, pare e avise antes de codar.
Assumindo que a direção foi confirmada, prossiga normalmente.

Contexto: hoje `UserSubscription` é 1:1 com `User` — uma assinatura por pessoa. Este grupo cria a base de
dados para licenciamento corporativo: uma `Organization` com seats contratados, membros vinculados, convites
por e-mail e uma assinatura própria da organização (cobrança por seat, não por pessoa).

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-151 — Modelo Organization
2. TASK-152 — Modelo OrganizationMember (decisão de escopo: 1 usuário pertence a no máximo 1 organização)
3. TASK-153 — Modelo OrganizationInvite (convite por e-mail, com token seguro e expiração de 7 dias)
4. TASK-154 — Modelo OrganizationSubscription (análogo a UserSubscription, mas com `seats` em vez de 1:1)

Dependências externas: nenhuma além do Grupo 0 — pode começar imediatamente após a validação de produto acima.

Atenção a padrões do projeto:
- Os 4 models são interdependentes — adicione todos ao `prisma/schema.prisma` antes de rodar a migration, em
  uma única migration (`npx prisma migrate dev --name add_organization_models`), para evitar estados
  intermediários inválidos.
- `OrganizationMember.userId` é `@unique` — essa é a decisão deliberada de v1 (sem multi-tenancy de usuário).
  Não modele como many-to-many.
- `OrganizationSubscription` reaproveita os enums `SubscriptionStatus` e `BillingCycle` já existentes — não
  duplique enums.
- Gere o token de convite com `crypto.randomBytes(32).toString('hex')` (Node `crypto`), nunca um valor
  previsível como UUID sequencial ou timestamp.
- Reaproveite `generateSlug`/`getUniqueSlug` de `src/lib/utils/slug.ts` para o slug da organização — mesmo
  helper já usado em `Course.slug`.

Como trabalhar:
1. Crie a branch `feat/fase3-b2b-modelos` a partir de `main` atualizada.
2. Implemente as 4 tasks na ordem listada, adicionando todos os models ao schema antes de migrar.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Rode `npx prisma migrate dev --name add_organization_models` e `npx prisma generate`.
5. Valide: `npx tsc --noEmit` sem erros novos.
6. Não há fluxo de UI para testar neste grupo — valide via Prisma Studio (`npx prisma studio`) ou um script
   pontual que cria uma `Organization`, um `OrganizationMember` e um `OrganizationInvite` de teste, confirmando
   que as constraints (`@unique`, `@@unique`) funcionam como esperado.
7. Marque `"pass": true` nos steps dos quatro JSONs de task e `"passes": true` em `.agent/tasks.json`.
8. Commit(s) e abra PR com `gh pr create`. Título: "feat: modelos de dados para licenciamento B2B (TASK-151 a
   154)". Descrição explicando os 4 models, as decisões de escopo (1 organização por usuário, seats fixados no
   plano), e link para a seção 14.1 e 14.6 do PRD.

Definition of Done: acceptanceCriteria de TASK-151 a 154 atendidas e marcadas; migration aplicada sem afetar
tabelas existentes; constraints validadas manualmente; PR aberto.
```

---

## Grupo 3 — B2B: Membros, convites e acesso

**Tasks**: TASK-155, TASK-156, TASK-157, TASK-158, TASK-159, TASK-160, TASK-161, TASK-166
**Depende de**: Grupo 2 (mesclado)

### Prompt para a IA

```
Você vai implementar o grupo "B2B — Membros, convites e acesso" da Fase 3 da Plataforma de Cursos (Next.js 16
App Router + Prisma 7). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

PRÉ-REQUISITO OBRIGATÓRIO: confirme que o grupo "B2B — Modelos de dados" (TASK-151 a 154) já está mesclado em
`main` antes de começar — todas as tasks deste grupo dependem dos models `Organization`, `OrganizationMember`,
`OrganizationInvite` e `OrganizationSubscription`. Se não estiver mesclado, pare e avise.

Contexto: este grupo entrega o ciclo completo de gestão de membros de uma organização: criar a organização,
convidar por e-mail (com ou sem conta prévia), aceitar o convite, remover membro, e a extensão do controle de
acesso para que membros de organização com assinatura ativa tenham acesso de nível premium ao catálogo — tudo
isso ANTES de existir cobrança (a cobrança é o Grupo 4, separado).

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-155 — Estender checkLessonAccess/checkCourseAccess em src/lib/access.ts para organizações
2. TASK-156 — POST /api/organizations cria organização (usuário se torna owner)
3. TASK-157 — GET /api/organizations/me retorna dados da organização do usuário
4. TASK-159 — E-mail transacional de convite (template + função de envio)
5. TASK-158 — POST /api/organizations/me/invites convida membro por e-mail
6. TASK-160 — Fluxo de aceite de convite (/convite/[token])
7. TASK-161 — DELETE /api/organizations/me/members/[userId] remove membro
8. TASK-166 — Autorização por papel (owner vs member) nos endpoints acima

Nota de ordem: TASK-159 (e-mail) vem antes de TASK-158 (que dispara o e-mail) porque o template/função
precisam existir primeiro. TASK-166 vem por último porque endurece a autorização dos endpoints já
implementados nos passos anteriores — implemente os endpoints já pensando em checar o papel, mas centralize e
teste a regra explicitamente nesta task final.

Dependências externas: Grupo 2 (B2B — Modelos de dados) mesclado em `main` — ver acima.

Atenção a padrões do projeto:
- `checkLessonAccess`/`checkCourseAccess` (`src/lib/access.ts`) são a fonte única de verdade de controle de
  acesso — a extensão para organizações deve ser uma checagem adicional, sem duplicar ou quebrar a lógica já
  existente de assinatura individual. As duas funções precisam da mesma checagem (evite implementar só em uma).
- Siga o padrão de `requireRole` (`src/lib/auth.ts`, retorno `instanceof NextResponse`) ao criar o helper
  `requireOrgOwner` da TASK-166 — não invente um padrão de erro diferente.
- `GET /api/organizations/me` deve retornar 404 (não 403) para usuário sem organização — não revele a
  existência de organizações de terceiros.
- O fluxo de convite (TASK-160) precisa tratar 3 estados na página `/convite/[token]`: usuário deslogado
  (redirecionar para `/cadastro` preservando o destino), e-mail divergente do convite, e convite
  expirado/já aceito. Não implemente só o caminho feliz.
- Siga o padrão de templates já existentes em `src/lib/email-templates.ts` para o e-mail de convite da
  TASK-159, e envolva o envio em try/catch — falha de e-mail não pode impedir a criação do convite.

Como trabalhar:
1. Confirme o pré-requisito (Grupo 2 mesclado) antes de criar a branch.
2. Crie a branch `feat/fase3-b2b-membros` a partir de `main` atualizada (já incluindo o Grupo 2).
3. Implemente as 8 tasks na ordem listada acima.
4. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
5. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
6. Teste manualmente o fluxo completo com dois usuários de teste: usuário A cria organização (torna-se owner),
   convida o e-mail do usuário B (que ainda não tem conta), usuário B recebe o link, cria conta a partir do
   convite e é adicionado como member; confirme que B aparece na lista de membros. Teste a remoção de B pelo
   owner. Teste que B (como member) recebe 403 ao tentar convidar ou remover alguém. Teste que um usuário sem
   organização recebe 404 em `GET /api/organizations/me`.
7. Marque `"pass": true` nos steps dos oito JSONs de task e `"passes": true` em `.agent/tasks.json`.
8. Commit(s) e abra PR com `gh pr create`. Título: "feat: gestão de membros e convites de organização B2B
   (TASK-155 a 161, 166)". Descrição com o fluxo de dois usuários testado, os casos de autorização validados, e
   link para a seção 14.1 e 14.4 do PRD.

Definition of Done: acceptanceCriteria de TASK-155 a 161 e 166 atendidas e marcadas; fluxo de convite e
remoção testado de ponta a ponta com dois usuários; autorização por papel validada; PR aberto.
```

---

## Grupo 4 — B2B: Cobrança por seat

**Tasks**: TASK-162, TASK-163
**Depende de**: Grupo 2 e Grupo 3 (mesclados)

### Prompt para a IA

```
Você vai implementar o grupo "B2B — Cobrança por seat" da Fase 3 da Plataforma de Cursos (Next.js 16 + Prisma
7 + Stripe). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

PRÉ-REQUISITO OBRIGATÓRIO: confirme que os grupos "B2B — Modelos de dados" (TASK-151 a 154) e "B2B — Membros,
convites e acesso" (TASK-155 a 161, 166) já estão mesclados em `main`. A TASK-162 depende de `GET /api/
organizations/me` (TASK-157) e a TASK-163 depende da `OrganizationSubscription` e do checkout já existirem.

Contexto: este grupo conecta a organização ao Stripe Billing, cobrando por quantidade de seats (`quantity` no
line item da Checkout Session), em vez do fluxo 1:1 de assinatura individual já existente.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-162 — Checkout de assinatura B2B por seat (POST /api/organizations/me/checkout)
2. TASK-163 — Estender webhooks Stripe (src/lib/stripe-handlers.ts) para tratar OrganizationSubscription

Dependências externas: Grupo 2 e Grupo 3 mesclados — ver acima.

Atenção a padrões do projeto:
- `src/lib/stripe-handlers.ts` já segue a API version `2026-05-27.dahlia` — `current_period_start`/`end`
  ficam em `subscription.items.data[0]`, e o ID da subscription em invoices vem de
  `invoice.parent.subscription_details`, NUNCA de `invoice.subscription` (ver AGENTS.md). Essa armadilha vale
  igualmente para `OrganizationSubscription`.
- Diferencie assinatura individual de assinatura de organização pelo metadata: `session.metadata.userId` (já
  existente) vs `session.metadata.organizationId` (novo, sem `userId`) — NÃO assuma que toda session de
  `mode: 'subscription'` é individual.
- O `quantity` do line item é o que define os `seats` contratados — não recalcule isso manualmente, leia de
  `subscription.items.data[0].quantity`.
- `Organization.seatLimit` deve ser sincronizado com o `quantity` da subscription sempre que ela for
  criada/atualizada — isso cobre o caso de o seatLimit ser ajustado direto no Stripe Dashboard.
- Crie um helper que localiza a subscription por `stripeSubscriptionId` tentando `UserSubscription` e depois
  `OrganizationSubscription`, e reaproveite esse helper nos handlers de invoice e de subscription
  updated/deleted já existentes, em vez de duplicar a lógica de busca.

Como trabalhar:
1. Confirme os dois pré-requisitos (Grupos 2 e 3 mesclados) antes de criar a branch.
2. Crie a branch `feat/fase3-b2b-cobranca` a partir de `main` atualizada.
3. Implemente TASK-162, depois TASK-163.
4. Confira as acceptanceCriteria de cada task.
5. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
6. Teste manualmente com Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`): como
   owner de uma organização de teste, inicie o checkout com 5 seats, complete o pagamento em modo teste, e
   confirme que `OrganizationSubscription` é criada com `seats: 5` e `Organization.seatLimit: 5`. Dispare
   `stripe trigger invoice.payment_failed` e `customer.subscription.deleted` para a mesma subscription e
   confirme que o status é atualizado corretamente SEM afetar nenhuma `UserSubscription` existente.
7. Marque `"pass": true` nos steps dos dois JSONs de task e `"passes": true` em `.agent/tasks.json`.
8. Commit(s) e abra PR com `gh pr create`. Título: "feat: cobrança B2B por seat via Stripe (TASK-162 a 163)".
   Descrição com o teste end-to-end (checkout → webhook → seatLimit sincronizado) e link para a seção 14.1 do
   PRD.

Definition of Done: acceptanceCriteria de TASK-162 e 163 atendidas e marcadas; checkout e os 4 eventos de
webhook (completed, payment_succeeded, payment_failed, deleted) testados para organização sem regressão na
assinatura individual; PR aberto.
```

---

## Grupo 5 — B2B: Painel da organização

**Tasks**: TASK-164, TASK-165
**Depende de**: Grupo 3 e Grupo 4 (mesclados)

### Prompt para a IA

```
Você vai implementar o grupo "B2B — Painel da organização" da Fase 3 da Plataforma de Cursos (Next.js 16 App
Router + Prisma 7). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar.

PRÉ-REQUISITO OBRIGATÓRIO: confirme que os grupos "B2B — Membros, convites e acesso" (TASK-155 a 161, 166) e
"B2B — Cobrança por seat" (TASK-162 a 163) já estão mesclados em `main`. Este grupo é só a camada de UI sobre
os endpoints já existentes — não deve criar nenhum endpoint novo de backend além do portal descrito abaixo.

Contexto: este é o último grupo de B2B — a página onde o owner gerencia a organização (membros, seats,
assinatura) e a página pública que apresenta o plano B2B para visitantes.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-164 — Painel /organizacao (membros, seats, convite, remoção, portal de assinatura)
2. TASK-165 — CTA "Para empresas" e página /planos/empresas

Dependências externas: Grupo 3 e Grupo 4 mesclados — ver acima.

Atenção a padrões do projeto:
- Adicione `/organizacao` ao matcher de `src/proxy.ts` (igual já existe para `/dashboard/:path*`) — sem isso a
  página fica acessível sem autenticação.
- A TASK-164 inclui um endpoint novo e pequeno, `POST /api/organizations/me/portal`, análogo a `POST /api/
  subscriptions/portal` mas usando `organization.stripeCustomerId` — siga exatamente esse padrão existente, só
  restrinja a `owner` (reaproveite o helper `requireOrgOwner` da TASK-166).
- Reaproveite componentes existentes: `<lui-tag>` para badge de papel (owner/member), o padrão visual de
  `UpgradePrompt`/cards do design system para os CTAs.
- A UI deve refletir os 3 papéis possíveis: sem organização (CTA criar/aceitar convite), member (lista
  somente leitura), owner (lista com controles de convite/remoção/gestão de assinatura) — não esconda isso só
  no backend, a UI também precisa diferenciar visualmente.

Como trabalhar:
1. Confirme os dois pré-requisitos (Grupos 3 e 4 mesclados) antes de criar a branch.
2. Crie a branch `feat/fase3-b2b-painel` a partir de `main` atualizada.
3. Implemente TASK-164, depois TASK-165.
4. Confira as acceptanceCriteria de cada task.
5. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
6. Suba o dev server e teste manualmente nos três papéis: sem organização, member, e owner (use os usuários de
   teste já criados no Grupo 3). Confirme que o owner consegue abrir o Stripe Customer Portal da organização a
   partir do painel. Confirme o fluxo completo a partir de `/planos/empresas`: criar organização e iniciar
   checkout com N seats escolhidos.
7. Marque `"pass": true` nos steps dos dois JSONs de task e `"passes": true` em `.agent/tasks.json`.
8. Commit(s) e abra PR com `gh pr create`. Título: "feat: painel de gestão e página pública de planos B2B
   (TASK-164 a 165)". Descrição com os três papéis testados no navegador e link para a seção 14.1 e 14.4 do
   PRD. Esta é a última peça de B2B — mencione no PR que o grupo todo (Grupos 2 a 5) está completo.

Definition of Done: acceptanceCriteria de TASK-164 e 165 atendidas e marcadas; os três papéis (sem
organização, member, owner) testados no navegador; fluxo completo de /planos/empresas até o checkout validado;
PR aberto.
```

