# Nota Fiscal de Serviço (NFS-e) — Opções de Emissão para a Plataforma

> **Atenção:** Informações coletadas em junho de 2026 a partir dos sites oficiais dos provedores e de fontes
> governamentais (gov.br/nfse, Receita Federal). Preços de API mudam com frequência e a obrigatoriedade da
> NFS-e Nacional está em transição — confirme valores e prazos atuais antes de decidir, e valide com o
> contador da empresa o regime tributário, o município de incidência do ISS e o código de serviço aplicável
> antes de implementar qualquer opção abaixo. Este documento é de **visão/viabilidade, não de execução** —
> não há tasks geradas a partir dele, no mesmo espírito de `docs/wiki/b2b-diferenciais.md`.

## Por que isso não é só "algum dia"

A plataforma já processa pagamentos via Stripe (assinatura, compra avulsa, bundle de trilha — ver
`docs/pricing/stripe-pricing.md`), mas **processar pagamento e emitir nota fiscal são obrigações
completamente separadas**. A Stripe nunca gera nota fiscal — isso é uma obrigação fiscal brasileira
independente do meio de cobrança.

E o prazo não é hipotético: pela Lei Complementar nº 214/2025, a **NFS-e padrão nacional passou a ser
obrigatória a partir de 1º de janeiro de 2026** para MEI, ME, EPP e demais prestadores de serviço. Para
empresas optantes pelo Simples Nacional (ME/EPP), o uso obrigatório do **Emissor Nacional** (web ou API)
começa em **1º de setembro de 2026** — cerca de dois meses a partir da data deste documento. Isso significa
que, dependendo do regime tributário da empresa, a janela para resolver isso sem risco é curta, mesmo que a
decisão de produto seja "não investir agora".

**Antes de qualquer escolha técnica, confirmar com o contador:**
- Regime tributário atual (MEI / ME-EPP Simples Nacional / Lucro Presumido) — define o prazo exato de
  obrigatoriedade e a alíquota de ISS
- Município de incidência do ISS (geralmente o do estabelecimento prestador, com exceções previstas na LC
  116/2003 para alguns serviços)
- Código de serviço (lista da LC 116/2003) aplicável a "acesso a plataforma de cursos online por assinatura"
- Se a nota deve ser emitida por cobrança individual (cada ciclo de assinatura) ou em lote mensal

## Lacuna atual no projeto (pré-requisito comum a qualquer opção escolhida)

Hoje o `model User` (`prisma/schema.prisma`) não tem **nenhum campo fiscal** — só `email`, `name`,
`stripeCustomerId`. Não existe CPF/CNPJ, nem endereço. Qualquer caminho abaixo, inclusive o manual, exige
coletar do aluno:
- CPF (pessoa física) ou CNPJ (quando a compra for feita em nome de empresa/B2B)
- Endereço (rua, número, bairro, cidade, UF, CEP) — exigido pelo layout da NFS-e
- Razão social/nome, quando CNPJ

Isso provavelmente entra como campo opcional no cadastro/checkout ou como etapa anterior à primeira emissão
de nota (não precisa bloquear o acesso ao curso, só a emissão fiscal). Não há task para isso ainda — fica
para quando a direção deste documento for decidida.

## As opções avaliadas

### 1. Emissão manual — menor custo agora, não escala

Emitir a nota "na mão" pelo emissor web do município ou pelo Portal Nacional da NFS-e (gov.br/nfse), feito
pelo próprio contador a cada cobrança ou em lote mensal.

- **Custo adicional:** zero ferramenta nova — a empresa provavelmente já paga um contador para as obrigações
  do Simples Nacional, e isso entra no trabalho dele
- **Não escala:** cada ciclo de assinatura (mensal/anual) de cada aluno gera uma nota — em volume baixo é
  trabalho manual gerenciável, mas cresce linearmente com a base de assinantes, sem nenhum gatilho automático
  a partir do pagamento confirmado na Stripe
- **Risco:** depende de processo manual disciplinado para não acumular notas em atraso; não há reconciliação
  automática entre cobrança Stripe e nota emitida

**Quando faz sentido:** enquanto o volume de assinantes for baixo o suficiente para o contador emitir nota a
nota sem gargalo, e enquanto isso for validado como aceitável dado o prazo de 2026-09-01 acima.

