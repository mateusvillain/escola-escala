# Stripe — Precificação e Custos por Forma de Pagamento

> **Atenção:** Os valores abaixo foram coletados em [stripe.com/br/pricing](https://stripe.com/br/pricing) e [stripe.com/pricing/local-payment-methods](https://stripe.com/pricing/local-payment-methods) em junho de 2026. Confirme os valores atuais antes de tomar decisões financeiras — taxas de pagamento mudam com frequência e podem variar por negociação direta com o time de vendas da Stripe (preços "sob consulta" para volumes maiores).

O projeto usa Stripe Checkout (`src/lib/stripe.ts`, API version `2026-05-27.dahlia`) para assinatura recorrente, compra avulsa de curso e, na Fase 3, cobrança B2B por seat. Este documento cobre as taxas de **todas as formas de pagamento relevantes ao projeto**: cartão de crédito, Pix e Boleto, além da taxa do produto de assinaturas (Stripe Billing) que incide por cima da taxa de pagamento em qualquer cobrança recorrente.

---

## Modelo de cobrança

A Stripe não tem mensalidade, taxa de setup nem custo de manter a conta parada — cobra **por transação bem-sucedida**, com a taxa variando por forma de pagamento. Isso significa que o custo da plataforma com a Stripe é diretamente proporcional ao volume processado, não um custo fixo mensal.

Importante: a taxa do produto **Billing** (assinaturas) é **adicional** à taxa de pagamento — uma cobrança recorrente via cartão paga a taxa de cartão **e** a taxa de Billing; uma compra avulsa (pagamento único, fora do produto Billing) paga só a taxa do método de pagamento escolhido.

---

## Os componentes de custo

### 1. Cartão de crédito nacional — 3,99% + R$ 0,39

Taxa padrão para cartões emitidos no Brasil, cobrada a cada transação bem-sucedida (única ou de um ciclo de assinatura).

- Inclui antifraude (Radar) e autenticação 3D Secure sem custo adicional
- Sem chargeback automático para o aluno — disputas são tratadas separadamente (ver item 6)

**Exemplo:** assinatura Premium mensal (R$ 59,90) → taxa de **R$ 2,78** → líquido de **R$ 57,12**

### 2. Cartão de crédito internacional — +2% adicional

Cobrado por cima da taxa de cartão nacional quando o cartão foi emitido fora do Brasil (mesmo pagando em BRL).

- Relevante para brasileiros com cartão emitido no exterior, ou clientes internacionais eventuais
- Plataforma é PT-BR/BRL only (ver `.agent/prd/PRD.md` seção 12) — volume esperado é baixo, mas a taxa existe e não pode ser desativada por método, só monitorada

**Exemplo:** assinatura Premium mensal (R$ 59,90) com cartão internacional → taxa de **R$ 2,78 + 2% (R$ 1,20) ≈ R$ 3,98** → líquido de **R$ 55,92**

### 3. Pix — 1,19% (somente convite, somente pagamento único no Brasil)

O método mais barato disponível, mas com duas restrições importantes para o projeto:

- **Acesso por convite:** contas Stripe sediadas no Brasil precisam ser convidadas pela própria Stripe para habilitar Pix — não é um toggle simples no Dashboard. O critério usual é ter histórico de transações processadas nos últimos ~60 dias em bom standing. **Por isso, Pix foi adiado da Fase 3** — TASK-147 a 150 e TASK-172 cobrem só Boleto por ora. Ver `docs/pix-habilitacao.md` para o passo a passo de solicitação do convite e para os pontos exatos do código a reverter quando ele for concedido.
- **Sem suporte a cobrança recorrente para contas BR:** existe um produto separado, "Pix Automático", que permite recorrência (cliente autoriza uma instrução no app do banco, cobranças futuras acontecem sem ação manual) — mas a documentação oficial da Stripe confirma que **Pix Automático não está disponível para contas brasileiras**. Por isso, mesmo quando Pix for habilitado, ele deve ficar restrito a pagamento único (compra avulsa e bundle de trilha), nunca à assinatura recorrente — não é uma limitação de implementação, é uma limitação da própria Stripe para contas BR.

**Exemplo:** compra avulsa de curso (R$ 197,00) → taxa de **R$ 2,34** → líquido de **R$ 194,66** (vs. R$ 188,75 líquido no cartão — Pix entrega ~R$ 6 mais por venda no mesmo preço)

### 4. Boleto bancário — R$ 3,45 por boleto pago (taxa fixa)

Diferente dos outros métodos, a taxa do Boleto é **fixa em reais**, não percentual — isso muda completamente o cálculo dependendo do valor da cobrança:

- Suporta **pagamento único e recorrente** (assinatura), inclusive em `mode: 'subscription'` do Checkout — diferente do Pix, não há bloqueio estrutural aqui. Isso é relevante para a investigação da TASK-150.
- **Confirmação em ~1 dia útil**, com fundos disponíveis para repasse após mais ~2 dias úteis (total de até 3 dias úteis). Numa assinatura, isso significa que a cobrança de renovação pode ficar em estado pendente por 1+ dia útil antes do webhook confirmar — o tratamento de `past_due`/eventos assíncronos das TASK-148/150 precisa tolerar essa janela sem bloquear acesso prematuramente.
- **Taxa fixa funciona mal para valores baixos:** num boleto de R$ 29,90 (assinatura Básico mensal), R$ 3,45 representa **11,5% do valor** — muito mais caro que cartão (~5,3% efetivo) ou Pix (1,19%). Já num boleto de R$ 599,00 (assinatura Premium anual) ou numa compra avulsa de R$ 197,00, a mesma taxa fixa representa só 0,6% e 1,8% respectivamente — extremamente barato.

**Exemplo (compra avulsa, R$ 197,00):** taxa de **R$ 3,45** → líquido de **R$ 193,55**
**Exemplo (hipotético, assinatura Básico mensal R$ 29,90):** taxa de **R$ 3,45** → líquido de **R$ 26,45** (apenas 88,5% do valor chega líquido)

### 5. Stripe Billing (taxa de assinatura) — +0,7% do volume

Cobrada **adicionalmente** à taxa de pagamento sempre que a cobrança passa pelo produto de assinaturas (Subscriptions/Billing) — ou seja, toda assinatura individual (Básico/Premium) e toda assinatura B2B por seat da Fase 3 (TASK-162/163). **Não incide em compra avulsa de curso nem em bundle de trilha**, porque esses fluxos usam Checkout Session em `mode: 'payment'` (pagamento único), fora do produto Billing.

**Exemplo:** assinatura Premium mensal (R$ 59,90) no cartão → taxa de cartão (R$ 2,78) **+** taxa de Billing (0,7% × 59,90 = R$ 0,42) = **R$ 3,20 total** → líquido de **R$ 56,70**

### 6. Disputas e chargebacks (somente cartão)

- **R$ 55,00** por contestação recebida — cobrado quando o titular do cartão contesta a cobrança, independente do resultado
- **Refutação manual:** mais R$ 55,00 para contestar a disputa (devolvido se a Stripe decidir a favor do negócio)
- **Smart Disputes** (ferramenta automatizada da Stripe para contestar): 30% do valor disputado, cobrado **somente se ganhar** — sem custo se perder
- **Pix e Boleto não têm chargeback** — uma vantagem estrutural desses métodos sobre cartão para este tipo de produto (assinatura/curso), já que elimina o risco de contestação fraudulenta após o conteúdo já ter sido consumido

### 7. Conversão de moeda — a partir de 2%

Aplicável quando a moeda de liquidação da conta Stripe difere da moeda da cobrança. Como a conta do projeto é brasileira e toda cobrança é em BRL (`.agent/prd/PRD.md` seção 12, "a plataforma opera apenas com pagamentos em BRL"), esta taxa **não se aplica** no fluxo normal — ela só apareceria combinada com a sobretaxa de cartão internacional (item 2), não como uma cobrança separada adicional para este projeto.

---

## Tabela comparativa — mesma cobrança, métodos diferentes

| Cobrança | Cartão (+ Billing se recorrente) | Pix | Boleto |
|---|---|---|---|
| Assinatura Básico mensal (R$ 29,90) | R$ 1,79 (6,0%) | — (sem suporte a recorrência no BR) | R$ 3,45 (11,5%) — caro pra esse valor |
| Assinatura Premium mensal (R$ 59,90) | R$ 3,20 (5,3%) | — | R$ 3,87 (6,5%) — inclui taxa de Billing |
| Assinatura Premium anual (R$ 599,00) | R$ 28,48 (4,8%) | — | R$ 7,64 (1,3%) — muito mais barato no plano anual |
| Compra avulsa de curso (R$ 197,00, ilustrativo) | R$ 8,25 (4,2%) | R$ 2,34 (1,19%) | R$ 3,45 (1,8%) |
| B2B, 10 seats × R$ 49,90 (R$ 499,00, ilustrativo) | R$ 23,79 (4,8%) | — | R$ 6,94 (1,4%) |

> Valores de curso avulso e seat B2B são **ilustrativos** — o catálogo real ainda não tem preço de compra avulsa configurado em nenhum curso, e o preço por seat B2B ainda não foi definido (ver `.agent/tasks/TASK-162.json`).

**Leitura prática:** Pix é o mais barato sempre que disponível, mas só funciona em compra avulsa/bundle (não em assinatura, por limitação da própria Stripe para contas BR). Boleto fica caro proporcionalmente em assinaturas de baixo valor mensal (Básico) e muito barato em valores altos (anual, avulsa, bundle, B2B) — isso é um dado relevante para a TASK-150 decidir se vale habilitar Boleto na assinatura mensal Básico especificamente, ou só nos planos anuais/B2B.

---

## Pontos de atenção para a Fase 3

| Item | Onde afeta | Observação |
|---|---|---|
| Pix exige convite da Stripe para contas BR — adiado da Fase 3 | `docs/pix-habilitacao.md` | Solicitar o convite com antecedência; reabilitar em TASK-147/148/172 quando concedido |
| Pix não tem suporte a recorrência para contas BR (Pix Automático indisponível) | `docs/pix-habilitacao.md` | Mesmo após o convite, Pix deve ficar restrito a pagamento único — nunca habilitar na assinatura recorrente |
| Boleto suporta `mode: 'subscription'`, com confirmação em ~1 dia útil | TASK-150 | A investigação pode concluir "habilitar", mas o tratamento de `past_due` precisa tolerar a janela de 1+ dia útil sem bloquear acesso prematuramente |
| Taxa fixa do Boleto (R$ 3,45) é desproporcional em valores baixos | TASK-150 | Vale considerar habilitar Boleto recorrente só no plano anual e/ou B2B, não no plano mensal Básico, dependendo da decisão de produto |
| Taxa de Billing (0,7%) incide sobre o volume de seats B2B | TASK-162, TASK-163 | Calcular o preço por seat já considerando essa taxa adicional, que não existe na compra avulsa |
| Boleto não tem chargeback (Pix também não, quando habilitado) | TASK-147, TASK-148 | Reduz risco financeiro de fraude pós-consumo de conteúdo, em comparação com cartão |

---

## Configuração necessária no projeto

Nenhuma variável de ambiente nova é necessária especificamente por causa das taxas — a Stripe não expõe "taxa" como configuração, ela é aplicada automaticamente no repasse. As variáveis relevantes já estão previstas:

```env
STRIPE_SECRET_KEY=                        # já configurada (Fase 1)
STRIPE_PRICE_ID_B2B_SEAT_MONTHLY=         # nova, Fase 3 (TASK-146) — preço já deve embutir a margem sobre a taxa de Billing
STRIPE_PRICE_ID_B2B_SEAT_ANNUAL=          # nova, Fase 3 (TASK-146)
```

**Onde confirmar as taxas reais da conta:**
1. **Dashboard → Settings → Pricing & balance**: mostra a taxa efetiva negociada para a conta (pode diferir do preço de lista público se houver negociação por volume)
2. **Dashboard → Payments → Payouts**: mostra o valor líquido repassado por transação, já com a taxa deduzida
3. **Dashboard → Settings → Payment methods**: onde Boleto é habilitado/desabilitado; Pix também aparece aqui, mas só fica disponível para ativação após o convite da Stripe (ver `docs/pix-habilitacao.md`)
