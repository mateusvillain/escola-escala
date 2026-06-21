# PRD — Plataforma de Cursos Online por Assinatura

**Versão**: 3.1  
**Data**: 2026-06-21  
**Fase**: 1 — MVP B2C (completa) + Fase 2 — Crescimento e Engajamento (completa) + Fase 3 — Expansão e Maturidade (em planejamento)

> A Fase 1 (seções 1–10 abaixo) e a Fase 2 (seção 13, TASK-84 a TASK-145) estão implementadas — ver `CLAUDE.md`/`AGENTS.md` do repositório para o estado real de cada funcionalidade. A seção 14 detalha a Fase 3 (TASK-146 a TASK-195), derivada de `docs/fase3-oportunidades.md`.

---

## 1. Visão Geral

Plataforma web responsiva de cursos online por assinatura recorrente, focada no mercado brasileiro (PT-BR). Permite que uma organização publique e monetize conteúdo educacional em vídeo estruturado em cursos, módulos e aulas. Alunos assinam um dos dois planos disponíveis (Básico ou Premium) e consomem o conteúdo com rastreamento de progresso, marcação automática de conclusão e emissão de certificado em PDF.

### Objetivos

- Lançar plataforma funcional de cursos online por assinatura (MVP)
- Gerar receita recorrente via Stripe com planos Básico e Premium
- Oferecer experiência de consumo de conteúdo fluida e rastreável
- Construir base técnica escalável para funcionalidades futuras (Fase 2+)

### Critérios de Sucesso (KPIs)

- Taxa de conversão de visitante → assinante ≥ 3%
- Taxa de churn mensal ≤ 5%
- Taxa de conclusão de curso ≥ 30%
- Tempo médio de carregamento de página < 2s (LCP)
- Uptime ≥ 99,5%

---

## 2. Público-Alvo

**Fase 1**: Exclusivamente B2C — pessoas físicas no Brasil que buscam capacitação profissional ou pessoal via cursos online.

**Perfil primário**: Profissionais de 22–45 anos, com acesso à internet, dispostos a pagar assinatura mensal/anual por acesso a conteúdo de qualidade. Familiarizados com plataformas como Hotmart, Udemy, Alura e Domestika.

---

## 3. Análise Competitiva

| Plataforma | Modelo | Força | Fraqueza |
|---|---|---|---|
| **Alura** | Assinatura B2C/B2B | Catálogo técnico amplo, brand forte | Foco em tech, caro para conteúdo nicho |
| **Hotmart** | Marketplace por produto | Grande ecossistema de afiliados | Sem assinatura de catálogo; plataforma genérica |
| **Domestika** | Assinatura + avulso | Design e criatividade, qualidade de produção | Conteúdo majoritariamente em espanhol/inglês |
| **Udemy** | Marketplace avulso | Variedade e preços acessíveis | Qualidade inconsistente; sem assinatura de catálogo |

**Diferenciação**: Plataforma white-label com marca própria, curadoria de conteúdo, design system exclusivo e controle total da experiência do aluno — sem disputar atenção com cursos de concorrentes no mesmo marketplace.

---

## 4. Funcionalidades Core

Cada requisito possui um ID único para rastreamento nas tarefas de implementação.

### 4.1 Autenticação e Perfis (TASK-2 a TASK-8)

**TASK-2** — Cadastro de novo aluno com e-mail e senha  
**TASK-3** — Login com e-mail e senha; sessão via JWT (HttpOnly cookie)  
**TASK-4** — Logout (invalidação de sessão no cliente)  
**TASK-5** — Recuperação de senha via link enviado por e-mail  
**TASK-6** — Perfis de acesso: `admin`, `instructor`, `student`  
**TASK-7** — Middleware de autorização por perfil em todas as rotas protegidas  
**TASK-8** — Página de perfil do aluno (nome, e-mail, avatar, senha)

### 4.2 Gestão de Conteúdo — Admin (TASK-9 a TASK-20)

**TASK-9** — CRUD de Cursos (título, descrição, thumbnail, instrutor, plano de acesso, status: rascunho/publicado/arquivado)  
**TASK-10** — CRUD de Módulos (título, descrição, ordem dentro do curso)  
**TASK-11** — CRUD de Aulas (título, descrição, vídeo, conteúdo textual opcional, ordem dentro do módulo, flag de preview gratuito)  
**TASK-12** — Upload de vídeo direto pelo painel admin via API do Bunny Stream  
**TASK-13** — Inserção de vídeo por ID/URL do Bunny Stream (alternativa ao upload)  
**TASK-14** — Associação de curso ao plano de acesso (Básico ou Premium)  
**TASK-15** — Publicação/despublicação de curso pelo Admin  
**TASK-16** — Gerenciamento de instrutores como tag de autor em cursos  
**TASK-17** — Listagem e busca de usuários no painel Admin  
**TASK-18** — Alteração de perfil de usuário pelo Admin (role, status ativo/inativo)  
**TASK-19** — Visualização de assinaturas ativas no painel Admin  
**TASK-20** — Dashboard Admin com métricas: total de alunos, assinaturas ativas, cursos publicados

### 4.3 Catálogo e Consumo de Cursos (TASK-21 a TASK-28)

**TASK-21** — Página pública de catálogo de cursos (acessível sem login; exibe cursos publicados)  
**TASK-22** — Página de detalhe do curso (descrição, módulos, aulas, instrutor, CTA de assinatura)  
**TASK-23** — Player de vídeo Bunny Stream embedado na página da aula  
**TASK-24** — Navegação entre aulas (anterior/próxima) dentro do módulo/curso  
**TASK-25** — Conteúdo textual complementar na página da aula (markdown renderizado)  
**TASK-26** — Preview gratuito de aulas marcadas como preview (sem necessidade de assinatura)  
**TASK-27** — Controle de acesso ao curso por plano do aluno (Básico acessa cursos Básico; Premium acessa tudo)  
**TASK-28** — Redirecionamento para página de upgrade quando aluno Básico tenta acessar curso Premium

