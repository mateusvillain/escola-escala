# Fase 3 — Visão Macro

> Documento de visão, não de execução. Sem quebra em tasks — isso vem depois, se e quando a direção for validada com o cliente/stakeholders.

## Onde a plataforma está hoje

A Fase 1 (B2C, assinatura recorrente) e a Fase 2 (62 tasks de monetização, retenção, conteúdo e operação) estão **completas**: 134 tasks implementadas, cobrindo auth, catálogo, player com progresso, certificados, quiz por módulo, avaliação de curso, compra avulsa, cupons, programa de indicação, exportação CSV, auditoria admin, painel do instrutor, legendas, busca interna e retomar do ponto exato. O schema (`prisma/schema.prisma`) reflete isso: `User`, `Instructor`, `Course → Module → Lesson`, `UserSubscription`, `CourseEnrollment`, `Certificate`, `CourseReview`, `Quiz/QuizQuestion/QuizAttempt`, `ReferralCode`, `AdminAuditLog`.

Três frentes da Fase 2 não entraram por decisão deliberada, não por estarem erradas:

- **TASK-81/82/83** (whitelist Bunny, deploy de produção, migração do upload de vídeo para TUS) — pré-requisitos de lançamento real, ainda pendentes em `.agent/tasks/`.
- **Grupos 6, 9 e 12** (upsell contextual, e-mail de retomada, streak de estudo) — movidos para `.agent/tasks/deprecated/` por risco de concentração no limite **diário** do Resend free tier (100 e-mails/dia), não por inviabilidade. `docs/resend-pricing.md` já documenta a mitigação (espalhar os crons em dias diferentes do mês).

Essas duas pendências são **finalização da Fase 2**, não Fase 3 — vale fechá-las antes de abrir frentes novas, porque bloqueiam o primeiro lançamento real com alunos pagantes.

O que ficou explicitamente fora de escopo desde o PRD original e nunca foi revisitado: **gestão B2B, fórum/comunidade, app mobile nativo, gamificação competitiva**. É justamente aí que a Fase 3 tem espaço — abrir essas fronteiras de forma seletiva, priorizando o que já tem base de reaproveitamento no código existente.

---

## 1. Monetização e expansão de mercado

- **Gestão B2B / licenciamento corporativo.** Hoje `UserSubscription` é 1:1 com `User` — uma assinatura por pessoa. Para B2B, o modelo natural é uma entidade `Organization` com seats: um cliente Stripe por organização, N usuários vinculados, painel de admin da própria organização (convidar/remover membros, ver consumo). A lógica de acesso por plano em `src/lib/access.ts` é reaproveitável quase integralmente — só muda a origem do "direito de acesso" (organização em vez de assinatura individual). É a maior alavanca de receita do roadmap atual: ticket médio de venda B2B é ordens de magnitude maior que assinatura individual.
- **Pix e Boleto via Stripe.** Hoje o checkout só aceita cartão de crédito. Stripe já suporta Pix e Boleto nativamente para clientes BR — relevante porque parte significativa do público brasileiro não tem ou prefere não usar cartão de crédito para cobrança recorrente. Reaproveita o checkout existente (`POST /api/subscriptions/checkout`), é mudança de configuração de payment methods, não de arquitetura.
- **Trilhas e bundles de cursos.** A estrutura hoje é plana — um curso por vez, sem relação entre eles. Agrupar cursos relacionados em trilha (sequência com progressão) ou bundle (pacote com desconto, reaproveitando o fluxo de compra avulsa já existente em `TASK-95-99`) aumenta o ticket médio e dá ao aluno um motivo claro para continuar na plataforma após o primeiro curso.

## 2. Conteúdo

- **Conteúdo programado ("drip content").** Liberar módulos em datas fixas ou X dias após a matrícula, em vez de tudo disponível de uma vez. Útil para cursos com formato de cohort/turma e para dar ritmo a cursos longos. `CourseEnrollment.enrolledAt` já existe como referência temporal para calcular liberação.

## 3. Confiabilidade e dados de produto

- **Testes E2E com Playwright.** A dependência está instalada desde a Fase 1, mas não existe `playwright.config.ts` nem nenhum spec escrito. Cobertura nos fluxos críticos (checkout, login, player, certificado) fica mais importante assim que houver tráfego real de produção, não menos.
- **Rate limiting distribuído.** `src/lib/rate-limit.ts` é em memória — zera a cada deploy e não protege nada se a Vercel escalar para múltiplas instâncias. Migrar para algo como Upstash Redis (já disponível via Vercel Marketplace) antes de qualquer crescimento de tráfego relevante.
- **Monitoramento de erro em produção.** Hoje não há nenhuma ferramenta de observação de erro além de log de console — um Sentry (ou equivalente) é pré-requisito básico de operação assim que houver usuários reais.
- **Event tracking de produto.** As métricas atuais (`GET /api/admin/metrics`) são agregados financeiros (MRR, churn, LTV) — não há rastreamento de eventos de uso (onde o aluno abandona o checkout, quais aulas têm maior drop-off). Mesmo um registro simples de eventos em tabela própria já habilita decisões de produto orientadas a dado, em vez de intuição.

---

## Como priorizar

1. Pix/Boleto — esforço baixo, impacto direto em conversão no mercado brasileiro.
2. B2B — maior potencial de receita, mas exige modelagem nova (`Organization`) e validação de demanda antes de investir.
3. Demais itens (trilhas, conteúdo programado, confiabilidade) conforme sinal de uso real após o lançamento.
