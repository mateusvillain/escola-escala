# Fase 4 — Grupos de Trabalho e Prompts de Execução

Este documento divide as 49 tasks da Fase 4 (`TASK-202` a `TASK-234`, novas, mais `TASK-151` a `TASK-166`,
reativadas de `.agent/tasks/deprecated/`) em **10 grupos de trabalho**. Cada grupo foi dimensionado para ser
implementado por uma única sessão de agente (ou desenvolvedor) e entregue como **um PR só**, na ordem em que
as tasks devem ser feitas dentro do grupo — mesmo formato de `docs/fase3-grupos-de-trabalho.md`.

Critério de agrupamento: cada grupo corresponde a uma fatia coesa de uma das três frentes definidas em
`docs/fase4-planejamento.md` (cadastro fiscal, NFS-e via Asaas, B2B).

> **Demanda B2B confirmada (2026-06-23):** diferente do que valia quando estas tasks foram geradas, a
> demanda de clientes corporativos para o item 3 (B2B) foi validada — o produto quer suportar assinatura
> tanto por pessoa física (B2C) quanto por pessoa jurídica comprando para os colaboradores (B2B), com os
> benefícios já documentados em `docs/wiki/b2b-diferenciais.md`, disponível já no lançamento da plataforma
> (sem data definida ainda). **Os Grupos 4 a 9 estão autorizados para implementação** — a sequência entre
> eles segue só a ordem técnica descrita em "Ordem de execução entre grupos" abaixo, não mais uma aprovação
> de produto pendente. `docs/fase4-planejamento.md` já foi atualizado com esta confirmação; `.agent/prd/PRD.md`
> seção 14.6 mantém o registro histórico da decisão original de despriorização na Fase 3, que esta
> confirmação reverte.

## Como usar este documento

Cada seção abaixo tem um bloco "Prompt para a IA" pronto para ser colado no início de uma sessão (Claude Code
ou outro agente). Para os Grupos 4, 5, 6 e 7 (B2B Parte A), o prompt é um **adendo** sobre o prompt já
completo e utilizável em `docs/fase3-grupos-de-trabalho.md` — não duplicamos o conteúdo já escrito lá, só as
tasks novas que entram no meio do grupo original.

**Regra geral para todos os grupos**: o agente abre o PR para revisão humana — **não mergeia sozinho**.
Nenhum grupo deve usar `--no-verify`, force-push, ou pular hooks.

## Ordem de execução entre grupos

1. **Grupo 0 (pré-requisitos) é bloqueante** para a emissão real de nota fiscal e para o teste em Sandbox —
   não bloqueia o início do Grupo 1.
2. **Grupo 1 (cadastro fiscal)** pode começar imediatamente, em paralelo ao Grupo 0.
3. **Grupos 2 e 3 (NFS-e via Asaas)** dependem do Grupo 1 (precisam dos campos fiscais no `User`) e são
   sequenciais entre si (Grupo 3 depende do Grupo 2).
4. **Grupos 4 a 9 (B2B)** formam uma cadeia técnica: Grupo 4 → Grupo 5 → (Grupo 6 e Grupo 7 em paralelo, mas
   Grupo 6 também depende dos Grupos 2/3 prontos) → Grupo 8 e Grupo 9 podem rodar em paralelo entre si,
   depois do Grupo 5.

| #   | Grupo                                                      | Tasks                          | Depende de              | Branch sugerida                          | Status      |
| --- | ----------------------------------------------------------- | ------------------------------- | ------------------------ | ----------------------------------------- | ----------- |
| 0   | Pré-requisitos da Fase 4                                    | TASK-202                       | —                        | (sem PR de código)                        | ⏳ Pendente |
| 1   | Complemento do cadastro de usuários                          | TASK-203 a 209                 | Grupo 0                  | `feat/fase4-cadastro-fiscal`              | ⏳ Pendente |
| 2   | NFS-e: modelo, cliente Asaas e gatilho de emissão            | TASK-210 a 214                 | Grupo 0, Grupo 1         | `feat/fase4-nfse-emissao`                 | ⏳ Pendente |
| 3   | NFS-e: webhook, painel de pendências e entrega ao aluno      | TASK-215 a 220                 | Grupo 2                  | `feat/fase4-nfse-webhook-entrega`         | ⏳ Pendente |
| 4   | B2B Parte A: Modelos de dados + campos fiscais               | TASK-151 a 154, 222            | Grupo 0, Grupo 1         | `feat/fase4-b2b-modelos`                  | ⏳ Pendente |
| 5   | B2B Parte A: Membros, convites e acesso                      | TASK-155 a 161, 166            | Grupo 4                  | `feat/fase4-b2b-membros`                  | ⏳ Pendente |
| 6   | B2B Parte A: Cobrança por seat + NFS-e B2B                   | TASK-162, 163, 221, 225        | Grupo 5, Grupo 2/3       | `feat/fase4-b2b-cobranca-nfse`            | ⏳ Pendente |
| 7   | B2B Parte A: Painel da organização + dados fiscais            | TASK-164, 165, 223, 224        | Grupo 5, Grupo 4         | `feat/fase4-b2b-painel`                   | ⏳ Pendente |
| 8   | B2B diferencial: Conteúdo próprio + dashboard de engajamento  | TASK-226 a 230                 | Grupo 4, Grupo 5         | `feat/fase4-b2b-conteudo-engajamento`     | ⏳ Pendente |
| 9   | B2B diferencial: Compliance e auditoria                       | TASK-231 a 234                 | Grupo 5                  | `feat/fase4-b2b-compliance`               | ⏳ Pendente |

---

## Grupo 0 — Pré-requisitos da Fase 4

**Tasks**: TASK-202
**Resultado**: não gera PR de código — é configuração/verificação que desbloqueia a emissão real (item 2) e
a confirmação de demanda (item 3).

