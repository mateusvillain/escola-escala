# Testes E2E (Playwright) — como funcionam e como rodar

Guia para rodar a suíte de testes E2E (ponta a ponta) localmente, incluindo o passo a passo do
`stripe listen` exigido pelo spec de checkout. Testes E2E simulam um usuário real navegando no app — abrem
um navegador de verdade contra o servidor local, batem nas rotas reais e leem o banco real. Isso é diferente
dos testes unitários (`npx vitest run`), que testam funções isoladas sem subir o app.

## Por que esses testes existem

Eles não testam nenhuma funcionalidade nova da Fase 3 — cobrem os 4 fluxos mais críticos da plataforma, que já
existem desde a Fase 1/2, para detectar regressão antes que ela chegue em produção:

| Spec | Fluxo coberto |
|---|---|
| `e2e/auth.spec.ts` | Cadastro, login, senha incorreta |
| `e2e/checkout.spec.ts` | Assinatura de plano via Stripe Checkout hospedado |
| `e2e/player.spec.ts` | Player de aula, navegação entre aulas, conclusão automática |
| `e2e/certificate.spec.ts` | Conclusão de curso e download de certificado em PDF |
| `e2e/smoke.spec.ts` | Verificação mínima de que a configuração do Playwright funciona |

## Pré-requisitos

1. `.env.local` configurado (ver `AGENTS.md`) — em especial `DATABASE_URL`, `JWT_SECRET`,
   `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` em modo teste, e `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
2. Navegador do Playwright instalado (uma vez por máquina):
   ```bash
   npx playwright install chromium
   ```
3. Banco com o seed aplicado — os specs de player e certificado dependem de dados fixos criados por
   `prisma/seed.ts` (ver "Dados de teste fixos" abaixo):
   ```bash
   npx prisma db seed
   ```

## Rodando os testes

```bash
npm run test:e2e
# equivalente a: npx playwright test
```

O `playwright.config.ts` sobe o `npx next dev` automaticamente antes dos testes (via `webServer`) — não é
preciso deixar o servidor rodando manualmente antes. Para rodar um spec específico:

```bash
npx playwright test e2e/player.spec.ts
```

> **Atenção:** o `webServer` do Playwright às vezes não finaliza o processo `next-server` ao término da
> execução (limitação conhecida do encadeamento `npx next dev` → processo filho). Se notar a porta 3000 já
> ocupada numa execução seguinte, isso é esperado — `reuseExistingServer: !process.env.CI` reaproveita esse
> servidor automaticamente em vez de falhar. Se precisar liberar a porta manualmente:
> ```bash
> lsof -ti :3000 | xargs kill
> ```

## `stripe listen` — exigido só para `checkout.spec.ts`

O spec de checkout completa um pagamento real em modo teste no Stripe. A confirmação da assinatura não
acontece na hora — chega depois, de forma assíncrona, via webhook (`POST /api/webhooks/stripe`). Sem o
webhook chegando, o pagamento é aprovado no Stripe mas a `UserSubscription` nunca é criada no banco, e o
teste falha por timeout esperando a assinatura ativar.

### Passo a passo

1. Instale o Stripe CLI (uma vez por máquina), se ainda não tiver:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```
2. Autentique com a conta Stripe do projeto (uma vez por máquina/sessão):
   ```bash
   stripe login
   ```
3. Em um terminal **separado**, deixado aberto durante toda a execução dos testes, rode:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   O comando imprime algo como `Ready! Your webhook signing secret is whsec_...`. Esse valor precisa ser
   igual ao `STRIPE_WEBHOOK_SECRET` em `.env.local` — se for diferente, copie o valor impresso para
   `.env.local` e reinicie o `next dev` (o `webServer` do Playwright recicla automaticamente se você matar o
   processo na porta 3000 antes de rodar os testes de novo).
4. Com o `stripe listen` rodando, em outro terminal:
   ```bash
   npx playwright test e2e/checkout.spec.ts
   ```

Se `STRIPE_SECRET_KEY` não estiver configurada em modo teste (prefixo `sk_test_`), o spec se auto-pula
(`test.skip`) em vez de arriscar rodar contra uma conta de produção.

### Por que esse passo não é automatizado

O Playwright sobe o `next dev` sozinho, mas o `stripe listen` é um processo externo ao Next.js — ele abre um
túnel entre o Stripe e o seu localhost, e não há uma forma de o Playwright iniciar isso por você sem exigir
que a máquina já tenha o Stripe CLI autenticado. Por isso esse é o único passo manual de toda a suíte.

