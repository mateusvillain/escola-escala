# Resumo do Projeto — Plataforma de Cursos Online por Assinatura (Fase 1)

## Visão Geral

Plataforma web responsiva de cursos online por assinatura recorrente, focada no mercado brasileiro (B2C, PT-BR). Permite que uma organização publique conteúdo educacional em vídeo e monetize via planos de assinatura mensal ou anual, com rastreamento de progresso individual e emissão automática de certificado em PDF ao concluir cursos.

## Principais Funcionalidades

- **Autenticação**: Cadastro e login com e-mail/senha; JWT em HttpOnly cookie; recuperação de senha por e-mail
- **Perfis de acesso**: Admin (gestão total), Instrutor (tag de autor nos cursos), Aluno (consumo de conteúdo)
- **Catálogo de cursos**: Estrutura Curso → Módulos → Aulas; aulas de preview gratuito; detalhe de curso com CTA de assinatura
- **Player de vídeo**: Bunny Stream embedado; rastreamento de progresso; marcação automática de conclusão (≥ 80%)
- **Dashboard do aluno**: Cursos em andamento, continuar de onde parou, cursos disponíveis, concluídos
- **Certificado PDF**: Gerado automaticamente ao concluir 100% do curso, disponível para download
- **Assinaturas**: 2 planos (Básico e Premium) × 2 ciclos (mensal e anual) via Stripe; webhooks para ciclo de vida completo; Stripe Customer Portal para autogestão
- **Painel Admin**: CRUD de cursos/módulos/aulas, upload de vídeos Bunny Stream, gestão de usuários, métricas de plataforma

## Fluxos Principais

1. **Visitante → Assinante**: Catálogo → Detalhe do Curso → Planos → Checkout Stripe → Dashboard ativado
2. **Aluno assiste aula**: Dashboard → Seleciona curso → Player carrega → Progresso rastreado a cada 10s → Auto-complete a 80%
3. **Conclusão e certificado**: 100% das aulas concluídas → Certificado PDF gerado → Download disponível no dashboard
4. **Admin publica curso**: Login admin → Cria curso → Adiciona módulos e aulas → Upload/link de vídeos → Publica

## Requisitos-Chave

- Stack: Next.js 14+ (App Router) + Node.js + PostgreSQL (Neon/Supabase) + Prisma ORM
- Hospedagem: Vercel (app) + Neon ou Supabase (banco)
- Vídeos: Bunny Stream (upload via API ou ID manual)
- Pagamentos: Stripe (Checkout + Webhooks + Customer Portal)
- Design: Design system existente do cliente (Figma/Storybook)
- Idioma: PT-BR only
- Fora do escopo Fase 1: app mobile nativo, gamificação, fórum, gestão B2B