### 2. API de emissão paga por documento, sem mensalidade fixa — melhor encaixe para "não investir agora"

| Opção | Mensalidade | Custo por nota | Cobertura/integração | Observação |
|---|---|---|---|---|
| **Asaas** (nota avulsa via API) | R$ 0 (conta digital PJ gratuita) | **R$ 0,49** por nota emitida (agendar/cancelar não tem custo) | API REST própria; sem integração nativa com Stripe — o disparo precisa ser feito pelo nosso código | Permite emitir nota avulsa via atributo `customer` **sem** processar o pagamento pelo Asaas — ou seja, a Stripe continua sendo o gateway, o Asaas só emite a nota. Abertura de conta exige KYC (documento + selfie), análise em até 2 dias úteis |
| **Focus NFe** (plano Solo) | R$ 89,90/mês (100 notas inclusas) | R$ 0,10 por nota excedente | API REST, webhook próprio para retorno assíncrono; cobertura de 3.000+ municípios, R$ 199 fixo para integrar município novo se necessário | Trial gratuito de 30 dias; mensalidade corre mesmo em mês com zero notas |
| **eNotas** (plano Básico) | R$ 137/mês (até 50 notas) | Excedente cobrado proporcional ao plano | **Integração nativa com Stripe via metadata** — dispara emissão na cobrança ou após um período de carência configurável, pensado para negócio de assinatura | Garantia incondicional de 30 dias; é o único dos três com encaixe pronto para o caso de uso "SaaS por assinatura + Stripe" sem código de integração próprio |
| **Nuvem Fiscal** | A partir de ~R$ 360/mês (cobrança anual) — confirmar direto no site, dado divergente entre fontes | Por operação fiscal consumida da cota do plano | API REST mais recente no mercado | Menos tração/documentação pública de preço que os demais; vale cotar diretamente antes de comparar |

Todos os quatro já declaram suporte (ou compatibilidade anunciada) ao novo layout da **NFS-e Nacional**
exigido pela Reforma Tributária a partir de 2026.

> O Asaas também é uma conta digital PJ completa, com gateway de pagamento próprio (cartão, Pix, Boleto,
> assinaturas). Isso levanta a pergunta natural de substituir a Stripe — ver `docs/wiki/asaas-vs-stripe.md`
> para o comparativo. Recomendação lá: **não substituir**, usar o Asaas só como emissor de nota fiscal.

#### Asaas — automação e testes

- **Automação após pagamento:** o Asaas não tem webhook nativo do Stripe (são plataformas independentes),
  mas a emissão é totalmente automatizável pelo nosso lado — `POST /v3/invoices` aceita uma nota "avulsa"
  via atributo `customer`, sem exigir que o pagamento tenha passado pelo Asaas. Isso entraria como uma
  chamada adicional dentro de `handleInvoicePaymentSucceeded`/`handleCheckoutSessionCompleted`
  (`src/lib/stripe-handlers.ts`), disparada depois que a Stripe confirma o pagamento. O Asaas também emite
  webhook próprio quando o status da nota muda (emitida, erro, cancelada), permitindo fechar o ciclo nos
  dois sentidos.
- **Teste sem custo:** existe ambiente Sandbox completo (`api-sandbox.asaas.com`), com cadastro separado do
  de produção. Na documentação oficial de desenvolvedor, agendar, emitir, atualizar, consultar, listar e
  cancelar nota fiscal estão todos marcados como testáveis normalmente em Sandbox — dá pra validar o fluxo
  inteiro (inclusive o webhook de retorno) sem gerar nota real nem custo, antes de trocar para a chave de
  produção.

### 3. ERP/conta completa (Omie, Bling, Conta Azul) — não recomendado agora

Resolvem nota fiscal junto com financeiro, estoque e outras funções de ERP, mas cobram mensalidade
recorrente independente de volume e trazem muito mais funcionalidade do que a plataforma precisa só para
emitir NFS-e de assinatura. Só passa a fazer sentido se o contador/operação já precisar de um ERP completo
por outro motivo — não como ponto de entrada para resolver nota fiscal isoladamente.

## Recomendação

Dado que a decisão de produto é **não investir financeiramente agora**, mas reconhecendo que a obrigação já
está em vigor (e o prazo do Emissor Nacional para Simples Nacional ME/EPP é setembro de 2026):

