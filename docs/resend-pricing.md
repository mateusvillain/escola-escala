# Resend — Precificação e Custos

> **Atenção:** Os valores abaixo foram coletados em [resend.com/pricing](https://resend.com/pricing) em junho de 2026. Confirme os valores atuais antes de tomar decisões financeiras — provedores de e-mail revisam preços e limites de tier com frequência.

O projeto usa o Resend como **relay SMTP** via `nodemailer` (`src/lib/email.ts`, credenciais `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM`), não a API/SDK nativa do Resend. Isso não muda a cobrança — o Resend cobra por **volume de e-mails enviados**, independente do canal (API REST ou SMTP relay).

---

## Modelo de cobrança

O Resend cobra por **volume mensal de envio**, com um tier gratuito generoso para side projects e produtos em fase inicial — sem custo de setup nem cartão obrigatório para o free tier.

Diferente do Bunny Stream (que tem cobrança contínua por storage/tráfego mesmo sem uso novo), o custo do Resend só existe proporcionalmente ao que é efetivamente enviado naquele mês — não há custo "parado" de manter a conta.

---

## Os componentes de custo

### 1. E-mails transacionais/mês — grátis até 3.000, depois por tier

| Plano | Preço | E-mails incluídos/mês | Limite diário | Overage |
|---|---|---|---|---|
| **Free** | $0 | 3.000 | **100/dia** | — (bloqueia ao atingir o limite) |
| **Pro** | $20/mês | 50.000 | sem limite diário | $0,90 por 1.000 extras |
| **Pro** | $35/mês | 100.000 | sem limite diário | $0,90 por 1.000 extras |
| **Scale** | $90 a $1.150/mês | 100.000 a 2.500.000 | sem limite diário | $0,46–$0,80 por 1.000 extras |
| **Enterprise** | sob consulta | 3.000.000+ | sem limite diário | sob consulta |

**O limite diário do free tier (100/dia) é, na prática, mais restritivo que o limite mensal (3.000/dia)** para este projeto — ver seção de estimativas abaixo, porque dois dos e-mails planejados na Fase 2 são disparados em lote no mesmo dia do mês.

### 2. Domínios verificados

- Free tier: **1 domínio** verificado (SPF/DKIM)
- Pro/Scale: até 10 domínios
- Hoje o projeto usa um único `SMTP_FROM` para todos os e-mails (ver `docs/emails-da-plataforma.md`), então 1 domínio é suficiente mesmo se decidir separar remetentes por *subdomínio* (ex: `notificacoes@` vs `suporte@` no mesmo domínio verificado não conta como domínio extra).

### 3. Automações (a partir do plano Pro)

- 10.000 execuções de automação incluídas no plano pago; overage de $0,0015/execução
- **Não relevante hoje** — o projeto não usa o produto de Automations do Resend, só envio direto via SMTP a partir de eventos da própria aplicação (webhook, cron).

### 4. Marketing Email / contatos (produto separado)

- Cobrança por **número de contatos**, não por e-mail enviado: Free até 1.000 contatos; planos pagos de $40/mês (5.000 contatos) a $650/mês (150.000 contatos)
- **Só relevante se o produto evoluir** para newsletters/campanhas segmentadas. Os e-mails de upsell e retomada planejados na Fase 2 (TASK-102, TASK-113/114) são enviados via SMTP transacional simples, não pelo produto de Marketing — não entram nessa cobrança a menos que o projeto migre para lá.

---

## Estimativas práticas

Baseado nos e-mails que já existem (`docs/emails-da-plataforma.md`, seção 1: recuperação de senha, boas-vindas, fim de trial) somados aos 3 planejados e ainda não implementados (cobrança falhada, upsell, retomada — TASK-102/113/114/115/116).

### Fase de desenvolvimento (mês 1)

| Item | Detalhe | Custo estimado |
|---|---|---|
| E-mails de teste | Em dev sem `SMTP_HOST` configurado, `src/lib/email.ts` usa Ethereal automaticamente — **nenhum e-mail passa pelo Resend** | $0,00 |
| E-mails de teste em staging (Resend real) | ~20–50 envios manuais de QA | $0,00 (dentro do free tier) |
| **Total** | | **$0,00** |

### Fase de lançamento (100 alunos ativos, com os 6 e-mails implementados)

| E-mail | Gatilho | Estimativa/mês |
|---|---|---|
| Boas-vindas | 1ª assinatura ativada | ~20 |
| Recuperação de senha | Sob demanda | ~10 |
| Fim de trial | Concessões manuais do admin | ~5 |
| Cobrança falhada | Falha de pagamento (~3–5% da base) | ~3–5 |
| Retomada (lote mensal, dia 1) | Alunos inativos há +7 dias | ~20–30 |
| Upsell (lote mensal, dia 1) | Aluno viu `UpgradePrompt` há +3 dias sem converter | ~10–15 |
| **Total mensal** | | **~70–85** → dentro do free tier ($0) |

**Ponto de atenção mesmo nessa fase pequena:** retomada e upsell estão especificados com o mesmo cron (`0 9 1 * *`, ver `docs/fase2-grupos-de-trabalho.md`, Grupos 6 e 9) — ambos disparam **no mesmo dia**. Somando os dois lotes (~30–45) com os transacionais do dia, é improvável estourar os 100/dia nesse volume de alunos, mas o risco cresce linearmente com a base.

### Fase de crescimento (1.000 alunos ativos)

| E-mail | Estimativa/mês |
|---|---|
| Boas-vindas | ~150 |
| Recuperação de senha | ~30 |
| Fim de trial | ~20 |
| Cobrança falhada | ~30–50 |
| Retomada (lote, dia 1) | ~200–300 |
| Upsell (lote, dia 1) | ~100–150 |
| **Total mensal** | **~530–700** → ainda dentro dos 3.000/mês do free tier |

**Aqui o limite diário vira o problema real, não o mensal:** retomada + upsell somados no dia 1 do mês chegam a **300–450 e-mails em um único dia**, contra o cap de **100/dia do free tier**. Esses dois lotes por si só forçam a migração para o plano Pro ($20/mês, sem limite diário) **antes** do volume mensal total justificar — o gatilho de upgrade é a concentração no cron, não o crescimento da base.

### Mitigação sem custo (antes de assumir que precisa do Pro)

- Espaçar os crons de retomada e upsell em dias diferentes do mês (ex: dia 1 e dia 8) evita a concentração e mantém os dois dentro do free tier por mais tempo.
- Enviar o lote em throttle (ex: 80/dia ao longo de 3–4 dias) em vez de tudo de uma vez, se o endpoint de cron for adaptado para paginar o envio.

---

## Variáveis que afetam o custo

| Fator | Impacto |
|---|---|
| Concentração de e-mails em lote no mesmo dia (retomada + upsell) | Estoura o limite **diário** do free tier muito antes do limite mensal |
| Crescimento da base de alunos | Mais cadastros, recuperações de senha e falhas de cobrança, proporcional ao tamanho da base |
| Adoção do produto de Marketing Email (contatos/newsletter) | Cobrança separada por contato, não por envio — só se o escopo for além de transacional/engajamento |
| Separação de remetentes por domínio (não subdomínio) | Free tier permite só 1 domínio verificado; múltiplos domínios exigem plano Pro |
| Falha de SMTP | `sendEmail()` não tem retry (falha só é logada, ver `docs/emails-da-plataforma.md` seção 4) — não há risco de custo duplicado por reenvio automático |

---

## Configuração necessária no projeto

As mesmas variáveis já usadas em `src/lib/email.ts` servem para o Resend (relay SMTP):

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=        # API Key gerada no painel Resend
SMTP_FROM=            # ex: naoresponda@seudominio.com (domínio precisa estar verificado)
```

**Onde encontrar no painel Resend:**
1. **API Keys** (Settings → API Keys): gera a chave usada em `SMTP_PASSWORD` — `SMTP_USER` é sempre a string literal `resend`
2. **Domains** (Settings → Domains): verificação de SPF/DKIM do domínio usado em `SMTP_FROM` — sem isso, e-mails caem em spam ou são rejeitados
3. **Logs** (Emails → todos os envios, com status de entrega/bounce) — único lugar para auditar falhas, já que o projeto não loga isso localmente além do console