## Dados de teste fixos

Os specs de player (`TASK-182`) e certificado (`TASK-183`) reaproveitam dados fixos do seed em vez de criar
conta/curso do zero a cada execução, porque simular conclusão de aula é uma chamada de API
(`POST /api/progress/[lessonId]`), não uma interação real com o player de vídeo (ver "Limitações conhecidas"):

| Dado | Valor | Onde é criado |
|---|---|---|
| Usuário premium | `aluno.premium@test.com` / `Test@12345` | `prisma/seed.ts` → `seedSubscriber` |
| Curso de teste | slug `curso-e2e-playwright`, 1 módulo, 3 aulas | `prisma/seed.ts` → `seedE2ECourse` |

Esse curso **não deve ser editado manualmente** pelo admin nem reutilizado para outro fim — os specs assumem
exatamente 3 aulas sem quiz. Se precisar adicionar mais cobertura, prefira criar um novo curso de teste
dedicado em vez de alterar esse.

Os specs de cadastro/login e checkout, em contraste, criam uma conta nova a cada execução
(`teste+${Date.now()}@example.com`, ver `e2e/helpers.ts`) — por isso não colidem entre execuções repetidas.
Os de player/certificado são idempotentes (mesmo usuário/curso, `upsert` no banco) — rodar duas vezes seguidas
não duplica nada nem quebra as asserções.

## Limitações conhecidas

- **`checkout.spec.ts` depende da estrutura HTML da página hospedada do Stripe** (`#cardNumber`,
  `#cardExpiry`, `#cardCvc`, `[data-testid="hosted-payment-submit-button"]`). Esses seletores são da própria
  Stripe, fora do controle deste projeto — se a Stripe alterar o layout do Checkout hospedado, esse spec pode
  quebrar mesmo sem nenhuma mudança no nosso código. Se isso acontecer, inspecione a página com
  `npx playwright test e2e/checkout.spec.ts --debug` para atualizar os seletores.
- **`player.spec.ts` não controla o player de vídeo real** (embed do Bunny Stream) — simula progresso
  chamando `POST /api/progress/[lessonId]` diretamente, e a verificação do iframe só confirma que o elemento
  carregou, não que o vídeo de fato reproduz.
- **A suíte roda com `workers: 1`** (`playwright.config.ts`) porque `player.spec.ts` e `certificate.spec.ts`
  compartilham o mesmo usuário/curso seedado — rodar em paralelo arriscaria corrida em `LessonProgress`.

## Achados relevantes durante a implementação

Escrever esses testes revelou dois bugs reais e pré-existentes (nenhum dos dois é específico do Playwright —
afetam usuários reais em produção):

1. **Sessão perdida no retorno do Stripe Checkout hospedado.** O cookie `auth-token` era criado com
   `sameSite: "strict"`, o que faz o navegador descartar o cookie no redirect de volta do Stripe Checkout
   hospedado (`checkout.stripe.com` → `/dashboard?checkout=success`) — qualquer aluno que pagasse por esse
   fluxo caía deslogado em `/login` imediatamente após pagar. Corrigido para `sameSite: "lax"` em
   `src/app/api/auth/{register,login,logout}/route.ts`, que preserva a sessão nesse redirect sem abrir brecha
   de CSRF (mutações continuam exigindo requisição same-origin via `fetch`).

2. **Duplo submit em todo formulário com o padrão `<Button type="submit" onClick={() => formRef.current?.requestSubmit()}>`.**
   O clique no `<lui-button type="submit">` já dispara a submissão nativa do `<form>` ancestor (o evento
   atravessa a shadow DOM normalmente) — o `onClick` chamando `requestSubmit()` de novo era redundante e
   causava DOIS `POST` por clique. Confirmado isolando um clique e contando requisições de rede (1 clique → 2
   `POST /api/auth/register`). Isso dobrava o consumo do rate limit em cadastro/login (e foi o que fez
   `player.spec.ts` cair em `429 Muitas tentativas` ao rodar a suíte completa — o limite de 10 req/min era
   atingido bem antes do esperado) e, em corrida, chegava a gerar erro de `Unique constraint failed` no banco
   quando os dois `POST` de cadastro colidiam. Corrigido removendo o `onClick` redundante em
   `RegisterForm.tsx`, `LoginForm.tsx` e `EditProfileForm.tsx` — o `type="submit"` nativo já basta.
