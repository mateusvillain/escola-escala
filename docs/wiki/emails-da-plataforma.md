# E-mails da Plataforma

Este documento lista os e-mails que a aplicação envia hoje, onde cada parte (conteúdo, envio, entregabilidade) é gerenciada, e detalhes operacionais relevantes para quem for dar manutenção.

## 1. E-mails enviados atualmente

Hoje existem **4 e-mails automáticos** em produção — todos transacionais (disparados por uma ação do usuário ou pelo ciclo da própria assinatura dele, não campanhas em lote).

| E-mail | Quando é disparado | Assunto | Link incluído | Implementação |
|---|---|---|---|---|
| **Recuperação de senha** | Usuário pede redefinição em `/recuperar-senha` (`POST /api/auth/forgot-password`) | "Redefinição de senha — {nome do app}" | Link para `/redefinir-senha?token=...`, válido por **1 hora** | `sendPasswordResetEmail()` em `src/lib/email.ts`, template `passwordResetEmailHtml()` em `src/lib/email-templates.ts` |
| **Boas-vindas** | Primeira assinatura ativada com sucesso (webhook `checkout.session.completed`) — **não** dispara em renovações | "Bem-vindo à plataforma!" | Link para `/dashboard` | `sendWelcomeEmail()` chamado em `handleCheckoutSessionCompleted` (`src/lib/stripe-handlers.ts`), template `welcomeEmailHtml()` |
| **Aviso de fim de trial** | Webhook `customer.subscription.trial_will_end` (3 dias antes da 1ª cobrança) — só ocorre para usuários com trial concedido manualmente pelo admin (TASK-85 a 87) | "Seu período de teste está acabando" | Link para `/dashboard/assinatura` | `sendTrialEndingEmail()` chamado em `handleTrialWillEnd` (`src/lib/stripe-handlers.ts`), template `trialEndingEmailHtml()` |
| **Cobrança falhada** | Webhook `invoice.payment_failed` (TASK-115/116) | "Não conseguimos processar seu pagamento" | Link real para o **Stripe Customer Portal**, gerado on-the-fly a cada envio (mesmo padrão de `POST /api/subscriptions/portal`, `return_url` para `/dashboard/assinatura`) | `sendPaymentFailedEmail()` chamado em `handleInvoicePaymentFailed` (`src/lib/stripe-handlers.ts`), template `paymentFailedEmailHtml()` |

Detalhes de comportamento:

- **Recuperação de senha** não revela se o e-mail existe ou não na base — a resposta da API é sempre a mesma mensagem genérica ("se esse e-mail estiver cadastrado..."), para não permitir enumeração de contas.
- **Recuperação de senha** é protegida por rate limit: **10 requisições/minuto por IP** (`src/lib/rate-limit.ts`), em memória — reseta a cada deploy/restart, não é distribuído entre instâncias.
- **Boas-vindas** só dispara uma vez por usuário: a condição é `subscriptionCount === 1` no momento do webhook, então upgrades/downgrades de plano ou renovações não geram um novo e-mail de boas-vindas.
- **Cobrança falhada** dispara a cada tentativa de cobrança que falha (sem deduplicação) — se o Stripe tentar cobrar de novo e falhar novamente, um novo e-mail é enviado a cada `invoice.payment_failed`. A marcação da assinatura como `past_due` acontece sempre, independente do envio do e-mail; a busca do `User` pelo `stripeCustomerId`, a criação da sessão do portal e o envio do e-mail ficam num try/catch **separado**, então uma falha nessa etapa (ex: usuário não encontrado, API do Stripe fora do ar) não impede a marcação `past_due` nem interrompe o processamento do webhook.

## 2. Onde gerenciar cada parte