### Prompt para a IA

```
Você vai executar a TASK-202 do projeto "Plataforma de Cursos" (Next.js 16 + Prisma 7 + Neon + Stripe + Bunny
Stream). Leia primeiro CLAUDE.md e AGENTS.md na raiz do repo para contexto geral, depois leia o spec completo
em .agent/tasks/TASK-202.json e docs/fase4-planejamento.md seção 0.

Esta task verifica os pré-requisitos não-técnicos da Fase 4 antes que os grupos de NFS-e e B2B comecem:
1. Adicionar ao `.env.local` (SOMENTE placeholders, nunca valores reais): `ASAAS_API_KEY`,
   `ASAAS_API_BASE_URL` (valor `https://api-sandbox.asaas.com/v3`, não é secret), `ASAAS_WEBHOOK_TOKEN`.
2. Confirmar com o usuário se já existe conta Asaas Sandbox criada — se sim, pedir para preencher
   `ASAAS_API_KEY` manualmente; se não, registrar como pendente (não bloqueia o Grupo 1, bloqueia o teste
   end-to-end dos Grupos 2/3).
3. Confirmar status de `TASK-82` (deploy de produção) e da conta Asaas PJ de produção — registrar pendência
   sem bloquear nenhum grupo de implementação/teste em Sandbox.
4. Registrar que a demanda de clientes corporativos (B2B) já foi confirmada em 2026-06-23 — o produto quer
   suportar assinatura tanto B2C quanto B2B (pessoa jurídica comprando para colaboradores) já no lançamento
   da plataforma (sem data definida ainda). Os Grupos 4 a 9 estão autorizados para implementação.
5. Marcar cada step do `.agent/tasks/TASK-202.json` como `"pass": true` somente após verificar de fato, e
   atualizar a entrada correspondente em `.agent/tasks.json` para `"passes": true`.

Não abra PR para esta task — é só configuração local/verificação. Ao final, reporte um resumo de cada item:
confirmado, pendente, ou bloqueado (e por quê), deixando claro que pendências do Asaas Sandbox/produção não
bloqueiam nenhum grupo de implementação/teste em Sandbox, e que a demanda B2B já está confirmada (não é mais
um bloqueio para os Grupos 4 a 9).
```

---

## Grupo 1 — Complemento do cadastro de usuários

**Tasks**: TASK-203, TASK-204, TASK-205, TASK-206, TASK-207, TASK-208, TASK-209
**Depende de**: Grupo 0 (não bloqueante — pode rodar em paralelo)

### Prompt para a IA

```
Você vai implementar o grupo "Complemento do cadastro de usuários" da Fase 4 da Plataforma de Cursos
(Next.js 16 App Router + Prisma 7). Leia CLAUDE.md e AGENTS.md na raiz do repo antes de começar, e leia
docs/fase4-planejamento.md seção 1 para o contexto completo da decisão de escopo.

Contexto: o model `User` hoje só tem email/nome/avatar/stripeCustomerId — nenhum dado fiscal. Este grupo
adiciona CPF/CNPJ e endereço completo, necessários para a Fase 4 emitir NFS-e (Grupos 2/3). Decisão de
produto já tomada: coleta é OPCIONAL no cadastro, feita depois em `/perfil` (Opção B do plano) — o acesso ao
curso/assinatura NUNCA fica bloqueado por falta desse dado, só a emissão de nota fiscal.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-203 — Campos de CPF/CNPJ e endereço no model User (migration)
2. TASK-204 — Utilitário de validação de CPF/CNPJ (checksum), standalone e reutilizável
3. TASK-205 — Integração ViaCEP para autofill de endereço, com timeout/fallback obrigatório
4. TASK-206 — PATCH /api/users/me aceita os novos campos fiscais
5. TASK-207 — Formulário de dados fiscais em /perfil, com autofill por CEP
6. TASK-208 — GET /api/admin/users/[id] retorna detalhe com dados fiscais (endpoint NOVO — não existia)
7. TASK-209 — UI admin (modal em UserTable) para visualizar dados fiscais

Dependências externas: nenhuma — não depende de chave de API nenhuma, só de schema/UI próprios.

Atenção a padrões do projeto:
- `cpfCnpj` e os 7 campos de endereço são TODOS opcionais em `User` — nenhuma migration pode forçar
  preenchimento. Reaproveite os MESMOS nomes de campo (`addressStreet`, `addressCity` etc.) que a TASK-222
  (B2B, Grupo 4) vai usar em `Organization` depois — é o que permite reaproveitar `isFiscalDataComplete` e a
  validação de CNPJ sem duplicar lógica quando o B2B for retomado.
- TASK-207 NÃO deve usar react-hook-form com `lui-input` — incompatibilidade de shadow DOM já documentada em
  AGENTS.md. Siga EXATAMENTE o padrão de leitura/escrita manual via `shadowRoot` já usado em
  `EditProfileForm.tsx`/`ChangePasswordForm.tsx`.
- Importante: docs/fase4-planejamento.md assumia que `GET /api/admin/users/[id]` e uma página
  `/admin/usuarios/[id]` já existiam — confirmado durante a geração das tasks que NENHUM dos dois existe (só
  há `PATCH` no arquivo de rota, e a listagem é só `UserTable` em `/admin/usuarios`, sem detalhe por ID).
  TASK-208/209 cobrem esse gap real — não tente "exibir em página existente", ela não existe.
- LGPD: confirme explicitamente que `GET /api/admin/users` (listagem) NUNCA retorna os campos fiscais — só
  o endpoint de detalhe novo (TASK-208) os expõe, e só para admin.
- Zod v4: usar `.issues`, não `.errors` (AGENTS.md).

