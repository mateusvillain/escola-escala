# Oportunidades para a Plataforma — Pós Fase 1

A Fase 1 (B2C, assinatura recorrente) está praticamente completa: auth, catálogo, player com progresso, certificados, Stripe (checkout + portal + webhooks) e admin de cursos/usuários/assinaturas. Este documento lista oportunidades de evolução, organizadas por esforço/impacto, com base no que já existe no schema e no código.

---

## 1. Quick wins (infraestrutura já existe, falta ligar)

- **Trial gratuito.** O enum `SubscriptionStatus` já tem `trialing` e a UI (admin, dashboard de assinatura) já sabe exibi-lo — mas o checkout (`src/app/api/subscriptions/checkout/route.ts`) nunca passa `trial_period_days` para o Stripe. Adicionar um trial de 7 dias é uma linha de configuração no Checkout Session e pode ter impacto direto em conversão.
- **Página pública de instrutor.** `Instructor` já tem `slug` único no schema, mas não existe nenhuma rota `/instrutores/[slug]`. Uma página simples com bio, foto e lista de cursos do instrutor aumenta SEO e dá mais contexto de autoridade ao aluno antes de assinar.
- **Cupons de desconto.** Stripe Checkout suporta `discounts`/`allow_promotion_codes` nativamente. Hoje não há nenhum cupom configurado — é a forma mais rápida de viabilizar campanhas de aquisição (Black Friday, parcerias, lançamento de curso) sem tocar no banco.
- **Materiais complementares por aula.** `Lesson.content` já existe como campo de texto livre (markdown, via `react-markdown`). Vale documentar/expandir esse campo para incluir links de download (slides, exercícios, código-fonte) — zero mudança de schema.

---

## 2. Monetização e growth

- **Compra avulsa de curso (sem assinatura).** Hoje o único caminho de acesso é assinatura recorrente. Um modelo de "comprar este curso" via Stripe Checkout em `mode: payment` atende quem não quer compromisso mensal e amplia o público — especialmente para cursos de nicho fora do catálogo "always-on".
- **Upsell contextual basic → premium.** `UpgradePrompt` já existe e é acionado quando o aluno tenta acessar um curso fora do plano. Vale instrumentar esse evento (qual curso, em que ponto da jornada) para campanhas de e-mail direcionadas — "você tentou acessar X, faça upgrade".
- **Programa de indicação.** Sem fórum/gamificação (fora do escopo da Fase 1), um programa de referral simples — gerar cupom único por aluno, crédito na próxima fatura via Stripe — é um motor de aquisição de baixo custo que não exige as features descartadas no PRD original.
- **Relatórios financeiros (MRR, churn, LTV).** `GET /api/admin/metrics` hoje é básico. Com `UserSubscription` já guardando histórico de status e ciclo, dá para calcular MRR, churn mensal e LTV médio por plano sem novas tabelas — só novas queries agregadas.

---

## 3. Engajamento e retenção do aluno

- **E-mail de retomada ("continue de onde parou").** `LessonProgress.lastWatchedAt` já é gravado a cada evento do player. Um job semanal que identifica alunos inativos há N dias com curso incompleto e dispara e-mail via o SMTP já configurado é a alavanca de retenção mais barata disponível hoje.
- **Notificação de renovação/cobrança.** Os webhooks de `invoice.payment_failed` já marcam a assinatura como `past_due`, mas não há e-mail avisando o aluno — ele só descobre ao tentar acessar o conteúdo. Acoplar um e-mail transacional ao handler em `src/lib/stripe-handlers.ts` reduz churn involuntário.
- **Avaliação de curso (rating + comentário curto).** Não exige fórum completo — um campo simples de nota 1-5 + texto opcional no momento da conclusão (quando `checkCourseCompletion` já dispara o certificado) gera prova social para a página de catálogo.
- **Streak de estudo.** Sem entrar em gamificação pesada (explicitamente fora do escopo da Fase 1), até um indicador simples de "dias consecutivos estudando" no dashboard, derivado de `LessonProgress.lastWatchedAt`, aumenta engajamento sem exigir nova infraestrutura.

---

## 4. Conteúdo e experiência de aprendizado

- **Legendas/transcrição de vídeo.** Bunny Stream tem suporte nativo a captions (`.vtt`) por vídeo. Hoje `BunnyPlayer` não expõe isso — é relevante tanto para acessibilidade quanto para SEO (transcrição indexável).
- **Quiz por módulo.** `Module` não tem nenhum mecanismo de avaliação hoje — só conclusão por watch %. Um quiz simples (JSON de perguntas no próprio `Module` ou tabela nova) eleva a percepção de valor do certificado, que hoje é emitido só por tempo assistido.
- **Busca dentro do curso.** Com `Lesson.content` em markdown, um índice de busca simples (mesmo client-side, sem Elasticsearch) sobre título/descrição/conteúdo das aulas ajuda alunos em cursos longos a achar onde um tópico foi abordado.
- **Velocidade de reprodução e retomar do ponto exato.** Hoje o tracking é por `watchPercentage`, não por timestamp. Guardar o segundo exato (`lastPositionSeconds`) permitiria "continuar de onde parei" com precisão, não só "marcar concluída aos 80%".

---

## 5. Operação e admin

- **Área própria do instrutor.** O Role `instructor` existe no schema e há instrutores cadastrados, mas não há nenhuma rota além do admin geral. Um dashboard restrito (meus cursos, meus alunos, métricas de conclusão) reduz dependência operacional do admin único e prepara terreno para escalar o catálogo com múltiplos instrutores.
- **Exportação de dados (CSV).** Listagens de assinantes/cursos no admin não têm exportação. Para reconciliação financeira ou campanhas de marketing, um botão "exportar CSV" nas tabelas (`SubscriptionTable`, `UserTable`) é baixo esforço e alto valor para o time de operação.
- **Auditoria de ações admin.** Não há log de quem alterou o quê (ex: quem despublicou um curso, quem alterou o plano de um usuário). Mesmo um log simples em tabela própria ajuda a investigar incidentes.
- **Migração do upload de vídeo para TUS (`TASK-83`, já mapeada).** Não é uma "oportunidade" nova, mas é bloqueador de produção: o endpoint atual de upload não funciona na Vercel para vídeos reais (limite de 4.5MB). Vale priorizar antes de qualquer outra entrega de conteúdo.

---

## 6. Fase 2 — fora do escopo atual, mas viável a partir da base existente

- **Gestão B2B (licenças corporativas).** O modelo `UserSubscription` é 1:1 com `User`; para B2B seria necessário um conceito de "organização" com seats — mas a lógica de acesso por plano (`access.ts`) já é reaproveitável quase integralmente.
- **Fórum/Q&A por aula.** Pode começar pequeno — um campo de comentários simples por `Lesson`, sem precisar da estrutura completa de fórum, como meio-termo antes de uma feature de comunidade completa.