### 4.4 Progresso e Conclusão (TASK-29 a TASK-34)

**TASK-29** — Rastreamento de progresso por aula (percentual assistido do vídeo)  
**TASK-30** — Marcação automática de aula como concluída quando o aluno assiste ≥ 80% do vídeo  
**TASK-31** — Marcação manual de aula como concluída/não concluída pelo aluno  
**TASK-32** — Cálculo de progresso por curso (% de aulas concluídas)  
**TASK-33** — Indicador visual de progresso em cada curso (barra de progresso)  
**TASK-34** — Detecção de curso 100% concluído e disparo de geração de certificado

### 4.5 Dashboard do Aluno (TASK-35 a TASK-39)

**TASK-35** — Dashboard principal: cursos em andamento com progresso  
**TASK-36** — Seção "Continuar de onde parei" (última aula assistida por curso)  
**TASK-37** — Seção "Cursos disponíveis" baseada no plano do aluno  
**TASK-38** — Seção "Concluídos" com link para download do certificado  
**TASK-39** — Indicador do plano ativo do aluno e link para gestão de assinatura

### 4.6 Certificado de Conclusão (TASK-40 a TASK-42)

**TASK-40** — Geração de certificado em PDF ao concluir 100% do curso  
**TASK-41** — Certificado contém: nome do aluno, nome do curso, nome do instrutor e data de conclusão  
**TASK-42** — Download do certificado PDF pela área do aluno

### 4.7 Assinaturas e Pagamentos (TASK-43 a TASK-52)

**TASK-43** — Página de planos com comparativo Básico vs. Premium (mensal e anual)  
**TASK-44** — Checkout via Stripe Checkout Session (redirect para Stripe)  
**TASK-45** — Tratamento de webhook `checkout.session.completed` → ativar assinatura  
**TASK-46** — Tratamento de webhook `invoice.payment_succeeded` → renovar assinatura  
**TASK-47** — Tratamento de webhook `invoice.payment_failed` → marcar assinatura como `past_due`  
**TASK-48** — Tratamento de webhook `customer.subscription.deleted` → cancelar assinatura  
**TASK-49** — Tratamento de webhook `customer.subscription.updated` → atualizar plano (upgrade/downgrade)  
**TASK-50** — Portal do cliente Stripe (Stripe Customer Portal) para gerenciar assinatura (cancelar, trocar plano, atualizar cartão)  
**TASK-51** — Bloqueio de acesso ao conteúdo quando assinatura está `past_due` ou cancelada  
**TASK-52** — E-mail transacional de boas-vindas após primeira assinatura

### 4.8 Design System e UI (TASK-53 a TASK-56)

**TASK-53** — Configuração do design system existente (Figma/Storybook) no projeto Next.js  
**TASK-54** — Layout responsivo base: header, footer, sidebar de navegação  
**TASK-55** — Componentes UI reutilizáveis: Button, Input, Card, Badge, Progress, Modal, Alert  
**TASK-56** — Tema claro/escuro (se previsto no design system existente)

---

## 5. Fluxos de Usuário

### 5.1 Novo Aluno — Cadastro e Assinatura

```
1. Acessa página inicial → clica em "Assinar"
2. Vê página de planos (Básico vs. Premium, mensal vs. anual)
3. Seleciona plano → redireciona para cadastro (se não logado)
4. Preenche nome, e-mail, senha → cria conta
5. Redireciona para Stripe Checkout → insere dados do cartão
6. Pagamento confirmado → webhook ativa assinatura
7. Redireciona para dashboard do aluno
8. E-mail de boas-vindas enviado automaticamente
```

### 5.2 Aluno — Consumo de Aula

```
1. Login → Dashboard
2. Clica em curso → página de detalhe do curso
3. Seleciona módulo → seleciona aula
4. Player de vídeo carrega (Bunny Stream embedded)
5. Ao atingir 80% do vídeo → aula marcada automaticamente como concluída
6. Progresso do curso atualizado em tempo real
7. Pode navegar para próxima aula ou retornar ao dashboard
```

### 5.3 Aluno — Certificado

```
1. Conclui 100% das aulas de um curso
2. Sistema detecta conclusão → gera PDF do certificado
3. Dashboard exibe curso em "Concluídos" com botão de download
4. Aluno clica em "Baixar Certificado" → PDF baixado
```

### 5.4 Admin — Criação de Curso

```
1. Login Admin → Painel Administrativo
2. Navega para "Cursos" → "Novo Curso"
3. Preenche título, descrição, thumbnail, instrutor, plano de acesso
4. Salva como rascunho
5. Adiciona módulos → dentro de cada módulo, adiciona aulas
6. Por aula: insere título, vídeo (upload ou ID Bunny Stream), conteúdo textual
7. Revisa estrutura → clica em "Publicar"
8. Curso aparece no catálogo para alunos com plano compatível
```

### 5.5 Aluno — Gestão de Assinatura

```
1. Dashboard → "Minha Assinatura"
2. Vê plano ativo, data de renovação, valor
3. Clica em "Gerenciar Assinatura" → abre Stripe Customer Portal
4. Pode: cancelar, trocar de plano, atualizar cartão de crédito
5. Mudanças refletidas via webhooks Stripe
```

---

