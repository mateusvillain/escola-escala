# Fase 4 — Planejamento

> **Nível deste documento: escopo e decisões, não execução.** Diferente de
> `docs/fase3-grupos-de-trabalho.md` (que assume tasks já geradas em `.agent/tasks/`), este documento define
> o que entra em cada frente e a ordem proposta. **Atualização:** as tasks granulares (`TASK-202` a `234`,
> mais `TASK-151` a `166` reativadas) e `docs/fase4-grupos-de-trabalho.md` já foram gerados — este documento
> continua valendo como registro do raciocínio e das decisões de escopo por trás delas.

A Fase 4 cobre três frentes, na ordem em que foram solicitadas:

1. **Complemento do cadastro de usuários** (CPF, endereço)
2. **Emissão de nota fiscal (NFS-e) usando Asaas**
3. **Planos B2B** — retomada do que foi despriorizado na Fase 3

Essas três frentes não são independentes: o item 1 é pré-requisito técnico do item 2 (não dá pra emitir
nota fiscal sem CPF/CNPJ e endereço do tomador), e o item 3, se retomado, expande quem precisa desse mesmo
dado fiscal (a organização compradora, não só o usuário individual). A seção "Ordem de execução proposta"
detalha isso.

## 0. Pré-requisitos não-técnicos (bloqueantes, fora do código)

Antes de gerar qualquer task granular, três coisas fora do código precisam estar resolvidas ou em andamento
— nenhuma delas se resolve só com implementação:

| Pré-requisito | Bloqueia | Status |
|---|---|---|
| **`TASK-82`** — deploy de produção na Vercel | Só a **emissão real** de nota fiscal contra receita real do item 2 — **não bloqueia desenvolvimento/teste**, ver detalhe abaixo | Pendente — já listada em `CLAUDE.md` como bloqueante de `TASK-201` e do Grupo 9 da Fase 3 (rate limiting distribuído); agora também bloqueia a emissão real da Fase 4 |
| Abertura de conta Asaas PJ + confirmação com o contador (regime tributário, município de incidência do ISS, código de serviço da LC 116/2003) | Item 2 — ver `docs/wiki/nota-fiscal-nfse.md` | Não iniciado |
| Validação de demanda de clientes corporativos com o cliente do projeto | Item 3 inteiro — decisão de produto, registrada em `.agent/prd/PRD.md` seção 14.6 | **Confirmado em 2026-06-23** — ver nota abaixo |

**`TASK-82` não bloqueia o desenvolvimento do item 2.** O Sandbox do Asaas (`api-sandbox.asaas.com`) é um
ambiente isolado, com conta própria e sem custo, e o ciclo completo (emitir, consultar, cancelar nota,
inclusive o webhook de retorno) pode ser testado usando o próprio modo de teste da Stripe que o projeto já
usa hoje (`stripe listen` + `stripe trigger`) — sem depender de deploy nenhum. `TASK-82` só importa no
momento de emitir uma nota fiscal real, vinculada a receita real, contra o CNPJ real da empresa: antes do
deploy a Stripe está em modo teste (sem receita real para documentar) e a conta Asaas de produção ainda nem
precisa existir. Ou seja: todas as tasks de implementação e teste do item 2 podem ser feitas e validadas
agora; o que fica pendente de `TASK-82` é só o momento de trocar a chave de API do Asaas de Sandbox para
produção e começar a emitir notas de verdade.

**A validação de demanda B2B foi confirmada em 2026-06-23.** O produto quer suportar assinatura tanto por
pessoa física (B2C, já existente) quanto por pessoa jurídica comprando para os seus colaboradores (B2B), com
os benefícios diferenciais já documentados em `docs/wiki/b2b-diferenciais.md`, disponível já no lançamento da
plataforma — que ainda não tem data definida. Isso reverte a decisão de despriorização registrada em
`.agent/prd/PRD.md` seção 14.6 (decisão tomada na Fase 3): o item 3 deste documento deixa de ser condicional
e passa a fazer parte do escopo confirmado da Fase 4, seguindo a ordem técnica já descrita na seção "Ordem de
execução proposta" abaixo. As tasks de B2B (`TASK-151` a `166`) já foram movidas de volta para
`.agent/tasks/` e as tasks novas (`TASK-202` a `234`, incluindo os campos fiscais de `Organization`) já foram
geradas — ver `docs/fase4-grupos-de-trabalho.md`.