Como trabalhar:
1. Crie a branch `feat/fase4-cadastro-fiscal` a partir de `main` atualizada.
2. Implemente as 7 tasks na ordem listada — TASK-206 depende de TASK-203/204, TASK-207 depende de
   TASK-203/205/206, TASK-209 depende de TASK-208.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos — TASK-204 e TASK-205 exigem testes
   unitários novos (checksum de CPF/CNPJ, ViaCEP com fetch mockado).
5. Teste manualmente: em `/perfil`, preencha um CEP válido e confirme o autofill; tente salvar um CPF
   inválido e confirme a mensagem de erro; salve dados válidos e recarregue a página confirmando persistência.
   Em `/admin/usuarios`, abra o modal de dados fiscais de um usuário com e sem dados preenchidos.
6. Marque `"pass": true` nos steps dos sete JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: complemento do cadastro com CPF/CNPJ e endereço
   (TASK-203 a 209)". Descrição com o fluxo testado e link para docs/fase4-planejamento.md seção 1.

Definition of Done: acceptanceCriteria de TASK-203 a 209 atendidas e marcadas; fluxo de preenchimento e
autofill testado de ponta a ponta; LGPD confirmado (CPF não aparece na listagem); PR aberto.
```

---

## Grupo 2 — NFS-e: modelo, cliente Asaas e gatilho de emissão

**Tasks**: TASK-210, TASK-211, TASK-212, TASK-213, TASK-214
**Depende de**: Grupo 0, Grupo 1

### Prompt para a IA

```
Você vai implementar a primeira metade do grupo "NFS-e via Asaas" da Fase 4 da Plataforma de Cursos
(Next.js 16 + Prisma 7 + Stripe). Leia CLAUDE.md e AGENTS.md, e docs/fase4-planejamento.md seção 2 e
docs/wiki/nota-fiscal-nfse.md (viabilidade) e docs/wiki/asaas-vs-stripe.md (por que Asaas não é gateway).

Contexto: a Stripe processa pagamento, mas nunca emite nota fiscal — é uma obrigação fiscal brasileira
separada (NFS-e Nacional obrigatória desde 2026-01-01). Este grupo cria a base: o registro interno de cada
nota (`FiscalInvoice`), o wrapper de chamadas à API do Asaas, e o gatilho que dispara a emissão depois que a
Stripe confirma o pagamento — SEM bloquear acesso ao curso/assinatura se faltar dado fiscal (item 1).

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-210 — Modelo FiscalInvoice (userId obrigatório nesta rodada — B2B ainda não confirmado, ver TASK-221)
2. TASK-211 — Cliente Asaas (src/lib/asaas.ts), todo testado em api-sandbox.asaas.com
3. TASK-212 — Mapeamento priceId → código de serviço municipal (placeholder até o contador confirmar)
4. TASK-213 — Helper isFiscalDataComplete
5. TASK-214 — Gatilho de emissão dentro dos handlers de webhook Stripe existentes

Dependências externas: `ASAAS_API_KEY`/`ASAAS_API_BASE_URL` preenchidos no Sandbox (Grupo 0) para testar de
ponta a ponta — sem isso, dá para implementar e até testar o caminho `pending_data`, mas não o caminho de
emissão real contra a API.

Atenção a padrões do projeto:
- `FiscalInvoice.userId` é OBRIGATÓRIO nesta rodada (não nullable) — não adicione `organizationId`
  especulativamente; essa migration de extensão só acontece na TASK-221 (Grupo 6), quando/se B2B for
  retomado, porque precisa do model `Organization` já existir no schema.
- O gatilho de emissão (TASK-214) é estritamente ADITIVO dentro de `handleInvoicePaymentSucceeded` e
  `handleCheckoutSessionCompleted` (`src/lib/stripe-handlers.ts`) — não toque na lógica de matrícula/ativação
  de assinatura já existente. Falha na chamada ao Asaas NUNCA pode propagar exceção para fora do handler —
  o webhook da Stripe precisa responder 200 independente do resultado da emissão de nota fiscal.
- Idempotência: `FiscalInvoice` é único por `stripeInvoiceId`/`stripeSessionId` — use `upsert`, nunca
  `create` puro, mesmo princípio já usado em todos os outros handlers de webhook do projeto.
- Confirme na documentação oficial do Asaas (docs.asaas.com) o nome exato do header de autenticação e o
  schema de resposta de criação de nota ANTES de implementar `src/lib/asaas.ts` — não assuma
  `Authorization: Bearer`, a TASK-211 já avisa para confirmar isso.
- Decisão pendente (não bloqueia esta rodada): emissão por cobrança individual (este desenho assume isso) vs.
  lote mensal — fica para confirmar com o contador (seção 0 do plano).

Como trabalhar:
1. Crie a branch `feat/fase4-nfse-emissao` a partir de `main` atualizada (já incluindo o Grupo 1).
2. Implemente as 5 tasks na ordem listada.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente com `stripe listen --forward-to localhost:3000/api/webhooks/stripe`: dispare
   `stripe trigger checkout.session.completed`/`invoice.payment_succeeded` para um usuário de teste SEM dados
   fiscais (confirme `FiscalInvoice.status: 'pending_data'`, sem chamada à API do Asaas) e para um usuário COM
   dados fiscais completos no Sandbox do Asaas (confirme `status: 'scheduled'` e `asaasInvoiceId` preenchido).
6. Marque `"pass": true` nos steps dos cinco JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: emissão de NFS-e via Asaas — modelo, cliente e
   gatilho (TASK-210 a 214)". Descrição com os dois cenários testados (pending_data e scheduled) e link para
   docs/fase4-planejamento.md seção 2. Não faça merge — deixe para revisão humana.