## 6. Stack Técnico

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router) | SSR/SSG, performance, rotas de API integradas |
| **Estilização** | Tailwind CSS + Design System existente | Consistência visual, utilitário |
| **Backend** | Next.js API Routes (Node.js) | Monorepo simplificado, mesma linguagem |
| **ORM** | Prisma | Type-safe, migrations, suporte a PostgreSQL |
| **Banco** | PostgreSQL (Neon ou Supabase) | Relacional, gerenciado, escalável |
| **Autenticação** | JWT customizado (HttpOnly cookies) | Controle total, sem dependência extra |
| **Pagamentos** | Stripe (Checkout + Customer Portal + Webhooks) | Padrão do mercado para recorrência |
| **Vídeos** | Bunny Stream | Custo-benefício, CDN global, API simples |
| **E-mail** | Nodemailer + SMTP (ou Resend) | E-mails transacionais |
| **PDF** | `pdf-lib` ou `puppeteer` | Geração de certificados |
| **Hospedagem** | Vercel (Next.js) + Neon/Supabase (DB) | DX excelente, deploys automáticos, custo inicial baixo |
| **Storage** | Bunny Stream (vídeos) + Vercel Blob ou S3 (thumbnails) | Separação de responsabilidades |

---

## 7. Pré-requisitos e Acesso

### Contas e Serviços Necessários

| Serviço | Finalidade | Status |
|---|---|---|
| Vercel | Hospedagem da aplicação Next.js | A configurar |
| Neon ou Supabase | Banco de dados PostgreSQL gerenciado | A configurar |
| Stripe | Assinaturas recorrentes e pagamentos | A configurar |
| Bunny Stream | Hospedagem e streaming de vídeos | A configurar |
| Provedor SMTP | E-mails transacionais (ex: Resend, SendGrid, Brevo) | A configurar |
| Figma/Storybook | Design System existente | Acesso pelo cliente |

### Variáveis de Ambiente

Todas as variáveis estão em `PROJECT_ROOT/.env.local` com valores placeholder. **O desenvolvedor deve preencher os valores reais manualmente antes de iniciar a implementação.**

| Variável | Finalidade | Arquivo |
|---|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL | `.env.local` |
| `JWT_SECRET` | Assinar tokens JWT | `.env.local` |
| `JWT_EXPIRES_IN` | Expiração do token (ex: `7d`) | `.env.local` |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação | `.env.local` |
| `STRIPE_SECRET_KEY` | Chamadas server-side à API Stripe | `.env.local` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js no cliente | `.env.local` |
| `STRIPE_WEBHOOK_SECRET` | Verificar assinatura dos webhooks | `.env.local` |
| `STRIPE_PRICE_ID_BASIC_MONTHLY` | Price ID do plano Básico mensal | `.env.local` |
| `STRIPE_PRICE_ID_BASIC_ANNUAL` | Price ID do plano Básico anual | `.env.local` |
| `STRIPE_PRICE_ID_PREMIUM_MONTHLY` | Price ID do plano Premium mensal | `.env.local` |
| `STRIPE_PRICE_ID_PREMIUM_ANNUAL` | Price ID do plano Premium anual | `.env.local` |
| `BUNNY_STREAM_API_KEY` | Autenticação na API do Bunny Stream | `.env.local` |
| `BUNNY_STREAM_LIBRARY_ID` | ID da biblioteca de vídeos | `.env.local` |
| `BUNNY_STREAM_CDN_HOSTNAME` | Hostname do CDN para embeds | `.env.local` |
| `SMTP_HOST` | Host do servidor SMTP | `.env.local` |
| `SMTP_PORT` | Porta SMTP (geralmente 587) | `.env.local` |
| `SMTP_USER` | Usuário SMTP | `.env.local` |
| `SMTP_PASSWORD` | Senha SMTP | `.env.local` |
| `SMTP_FROM` | Endereço remetente dos e-mails | `.env.local` |

### Usuários de Teste Necessários

Antes de iniciar a implementação, criar manualmente (via seed ou SQL):

| Perfil | E-mail | Função |
|---|---|---|
| Admin | admin@test.com | Testar painel administrativo |
| Instrutor | instrutor@test.com | Testar exibição de autor |
| Aluno Básico | aluno.basico@test.com | Testar plano Básico |
| Aluno Premium | aluno.premium@test.com | Testar plano Premium |

### Gaps de Pré-requisito

- **Design System**: O cliente possui Figma/Storybook existente. Os tokens de design e componentes base precisam ser fornecidos antes da implementação da UI. **Decisão: prosseguir com implementação de backend/API em paralelo enquanto design system é disponibilizado.**

---

## 8. Modelo de Dados Conceitual

### Entidades Principais

