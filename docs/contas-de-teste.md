# Contas de Teste

Contas existentes no banco de desenvolvimento (Neon) para uso manual em testes locais. **Não são contas de produção.**

A senha padrão (`Test@12345`) é a mesma usada em `prisma/seed.ts` — já está em texto plano nesse arquivo versionado, então documentá-la aqui não expõe nada novo.

| E-mail | Senha | Role | Descrição |
|---|---|---|---|
| `admin@test.com` | `Test@12345` | admin | Acesso total ao painel `/admin`. |
| `instrutor@test.com` | `Test@12345` | instructor | Instrutor de teste (slug `instrutor-teste`), acesso a `/instrutor`. |
| `aluno.basico@test.com` | `Test@12345` | student | Assinante ativo do Plano Básico (`sub_test_basic`). |
| `aluno.premium@test.com` | `Test@12345` | student | Assinante ativo do Plano Premium (`sub_test_premium`). |
| `sem-plano@teste.com` | `Test@12345` | student | Sem assinatura ativa, mas com `stripeCustomerId` real (modo teste) já criado. Útil para testar compra avulsa, prompts de upgrade, e-mails que dependem de customer no Stripe e bloqueio de acesso. |
| `novo@test.com` | `Test@12345` | student | Sem assinatura, sem matrícula, sem `stripeCustomerId`. Conta "genérica" para fluxos que partem de um usuário totalmente novo. |
| `dono@empresa-teste.com` | `Senha123!` | student | Owner da organização B2B "Empresa Teste LTDA" (5 seats, 2 em uso). Tem `OrganizationSubscription` ativa simulada diretamente no banco (o checkout do Grupo 6 ainda não existe) e CNPJ já definido (campo bloqueado para edição após definido). Acesso a todos os cursos via assinatura da organização. |
| `colaborador@empresa-teste.com` | `Senha123!` | student | Member da organização "Empresa Teste LTDA" (mesma org de `dono@empresa-teste.com`). Acesso aos cursos via assinatura da organização; não acessa a página `/organizacao` (redirecionada para `/dashboard` — só owner acessa). |

## Observações

- As 4 primeiras contas vêm de `prisma/seed.ts` e são recriadas (via `upsert`) a cada `npx prisma db seed` — a senha sempre volta a ser `Test@12345` nesse processo.
- `sem-plano@teste.com` e `novo@test.com` **não fazem parte do seed** — foram criadas manualmente em sessões de teste anteriores e tiveram a senha redefinida para o padrão acima (a senha original com que foram criadas não era conhecida).
- `dono@empresa-teste.com` e `colaborador@empresa-teste.com` também **não fazem parte do seed** — criadas manualmente durante o teste manual do Grupo 7 da Fase 4 (B2B, PR #27). Senha própria (`Senha123!`), diferente do padrão `Test@12345` das demais.
- Se alguma dessas contas tiver a senha alterada manualmente durante um teste (ex: fluxo de troca de senha em `/perfil`), ela volta a ficar fora de sincronia com este documento — redefina-a novamente se necessário.
