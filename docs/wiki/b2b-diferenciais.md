# Fase 3 — B2B: Diferenciais Reais para o Cliente Corporativo

> Documento de visão, não de execução. Sem quebra em tasks — isso só deveria acontecer depois de validar com o cliente quais desses diferenciais pesam de fato na decisão de compra de uma empresa.

## Por que este documento existe

As tasks de B2B já planejadas (`TASK-151` a `TASK-166`, ver `docs/fase3-grupos-de-trabalho.md` Grupos 2 a 5, e `.agent/prd/PRD.md` seção 14.1/14.4) entregam o modelo de `Organization` com seats, convite de membros e cobrança por seat via Stripe. Isso resolve a parte **comercial/técnica** (como cobrar e dar acesso a N pessoas de uma vez), mas o que se vende com isso ainda é só "o mesmo catálogo de assinatura individual, agora pago em lote por uma empresa". Não é um diferencial de produto — é o requisito mínimo para a transação existir.

Para um RH/L&D corporativo decidir comprar (e renovar) de uma plataforma de cursos em vez de só dar reembolso de assinaturas individuais aos colaboradores, o produto precisa oferecer algo que a assinatura individual não oferece. É isso que está listado abaixo.

## Ideias por categoria

### 1. Conteúdo próprio da organização

- Upload de cursos privados pela própria empresa (treinamento interno, onboarding, processos, compliance específico do negócio), visíveis apenas para membros da organização — reaproveitando a estrutura `Course → Module → Lesson` já existente, com um `organizationId` no lugar do instrutor da plataforma.
- Combinar conteúdo próprio com o catálogo geral numa mesma trilha (ex.: trilha de onboarding com 2 cursos do catálogo público + 1 curso interno exclusivo da empresa).
- Quizzes e certificados (já existentes na Fase 2) aplicáveis também a esse conteúdo próprio.

### 2. Visibilidade e gestão para o gestor/RH

- Dashboard de engajamento por colaborador: progresso, tempo de estudo, cursos concluídos e atrasados — visão que hoje só existe para o próprio aluno, nunca para um terceiro.
- Visão agregada por equipe/departamento (sub-grupos dentro da organização), não só a lista plana de membros que as tasks atuais (TASK-156/157) preveem.
- Alertas automáticos para o owner/gestor: "colaborador X ainda não iniciou o treinamento obrigatório Y".
- Atribuição de trilhas obrigatórias por cargo ou departamento, com prazo de conclusão.

### 3. Compliance e auditoria

- Exportação em lote de certificados de todos os colaboradores — útil para auditorias de compliance (NRs, LGPD, políticas internas).
- Certificados com data de validade e lembrete automático de renovação (treinamentos obrigatórios recorrentes, ex. anuais).
- Log de auditoria de quem completou o quê e quando, exportável para o RH (diferente do `AdminAuditLog` atual, que é só para ações administrativas internas da plataforma).

### 4. Onboarding e integração corporativa

- Importação em massa de colaboradores via CSV, em vez de convite individual um a um (TASK-158 hoje só cobre convite por e-mail unitário).
- SSO corporativo (Google Workspace, Microsoft Entra/SAML) — relevante para empresas médias/grandes cujo time de TI exige login único em qualquer ferramenta nova.
- Desativação de acesso sincronizada com saída do colaborador — hoje é remoção manual pelo owner (TASK-161); integração com o RH automatizaria isso.

### 5. Branding e experiência

- Portal da organização com logo e cores da empresa cliente (white-label parcial em `/organizacao`).
- Certificado co-branded — logo da empresa cliente ao lado do logo da plataforma.

### 6. Dados e integração

- API ou webhook de progresso para empresas que já têm um LMS/HRIS próprio e preferem só consumir dados, sem usar o painel da plataforma diretamente.

## Como priorizar (sugestão inicial, sem validação de demanda)

1. **Dashboard de engajamento (#2) e conteúdo próprio (#1)** são o diferencial mais visível — sem eles, a oferta B2B não passa de "assinatura comprada em lote", o que dificulta justificar um preço por seat acima do individual.
2. **Compliance (#3)** é o gancho de venda mais forte para empresas reguladas ou com treinamento obrigatório recorrente.
3. **Onboarding corporativo (#4) e branding (#5)** reduzem fricção de adoção e ajudam na renovação, mas só importam depois que o core (#1/#2) já existir.
4. **Integração de dados (#6)** é o item mais avançado — provavelmente só relevante para contas enterprise grandes, numa fase posterior.

## Relação com o que já está planejado

Nenhum item acima tem task gerada ainda. Os 4 modelos já especificados em TASK-151 a 154 (`Organization`, `OrganizationMember`, `OrganizationInvite`, `OrganizationSubscription`) continuam sendo a base necessária — este documento não os substitui, é uma camada de produto adicional sobre eles. Antes de quebrar qualquer um destes itens em tasks, vale validar com o cliente quais diferenciais pesam de fato na decisão de compra — a mesma ressalva de demanda não validada que já existe para o B2B em `.agent/prd/PRD.md` seção 14.6 vale com ainda mais força aqui, já que é investimento adicional sobre uma aposta que ainda não foi confirmada.