```
users
  id            UUID PK
  email         VARCHAR(255) UNIQUE NOT NULL
  name          VARCHAR(255) NOT NULL
  password_hash VARCHAR(255) NOT NULL
  role          ENUM(admin, instructor, student) DEFAULT student
  avatar_url    TEXT
  is_active     BOOLEAN DEFAULT true
  created_at    TIMESTAMP DEFAULT NOW()
  updated_at    TIMESTAMP

instructors (extensão de users com role=instructor)
  user_id       UUID FK → users.id PK
  bio           TEXT
  slug          VARCHAR(255) UNIQUE

courses
  id            UUID PK
  title         VARCHAR(255) NOT NULL
  slug          VARCHAR(255) UNIQUE NOT NULL
  description   TEXT
  thumbnail_url TEXT
  instructor_id UUID FK → users.id
  plan_access   ENUM(basic, premium) NOT NULL
  status        ENUM(draft, published, archived) DEFAULT draft
  created_at    TIMESTAMP DEFAULT NOW()
  updated_at    TIMESTAMP

modules
  id            UUID PK
  course_id     UUID FK → courses.id
  title         VARCHAR(255) NOT NULL
  description   TEXT
  order         INT NOT NULL
  created_at    TIMESTAMP DEFAULT NOW()

lessons
  id               UUID PK
  module_id        UUID FK → modules.id
  title            VARCHAR(255) NOT NULL
  description      TEXT
  video_id         VARCHAR(255)       -- Bunny Stream Video ID
  video_duration   INT                -- duração em segundos
  content          TEXT               -- markdown opcional
  order            INT NOT NULL
  is_preview       BOOLEAN DEFAULT false
  created_at       TIMESTAMP DEFAULT NOW()
  updated_at       TIMESTAMP

subscription_plans
  id                          UUID PK
  name                        VARCHAR(255) NOT NULL
  type                        ENUM(basic, premium) UNIQUE NOT NULL
  description                 TEXT
  price_monthly               DECIMAL(10,2)
  price_annual                DECIMAL(10,2)
  stripe_price_id_monthly     VARCHAR(255)
  stripe_price_id_annual      VARCHAR(255)
  is_active                   BOOLEAN DEFAULT true

user_subscriptions
  id                      UUID PK
  user_id                 UUID FK → users.id
  plan_id                 UUID FK → subscription_plans.id
  stripe_subscription_id  VARCHAR(255) UNIQUE
  stripe_customer_id      VARCHAR(255)
  status                  ENUM(active, past_due, canceled, trialing)
  billing_cycle           ENUM(monthly, annual)
  current_period_start    TIMESTAMP
  current_period_end      TIMESTAMP
  created_at              TIMESTAMP DEFAULT NOW()
  updated_at              TIMESTAMP

course_enrollments
  id              UUID PK
  user_id         UUID FK → users.id
  course_id       UUID FK → courses.id
  enrolled_at     TIMESTAMP DEFAULT NOW()
  completed_at    TIMESTAMP
  UNIQUE(user_id, course_id)

lesson_progress
  id                  UUID PK
  user_id             UUID FK → users.id
  lesson_id           UUID FK → lessons.id
  watch_percentage    DECIMAL(5,2) DEFAULT 0   -- 0 a 100
  is_completed        BOOLEAN DEFAULT false
  completed_at        TIMESTAMP
  last_watched_at     TIMESTAMP DEFAULT NOW()
  UNIQUE(user_id, lesson_id)

certificates
  id            UUID PK
  user_id       UUID FK → users.id
  course_id     UUID FK → courses.id
  issued_at     TIMESTAMP DEFAULT NOW()
  file_url      TEXT                            -- URL do PDF gerado
  UNIQUE(user_id, course_id)
```

### Relacionamentos-Chave

- Um `user` tem no máximo uma `user_subscription` ativa por vez
- Acesso ao curso: `user_subscription.plan_id.type >= course.plan_access`
  - Premium acessa basic + premium
  - Básico acessa apenas basic
- `course_enrollments` é criado na primeira aula assistida de um curso
- `lesson_progress` atualizado a cada evento de progresso do player
- `certificates` gerado automaticamente quando `course_enrollments.completed_at` é preenchido

---

## 9. Princípios de Design e UI

- **Base**: Design system existente do cliente (Figma/Storybook) — tokens de cor, tipografia e espaçamento devem ser importados como variáveis CSS ou configuração Tailwind
- **Responsividade**: Mobile-first; breakpoints principais: 375px (mobile), 768px (tablet), 1280px (desktop)
- **Acessibilidade**: WCAG 2.1 nível AA — contraste adequado, suporte a teclado, atributos ARIA
- **Player de vídeo**: Bunny Stream embed responsivo (aspect-ratio 16:9), controles nativos do player
- **Feedback imediato**: Estados de loading, error e success em todas as ações assíncronas
- **Navegação do aluno**: Header com logo, links principais, avatar/menu do usuário; sidebar em páginas de curso

---

## 10. Segurança

- Senhas armazenadas com bcrypt (salt rounds ≥ 12)
- JWT em HttpOnly cookies (não acessível via JavaScript)
- CSRF protection via SameSite=Strict cookie
- Verificação obrigatória de assinatura em todos os webhooks Stripe (`stripe.webhooks.constructEvent`)
- Todas as rotas de API protegidas por middleware de autenticação + autorização por role
- Rate limiting nas rotas de autenticação (máx. 10 tentativas/minuto por IP)
- Vídeos do Bunny Stream com restrição de domínio (whitelist apenas do domínio da plataforma)
- Variáveis de ambiente nunca expostas no bundle do cliente (prefixo `NEXT_PUBLIC_` apenas para chaves públicas)
- Sanitização de inputs em todos os formulários (prevenção de XSS e SQL Injection via Prisma ORM)
- HTTPS obrigatório em produção (via Vercel)

---

## 11. Fases de Desenvolvimento

### Fase 1 (este PRD)

**Sprint 1 — Fundação**
- Setup do projeto (Next.js + Prisma + PostgreSQL + Tailwind)
- Autenticação completa (cadastro, login, recuperação de senha)
- Modelo de dados e migrations
- Design system integrado

**Sprint 2 — Conteúdo e Admin**
- Painel administrativo
- CRUD de cursos, módulos e aulas
- Integração Bunny Stream (upload e embed)
- Catálogo público e página de detalhe de curso

**Sprint 3 — Assinaturas**
- Integração Stripe (planos, checkout, webhooks)
- Controle de acesso por plano
- Portal do cliente Stripe

**Sprint 4 — Progresso, Certificado e Dashboard**
- Rastreamento de progresso por aula
- Marcação automática de conclusão
- Dashboard do aluno
- Geração de certificado PDF

