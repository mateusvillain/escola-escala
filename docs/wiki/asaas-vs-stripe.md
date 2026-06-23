# Asaas como gateway de pagamento — vale substituir a Stripe?

> **Atenção:** valores coletados em junho de 2026 em [asaas.com/precos-e-taxas](https://www.asaas.com/precos-e-taxas)
> e no blog/documentação oficial do Asaas. Algumas tarifas (Pix, Boleto) estão em período promocional até
> 22/09/2026 — confirme as taxas vigentes antes de decidir. Este documento nasceu da investigação de
> `docs/wiki/nota-fiscal-nfse.md` (Asaas como emissor de NFS-e) e expande a pergunta para o gateway de
> pagamento como um todo. É um documento de **visão, não de execução** — não há tasks geradas a partir dele.

## Resumo da resposta

**Sim, o Asaas tem conta digital PJ com gateway de pagamento completo** (cartão, Pix, Boleto, assinaturas
recorrentes, checkout, antifraude). **Mas não recomendo substituir a Stripe agora** — a economia de taxa é
real, porém pequena em termos absolutos no volume atual, e o custo de reescrever toda a camada de
monetização do projeto (que já está pronta, testada e a um passo do primeiro deploy de produção, `TASK-82`)
é desproporcional ao ganho. Os detalhes e a única vantagem estrutural do Asaas que de fato merece nota — Pix
recorrente — estão abaixo.

## Comparativo de taxas (mesmo formato de `docs/pricing/stripe-pricing.md`)

| Meio | Stripe (já integrado) | Asaas (taxa padrão, fora do período promocional) |
|---|---|---|
| Cartão nacional, cobrança única | 3,99% + R$ 0,39 | R$ 0,49 + 2,99% |
| Cartão nacional, assinatura recorrente | 3,99% + R$ 0,39 **+ 0,7% (Stripe Billing)** | R$ 0,49 + 2,99% — sem taxa adicional de assinatura encontrada na documentação |
| Cartão internacional | +2% adicional | Não há confirmação clara de suporte/sobretaxa — bandeiras citadas (Visa, Master, Elo, Amex, Diners, Hipercard, Discover) sugerem foco doméstico |
| Pix | 1,19% — **exige convite da Stripe** (pendente, ver `docs/wiki/pix-habilitacao.md`); **sem suporte a recorrência para contas BR** | R$ 0,99 (promo 3 meses) / R$ 1,99 padrão, por transação (fixo, não percentual) — **disponível sem convite**, e com **Pix Automático (recorrente)** já liberado gradualmente para PJ |
| Boleto | R$ 3,45 fixo | R$ 1,99 fixo |
| Compensação cartão | Imediata | Até 3 dias úteis |
| Compensação boleto | ~1 dia útil + repasse (até 3 dias úteis total) | ~2 dias úteis |
| Antecipação de recebíveis | Não aplicável (não há tasks de parcelamento) | A partir de 1,25%/mês (cartão à vista), 5,79%/mês (boleto) — só relevante se algum dia vender parcelado |
| Repasse para conta bancária | Direto, automático, sem etapa extra | Fica em "conta digital" Asaas até ser transferido — Pix grátis até 30/mês, depois R$ 2,00; TED R$ 5,00 |

**Exemplo prático (assinatura Premium mensal, R$ 59,90, cartão):**
- Stripe: R$ 2,78 (cartão) + R$ 0,42 (Billing) = **R$ 3,20** → líquido R$ 56,70
- Asaas: R$ 0,49 + 2,99% × 59,90 (R$ 1,79) = **R$ 2,28** → líquido R$ 57,62

A diferença é real (~R$ 0,90/assinatura/mês neste exemplo, ~1,5 ponto percentual), mas pequena em termos
absolutos com a base de assinantes atual — e some quando comparada ao custo de reescrever a camada de
pagamento.

## Onde o Asaas tem vantagem estrutural (não é só taxa)

- **Pix sem convite e com recorrência real:** a Stripe não só exige convite para habilitar Pix em contas BR
  (pendente desde a decisão de adiamento, `docs/wiki/pix-habilitacao.md`) como **não suporta Pix Automático
  para contas brasileiras** — é uma limitação estrutural da própria Stripe, não do Banco Central. O Asaas já
  tem **Pix Automático liberado gradualmente para PJ** (CNPJ ativo há 6+ meses, conta aprovada, sem indício
  de fraude no DICT), sem custo adicional sobre a tarifa de Pix padrão. Isso resolveria de uma vez algo que
  hoje está estruturalmente bloqueado na Stripe para assinatura recorrente via Pix.
- **NFS-e nativa**, já coberta em `docs/wiki/nota-fiscal-nfse.md` — unificaria pagamento e nota fiscal num
  único provedor.

## Onde a Stripe continua na frente

- **Já integrada e testada:** `stripeCustomerId`/`stripeSubscriptionId` em `User`/`UserSubscription`
  (`prisma/schema.prisma`), múltiplos handlers de webhook (`src/lib/stripe-handlers.ts`), Embedded Checkout
  já no fluxo de cadastro (`EmbeddedCheckoutForm`), Customer Portal (`POST /api/subscriptions/portal`),
  lógica de referral/crédito (`src/lib/referral.ts`), e monitoramento Sentry configurado especificamente
  nessas rotas financeiras. Substituir significa reescrever — e testar de novo do zero — toda a camada de
  monetização do projeto, não troca pontual.
- **Maturidade global:** Radar (antifraude) e 3D Secure são extremamente documentados e testados em escala;
  o antifraude do Asaas é gratuito mas tem reclamações públicas de falso positivo/negativo (Reclame Aqui) —
  sinal a investigar, não um veredito, mas pesa contra trocar um sistema crítico de receita sem necessidade.
- **Sem etapa de custódia extra:** a Stripe repassa direto para a conta bancária cadastrada; no Asaas o
  dinheiro fica numa "conta digital" até ser transferido (com tarifa, exceto Pix dentro da cota mensal) —
  uma etapa operacional e um ponto de concentração de risco adicional que a Stripe não tem.
- **Cartão internacional já suportado** (com sobretaxa conhecida e documentada), enquanto o suporte do Asaas
  a cartão emitido fora do Brasil não está claramente confirmado.

## Recomendação

**Não substituir agora.** A Stripe ainda está em modo teste (`TASK-82`, deploy de produção, segue pendente)
— ironicamente esse é o momento "mais barato" para trocar, já que não há assinaturas reais em produção para
migrar. Mas o custo não está nos dados de produção, está no trabalho de engenharia já feito (Fases 1 a 3) e
no risco de reescrever, às vésperas do primeiro deploy, a camada que controla acesso pago ao conteúdo — exatamente
o tipo de mudança que `docs/wiki/sentry.md` e o monitoramento de rotas financeiras críticas existem para
proteger.

Caminho recomendado:
1. **Manter Stripe** como processador de pagamento — é a decisão já validada, testada e documentada.
2. **Usar Asaas só como emissor de NFS-e** (conforme `docs/wiki/nota-fiscal-nfse.md`), não como gateway.
3. **Revisitar isso depois**, e só por um motivo concreto: se o volume real de produção tornar a diferença
   de ~1,5pp em taxa de cartão relevante em R$, ou se Pix recorrente via assinatura virar prioridade de
   produto e a Stripe continuar sem suportá-lo para contas BR. Nesse caso, a decisão mais provável não é
   "substituir tudo", e sim avaliar oferecer Pix recorrente via Asaas **como meio de pagamento adicional**
   ao lado da Stripe — o que tem seu próprio custo (duas fontes de verdade de cobrança, dois webhooks, dois
   lugares de reconciliação) e mereceria um documento de viabilidade próprio se chegar a esse ponto.

## Referências

- [Asaas — preços e taxas](https://www.asaas.com/precos-e-taxas)
- [Asaas — Pix automático no Asaas simplifica recebimentos recorrentes](https://blog.asaas.com/release/pix-automatico/)
- [Asaas — cobrança recorrente (assinaturas)](https://blog.asaas.com/cobranca-recorrente-no-asaas/)
- [Asaas — checkout transparente](https://blog.asaas.com/checkout-transparente-do-asaas/)
- [Asaas — chargeback e disputa](https://docs.asaas.com/docs/chargeback)
- `docs/pricing/stripe-pricing.md` — taxas atuais da Stripe usadas na comparação
- `docs/wiki/pix-habilitacao.md` — por que Pix está adiado na Stripe e a limitação de Pix Automático para contas BR
- `docs/wiki/nota-fiscal-nfse.md` — uso do Asaas como emissor de NFS-e (independente desta decisão de gateway)
