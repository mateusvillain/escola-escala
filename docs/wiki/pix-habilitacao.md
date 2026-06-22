# Pix via Stripe — Como solicitar e habilitar

> Pix foi adiado da Fase 3 em 2026-06-21. Este documento existe para que a solicitação à Stripe possa ser
> aberta com antecedência (o convite não é instantâneo) e para deixar claro exatamente o que reverter no
> código quando ele for concedido. Ver `docs/fase3-grupos-de-trabalho.md` (Grupo 1 e Grupo 6) e
> `docs/pricing/stripe-pricing.md` (custo: 1,19% por transação, o método mais barato disponível) para o contexto
> completo da decisão.

## Por que foi adiado

Diferente de Boleto, **Pix não é um toggle direto no Stripe Dashboard** para contas sediadas no Brasil. A
Stripe exige convidar a conta explicitamente antes de o método aparecer disponível para ativação em
Settings → Payment methods. O critério usual divulgado pela Stripe é a conta ter histórico de transações
processadas em bom standing (referência comum: ~60 dias) — não há um formulário de autoatendimento que
garanta aprovação imediata.

Como o projeto ainda não tinha esse histórico/convite quando a Fase 3 foi planejada, a opção foi seguir com
Boleto (que não tem essa barreira) e tratar Pix como item adiado, não cancelado.

## Como solicitar o convite

1. **Acumular histórico de transações.** A conta precisa estar processando pagamentos reais (cartão e/ou
   Boleto) em bom standing por um período — é a pré-condição mais comum mencionada pela Stripe antes de
   conceder o convite. Não há uma ação de código para isso; é uma questão de tempo de operação da conta.
2. **Abrir o pedido com a Stripe.** As vias disponíveis (confirme qual se aplica à conta no momento da
   solicitação, já que a Stripe pode mudar o fluxo):
   - **Dashboard → Settings → Payment methods**: localizar Pix na lista de métodos disponíveis para a região
     da conta (BR) e usar a opção de solicitar acesso, se exibida ali.
   - **Stripe Support** (via Dashboard → Help, ou support.stripe.com): abrir um ticket pedindo explicitamente
     a habilitação de Pix para a conta, mencionando o volume/histórico de transações já processado.
   - Se a conta tiver um representante de vendas/account manager da Stripe (comum para contas de maior
     volume), pedir diretamente a ele costuma acelerar o processo.
3. **Aguardar a confirmação da Stripe.** Não há SLA público — pode levar dias a semanas. Não há nada a fazer
   no código enquanto o convite está pendente.
4. **Confirmar a habilitação.** Quando concedido, Pix passa a aparecer disponível para ativação em
   **Dashboard → Settings → Payment methods**, igual a qualquer outro método.

## O que reverter no código quando o convite for concedido

Nenhuma dessas mudanças é urgente nem bloqueante — Pix pode ser adicionado em qualquer momento depois do
convite, sem dependência de outra feature da Fase 3 estar em andamento.

| Onde | O que mudar |
|---|---|
| `src/app/api/courses/[slug]/purchase/route.ts` (TASK-147) | `payment_method_types: ['card', 'boleto']` → `['card', 'pix', 'boleto']` |
| `src/app/api/tracks/[slug]/purchase/route.ts` (TASK-172, quando o Grupo 6 existir) | mesma mudança em `payment_method_types` |
| `src/lib/stripe-handlers.ts` (TASK-148) | os handlers de `checkout.session.async_payment_succeeded`/`_failed` já tratam qualquer método assíncrono — Pix reaproveita o mesmo código de Boleto sem mudança adicional |
| Página de retorno de compra avulsa (TASK-149) | ajustar o texto do estado "pagamento pendente" para diferenciar Pix (confirmação em minutos) de Boleto (até 3 dias úteis) — hoje a mensagem só cobre Boleto |
| `.agent/tasks/TASK-146.json`, `TASK-147.json`, `TASK-149.json`, `TASK-172.json` | remover as notas de "Pix adiado" e as referências a este documento, voltando a incluir Pix nos critérios de aceite |
| `docs/fase3-grupos-de-trabalho.md` (Grupo 1 e Grupo 6) | remover os avisos de adiamento e voltar a incluir Pix nos prompts e nos testes manuais |

## Limitação permanente (não muda com o convite)

Mesmo depois de concedido, **Pix não tem suporte a cobrança recorrente para contas brasileiras** — o produto
"Pix Automático" (que permitiria recorrência) não está disponível no Brasil, segundo a documentação oficial
da Stripe. Isso significa que Pix deve ficar restrito a `mode: 'payment'` (compra avulsa de curso e bundle de
trilha) — nunca à assinatura recorrente (`mode: 'subscription'`). Essa restrição não é uma decisão de produto
revisitável, é uma limitação estrutural da própria Stripe para contas BR.

## Referência de custo

Pix custa **1,19%** por transação — o método mais barato entre os disponíveis para o projeto (cartão nacional
3,99% + R$ 0,39; Boleto R$ 3,45 fixo). Ver a tabela comparativa completa em `docs/pricing/stripe-pricing.md`.