**Sprint 5 — Polimento e Lançamento**
- E-mails transacionais
- Testes end-to-end
- Performance e SEO básico
- Deploy em produção (Vercel)

### Fase 2 — Crescimento e Engajamento (TASK-84 a TASK-145)

Detalhada na seção 13. Resumo por sprint sugerido:

**Sprint 6 — Monetização**
- Trial gratuito, cupons de desconto, compra avulsa de curso, programa de indicação, relatórios financeiros (MRR/churn/LTV)

**Sprint 7 — Retenção e prova social**
- E-mail de retomada de curso, notificação de cobrança falhada, avaliação de curso, streak de estudo

**Sprint 8 — Conteúdo e aprendizado**
- Legendas/transcrição de vídeo, quiz por módulo, busca dentro do curso, retomar do ponto exato e velocidade de reprodução

**Sprint 9 — Operação**
- Página pública de instrutor, área própria do instrutor (somente leitura), materiais complementares por aula, exportação CSV, auditoria de ações admin

### Fase 3 — Expansão e Maturidade (TASK-146 a TASK-150, TASK-167 a TASK-195)

Detalhada na seção 14. Resumo por sprint sugerido (ordem de prioridade conforme `docs/fase3-oportunidades.md`):

> **B2B despriorizado (2026-06-21):** o licenciamento corporativo (TASK-151 a TASK-166) foi retirado dos sprints ativos e suas tasks movidas para `.agent/tasks/deprecated/` — não por inviabilidade técnica, mas por decisão de priorização (demanda ainda não validada com o cliente, ver seção 14.6). O spec completo permanece descrito na seção 14.1/14.4 para quando a direção for revisitada.

**Sprint 10 — Monetização rápida**
- Boleto via Stripe na compra avulsa, com tratamento de pagamento assíncrono (Pix adiado — ver `docs/pix-habilitacao.md`)

**Sprint 11 — Expansão de catálogo**
- Trilhas e bundles de cursos, conteúdo programado (drip content)

**Sprint 12 — Confiabilidade e dados de produto**
- Testes E2E com Playwright, rate limiting distribuído (Upstash Redis), monitoramento de erro (Sentry), event tracking de produto

### Fase 4+ (fora do escopo desta rodada)

- Gamificação pesada (pontos, ranking competitivo)
- Fórum e comunidade de alunos
- App mobile nativo (iOS e Android)
- Certificado com URL de verificação pública
- Live streaming de aulas
- Edição de conteúdo de curso pelo próprio instrutor (a Fase 2 entrega o painel do instrutor somente leitura — ver TASK-139)

---

## 12. Premissas e Dependências

### Premissas

- O design system existente estará disponível em formato compatível com Tailwind CSS ou como biblioteca de componentes React antes do Sprint 1
- O cliente criará e configurará as contas Stripe, Bunny Stream, Vercel e banco de dados antes do Sprint 1
- Os planos de assinatura (preços de Básico e Premium) serão definidos e configurados no Stripe Dashboard antes do Sprint 3
- O conteúdo inicial de cursos (vídeos, textos, thumbnails) estará disponível para testes no Bunny Stream antes do Sprint 4
- A plataforma opera apenas com pagamentos em BRL (Real Brasileiro)

### Dependências