> Nota de setup: para testar o **webhook** do Asaas (não só a chamada de emissão) em desenvolvimento local,
> provavelmente é necessário expor o `localhost` via túnel (ex. ngrok) — diferente da Stripe, não há
> indicação de uma ferramenta equivalente ao `stripe listen` para reenvio direto à porta local. É só uma
> questão de setup, não um bloqueio.

---

## 1. Complemento do cadastro de usuários

### Por que

Identificado em `docs/wiki/nota-fiscal-nfse.md`: o `model User` (`prisma/schema.prisma`) hoje só tem
`email`, `name`, `avatarUrl`, `stripeCustomerId` — nenhum dado fiscal. É pré-requisito comum a qualquer
caminho de emissão de NFS-e, e também é dado que cresce em valor para a plataforma de forma independente da
nota fiscal (ex.: segmentação, prevenção de fraude, conformidade LGPD de dado mínimo necessário).

### Escopo proposto

- **Campos novos em `User`:** CPF (pessoa física) ou CNPJ (quando a compra for em nome de empresa — relevante
  já pensando no item 3), e endereço completo (rua, número, complemento, bairro, cidade, UF, CEP). Decisão a
  tomar na geração de tasks: campos flat em `User` (consistente com o estilo atual do schema, ex.
  `avatarUrl`) vs. um model `Address` separado — recomendo flat, não há caso de uso hoje para múltiplos
  endereços por usuário.
- **Validação de CPF/CNPJ:** função de checksum (dígito verificador), no mesmo espírito de
  `src/lib/utils/slug.ts` — não existe hoje no projeto.
- **Autofill de endereço por CEP:** ViaCEP (API pública brasileira, gratuita, sem chave) para preencher
  cidade/UF/bairro a partir do CEP — reduz fricção de formulário, mas é uma dependência externa nova a
  avaliar (timeout/fallback se a API estiver fora do ar não pode bloquear o cadastro).
- **Onde coletar — decisão de produto pendente:**
  - Opção A: campo obrigatório no cadastro (`/cadastro`) — mais fricção bem na entrada, e o cadastro já
    ganhou um passo extra na Fase 3 (Embedded Checkout, Grupo 12); adicionar mais campos aqui pode piorar
    conversão.
  - Opção B (recomendada): opcional no cadastro, exigido depois em `/perfil` (que já tem edição de perfil)
    antes da primeira emissão de nota fiscal — ou seja, só vira obrigatório no momento em que efetivamente
    bloqueia algo (emitir a nota), não na entrada.
  - Em qualquer opção, o acesso ao curso/assinatura **nunca** deve ficar bloqueado por falta desse dado — só
    a emissão da nota fiscal fica pendente (ver item 2).
- **Visibilidade admin:** exibir em `/admin/usuarios/[id]` (endpoint `GET /api/admin/users/[id]` já existe),
  útil para suporte resolver nota fiscal pendente por dado faltante.
- **Ponto de atenção LGPD:** CPF é dado pessoal mais sensível que o que a plataforma guarda hoje (e-mail,
  nome). Vale revisar controle de acesso a esse campo nas APIs admin (não retornar em listagens gerais,
  só no detalhe) — decisão a confirmar na geração de tasks, não é over-engineering, é a mesma camada de
  cuidado já aplicada a `passwordHash`/`resetToken`.

---

## 2. Emissão de nota fiscal (NFS-e via Asaas)

### Por que e com qual ferramenta

Já decidido em `docs/wiki/nota-fiscal-nfse.md` (Asaas como emissor, não como gateway de pagamento — ver
`docs/wiki/asaas-vs-stripe.md` para por que a Stripe continua sendo o processador de pagamento) e
confirmado que automação e testes em Sandbox são viáveis sem custo. Esta seção assume essas decisões e
detalha o que falta para implementar.

### Escopo proposto

- **Cliente Asaas (`src/lib/asaas.ts`):** wrapper da API, no mesmo espírito de `src/lib/bunny.ts` —
  encapsula autenticação (chave de API) e as chamadas de criar/consultar/cancelar nota fiscal avulsa.
