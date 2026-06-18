# Cupons de desconto — Stripe Dashboard

Guia para o time de marketing/operação criar e gerenciar cupons de desconto direto no Stripe Dashboard, sem depender de um desenvolvedor. Cupons não têm nenhuma tabela própria no nosso banco — tudo é gerenciado e validado pela Stripe.

O Checkout da plataforma já aceita cupons (`allow_promotion_codes: true` em `POST /api/subscriptions/checkout`): basta criar o cupom no Dashboard e divulgar o código para os alunos.

---

## Como funciona

Existem dois objetos distintos na Stripe, e você precisa dos dois:

- **Coupon**: define o desconto em si (percentual ou valor fixo, duração, validade, limite de uso). Não tem um código legível — é identificado por um ID interno.
- **Promotion Code**: o código que o aluno efetivamente digita na tela de Checkout (ex: `10OFF`). Sempre vinculado a um Coupon. O mesmo Coupon pode ter vários Promotion Codes diferentes, com regras de restrição próprias (ex: validade ou limite de uso específicos daquele código).

---

## Passo a passo: criar um Coupon

1. Confirme que está em **modo de teste** (toggle "Test mode" no canto superior do Dashboard) ao testar, ou em modo live para um cupom real de produção.
2. Acesse **Product catalog → Coupons** no menu lateral.
3. Clique em **+ New**.
4. Defina o tipo de desconto:
   - **Percent off** — ex: 10% de desconto
   - **Fixed amount off** — ex: R$20 de desconto (escolha a moeda)
5. Defina a **Duration**:
   - `Once` — aplica só na primeira cobrança (mais comum para cupom de aquisição)
   - `Repeating` — aplica por N meses consecutivos
   - `Forever` — aplica em todas as cobranças enquanto a assinatura existir
6. Opcional: **Redemption limit** (quantas vezes o cupom pode ser usado no total, somando todos os códigos vinculados a ele) e **Expiration date**.
7. Salve.

## Passo a passo: criar um Promotion Code vinculado

1. Ainda em **Coupons**, abra o cupom criado e use a opção de gerar um **Promotion Code** (ou acesse **Promotion codes** no menu e clique em **+ New**, selecionando o Coupon já criado).
2. Defina o **código** que o aluno vai digitar (ex: `10OFF`, `BEMVINDO20`). Use algo curto e fácil de divulgar.
3. Restrições opcionais específicas desse código (independentes do limite do Coupon):
   - **Max redemptions** — limite de uso só deste código
   - **Expiration date** — pode ser diferente da validade do Coupon
   - **First-time transaction only** — restringe a clientes que nunca tiveram uma cobrança bem-sucedida na conta (útil para cupom de boas-vindas, mas não pode ser combinado com cliente já assinante tentando trocar de plano)
   - **Minimum order amount**
4. Salve. O código fica **ativo imediatamente**.

> Para desativar um código sem apagar o histórico, edite o Promotion Code e marque **Active: off** — os relatórios de uso continuam disponíveis.

---

## Testando o fluxo

Com o código criado em modo de teste, vá em `/planos` na aplicação, inicie uma assinatura, e na tela de Checkout hospedada pela Stripe clique em **"Add promotion code"** (aparece abaixo do subtotal) e digite o código. O desconto é refletido imediatamente no "Total due today" antes de informar o cartão. Use um cartão de teste (ex: `4242 4242 4242 4242`, validade futura, qualquer CVC) para concluir.

**Importante:** `allow_promotion_codes: true` não pode ser combinado com um desconto pré-aplicado (`discounts`) na mesma Checkout Session — a Stripe rejeita a requisição se os dois forem enviados juntos. Isso é relevante para qualquer fluxo futuro que precise aplicar um desconto automaticamente (ex: programa de indicação): é necessário escolher um dos dois mecanismos por sessão.

---

## Onde ver os relatórios de uso (redemptions)

- **Coupons → abra o cupom**: mostra o total de "Redemptions" (quantas vezes qualquer código vinculado a ele foi usado) e o valor total descontado.
- **Promotion codes → abra o código específico**: mostra "Times redeemed" daquele código isoladamente, útil quando o mesmo cupom tem vários códigos (ex: um por campanha de marketing).
- Para reconciliação financeira mais ampla, os descontos aplicados também aparecem nos relatórios de **Payments → Invoices** (campo de desconto em cada invoice) e podem ser cruzados com a exportação de assinaturas em `/admin/assinaturas` (botão "Exportar CSV").