- Stripe: funcionamento correto dos webhooks em ambiente local requer [Stripe CLI](https://stripe.com/docs/stripe-cli)
- Bunny Stream: biblioteca deve ter CDN configurado e domínio da plataforma whitelistado
- Vercel: necessário configurar variáveis de ambiente no dashboard antes do deploy
- Design System: componentes base precisam estar disponíveis antes da implementação da UI

### Não-Metas (Fase 1)

- ~~Não há sistema de afiliados ou comissões~~ → Fase 2 entrega um programa de indicação simples (TASK-103 a TASK-107), não um sistema completo de afiliados
- Não há integração com plataformas de terceiros (LinkedIn, Zapier, etc.)
- Não há suporte a múltiplos idiomas (apenas PT-BR)
- ~~Não há funcionalidade de busca avançada por conteúdo das aulas~~ → Fase 2 entrega busca simples via `contains` (TASK-131/132), não full-text search
- ~~Instrutores não têm painel próprio na Fase 1~~ → Fase 2 entrega painel do instrutor somente leitura (TASK-137 a TASK-139); edição de conteúdo pelo instrutor continua fora de escopo
- ~~Não há trial gratuito de assinatura na Fase 1~~ → Fase 2 permite que o admin conceda manualmente 7 dias de teste grátis a um usuário específico (TASK-85 a TASK-87) — não é um trial oferecido a todo mundo que assina

### Não-Metas (Fase 2 e além)

- Edição de conteúdo de curso pelo próprio instrutor (painel do instrutor é somente leitura na Fase 2)
- Sistema de afiliados completo com múltiplos níveis de comissão (Fase 2 entrega só indicação direta 1 nível)
- Full-text search (tsvector/Elasticsearch) — Fase 2 usa busca simples via `contains`

### Não-Metas (Fase 3)

- **Gestão B2B continua fora de escopo desta rodada** — o modelo de organização com seats foi especificado (TASK-151 a TASK-166), mas despriorizado e movido para `.agent/tasks/deprecated/`; demanda real ainda não validada com o cliente — ver decisão na seção 14.6
- Assinatura recorrente de trilha — Fase 3 entrega só bundle em pagamento único (TASK-167 a TASK-173)
- Liberação programada por aula individual — Fase 3 entrega granularidade por módulo (TASK-174 a TASK-178)

### Não-Metas (Fase 3 e além)

- Gamificação pesada (pontos, ranking competitivo), fórum/comunidade, app mobile nativo e live streaming — ver "Fase 4+" na seção 11

---

## 13. Fase 2 — Crescimento e Engajamento

Origem: `docs/oportunidades-plataforma.md`, seções 1–5 (seção 6, B2B e fórum, permanece fora de escopo — ver seção 12). Cada requisito referencia o ID de task correspondente em `.agent/tasks/`.

### 13.1 Monetização (TASK-85 a TASK-110)

**Trial gratuito concedido pelo admin** — TASK-85 a TASK-87: admin concede manualmente 7 dias de teste grátis a um usuário específico em `/admin/usuarios`; o checkout aplica o trial apenas para esse usuário (consumindo a concessão), com aviso de fim de trial por e-mail e indicação visual no dashboard de assinatura. Não é um benefício padrão de checkout — `/planos` não menciona trial.
**Cupons de desconto** — TASK-90/91: `allow_promotion_codes` habilitado no Checkout; cupons criados e geridos direto no Stripe Dashboard.
**Compra avulsa de curso** — TASK-95 a TASK-99: cursos podem ser configurados para venda em pagamento único, sem exigir assinatura, com enrollment direto via webhook.
**Upsell contextual** — TASK-100 a TASK-102: eventos de exibição do `UpgradePrompt` são registrados e disparam e-mail de upsell automático após 3 dias sem conversão.
**Programa de indicação** — TASK-103 a TASK-107: código de indicação único por aluno, cupom de desconto para o indicado e crédito automático para o indicador na primeira assinatura do indicado.
**Relatórios financeiros** — TASK-108 a TASK-111: MRR, churn mensal e LTV médio por plano calculados a partir de `UserSubscription` e exibidos no `AdminDashboard`.

### 13.2 Engajamento e Retenção (TASK-112 a TASK-122)

**E-mail de retomada** — TASK-112 a TASK-114: identificação mensal de alunos inativos com curso incompleto, com e-mail "continue de onde parou" disparado via Vercel Cron.
**Notificação de cobrança falhada** — TASK-115/116: e-mail automático com link para o Stripe Customer Portal quando uma cobrança falha.
**Avaliação de curso** — TASK-117 a TASK-120: nota de 1 a 5 + comentário opcional ao concluir um curso, exibidos como prova social na página de detalhe.
**Streak de estudo** — TASK-121/122: indicador de dias consecutivos de estudo no dashboard do aluno.

### 13.3 Conteúdo e Aprendizado (TASK-123 a TASK-136)

**Legendas/transcrição** — TASK-123 a TASK-125: upload de arquivo `.vtt` por aula via API de Captions do Bunny Stream, com seletor nativo no player.
**Quiz por módulo** — TASK-126 a TASK-130: perguntas de múltipla escolha por módulo; aprovação (≥70%) passa a ser pré-requisito do certificado quando o módulo tiver quiz.
**Busca dentro do curso** — TASK-131/132: busca textual simples (título/descrição/conteúdo das aulas) na sidebar do curso.
**Retomar do ponto exato e velocidade** — TASK-133 a TASK-136: posição exata do vídeo salva e usada para retomar a aula; controle de velocidade depende de validar suporte nativo do embed Bunny Stream.

### 13.4 Operação e Admin (TASK-88, TASK-89, TASK-92 a TASK-94, TASK-137 a TASK-145)

**Página pública de instrutor** — TASK-88/89: rota `/instrutores/[slug]` com bio e cursos publicados, usando o `slug` já existente no model `Instructor`.
**Materiais complementares por aula** — TASK-92 a TASK-94: campo `attachments` em `Lesson` para links de download (slides, exercícios, código-fonte).
**Área própria do instrutor** — TASK-137 a TASK-139: painel somente leitura em `/instrutor` com cursos próprios, matrículas e taxa de conclusão.
**Exportação CSV** — TASK-140 a TASK-142: exportação de assinaturas e usuários para reconciliação financeira e campanhas.
**Auditoria de ações admin** — TASK-143 a TASK-145: log de mudanças sensíveis (status de curso, role/status de usuário) com tela de consulta em `/admin/auditoria`.

### 13.5 Pré-requisitos específicos da Fase 2

| Item | Necessário para | Status |
|---|---|---|
| `CRON_SECRET` (nova variável em `.env.local`) | Proteger endpoints `/api/cron/*` (TASK-102, TASK-114) | A preencher manualmente (TASK-84) |
| Promotion Codes habilitado no Stripe Dashboard | Cupons de desconto (TASK-90) | A confirmar (TASK-84) |
| `STRIPE_COUPON_ID_REFERRAL` (nova variável) | Crédito de indicação (TASK-106) | Criar Coupon fixo no Stripe Dashboard antes da TASK-106 |
| API de Captions do Bunny Stream acessível | Legendas (TASK-123) | A confirmar (TASK-84) |
| Vercel Cron habilitado no projeto | E-mails de upsell e reengajamento (TASK-102, TASK-114) | A configurar no deploy (depende de TASK-82) |
| Evento `customer.subscription.trial_will_end` adicionado à lista de eventos do endpoint de webhook na Stripe Dashboard | Aviso de fim de trial (TASK-87) | Pendente — adicionar manualmente em Developers → Webhooks (local, via `stripe listen`, já recebe todos os eventos; em produção, o endpoint configurado precisa ter esse evento habilitado explicitamente) |

### 13.6 Decisões de escopo assumidas (sem confirmação do cliente)

- Trial gratuito: concedido manualmente pelo admin por usuário (não é oferecido a todo mundo que assina), 7 dias fixos, consumido após o primeiro uso, sem necessidade de cartão verificado além do que o próprio Stripe já exige no Checkout
- Quiz: aprovação mínima de 70%: para passar a contar como pré-requisito do certificado
- Painel do instrutor: somente leitura nesta rodada — edição de conteúdo continua centralizada no admin
- Programa de indicação: 1 nível apenas (sem cadeia de indicações), crédito equivalente a um ciclo de cobrança
- Churn/LTV: calculados de forma aproximada a partir do histórico de `UserSubscription`, sem tabela de snapshot mensal dedicada

Essas decisões devem ser validadas com o cliente antes ou durante a implementação das tasks correspondentes; ajustar a task específica se a decisão mudar.

---

## 14. Fase 3 — Expansão e Maturidade

Origem: `docs/fase3-oportunidades.md`. Documento de visão original — não previa quebra em tasks até validação com o cliente; esta seção converte os 7 itens do documento em tasks de implementação, mais uma frente adicional (14.7) decidida em conversa com o cliente em 2026-06-21, fora do documento de oportunidades original. **B2B (14.1) foi despriorizado e suas tasks (TASK-151 a TASK-166) movidas para `.agent/tasks/deprecated/`** — ver decisão na seção 14.6; o spec permanece descrito abaixo (14.1/14.4) como referência para quando a direção for revisitada, mas não faz parte dos sprints ativos (seção 11). Cada requisito referencia o ID de task correspondente em `.agent/tasks/`.

### 14.1 Monetização e Expansão de Mercado (TASK-147 a TASK-150, TASK-167 a TASK-173 ativas; TASK-151 a TASK-166 despriorizadas)

**Boleto via Stripe (Pix adiado)** — TASK-147 a TASK-150: Boleto habilitado na Checkout Session de compra avulsa (`mode: 'payment'`), com tratamento dos webhooks de pagamento assíncrono (`checkout.session.async_payment_succeeded`/`async_payment_failed`) e estado de "pagamento pendente" na UI. Pix foi adiado desta rodada — habilitar exige convite da Stripe para contas BR, não é configuração direta de Dashboard (ver `docs/pix-habilitacao.md`). Suporte de Boleto na assinatura recorrente fica como investigação separada (TASK-150), já que cobrança recorrente com método assíncrono tem implicações de `past_due` temporário a cada ciclo.
**B2B / licenciamento corporativo — `[DESPRIORIZADO, ver 14.6]`** — TASK-151 a TASK-166 (movidas para `.agent/tasks/deprecated/`): modelo `Organization` com seats (`OrganizationMember`, `OrganizationInvite`, `OrganizationSubscription`), controle de acesso estendido em `access.ts` para conceder nível premium a membros de organização ativa, fluxo de convite por e-mail, checkout por seat via Stripe (`quantity` no line item) e painel `/organizacao` para o owner gerenciar membros e assinatura. Spec mantido como referência; não faz parte do roadmap ativo (seção 11) até a demanda ser validada.
**Trilhas e bundles de cursos** — TASK-167 a TASK-173: `CourseTrack`/`CourseTrackItem` agrupam cursos em sequência; trilha pode ser vendida como bundle em pagamento único (reaproveitando o padrão de compra avulsa individual), com matrícula em lote em todos os cursos da trilha via webhook.

### 14.2 Conteúdo (TASK-174 a TASK-178)

**Conteúdo programado (drip content)** — TASK-174 a TASK-178: módulos ganham `releaseType` (`immediate`/`fixed_date`/`days_after_enrollment`), com liberação calculada a partir de `CourseEnrollment.enrolledAt` para o caso de dias após matrícula. Granularidade por módulo, não por aula individual.

### 14.3 Confiabilidade e Dados de Produto (TASK-179 a TASK-195)

**Testes E2E com Playwright** — TASK-179 a TASK-184: `playwright.config.ts` configurado e specs cobrindo os fluxos críticos identificados no documento de oportunidades (cadastro/login, checkout de assinatura, player e progresso, conclusão de curso e certificado).
**Rate limiting distribuído** — TASK-185 a TASK-187: `src/lib/rate-limit.ts` migrado de `Map` em memória para Upstash Redis (via Vercel Marketplace), validado entre múltiplas instâncias.
**Monitoramento de erro em produção** — TASK-188 a TASK-190: `@sentry/nextjs` instalado e configurado, com captura explícita de erros nos fluxos financeiramente críticos (webhook Stripe, checkout, certificado) e alerta de erro configurado para produção.
**Event tracking de produto** — TASK-191 a TASK-195: tabela `ProductEvent` simples, helper `trackEvent` fire-and-forget, instrumentação dos eventos-chave do funil (visualização de planos, início de checkout, ativação de assinatura, início de aula) e seção de funil/abandono no `AdminDashboard`.

### 14.4 Fluxo de Usuário — B2B (Criação de Organização e Convite) `[DESPRIORIZADO, ver 14.6]`

> Fluxo preservado como referência para quando o B2B for retomado — não está em implementação ativa nesta rodada.

```
1. Usuário autenticado acessa /planos/empresas → escolhe quantidade de seats e ciclo
2. Confirma → cria Organization (torna-se owner) → redireciona para Stripe Checkout (cobrança por seat)
3. Pagamento confirmado → webhook ativa OrganizationSubscription
4. Owner acessa /organizacao → convida membros por e-mail (respeitando o seatLimit contratado)
5. Convidado recebe e-mail com link /convite/[token] → aceita (cria conta se necessário)
6. Membro aceito ganha acesso de nível premium a todo o catálogo, herdado da organização
```

### 14.5 Pré-requisitos específicos da Fase 3

| Item | Necessário para | Status |
|---|---|---|
| `STRIPE_PRICE_ID_B2B_SEAT_MONTHLY`/`STRIPE_PRICE_ID_B2B_SEAT_ANNUAL` (novas variáveis) | Checkout B2B por seat (TASK-162) | Despriorizado junto com B2B — não criar agora (ver 14.6) |
| Boleto habilitado na conta Stripe (BRL/BR) | Compra avulsa com Boleto (TASK-147) | A confirmar (TASK-146) |
| Convite da Stripe para habilitar Pix (BRL/BR) | Reabilitar Pix na compra avulsa/bundle — adiado da Fase 3 | Adiado — ver `docs/pix-habilitacao.md` para solicitar |
| `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (novas variáveis) | Rate limiting distribuído (TASK-185/186) | Provisionar via Vercel Marketplace (TASK-146/185) |
| `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`/`SENTRY_AUTH_TOKEN` (novas variáveis) | Monitoramento de erro (TASK-188) | Criar projeto Sentry (TASK-146/188) |
| Eventos `checkout.session.async_payment_succeeded`/`async_payment_failed` adicionados à lista de eventos do endpoint de webhook na Stripe Dashboard | Boleto assíncrono (TASK-148) | Pendente — mesmo padrão já usado para `trial_will_end` na Fase 2 (local via `stripe listen` já recebe todos os eventos; produção precisa habilitar explicitamente) |

### 14.6 Decisões de escopo assumidas (sem confirmação do cliente)

- **B2B (despriorizado em 2026-06-21):** demanda de clientes corporativos ainda não validada — o documento de origem (`docs/fase3-oportunidades.md`) classifica B2B como "maior alavanca de receita do roadmap atual", mas recomenda "validação de demanda antes de investir". Decisão tomada: em vez de manter as tasks no sprint ativo só com essa ressalva, TASK-151 a TASK-166 foram movidas para `.agent/tasks/deprecated/` e retiradas dos sprints da seção 11. O spec completo permanece intacto (descrito em 14.1/14.4) para retomada futura, condicionado a validar a demanda com o cliente antes de reabrir qualquer um dos Grupos 2 a 5 (`docs/fase3-grupos-de-trabalho.md`).
- Decisões de escopo já registradas no spec, preservadas para quando o B2B for retomado: 1 usuário pertence a no máximo 1 organização (sem multi-tenancy); acesso de organização equivale a nível `premium`, sem distinção básico/premium por seat; seats fixados no checkout inicial, sem self-service de ajuste de quantidade; convite por e-mail expira em 7 dias.
- Trilhas/bundles: bundle dá acesso permanente via enrollment direto em cada curso da trilha (igual à compra avulsa individual) — sem assinatura recorrente de trilha
- Drip content: liberação programada por módulo, não por aula individual
- Boleto recorrente (assinatura): decisão não assumida — fica para investigação dedicada na TASK-150, podendo concluir como "não habilitar nesta rodada"
- Pix: adiado da Fase 3 — TASK-147 a 150 e TASK-172 cobrem só Boleto. Habilitar exige convite da Stripe para contas BR, não é uma decisão de produto, é um bloqueio externo (ver `docs/pix-habilitacao.md` para solicitar e para os pontos a reverter quando concedido)
- Event tracking: tabela própria simples (`ProductEvent`), sem ferramenta de analytics externa nesta rodada

Essas decisões devem ser validadas com o cliente antes ou durante a implementação das tasks correspondentes; ajustar a task específica se a decisão mudar.

### 14.7 Checkout integrado ao cadastro (Embedded Checkout) — TASK-196 a TASK-200

Decidido em 2026-06-21, fora do documento de oportunidades original (`docs/fase3-oportunidades.md`). Hoje o cadastro (`/cadastro`) só cria a conta e redireciona para `/dashboard` — a escolha de plano acontece numa visita separada a `/planos`, e quem ainda não tem conta e clica em "Assinar" lá é mandado para `/login`, sem caminho direto para criar conta preservando a intenção de assinatura. Esta frente junta os dois passos numa página só, usando o **Embedded Checkout** do Stripe (`ui_mode: 'embedded'`) em vez do Checkout hospedado — o formulário de pagamento é renderizado num iframe dentro da própria página, sem redirecionar o usuário para `checkout.stripe.com`.

- **TASK-196** — `POST /api/subscriptions/checkout` passa a aceitar `uiMode: 'hosted' | 'embedded'`, retornando `clientSecret` no modo embedded (mantém `checkoutUrl` no modo hosted, comportamento atual inalterado).
- **TASK-197** — Componente `EmbeddedCheckoutForm` reutilizável (`@stripe/stripe-js` + `@stripe/react-stripe-js`).
- **TASK-198** — `/planos` propaga plano/ciclo escolhidos para `/cadastro` via query string quando o usuário não está autenticado, em vez de só oferecer login.
- **TASK-199** — `RegisterForm` ganha um segundo passo: com plano selecionado, após criar a conta abre o Embedded Checkout inline na mesma página em vez de ir direto para `/dashboard`.
- **TASK-200** — Rota de retorno (`return_url`) para os casos em que a confirmação de pagamento navega para fora do iframe (ex.: desafio 3D Secure) e não dispara o callback `onComplete` no client.

**Decisão de escopo:** não há custo adicional do Stripe por usar Embedded em vez de Hosted Checkout — é o mesmo produto Checkout Session, mesma tabela de taxas por forma de pagamento (`docs/stripe-pricing.md`), só muda onde a UI é renderizada. Esta frente cobre apenas o checkout de **assinatura** (`mode: 'subscription'`, planos Básico/Premium) integrado ao cadastro — não estende Embedded Checkout à compra avulsa de curso nem ao bundle de trilha (TASK-167 a 173) nesta rodada.