- **Modelo novo (`FiscalInvoice` ou similar):** registro interno de cada nota — `userId` (ou
  `organizationId`, ver interação com o item 3), referência da cobrança Stripe de origem
  (`stripeInvoiceId`/`stripeSessionId`), `asaasInvoiceId`, `status`, `pdfUrl`, timestamps. Necessário por
  dois motivos: **idempotência** (webhook da Stripe pode reentregar — sem um registro único por cobrança, o
  mesmo pagamento geraria duas notas) e **entrega ao aluno** (ver subseção "Entrega ao aluno" abaixo).
- **Gatilho de emissão:** dentro de `handleInvoicePaymentSucceeded`/`handleCheckoutSessionCompleted`
  (`src/lib/stripe-handlers.ts`), depois que o pagamento é confirmado — chamando o cliente Asaas. Se o
  usuário não tiver CPF/CNPJ ou endereço preenchidos (item 1), a emissão fica marcada como pendente, **sem
  bloquear o acesso ao curso/assinatura já concedido**.
- **Webhook novo (`POST /api/webhooks/asaas`):** para receber atualização de status da nota (emitida, erro,
  cancelada) — fonte de webhook separada da Stripe, com verificação própria de autenticidade (token do
  Asaas), seguindo o mesmo princípio de verificação de assinatura já usado em `POST /api/webhooks/stripe`,
  mas não o mesmo mecanismo (são plataformas diferentes).
- **Mapeamento plano/produto → código de serviço municipal:** análogo a `buildPriceMap()`
  (`src/lib/stripe-handlers.ts`), mas mapeando `priceId`/produto para o código de serviço da LC 116/2003
  confirmado com o contador (ver pré-requisito na seção 0).
- **Painel de pendências (admin):** lista de notas não emitidas por dado faltante ou erro da API, para
  acompanhamento manual — não é um sistema de retry automático nesta rodada, é visibilidade mínima para não
  perder nota fiscal de vista.
- **Ambiente:** todo o desenvolvimento e teste usa `api-sandbox.asaas.com` (gratuito, ciclo completo
  testável conforme `docs/wiki/nota-fiscal-nfse.md`) até a confirmação da `TASK-82`.

### Entrega ao aluno (dois canais complementares)

A nota chega ao aluno por **dois canais**, não um ou outro — um cobre a entrega ativa (push), o outro
garante acesso permanente independente do que aconteceu com o e-mail (pull):