| O quê | Onde |
|---|---|
| **Conteúdo/HTML dos e-mails** (texto, layout, cores) | Código: `src/lib/email-templates.ts` — não há editor visual nem CMS; qualquer alteração de texto exige editar o template e fazer deploy |
| **Assunto e lógica de quando enviar** | Código: `src/lib/email.ts` (assunto) e os pontos de chamada (`forgot-password/route.ts`, `stripe-handlers.ts`) |
| **Credenciais SMTP** (host, porta, usuário, senha, remetente) | `.env.local` em desenvolvimento (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`); Vercel Dashboard → Environment Variables em produção |
| **Entregabilidade, domínio verificado (SPF/DKIM), logs de envio, bounces** | Painel do provedor SMTP configurado (Resend, conforme `AGENTS.md`) — fora deste repositório |
| **Nome do app exibido no assunto da recuperação de senha** | Variável `NEXT_PUBLIC_APP_NAME` — **hoje não está configurada** em nenhum `.env.local` nem na tabela de variáveis do PRD, então o assunto sempre cai no fallback `"Plataforma de Cursos"` (ver `src/lib/email.ts:61`) |

## 3. Comportamento em desenvolvimento

Se `SMTP_HOST` não estiver definido (ou estiver com o placeholder `TODO_FILL_MANUALLY`), `src/lib/email.ts` cria automaticamente uma **conta de teste Ethereal** a cada novo processo do servidor — os e-mails não são entregues de verdade, apenas capturados. A URL de preview de cada e-mail aparece no log do servidor (`[email] Preview URL: ...`); é necessário acessar esse link manualmente para ver o conteúdo, nenhum e-mail chega a uma caixa de entrada real nesse modo.

## 4. Tratamento de falha

`sendEmail()` envolve o envio em try/catch e **nunca lança erro** — uma falha de SMTP é só logada no console (`[email] Falha ao enviar e-mail`) e não interrompe o fluxo principal (cadastro, recuperação de senha, ativação de assinatura continuam funcionando mesmo se o e-mail falhar). Isso é intencional (e-mail não deve travar a operação principal), mas como consequência **não há retry nem alerta automático** se o SMTP cair — uma falha de entrega só é percebida revisando logs manualmente.

## 5. Outros pontos relevantes

- **Sem testes automatizados**: não existe nenhum teste unitário para `src/lib/email.ts` ou `email-templates.ts` hoje (`src/lib/__tests__/` cobre apenas `auth`, `jwt` e `certificate`).
- **Sem mecanismo de unsubscribe/opt-out**: aceitável hoje porque os 2 e-mails atuais são estritamente transacionais (ação direta do usuário). Isso muda com a Fase 2 — ver seção 6.
- **Remetente único**: todo e-mail sai do mesmo `SMTP_FROM`, não há remetentes diferentes por tipo de e-mail (ex: `suporte@` vs `naoresponda@`).

## 6. E-mails planejados na Fase 2 — ainda não implementados

A seção 13 do PRD (`.agent/prd/PRD.md`) e `docs/fase2-grupos-de-trabalho.md` já têm tasks especificadas para mais 2 e-mails automáticos, mas **nenhum deles existe em produção ainda** (o aviso de fim de trial, TASK-85 a 87, e o de cobrança falhada, TASK-115/116, já estão implementados e listados na seção 1):

| E-mail planejado | Gatilho | Task |
|---|---|---|
| Upsell (básico → premium) | Cron mensal — alunos que viram o `UpgradePrompt` há +3 dias sem converter | TASK-102 |
| Retomada de curso ("continue de onde parou") | Cron mensal — alunos inativos há +7 dias com curso incompleto | TASK-113/114 |

**Atenção ao implementar esses dois últimos**: diferente dos e-mails atuais (100% transacionais, disparados por uma ação do próprio usuário), upsell e retomada são **envios em lote, iniciados pela plataforma, não pelo usuário** — isso se aproxima de e-mail de marketing/engajamento. Vale avaliar nessa hora se é necessário adicionar um link de "não quero mais receber esses e-mails" (mesmo que os 2 e-mails transacionais atuais continuem sem essa exigência), e configurar um remetente/assunto que deixe claro que não é uma cobrança ou aviso crítico de conta.
