# Sentry — O que é e como usar

Guia para quem não é desenvolvedor entender o que o Sentry faz na plataforma e como acompanhar os erros no
dia a dia, sem depender de abrir o código.

## O que é o Sentry, em uma frase

O Sentry é um serviço que **fica de olho na plataforma 24 horas por dia e avisa automaticamente quando algo dá
erro** — antes mesmo que um aluno precise mandar e-mail reclamando. Pense nele como um sensor de fumaça: ele
não impede o problema de acontecer, mas garante que alguém saiba na hora, em vez de descobrir dias depois.

Sem o Sentry, a única forma de saber que algo quebrou era um aluno relatar (ou ninguém relatar, e o problema
ficar invisível). Com o Sentry, qualquer erro real que acontecer no servidor ou no navegador do aluno é
capturado e aparece num painel, com detalhes suficientes para o time técnico investigar rápido.

## Onde acessar

Dashboard: **https://escola-escala.sentry.io** (peça acesso a quem administra a conta — ver "Quem deve ter
acesso" abaixo).

## Como ler a tela principal (Issues)

Ao entrar, a primeira tela é a lista de **Issues** — cada Issue é um *tipo* de erro, não cada vez que ele
aconteceu. Se o mesmo erro acontecer 50 vezes em um dia, você vê **uma** Issue com a contagem de 50, não 50
linhas separadas. Isso evita que a tela vire uma bagunça.

Cada linha mostra, da esquerda para a direita:

| Coluna | O que significa |
|---|---|
| Título do erro | Uma descrição curta, geralmente em inglês técnico (ex: "TypeError: Cannot read property..."). Não precisa entender o texto exato — o importante é a frequência e onde aconteceu. |
| Onde aconteceu | O endereço (rota) da plataforma onde o erro ocorreu, ex: `/api/webhooks/stripe` (pagamento) ou `/cursos/[slug]/aulas/[lessonId]` (player de aula). Isso já diz muito sobre o impacto. |
| Events | Quantas vezes esse erro específico já aconteceu. |
| Users | Quantas pessoas diferentes foram afetadas por ele. |
| Última vez visto | Há quanto tempo o erro aconteceu pela última vez — se foi "há 3 meses", provavelmente já não é um problema atual. |

**Dica prática:** ordene por "Users" quando quiser saber o que está afetando mais gente, ou por "Last Seen"
para ver o que está acontecendo agora.

## Abrindo uma Issue específica

Ao clicar em uma Issue, você não precisa entender o código mostrado (o "stack trace" — é literalmente o
caminho que o erro percorreu dentro do sistema, útil só para quem vai corrigir). O que vale olhar:

- **Gráfico de frequência** no topo: mostra se o erro é um pico isolado (aconteceu uma vez e parou) ou
  contínuo (está acontecendo toda hora, sinal de algo quebrado de verdade agora).
- **Tags** (geralmente do lado direito): mostram contexto extra, como `eventType` (em erros do Stripe, qual
  evento estava sendo processado) ou `userId`/`courseId` (em erros de checkout e certificado, quem foi
  afetado e em qual curso). Isso ajuda a estimar o impacto sem precisar entender o erro técnico em si.
- **Environment**: confirme se é `production` (ambiente real, afeta alunos de verdade) ou outro ambiente de
  teste — erros fora de produção geralmente não são urgentes.

## O que fazer quando encontrar um erro

1. **Não tente corrigir você mesmo** — encaminhe o link da Issue para o time técnico. O link da página já é
   compartilhável.
2. **Avalie a urgência pelo volume e pela rota afetada.** Um erro com 1 "Event" e 1 "User" numa rota pouco
   usada pode esperar. Um erro crescendo rápido em `/api/webhooks/stripe`, `/api/subscriptions/checkout` ou
   `/api/courses/[slug]/purchase` é **dinheiro envolvido** (pagamento/assinatura) — esses são tratados com
   prioridade mais alta de propósito (ver "Erros que recebem atenção extra" abaixo).
3. Depois de corrigido, o time técnico marca a Issue como **Resolved** — ela some da lista de "não resolvidos"
   mas o histórico continua disponível para consulta.

## Erros que recebem atenção extra

Quatro fluxos da plataforma têm captura de erro reforçada, porque envolvem pagamento ou um benefício que o
aluno pagou para receber:

- Webhook do Stripe (confirmação de pagamento e renovação de assinatura)
- Início de checkout de assinatura
- Compra avulsa de um curso
- Geração do certificado de conclusão

Se um erro aparecer com a tag `eventType`, `userId` ou `courseId`, ele vem de um desses quatro pontos — é um
sinal de que vale a pena investigar com prioridade, mesmo que o volume (Events) ainda seja baixo.

## Alertas por e-mail

O Sentry já avisa o time automaticamente quando aparece um erro novo (configurado em 2026-06-22, ver
`.agent/tasks/TASK-190.json`) — condição **"A new issue is created"**, notificando um e-mail fixo da equipe.

**Limitação atual:** o alerta está com o Environment em **"All Environments"**, não restrito a `production`.
Isso é interino, não um esquecimento: o ambiente `production` só passa a existir no Sentry depois do primeiro
evento real, e a aplicação ainda não foi implantada em produção (deploy na Vercel pendente). Até esse deploy
acontecer, qualquer erro disparado em ambiente de desenvolvimento local também gera o e-mail de alerta — pode
gerar algum ruído, mas garante que o canal já está funcionando desde já. Restringir o filtro para `production`
e validar o alerta de fato em produção está registrado em `.agent/tasks/TASK-201.json`, para ser feito depois
do primeiro deploy.

## Quem deve ter acesso

Acesso ao dashboard do Sentry é por convite de quem administra a conta da organização (`escola-escala`). Não
é necessário acesso técnico ao código para usar o dashboard — basta saber ler a tabela de Issues como descrito
acima. Recomenda-se que pelo menos uma pessoa do time de operação/suporte tenha acesso, além do time técnico,
para conseguir checar rapidamente se um problema relatado por um aluno já é um erro conhecido.

## Perguntas frequentes

**Um erro aparecer significa que a plataforma está fora do ar?**
Não necessariamente. A maioria dos erros captados afeta uma ação específica de um usuário específico (ex:
"essa pessoa tentou comprar e algo falhou"), não a plataforma inteira. Para saber se é generalizado, olhe a
coluna "Users" — se for um número alto e crescendo rápido, sim, é mais sério.

**Por que vejo erros que não foram causados por alunos de verdade?**
É normal aparecer algum ruído de robôs/scanners testando endereços da internet (bots tentando acessar rotas
que não existem, por exemplo). Esses costumam ter "Users" baixo e nenhuma tag de `userId` real — geralmente
podem ser ignorados.

**Isso substitui o suporte ao aluno?**
Não. O Sentry avisa sobre falhas técnicas (algo quebrou no código). Reclamações sobre experiência, conteúdo do
curso, ou dúvidas continuam sendo tratadas pelo canal de suporte normal.