1. **E-mail automático — canal primário, nativo do Asaas.** O Asaas tem sistema de notificação por
   `Customer` (campos `email` e `notificationDisabled` na criação do cliente — ver
   [Create new customer](https://docs.asaas.com/reference/create-new-customer)), e a documentação de produto
   confirma que **o cliente recebe a nota fiscal por e-mail automaticamente**, na data de emissão configurada
   (`effectiveDate`) — ver [asaas.com/nota-fiscal](https://www.asaas.com/nota-fiscal): "Seu cliente receberá
   a nota por e-mail na data que você configurou". Ou seja, ao criar o `Customer` no Asaas para a nota avulsa
   (`customer.email` = e-mail do aluno), **o envio do e-mail não precisa ser construído por nós** — é nativo
   da plataforma, desde que `notificationDisabled` não seja `true`. Não é uma suposição: é o mesmo sistema de
   notificação documentado em
   [Default notifications](https://docs.asaas.com/docs/default-notifications) e
   [Changing notifications of a client](https://docs.asaas.com/docs/changing-notifications-of-a-client),
   aplicado a notas fiscais.
   - **Validar no Sandbox durante a implementação (não confirmado pela documentação pública):**
     (a) se esse e-mail nativo dispara igual quando o `Customer` é usado **só para nota avulsa**, sem
     cobrança processada pelo Asaas — que é exatamente o nosso caso (Stripe continua sendo o gateway, ver
     `docs/wiki/asaas-vs-stripe.md`); a documentação descreve o produto de nota fiscal em geral, não esse
     caso de borda específico; (b) se o conteúdo/remetente do e-mail (branding Asaas, não da plataforma) é
     aceitável para o aluno.
   - **Default proposto:** começar com o e-mail nativo do Asaas (zero código extra, `notificationDisabled:
     false`). Só substituir por e-mail próprio via Resend (mesmo canal já usado para recuperação de senha,
     ver `AGENTS.md`/serviços externos) disparado pelo webhook `INVOICE_AUTHORIZED` se o teste em Sandbox
     mostrar que (a) falhou ou (b) o branding ficou inadequado. Evitar mandar os dois — gera duplicidade.
2. **Download no painel do aluno — canal permanente, pull.** Independente do e-mail (pode cair em spam, ser
   apagado, ou usar um e-mail desatualizado), a nota fica disponível para download em `/dashboard` ou
   `/perfil`, no mesmo padrão de `GET /api/certificates/[courseId]/download`, usando o campo `pdfUrl` do
   `FiscalInvoice` já previsto acima.
   - **Validar no Sandbox durante a implementação:** o endpoint/campo exato que devolve a URL do PDF — a
     busca na documentação pública não expôs o schema completo de resposta de
     [Recuperar uma nota fiscal](https://docs.asaas.com/reference/recuperar-uma-nota-fiscal) (`GET
     /v3/invoices/{id}`); confirmar isso durante a implementação e popular `FiscalInvoice.pdfUrl` a partir
     daí (provavelmente no handler do webhook `INVOICE_AUTHORIZED`, mesmo ponto que atualiza o `status`).

Os dois canais leem do mesmo registro `FiscalInvoice` — o e-mail nativo do Asaas não substitui esse registro
interno, que continua existindo pelos motivos de idempotência já descritos acima.

### Decisão pendente

Emitir nota por cobrança individual (cada ciclo de assinatura) ou em lote mensal? Afeta o desenho do
gatilho acima — fica para confirmar com o contador junto dos outros itens da seção 0.

---

## 3. Planos B2B (retomada do que foi despriorizado na Fase 3)

### Estado atual

B2B foi especificado em detalhe na Fase 3 (`TASK-151` a `TASK-166`, 4 sub-grupos: Modelos, Membros/Acesso,
Cobrança por seat, Painel) e depois despriorizado em 2026-06-21 por falta de validação de demanda — não por
inviabilidade técnica (`.agent/prd/PRD.md` seção 14.6). Os prompts de execução completos continuam em
`docs/fase3-grupos-de-trabalho.md`, seção "Grupos despriorizados — B2B".

**A decisão de retomar isso na Fase 4 foi confirmada em 2026-06-23** (ver seção 0): a demanda de clientes
corporativos existe, e o produto quer oferecer assinatura B2B (pessoa jurídica comprando para colaboradores)
já no lançamento da plataforma, sem data definida ainda. As tasks `TASK-151` a `166` já foram movidas de
volta de `.agent/tasks/deprecated/` para `.agent/tasks/`, e a task nova de campos fiscais em `Organization`
(`TASK-222`) e as tasks de diferenciais priorizados (`TASK-226` a `234`) já foram geradas — ver
`docs/fase4-grupos-de-trabalho.md`. O que segue não é mais uma suposição condicional.

### Escopo proposto

**Parte A — reaproveitar o que já está especificado, com uma lacuna confirmada:** verificação feita
diretamente nos JSONs de `TASK-151` a `166` (não só no resumo de `docs/fase3-grupos-de-trabalho.md`) confirma
que a maior parte do spec continua válida sem alteração e pode ser movida de volta para `.agent/tasks/` sem
mudança: `TASK-152`/`153` (membros/convites), `TASK-155`/`157`–`161`/`166` (acesso e autorização), `TASK-154`
(modelo de assinatura por seat) e `TASK-165` (página pública) — nenhuma toca dado fiscal. Mas **não é só mover
os arquivos**:
- `TASK-151` (model `Organization`) hoje só tem `id, name, slug, stripeCustomerId, seatLimit, createdAt,
  updatedAt` — confirmado, nenhum campo fiscal. Nem `TASK-156` (`POST /api/organizations`, criação) nem
  `TASK-164` (painel `/organizacao`) coletam CNPJ/razão social/endereço da organização — não existe hoje
  nenhuma task que colete esse dado. Falta uma task nova para isso (ver "Numeração de tasks reservada").
- `TASK-162`/`163` (checkout e webhook de cobrança por seat) **não precisam ser reescritas** — já diferenciam
  corretamente `organizationId` vs `userId` via metadata, design que já antecipava múltiplos tipos de
  assinatura. `TASK-163` só precisa GANHAR um passo adicional: disparar a emissão de nota fiscal pela
  `Organization.cnpj`/endereço em vez do `User` do owner, análogo ao gatilho que o item 2 cria para `User` —
  ver detalhe em "Interação com os itens 1 e 2" abaixo.

**Parte B — diferenciais de produto, ainda sem task:** `docs/wiki/b2b-diferenciais.md` lista o que falta
para o B2B ser mais do que "a mesma assinatura individual paga em lote" — nenhum desses itens tem task
gerada. A priorização sugerida naquele documento:
1. Conteúdo próprio da organização + dashboard de engajamento para o RH/gestor — sem isso, difícil justificar
   preço por seat acima do individual
2. Compliance e auditoria (exportação de certificados, validade/renovação) — gancho de venda para empresas
   reguladas
3. Onboarding corporativo (CSV em massa, SSO) e branding — reduzem fricção de adoção/renovação
4. Integração de dados (API/webhook de progresso) — só relevante para contas enterprise grandes

Esta Fase 4 cobre, no mínimo, a Parte A (retomar TASK-151 a 166). Se a Parte B entrar também depende de
quanto da demanda validada já aponta para diferenciais específicos — não dá pra priorizar a Parte B sem
saber o que o cliente corporativo concreto está pedindo.

### Interação com os itens 1 e 2 (importante, confirmado nos specs reais)

Se a cobrança B2B por seat (`TASK-162`/`163`, Stripe Billing com `OrganizationSubscription`) for retomada,
ela cria uma nova origem de receita que também precisa de nota fiscal — mas para o **CNPJ da organização
compradora**, não para o CPF do usuário individual que é `owner`. Confirmado lendo os JSONs de `TASK-151`,
`156` e `164` (não é só uma suposição de design): nenhum dos três cobre dado fiscal de organização. Isso
significa:
- Task nova, dependência de `TASK-151`, antes de `TASK-162`/`163`: adiciona CNPJ, razão social e endereço ao
  `model Organization` (mesmos campos do item 1, mas como entidade própria — a organização é quem emite a
  nota, não o `owner` individual) e um ponto de coleta (provável: formulário no painel `TASK-164`, mesmo
  espírito da Opção B do item 1 — opcional até bloquear a emissão de nota, nunca o acesso).
- O gatilho de emissão do item 2 precisa de um branch a mais: na cobrança B2B (`metadata.organizationId`,
  já diferenciado em `TASK-163`), emitir pelo `Organization.cnpj`/endereço em vez do `User` do owner. Isso é
  um passo adicional dentro de `TASK-163`, não uma reescrita do que já está especificado lá.
- Essa dependência só é bloqueante na prática se o item 2 (NFS-e) já estiver implementado quando B2B for
  retomado — se B2B for retomado primeiro, a emissão B2B fica pendente pelo mesmo motivo e com o mesmo
  tratamento (não bloqueia acesso) que o item 2 já prevê para `User` sem CPF/endereço.

Essa dependência cruzada é o principal motivo para a ordem proposta abaixo.

---

## Ordem de execução proposta

```
Item 1 (cadastro: CPF/endereço do User)
        │
        ▼
Item 2 (NFS-e via Asaas) ──── pode começar em paralelo no Sandbox,
        │                     mas emissão real depende de TASK-82
        ▼
Item 3 (B2B) ── independente tecnicamente dos itens 1 e 2, MAS:
                 - demanda confirmada em 2026-06-23 — não é mais um gate de produto
                 - "Organization" precisa dos mesmos campos fiscais do
                   item 1 (CNPJ/endereço próprios) antes da cobrança por seat
```

1. **Item 1 primeiro** — é prerequisito técnico direto do item 2, e baixo risco/escopo bem contido.
2. **Item 2 em seguida** (ou em paralelo, usando Sandbox, enquanto a `TASK-82` não é concluída) — depende do
   item 1 para ter o que emitir.
3. **Item 3 confirmado, mas tecnicamente independente dos itens 1 e 2** — a demanda já foi validada
   (2026-06-23), então não há mais gate de produto bloqueando a implementação. O `model Organization` ganha
   os campos fiscais (`TASK-222`) **antes** da cobrança por seat ser implementada, evitando a migration de
   correção que aconteceria se a ordem fosse invertida — ver `docs/fase4-grupos-de-trabalho.md` Grupo 4.

## Numeração de tasks reservada

Próximo número livre: `TASK-202`. Proposta de faixas (a confirmar na geração granular de tasks):

| Item | Faixa proposta |
|---|---|
| 1. Complemento de cadastro | `TASK-202` a `TASK-20X` |
| 2. NFS-e via Asaas | `TASK-2XX` em diante, após o item 1 |
| 3. B2B — Parte A (reaproveitada sem mudança) | reaproveita `TASK-152`–`154`, `155`, `157`–`161`, `165`, `166` (mover de `deprecated/` para `tasks/`, sem renumerar) |
| 3. B2B — Parte A (campos fiscais em `Organization`) | numeração nova (`TASK-2XX`, faixa do item 3), depende de `TASK-151`, bloqueia `TASK-162`/`163` — ver "Interação com os itens 1 e 2" |
| 3. B2B — Parte A (`TASK-151`, `156`, `163`) | reaproveitadas com adendo: `TASK-151` ganha os campos fiscais da task nova acima, `TASK-156`/`164` ganham o ponto de coleta, `TASK-163` ganha o passo de emissão pela `Organization` |
| 3. B2B — Parte B (diferenciais) | numeração nova, só quando essa frente for priorizada com escopo confirmado |

## Próximos passos

1. Confirmar os 2 pré-requisitos não-técnicos da seção 0 que ainda restam pendentes (`TASK-82`/deploy de
   produção e abertura de conta Asaas PJ de produção) — a validação de demanda B2B já foi confirmada em
   2026-06-23 e não é mais uma pendência.
2. ~~Resolver as decisões de escopo pendentes nos itens 1 e 2~~ — resolvidas na geração das tasks granulares
   (Opção B de coleta de dado fiscal; emissão por cobrança individual assumida no desenho do gatilho).
   Granularidade de emissão (individual vs. lote mensal) ainda depende de confirmação com o contador.
3. ~~Gerar as tasks granulares~~ — feito: `TASK-202` a `234`, mais `TASK-151` a `166` reativadas, ver
   `docs/fase4-grupos-de-trabalho.md`.
4. ~~Escrever `docs/fase4-grupos-de-trabalho.md`~~ — feito.
5. Adicionar uma seção 15 a `.agent/prd/PRD.md` espelhando a seção 14 — ainda pendente, não bloqueia a
   implementação dos grupos já definidos em `docs/fase4-grupos-de-trabalho.md`.

## Referências

- `docs/wiki/nota-fiscal-nfse.md` — viabilidade de NFS-e e recomendação do Asaas
- `docs/wiki/asaas-vs-stripe.md` — por que o Asaas não substitui a Stripe como gateway
- `docs/wiki/b2b-diferenciais.md` — diferenciais de produto do B2B ainda sem task
- `docs/fase3-grupos-de-trabalho.md` — seção "Grupos despriorizados — B2B", prompts de `TASK-151` a `166`
- `.agent/prd/PRD.md` seções 14.1, 14.4, 14.6 — spec original de B2B e decisão de despriorização
- [Asaas — nota fiscal (produto)](https://www.asaas.com/nota-fiscal) — confirma envio automático de e-mail
  ao cliente na emissão
- [Asaas — Create new customer](https://docs.asaas.com/reference/create-new-customer) — campos `email` e
  `notificationDisabled`
- [Asaas — Default notifications](https://docs.asaas.com/docs/default-notifications) /
  [Changing notifications of a client](https://docs.asaas.com/docs/changing-notifications-of-a-client) —
  sistema de notificação por cliente
- [Asaas — Webhook para notas fiscais](https://docs.asaas.com/docs/webhook-para-notas-fiscais) — eventos
  `INVOICE_CREATED`/`SYNCHRONIZED`/`AUTHORIZED`/`ERROR`/etc.
- [Asaas — Recuperar uma nota fiscal](https://docs.asaas.com/reference/recuperar-uma-nota-fiscal) — `GET
  /v3/invoices/{id}`, schema de resposta a confirmar na implementação