1. **Curto prazo:** manter emissão manual via contador **se** o volume atual permitir e o contador confirmar
   que isso é aceitável dado o regime tributário e os prazos da NFS-e Nacional — não é uma decisão técnica,
   é uma decisão a validar com quem responde fiscalmente pela empresa.
2. **Quando decidir automatizar sem assumir mensalidade fixa:** **Asaas** é o caminho de menor fricção
   financeira — conta gratuita, custo de R$ 0,49 só quando uma nota é de fato emitida, e não exige migrar o
   processamento de pagamento (que continua 100% na Stripe). Na prática, o handler que já existe em
   `handleInvoicePaymentSucceeded`/`handleCheckoutSessionCompleted` (`src/lib/stripe-handlers.ts`) passaria a
   chamar a API do Asaas (nota avulsa por `customer`) depois de confirmado o pagamento — sem webhook nativo
   entre as duas, a integração é responsabilidade do nosso código.
3. **Se o volume crescer o suficiente para justificar uma ferramenta pensada para SaaS de assinatura:**
   **eNotas** é o upgrade natural — já tem integração nativa com Stripe via metadata e lógica de "emitir após
   período de carência", que é exatamente o formato de cobrança recorrente do projeto. A contrapartida é
   assumir uma mensalidade (R$ 137/mês no plano de entrada) independente de volume.

## Pré-requisitos no código quando a decisão for tomada (não implementar agora)

- Campo de CPF/CNPJ (e endereço fiscal) no `model User` — não existe hoje
- Fluxo de coleta desse dado (cadastro, perfil ou etapa anterior à primeira emissão)
- Mapeamento `priceId`/plano → código de serviço municipal, no mesmo padrão de `buildPriceMap()` já usado
  para Stripe (`src/lib/stripe-handlers.ts`)
- Handler novo, acionado a partir de `invoice.payment_succeeded`/`checkout.session.completed`, chamando a
  API escolhida — seguindo o padrão de tratamento de webhook já estabelecido em `src/lib/stripe-handlers.ts`

## Referências

- [Ministério da Fazenda — NFS-e obrigatória a partir de janeiro de 2026](https://www.gov.br/fazenda/pt-br/assuntos/noticias/2025/agosto/a-partir-de-janeiro-de-2026-a-nota-fiscal-de-servico-eletronica-nfs-e-sera-obrigatoria-a-fim-de-simplificar-cotidiano-das-empresas)
- [Receita Federal — NFS-e padrão nacional obrigatória para optantes do Simples Nacional (Emissor Nacional, 01/09/2026)](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/abril/nfs-e-de-padrao-nacional-sera-obrigatoria-para-optantes-do-simples-nacional)
- [Portal NFS-e — NFS-e e Simples Nacional: obrigatoriedade via Emissor Nacional](https://www.gov.br/nfse/pt-br/noticias/nfs-e-e-simples-nacional-obrigatoriedade-de-emissao-atraves-do-emissor-nacional)
- [Asaas — taxas para emissão de notas fiscais (R$ 0,49/nota)](https://central.ajuda.asaas.com/hc/pt-br/articles/32087796483099-Quais-s%C3%A3o-as-taxas-para-emiss%C3%A3o-de-notas-fiscais-no-Asaas)
- [Asaas — emitir nota fiscal avulsa via API (`customer`, sem usar Asaas para receber)](https://docs.asaas.com/reference/emitir-uma-nota-fiscal)
- [Asaas — emissão automática de notas fiscais para assinaturas](https://docs.asaas.com/docs/emitir-notas-fiscais-automaticamente-para-assinaturas)
- [Asaas — Sandbox (área de testes)](https://docs.asaas.com/docs/duvidas-frequentes-sandbox)
- [Asaas — o que pode ser testado em Sandbox (nota fiscal: agendar/emitir/cancelar ✅)](https://docs.asaas.com/docs/o-que-pode-ser-testado)
- [Focus NFe — planos e preços](https://focusnfe.com.br/precos/)
- [eNotas — planos e preços](https://enotass.com.br/notas)
- [eNotas — integração com Stripe](https://atendimento.enotas.com.br/hc/pt-br/articles/35773419614349--Stripe-Como-habilitar-a-integra%C3%A7%C3%A3o)
- [Nuvem Fiscal — documentação da API](https://dev.nuvemfiscal.com.br/docs/api/)
