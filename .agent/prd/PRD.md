# PRD — Plataforma de Cursos Online por Assinatura (Fase 1)

**Versão**: 1.0  
**Data**: 2026-06-14  
**Fase**: 1 — MVP B2C

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

### Fase 2 (fora do escopo)

- Gestão B2B com painel de equipes e seats corporativos
- Gamificação (badges, pontos, ranking)
- Fórum e comunidade de alunos
- App mobile nativo (iOS e Android)
- Certificado com URL de verificação pública
- Live streaming de aulas

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

- Não há sistema de afiliados ou comissões
- Não há integração com plataformas de terceiros (LinkedIn, Zapier, etc.)
- Não há suporte a múltiplos idiomas (apenas PT-BR)
- Não há funcionalidade de busca avançada por conteúdo das aulas
- Instrutores não têm painel próprio na Fase 1 (Admin gerencia todo o conteúdo)
- Não há trial gratuito de assinatura na Fase 1
