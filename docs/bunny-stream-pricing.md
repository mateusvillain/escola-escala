# Bunny Stream — Precificação e Custos

> **Atenção:** Os valores abaixo são estimativas com base em informações disponíveis até agosto de 2025. Confirme os valores atuais em [bunny.net/pricing](https://bunny.net) antes de tomar decisões financeiras.

---

## Modelo de cobrança

O Bunny Stream usa **pay-as-you-go** — sem mensalidade mínima obrigatória. Você paga apenas pelo que usar, o que o torna ideal para projetos em fase de desenvolvimento ou com volume inicial baixo.

Ao criar uma conta, o Bunny geralmente oferece um **crédito inicial gratuito** (tipicamente $1–10) que cobre bastante uso em desenvolvimento sem custo algum.

---

## Os três componentes de custo

### 1. Storage — ~$0.01/GB/mês

Espaço em disco para armazenar os arquivos de vídeo na infraestrutura do Bunny (originais e versões transcodificadas).

- Cobrado mensalmente com base no total armazenado
- Inclui todas as resoluções geradas (720p, 1080p, etc.)
- Um vídeo de 1h em qualidade razoável ocupa aproximadamente 1–3 GB

**Exemplo:** 10 aulas de 20 minutos cada ≈ 5 GB armazenados → **$0.05/mês**

---

### 2. Tráfego (Bandwidth) — ~$0.005–0.01/GB

Cobrado cada vez que um vídeo é entregue a um usuário via CDN — ou seja, a cada byte reproduzido por um aluno.

- Varia por região (tráfego para América do Sul costuma ter tarifa levemente maior)
- Em desenvolvimento (você + 1–2 pessoas testando) o consumo é irrisório
- Em produção, cresce proporcionalmente ao número de alunos e horas assistidas

**Exemplo:** 50 visualizações de uma aula de 20 min (≈ 500 MB por visualização) = 25 GB → **$0.13–0.25**

---

### 3. Encoding — ~$0.005/minuto de vídeo

Cobrado **uma única vez** no momento do upload. Quando você envia um vídeo, o Bunny transcodifica automaticamente para múltiplas resoluções (adaptive streaming). Não é recorrente — alunos assistindo não geram custo de encoding.

- Pago apenas no upload, não a cada visualização
- Cobre a geração de todas as qualidades (480p, 720p, 1080p, etc.)

**Exemplo:** 10 aulas de 20 minutos = 200 minutos de vídeo → **$1.00** (custo único)

---

## Estimativas práticas

### Fase de desenvolvimento (mês 1)

| Item | Detalhe | Custo estimado |
|---|---|---|
| Encoding | 10 aulas × 20 min = 200 min | $1.00 |
| Storage | ~5 GB armazenados por 1 mês | $0.05 |
| Tráfego | ~50 visualizações de teste | $0.13 |
| **Total** | | **~$1.18** |

> Com o crédito inicial da Bunny, o mês 1 sai provavelmente **$0.00**.

---

### Fase de lançamento (estimativa com 100 alunos ativos)

Assumindo: 30 aulas de 30 min, cada aluno assiste em média 5h/mês.

| Item | Detalhe | Custo estimado |
|---|---|---|
| Encoding | 30 aulas × 30 min = 900 min | $4.50 (único) |
| Storage | ~15 GB armazenados | $0.15/mês |
| Tráfego | 100 alunos × 5h × ~500 MB/h = 250 GB | $1.25–2.50/mês |
| **Total mensal** | (após encoding inicial) | **~$1.40–2.65/mês** |

---

### Fase de crescimento (estimativa com 1.000 alunos ativos)

| Item | Detalhe | Custo estimado |
|---|---|---|
| Storage | ~15 GB (mesmo conteúdo) | $0.15/mês |
| Tráfego | 1.000 alunos × 5h × 500 MB/h = 2.500 GB | $12.50–25/mês |
| **Total mensal** | | **~$12.65–25.15/mês** |

---

## Variáveis que afetam o custo

| Fator | Impacto |
|---|---|
| Duração e qualidade dos vídeos | Vídeos mais longos/alta resolução → mais storage e encoding |
| Engajamento dos alunos | Mais horas assistidas → mais tráfego |
| Região dos alunos | Tráfego para regiões mais distantes pode ter tarifas maiores |
| Retenção de vídeos antigos | Cursos arquivados mas mantidos no storage geram custo contínuo |

---

## Configuração necessária no projeto

Três variáveis de ambiente são necessárias para integrar o Bunny Stream:

```env
BUNNY_STREAM_API_KEY=       # Chave de API da biblioteca (aba API nas configurações)
BUNNY_STREAM_LIBRARY_ID=    # ID numérico da biblioteca de vídeos
BUNNY_STREAM_CDN_HOSTNAME=  # Hostname do pull zone (ex: vz-xxxxxxxx.b-cdn.net)
```

**Onde encontrar no painel Bunny:**
1. Acesse **Stream → Libraries** e selecione sua biblioteca
2. `LIBRARY_ID` aparece na URL e na aba *Overview*
3. `API_KEY` está na aba *API* das configurações da biblioteca
4. `CDN_HOSTNAME` está na aba *Overview* como "Pull Zone Hostname"