Definition of Done: acceptanceCriteria de TASK-210 a 214 atendidas e marcadas; os dois caminhos (pending_data
e emissão real em Sandbox) testados; nenhuma regressão nos handlers de webhook existentes; PR aberto.
```

---

## Grupo 3 — NFS-e: webhook, painel de pendências e entrega ao aluno

**Tasks**: TASK-215, TASK-216, TASK-217, TASK-218, TASK-219, TASK-220
**Depende de**: Grupo 2

### Prompt para a IA

```
Você vai implementar a segunda metade do grupo "NFS-e via Asaas" da Fase 4 da Plataforma de Cursos
(Next.js 16 + Prisma 7). Leia CLAUDE.md e AGENTS.md, e docs/fase4-planejamento.md seção 2 (subseção "Entrega
ao aluno") antes de começar — ela já define os dois canais de entrega e o que precisa ser validado no
Sandbox.

PRÉ-REQUISITO OBRIGATÓRIO: confirme que o Grupo 2 (TASK-210 a 214) já está mesclado em `main` — este grupo
depende do `FiscalInvoice` e do cliente Asaas já existirem.

Contexto: depois que a TASK-214 (Grupo 2) agenda a emissão da nota, falta: (1) receber a confirmação
assíncrona de que ela foi de fato emitida (webhook do Asaas), (2) dar visibilidade ao admin sobre notas
pendentes/com erro, e (3) entregar a nota ao aluno por dois canais complementares — e-mail nativo do Asaas
(push) e download no dashboard (pull).

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-215 — Webhook POST /api/webhooks/asaas (verificação própria de autenticidade, diferente da Stripe)
2. TASK-216 — GET /api/admin/fiscal-invoices lista pendências e erros
3. TASK-217 — Painel admin /admin/notas-fiscais
4. TASK-218 — GET /api/fiscal-invoices/[id]/download (canal pull)
5. TASK-219 — UI de download no dashboard do aluno
6. TASK-220 — Configurar e VALIDAR no Sandbox a notificação nativa do Asaas (canal push)

Dependências externas: testar o webhook do Asaas em desenvolvimento local provavelmente exige expor o
`localhost` via túnel (ex. ngrok) — diferente da Stripe, não há um `stripe listen` equivalente para o Asaas.

Atenção a padrões do projeto:
- TASK-215 usa um MECANISMO DE VERIFICAÇÃO PRÓPRIO do Asaas — não reaproveite `stripe.webhooks.constructEvent`
  nem nenhuma lógica da Stripe, são plataformas diferentes. Confirme o nome exato do header de token na
  documentação oficial (`docs.asaas.com/docs/webhook-para-notas-fiscais`) antes de implementar.
- TASK-218 é mais simples que o equivalente de certificado (`GET /api/certificates/[courseId]/download`) —
  a nota fiscal é hospedada pelo Asaas, então é sempre um `NextResponse.redirect(pdfUrl)`, nunca um stream de
  buffer base64.
- TASK-220 é a VALIDAÇÃO EXPLÍCITA de uma lacuna que docs/fase4-planejamento.md deixou marcada como "não
  confirmado pela documentação pública" — não pule este teste assumindo que o e-mail nativo do Asaas
  funciona para um `Customer` usado só para nota avulsa (sem cobrança processada pelo Asaas). Se o teste
  falhar ou o branding for inadequado, implemente o fallback via Resend descrito no spec — e desative a
  notificação nativa (`notificationDisabled: true`) para não duplicar e-mail.
- Lembrete de ambiente: o Resend em modo Sandbox só entrega e-mail de teste para o endereço verificado do
  projeto — use esse mesmo endereço ao testar a TASK-220, não um e-mail genérico.

Como trabalhar:
1. Confirme o pré-requisito (Grupo 2 mesclado) antes de criar a branch.
2. Crie a branch `feat/fase4-nfse-webhook-entrega` a partir de `main` atualizada.
3. Implemente as 6 tasks na ordem listada.
4. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
5. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
6. Teste manualmente: com túnel ativo, emita uma nota de teste no Sandbox e confirme que o webhook chega e
   atualiza `FiscalInvoice` para `issued` com `pdfUrl`; baixe a nota pelo dashboard do aluno; confirme o
   painel `/admin/notas-fiscais` mostrando uma nota `pending_data` e uma `error` de teste; execute a
   validação do e-mail nativo (TASK-220) e registre o resultado.
7. Marque `"pass": true` nos steps dos seis JSONs de task e `"passes": true` em `.agent/tasks.json`.
8. Commit(s) e abra PR com `gh pr create`. Título: "feat: webhook, painel de pendências e entrega de NFS-e ao
   aluno (TASK-215 a 220)". Descrição com o resultado da validação do e-mail nativo do Asaas (TASK-220) em
   destaque, e link para docs/fase4-planejamento.md seção 2. Não faça merge — deixe para revisão humana.

Definition of Done: acceptanceCriteria de TASK-215 a 220 atendidas e marcadas; ciclo completo (emissão →
webhook → download) testado em Sandbox; decisão sobre o canal de e-mail (nativo vs. Resend) registrada com
justificativa; PR aberto.
```

---

## Grupo 4 — B2B Parte A: Modelos de dados + campos fiscais

**Tasks**: TASK-151, TASK-152, TASK-153, TASK-154, TASK-222
**Depende de**: Grupo 0, Grupo 1

### Prompt para a IA

```
Contexto de produto: a demanda de clientes corporativos (B2B) já está confirmada (2026-06-23) — o objetivo é
suportar assinatura tanto B2C quanto B2B (pessoa jurídica comprando para colaboradores) já no lançamento da
plataforma (sem data definida ainda). Pode implementar diretamente, sem confirmação adicional de produto.

Use o prompt completo do grupo "B2B — Modelos de dados" já existente em docs/fase3-grupos-de-trabalho.md
(seção "Grupo 2 — B2B: Modelos de dados") como base — ele cobre TASK-151 a TASK-154 (Organization,
OrganizationMember, OrganizationInvite, OrganizationSubscription) e está completo e correto, sem necessidade
de reescrita.

ADENDO desta Fase 4 (execute como step adicional, na mesma branch e mesmo PR do grupo original): depois de
TASK-151 a 154, implemente também:

5. TASK-222 — Campos fiscais (CNPJ, razão social, endereço) em `Organization`, na MESMA migration do grupo
   (não crie uma migration separada). Leia o spec completo em .agent/tasks/TASK-222.json.

Motivo do adendo: verificação feita nos specs reais de B2B durante o planejamento da Fase 4 (ver
docs/fase4-planejamento.md, seção "Interação com os itens 1 e 2") confirmou que o `model Organization`
originalmente especificado NÃO tinha nenhum campo fiscal — e a cobrança B2B por seat (Grupo 6) precisa emitir
nota fiscal pelo CNPJ da organização, não pelo CPF do owner individual.

Atenção a padrões adicionais para o TASK-222:
- Use os MESMOS nomes de campo de endereço já usados em `User` (TASK-203, Grupo 1) — `addressStreet`,
  `addressCity` etc. — para poder reaproveitar a validação de CNPJ (`validateCnpj`, TASK-204) sem duplicar
  lógica.
- `cnpj`, não `cpfCnpj` — uma `Organization` nunca emite nota por CPF.
- `legalName` (razão social) é um campo NOVO, distinto de `Organization.name` já existente (nome de exibição
  usado em convites/painel).

Como trabalhar (mesmos passos do grupo original, mais o adendo):
1. Crie a branch `feat/fase4-b2b-modelos` a partir de `main` atualizada (já incluindo Grupo 0 e Grupo 1).
2. Implemente TASK-151 a 154 seguindo o prompt original de docs/fase3-grupos-de-trabalho.md.
3. Implemente TASK-222 (adendo) na mesma migration.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: confirme as constraints originais (`@unique`, `@@unique`) via Prisma Studio, mais a
   validação de CNPJ ao tentar salvar um CNPJ inválido (se já houver algum endpoint que aceite o campo nesta
   altura — senão, valide só a presença/tipo do campo no schema).
6. Marque `"pass": true` nos steps dos cinco JSONs de task (151 a 154 e 222) e `"passes": true` em
   `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: modelos de dados para licenciamento B2B + campos
   fiscais de Organization (TASK-151 a 154, 222)". Descrição explicando os 4 models originais MAIS o adendo
   fiscal desta Fase 4, e link para docs/fase4-planejamento.md seção 3.

Definition of Done: acceptanceCriteria de TASK-151 a 154 e TASK-222 atendidas e marcadas; migration única
aplicada sem afetar tabelas existentes; PR aberto.
```

---

## Grupo 5 — B2B Parte A: Membros, convites e acesso

**Tasks**: TASK-155, TASK-156, TASK-157, TASK-158, TASK-159, TASK-160, TASK-161, TASK-166
**Depende de**: Grupo 4

### Prompt para a IA

```
ATENÇÃO — confirme antes de começar: que o Grupo 4 (TASK-151 a 154, 222) já está mesclado em `main`.

Use o prompt completo do grupo "B2B — Membros, convites e acesso" já existente em
docs/fase3-grupos-de-trabalho.md (seção "Grupo 3 — B2B: Membros, convites e acesso") — verificado durante o
planejamento da Fase 4 que NENHUMA das tasks deste grupo (TASK-155 a 161, 166) depende de dado fiscal. O
prompt original está completo e correto, **sem adendo nesta Fase 4** — use exatamente como está escrito lá,
só atualizando a branch base para incluir o Grupo 4 (que agora também inclui TASK-222).

Como trabalhar: siga o prompt original de docs/fase3-grupos-de-trabalho.md, criando a branch
`feat/fase4-b2b-membros` a partir de `main` já incluindo os Grupos 0, 1 e 4 desta Fase 4.

Definition of Done: igual ao definido no prompt original (docs/fase3-grupos-de-trabalho.md, seção "Grupo 3").
```

---

## Grupo 6 — B2B Parte A: Cobrança por seat + NFS-e B2B

**Tasks**: TASK-162, TASK-163, TASK-221, TASK-225
**Depende de**: Grupo 5, Grupo 2 e Grupo 3 (NFS-e do item 2 já implementado)

### Prompt para a IA

```
ATENÇÃO — confirme antes de começar: Grupo 5 (membros) mesclado; Grupos 2 e 3 (NFS-e via Asaas, item 2
completo) mesclados — este grupo é o único de B2B que depende do item 2 inteiro, não só dos modelos de
cadastro fiscal.

Use o prompt completo do grupo "B2B — Cobrança por seat" já existente em docs/fase3-grupos-de-trabalho.md
(seção "Grupo 4 — B2B: Cobrança por seat") como base para TASK-162 e TASK-163 — está completo e correto, sem
necessidade de reescrita.

ADENDO desta Fase 4 (execute depois de TASK-162/163, mesma branch e mesmo PR): implemente também:

3. TASK-221 — Migration que relaxa `FiscalInvoice.userId` para opcional e adiciona `organizationId` opcional
   + constraint de exclusividade (exatamente um dos dois preenchido). Leia .agent/tasks/TASK-221.json.
4. TASK-225 — Emissão de NFS-e para a cobrança B2B pelo CNPJ da `Organization`, estendendo o MESMO branch de
   `metadata.organizationId` que a TASK-163 já implementa em `handleCheckoutSessionCompleted`/
   `handleInvoicePaymentSucceeded` — não é uma reescrita do webhook, é um passo adicional dentro dele. Leia
   .agent/tasks/TASK-225.json.

Motivo do adendo: a cobrança B2B por seat é uma nova origem de receita que também precisa de nota fiscal —
pelo CNPJ da organização compradora, não pelo CPF do owner. Isso só pode ser feito DEPOIS do item 2 (NFS-e
individual) já estar implementado, porque reaproveita o `FiscalInvoice`, o cliente Asaas e o helper
`isFiscalDataComplete` criados ali.

Atenção a padrões adicionais para TASK-221/225:
- TASK-221 é uma migration de correção, não uma feature nova — só relaxa uma constraint e adiciona um campo,
  sem alterar nenhum `FiscalInvoice` já existente (todos continuam com `userId` preenchido).
- TASK-225 reaproveita a função `triggerFiscalInvoice` da TASK-214 (Grupo 2), generalizando a assinatura para
  aceitar `organizationId` — não crie uma segunda função paralela duplicando a lógica de chamada ao Asaas.
- Confirme que o branch de `metadata.organizationId` já implementado pela TASK-163 segue intacto — TASK-225
  só adiciona UMA chamada nova depois da lógica de sincronização de `OrganizationSubscription` já existente.

Como trabalhar (mesmos passos do grupo original, mais o adendo):
1. Crie a branch `feat/fase4-b2b-cobranca-nfse` a partir de `main` atualizada (incluindo Grupos 0, 1, 2, 3, 4, 5).
2. Implemente TASK-162, depois TASK-163, seguindo o prompt original de docs/fase3-grupos-de-trabalho.md.
3. Implemente TASK-221, depois TASK-225 (adendo).
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente (além do teste original de checkout/webhook B2B): com uma `Organization` de teste SEM
   CNPJ preenchido, confirme que a cobrança B2B ativa normalmente e gera `FiscalInvoice` com
   `status: 'pending_data'`; com CNPJ preenchido (Grupo 7 precisa estar pronto para preencher via UI, ou
   preencha direto no banco para este teste), confirme emissão real em Sandbox com `organizationId` correto
   e `userId` nulo.
6. Marque `"pass": true` nos steps dos quatro JSONs de task (162, 163, 221, 225) e `"passes": true` em
   `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: cobrança B2B por seat + emissão de NFS-e pelo CNPJ
   da organização (TASK-162, 163, 221, 225)". Descrição com o teste end-to-end original MAIS o cenário de
   nota fiscal B2B, e link para docs/fase4-planejamento.md seção 3.

Definition of Done: acceptanceCriteria de TASK-162, 163, 221 e 225 atendidas e marcadas; checkout e webhook
B2B testados sem regressão na assinatura individual; emissão de NFS-e B2B testada nos dois cenários
(pending_data e emissão real); PR aberto.
```

---

## Grupo 7 — B2B Parte A: Painel da organização + dados fiscais

**Tasks**: TASK-164, TASK-165, TASK-223, TASK-224
**Depende de**: Grupo 5, Grupo 4

### Prompt para a IA

```
ATENÇÃO — confirme antes de começar: Grupo 5 (membros) e Grupo 4 (modelos + campos fiscais de Organization)
mesclados.

Use o prompt completo do grupo "B2B — Painel da organização" já existente em docs/fase3-grupos-de-trabalho.md
(seção "Grupo 5 — B2B: Painel da organização") como base para TASK-164 e TASK-165 — está completo e correto.

ADENDO desta Fase 4 (execute depois de TASK-164/165, mesma branch e mesmo PR): implemente também:

3. TASK-223 — PATCH /api/organizations/me aceita campos fiscais (CNPJ, razão social, endereço), restrito a
   `owner`. Leia .agent/tasks/TASK-223.json.
4. TASK-224 — Formulário de dados fiscais no próprio painel `/organizacao`, visível só para `owner`,
   reaproveitando o padrão do `FiscalDataForm` do aluno individual (TASK-207, Grupo 1) e o autofill por CEP
   (TASK-205, Grupo 1). Leia .agent/tasks/TASK-224.json.

Motivo do adendo: alguém precisa preencher o CNPJ/endereço da organização (TASK-222, Grupo 4) para que a
cobrança B2B (Grupo 6) consiga emitir nota fiscal — o painel do owner é o lugar natural para isso, mesmo
papel que `/perfil` tem para o usuário individual.

Atenção a padrões adicionais para TASK-223/224:
- Reaproveite `requireOrgOwner` (TASK-166, Grupo 5) para restringir o PATCH a `owner` — `member` não deve
  conseguir alterar dado fiscal de cobrança.
- TASK-224 deve seguir o MESMO padrão de `FiscalDataForm` (TASK-207) — lui-input + leitura via `shadowRoot`,
  nunca react-hook-form (AGENTS.md).
- Member (não-owner) NÃO deve ver esta seção, nem em modo leitura — diferente da lista de membros (que
  member vê em modo leitura), dado fiscal de cobrança não é relevante para quem não gerencia a assinatura.

Como trabalhar (mesmos passos do grupo original, mais o adendo):
1. Crie a branch `feat/fase4-b2b-painel` a partir de `main` atualizada (incluindo Grupos 0, 1, 4, 5).
2. Implemente TASK-164, depois TASK-165, seguindo o prompt original.
3. Implemente TASK-223, depois TASK-224 (adendo).
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente (além dos três papéis do teste original): como owner, preencha CNPJ válido e confirme
   persistência; tente um CNPJ inválido e confirme erro inline; confirme que member não vê a seção fiscal.
6. Marque `"pass": true` nos steps dos quatro JSONs de task (164, 165, 223, 224) e `"passes": true` em
   `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: painel de gestão de organização B2B + dados fiscais
   (TASK-164, 165, 223, 224)". Descrição com os três papéis testados MAIS o fluxo de dados fiscais, e link
   para docs/fase4-planejamento.md seção 3. Mencione que este é o último grupo de B2B Parte A.

Definition of Done: acceptanceCriteria de TASK-164, 165, 223 e 224 atendidas e marcadas; os três papéis
testados; fluxo de dados fiscais do owner testado; PR aberto.
```

---

## Grupo 8 — B2B diferencial: Conteúdo próprio + dashboard de engajamento

**Tasks**: TASK-226, TASK-227, TASK-228, TASK-229, TASK-230
**Depende de**: Grupo 4, Grupo 5

> Prioridade #1 de `docs/wiki/b2b-diferenciais.md`: sem conteúdo próprio e dashboard de engajamento, a oferta
> B2B não passa de "a mesma assinatura individual paga em lote", o que dificulta justificar um preço por seat
> acima do individual. Dos 6 diferenciais listados naquele documento, só este e o do Grupo 9 foram
> transformados em tasks granulares nesta rodada — os demais (#3 onboarding/SSO, #4 branding, #5 integração
> de dados) continuam só como documento de visão, sem task, até demanda concreta de um cliente justificar.

### Prompt para a IA

```
ATENÇÃO — confirme antes de começar: Grupo 4 (modelos) e Grupo 5 (membros e acesso) mesclados.

Você vai implementar o primeiro diferencial de produto B2B (de docs/wiki/b2b-diferenciais.md, item 1:
"Conteúdo próprio da organização" + item 2: "Dashboard de engajamento") da Fase 4 da Plataforma de Cursos
(Next.js 16 + Prisma 7). Leia CLAUDE.md, AGENTS.md, docs/wiki/b2b-diferenciais.md e
docs/fase4-planejamento.md seção 3 antes de começar.

Contexto: o que já foi especificado em B2B (Grupos 4 a 7) resolve a parte comercial/técnica (cobrar e dar
acesso a N pessoas), mas o que se vende ainda é só "o mesmo catálogo, pago em lote". Este grupo permite que a
empresa cliente tenha conteúdo próprio (treinamento interno, onboarding, processos) visível só para seus
membros, e dá ao gestor/RH uma visão de progresso da equipe que hoje não existe para ninguém além do próprio
aluno.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-226 — Campo organizationId opcional em Course (migration + filtro do catálogo público)
2. TASK-227 — Controle de acesso a curso de organização em access.ts (extensão de checkLessonAccess/
   checkCourseAccess, isolamento entre organizações)
3. TASK-228 — Seletor de organização no CourseForm admin (autoria continua restrita a admin, ver nota abaixo)
4. TASK-229 — GET /api/organizations/me/engagement agregação de progresso por membro
5. TASK-230 — UI do dashboard de engajamento no painel /organizacao

Dependências externas: nenhuma além dos Grupos 4 e 5 já mesclados.

Decisão de escopo assumida nesta rodada (registrar no PR, não validada com cliente corporativo concreto):
autoria de curso de organização continua sendo feita pelo ADMIN da plataforma (mesma tela `/admin/cursos`,
só com um seletor de organização) — NÃO é self-service para o owner da organização. Construir um sistema de
permissões novo para autoria por terceiros é um investimento maior que não está justificado sem demanda
concreta de um cliente específico pedindo isso. Não expanda o escopo para self-service sem confirmar antes.

Atenção a padrões do projeto:
- Cursos com `organizationId` preenchido NUNCA podem aparecer no catálogo público (`/cursos`,
  `GET /api/courses`) — filtre explicitamente, não confie em omissão.
- `checkLessonAccess`/`checkCourseAccess` (`src/lib/access.ts`) continuam sendo a fonte única de verdade — a
  checagem de curso de organização é uma camada ADICIONAL, e precisa ser simétrica nas duas funções (mesmo
  princípio já aplicado ao drip content, ver AGENTS.md). Teste isolamento entre DUAS organizações diferentes,
  não só "organização vs. sem organização".
- A métrica de "atrasado" no dashboard de engajamento é uma proxy simples (matriculado há mais de 14 dias
  sem progresso recente, sem conclusão) — não crie um campo dedicado de status, calcule na agregação, mesmo
  espírito da proxy de drop-off já usada no event tracking (TASK-194, Fase 3).
- Reaproveite `<lui-card>`/`<lui-tag>` do design system na UI do dashboard de engajamento, consistente com o
  resto do painel admin/organização.

Como trabalhar:
1. Crie a branch `feat/fase4-b2b-conteudo-engajamento` a partir de `main` atualizada (incluindo Grupos 0, 1,
   4, 5).
2. Implemente as 5 tasks na ordem listada.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: crie um curso vinculado a uma organização de teste A, confirme que NÃO aparece em
   `/cursos`; confirme que um membro da organização B (diferente) não consegue acessá-lo mesmo com assinatura
   B2B ativa na própria B; acesse o dashboard de engajamento como owner da organização A com membros em
   diferentes estados de progresso (concluído, em andamento, atrasado) e confirme os números.
6. Marque `"pass": true` nos steps dos cinco JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: conteúdo próprio de organização + dashboard de
   engajamento B2B (TASK-226 a 230)". Descrição com o isolamento entre organizações testado e a decisão de
   escopo (autoria admin, não self-service) documentada, e link para docs/wiki/b2b-diferenciais.md item 1/2.

Definition of Done: acceptanceCriteria de TASK-226 a 230 atendidas e marcadas; isolamento de conteúdo entre
organizações testado; dashboard de engajamento exibindo dados corretos; PR aberto.
```

---

## Grupo 9 — B2B diferencial: Compliance e auditoria

**Tasks**: TASK-231, TASK-232, TASK-233, TASK-234
**Depende de**: Grupo 5

> Prioridade #2 de `docs/wiki/b2b-diferenciais.md`: gancho de venda para empresas reguladas ou com
> treinamento obrigatório recorrente.

### Prompt para a IA

```
ATENÇÃO — confirme antes de começar: Grupo 5 (membros e acesso) mesclado.

Você vai implementar o segundo diferencial de produto B2B (docs/wiki/b2b-diferenciais.md, item 3:
"Compliance e auditoria") da Fase 4 da Plataforma de Cursos (Next.js 16 + Prisma 7). Leia CLAUDE.md, AGENTS.md
e docs/wiki/b2b-diferenciais.md antes de começar.

Contexto: empresas reguladas (compliance, NRs, treinamento obrigatório recorrente) precisam de exportação em
lote de certificados, validade/renovação, e um log de conclusão exportável para o RH — diferente do
`AdminAuditLog` existente, que é só para ações administrativas internas da plataforma.

Tasks deste grupo, na ordem (leia o spec completo em .agent/tasks/TASK-<id>.json):
1. TASK-231 — Campo expiresAt (validade) em Certificate
2. TASK-232 — GET /api/organizations/me/certificates/export exportação em lote (CSV)
3. TASK-233 — Lembrete automático de renovação (PRIMEIRO cron job do projeto — sem padrão anterior a seguir)
4. TASK-234 — GET /api/organizations/me/compliance-log exportação de conclusões (CSV)

Dependências externas: nenhuma nova variável de ambiente — `CRON_SECRET` já está reservado em `.env.local`
desde antes desta Fase, mas nunca foi consumido em código; esta é a primeira implementação real que o usa.

Atenção a padrões do projeto:
- `expiresAt` é opcional e não tem nenhuma lógica de preenchimento automático nesta rodada (preenchimento é
  manual) — não invente um sistema de periodicidade por curso, fora de escopo.
- TASK-233 é a primeira tarefa agendada do projeto — não existe `vercel.json` nem `vercel.ts` ainda. Decida
  entre os dois na implementação (a Vercel recomenda `vercel.ts` atualmente) e documente a escolha no PR.
  Proteja a rota com `Authorization: Bearer ${CRON_SECRET}`, 401 se incorreto.
- TASK-232/234 seguem o MESMO padrão de geração de CSV já usado em `GET /api/admin/users/export` — não
  invente um formato novo.
- Não confunda o log de compliance (TASK-234, atividade do ALUNO) com `AdminAuditLog` (`src/lib/audit.ts`,
  ações administrativas internas) — são dados e propósitos diferentes, tabelas separadas.
- Ambos os exports (232, 234) consideram só membros ATUAIS da organização — membro removido não aparece mais.

Como trabalhar:
1. Crie a branch `feat/fase4-b2b-compliance` a partir de `main` atualizada (incluindo Grupos 0, 1, 4, 5).
2. Implemente as 4 tasks na ordem listada.
3. Confira as acceptanceCriteria de cada task antes de seguir para a próxima.
4. Valide: `npx tsc --noEmit` e `npx vitest run` sem erros novos.
5. Teste manualmente: crie um certificado de teste com `expiresAt` em 15 dias, chame a rota de cron
   manualmente com o `CRON_SECRET` correto via curl, confirme o e-mail recebido e que uma segunda chamada não
   reenvia; exporte certificados e log de compliance de uma organização de teste e confirme o CSV.
6. Marque `"pass": true` nos steps dos quatro JSONs de task e `"passes": true` em `.agent/tasks.json`.
7. Commit(s) e abra PR com `gh pr create`. Título: "feat: compliance e auditoria B2B — validade de
   certificado, exportação e log de conclusão (TASK-231 a 234)". Descrição com o teste do cron e dos exports,
   a decisão entre `vercel.ts`/`vercel.json` documentada, e link para docs/wiki/b2b-diferenciais.md item 3.

Definition of Done: acceptanceCriteria de TASK-231 a 234 atendidas e marcadas; cron testado manualmente
(incluindo idempotência); exports de certificados e compliance-log validados; PR aberto.
```

---

## Diferenciais B2B sem task (backlog, ver docs/wiki/b2b-diferenciais.md)

Por decisão explícita ao gerar estas tasks, só os 2 itens de maior prioridade (#1/#2, Grupos 8 e 9) foram
transformados em tasks granulares. Os demais continuam só como documento de visão, sem task gerada, até
demanda concreta de um cliente corporativo justificar o investimento:

- **#3 Onboarding e integração corporativa** — importação em massa via CSV, SSO corporativo, desativação
  sincronizada com saída do colaborador.
- **#4 Branding e experiência** — portal com logo/cores da empresa cliente, certificado co-branded.
- **#5 (dentro de #2) Alertas automáticos e atribuição de trilhas obrigatórias** — "colaborador X não iniciou
  o treinamento Y", trilhas obrigatórias por cargo/departamento com prazo.
- **#6 Dados e integração** — API/webhook de progresso para LMS/HRIS próprio do cliente corporativo.

Se qualquer um destes for priorizado depois, gerar tasks granulares seguindo o mesmo formato deste documento,
condicionado a ter requisito concreto de um cliente real — não especular escopo sem isso (mesmo princípio já
aplicado nesta rodada).

## Referências

- `docs/fase4-planejamento.md` — escopo e decisões das três frentes da Fase 4
- `docs/wiki/nota-fiscal-nfse.md` — viabilidade de NFS-e e recomendação do Asaas
- `docs/wiki/asaas-vs-stripe.md` — por que o Asaas não substitui a Stripe como gateway
- `docs/wiki/b2b-diferenciais.md` — diferenciais de produto do B2B, priorização e itens sem task
- `docs/fase3-grupos-de-trabalho.md` — prompts originais de B2B Parte A (`TASK-151` a `166`), reaproveitados
  com adendo nos Grupos 4, 6 e 7 deste documento
- `.agent/prd/PRD.md` seção 14.6 — decisão de despriorização original do B2B na Fase 3; revertida nesta Fase
  4 com a confirmação de demanda em 2026-06-23 (ver nota no topo deste documento e em
  `docs/fase4-planejamento.md`)
