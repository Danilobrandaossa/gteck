# 📋 SPEC FINAL V3 — "Meta Creative Intelligence"
## Especificação Implementável para Desenvolvimento

**Data:** Janeiro 2025  
**Versão:** 3.0 (Final Consolidado)  
**Status:** ✅ **READY FOR IMPLEMENTATION**

---

## 📊 1. VISÃO GERAL DO PRODUTO

### **1.1 Objetivo**

Criar funcionalidade no dashboard que permite:
1. Usuário conecta conta Meta (OAuth)
2. Seleciona Ad Account + período + objetivo/KPI
3. Sistema busca "top performers" na Meta Marketing API
4. Salva metadata + features extraídas (MVP: metadata-only)
5. Extrai padrões (visual/mensagem/abordagem/CTA)
6. Gera prompt/brief no formato aceito pelo gerador existente
7. Gera novo criativo inspirado (sem clonar) com variações e scoring

### **1.2 Escopo por Fase**

#### **MVP (Fase 1)**
- ✅ Modo A apenas (Marketing API, contas conectadas)
- ✅ Metadata-only (não baixar assets completos)
- ✅ Seleção explícita: Ad Account, Time Window (30 dias default), Objetivo, KPI principal
- ✅ Top N criativos (default 10)
- ✅ Extração de padrões básica (visual + mensagem)
- ✅ Geração de 1-4 variações inspiradas

#### **Fase 2**
- ⏳ Modo B (Ads Library - concorrentes) - SEM métricas de conversão
- ⏳ S3 para assets completos (opcional)
- ⏳ Extração de padrões avançada (OCR, análise de CTA)
- ⏳ Cache de insights otimizado

#### **Fase 3**
- ⏳ Dashboard de performance
- ⏳ Recomendações automáticas
- ⏳ A/B testing de criativos gerados

---

## 🔀 2. MODOS DE OPERAÇÃO

### **2.1 Modo A: Top Performers (Marketing API) — MVP**

**Fonte:** Meta Marketing API via OAuth  
**Dados:** Criativos das contas do usuário conectadas  
**Métricas:** ✅ CTR, CPC, ROAS, CPA, Conversions (completas)  
**Limitações:** Apenas contas autorizadas pelo usuário

**Disclaimers para UI:**
- "Métricas baseadas em dados reais da sua conta Meta"
- "Apenas criativos das contas conectadas são analisados"
- "Dados atualizados conforme disponibilidade da Meta API"

### **2.2 Modo B: Pesquisa de Concorrentes (Ads Library) — Fase 2**

**Fonte:** Meta Ads Library API (pública)  
**Dados:** Anúncios públicos de qualquer conta  
**Limitação:** ❌ **NÃO fornece métricas de conversão/CTR/ROAS/CPA de terceiros**  
**Métricas disponíveis:** Apenas spend público (se divulgado), data de publicação, creative assets

**Disclaimers para UI (Fase 2):**
- ⚠️ **"Métricas de conversão não disponíveis para anúncios de terceiros"**
- "Apenas dados públicos divulgados pela Meta são exibidos"
- "Análise baseada em padrões visuais e estruturais, não em performance"

---

## 🔄 3. FLUXO END-TO-END

### **3.1 Diagrama de Fluxo**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USUÁRIO: Conecta conta Meta (OAuth)                     │
│    POST /api/meta/connect                                   │
│    → Redireciona para Meta OAuth                            │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CALLBACK: Meta retorna código                            │
│    GET /api/meta/oauth/callback?code=...                    │
│    → Troca código por token                                 │
│    → Salva em MetaConnection (criptografado)                │
│    → Retorna sucesso                                        │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. USUÁRIO: Seleciona parâmetros                            │
│    - Ad Account (lista via GET /api/meta/ad-accounts)       │
│    - Time Window (default: últimos 30 dias)                 │
│    - Objetivo (Lead/Purchase/Install)                        │
│    - KPI principal (1) + secundário opcional (1)            │
│    - Top N (default: 10)                                    │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. API: POST /api/meta/insights/sync                        │
│    → Cria QueueJob: meta_insights_fetch                     │
│    → Retorna jobId                                          │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. WORKER: meta_insights_fetch (assíncrono)                  │
│    → Busca insights da Meta API (batch)                     │
│    → Aplica guardrails (minSpend, minConversions, etc.)     │
│    → Filtra por objetivo/KPI                                │
│    → Rankeia criativos                                       │
│    → Salva em MetaInsightCache (TTL 1h)                     │
│    → Cria QueueJob: meta_creative_ingest (para cada top N)  │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. WORKER: meta_creative_ingest (assíncrono)                │
│    → Busca metadata do criativo (não baixa asset)           │
│    → Extrai features básicas (thumbnail URL, dimensões)     │
│    → Salva em MetaCreative (metadata-only)                 │
│    → Cria QueueJob: meta_pattern_extract                    │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. WORKER: meta_pattern_extract (assíncrono)               │
│    → Baixa thumbnail (temporário, não persiste)             │
│    → Análise GPT-4 Vision (cores, composição, estilo)       │
│    → OCR via Vision (texto na imagem)                       │
│    → Identifica CTA                                         │
│    → Extrai copy do anúncio (se disponível)                 │
│    → Salva em CreativePattern (visual, message, approach)   │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. API: POST /api/meta/top-creatives                        │
│    → Consulta MetaInsightCache (ou busca se expirado)       │
│    → Retorna top N criativos com padrões extraídos          │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. USUÁRIO: Seleciona criativos para inspirar                │
│    POST /api/meta/generate-from-patterns                    │
│    → Recebe array de metaCreativeIds                        │
│    → Combina padrões (visual + message + approach)          │
│    → Gera CreativeBrief otimizado                           │
│    → Chama POST /api/creative/generate (EXISTENTE)          │
│    → Retorna CreativeOutput com variações                    │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. RESULTADO: Novo criativo inspirado                      │
│     - Variações geradas (1-4)                               │
│     - Scoring aplicado                                      │
│     - Anti-clone rules aplicadas                            │
└─────────────────────────────────────────────────────────────┘
```

### **3.2 Estados Assíncronos (QueueJob)**

| Job Type | Status Inicial | Status Final | Retry | TTL |
|----------|---------------|--------------|-------|-----|
| `meta_insights_fetch` | `pending` | `completed` / `failed` | 3x | 10min |
| `meta_creative_ingest` | `pending` | `completed` / `failed` | 3x | 5min |
| `meta_pattern_extract` | `pending` | `completed` / `failed` | 3x | 15min |
| `meta_retention_cleanup` | `pending` | `completed` | 1x | N/A |

---

## 🔌 4. CONTRATO DE API

### **4.1 Endpoints MVP**

#### **POST /api/meta/connect**
Inicia fluxo OAuth Meta.

**Request:**
```json
{
  "organizationId": "org_xxx"
}
```

**Response:**
```json
{
  "status": "redirect",
  "oauthUrl": "https://www.facebook.com/v19.0/dialog/oauth?..."
}
```

**Erros:**
- `400`: organizationId inválido
- `500`: Erro ao gerar OAuth URL

---

#### **GET /api/meta/oauth/callback**
Callback OAuth Meta.

**Query Params:**
- `code`: Código de autorização
- `state`: State token (CSRF protection)
- `error`: Erro (se houver)

**Response (sucesso):**
```json
{
  "status": "success",
  "connectionId": "conn_xxx",
  "adAccounts": [
    {
      "id": "act_123",
      "name": "Minha Conta",
      "currency": "BRL"
    }
  ]
}
```

**Response (erro):**
```json
{
  "status": "error",
  "error": "access_denied",
  "message": "Usuário negou permissões"
}
```

**Erros:**
- `400`: code ou state inválido
- `401`: Token exchange falhou
- `500`: Erro ao salvar conexão

---

#### **GET /api/meta/ad-accounts**
Lista contas de anúncios autorizadas.

**Headers:**
- `Authorization: Bearer <session_token>`

**Query Params:**
- `connectionId` (opcional): Filtrar por conexão específica

**Response:**
```json
{
  "status": "success",
  "accounts": [
    {
      "id": "act_123",
      "name": "Minha Conta",
      "currency": "BRL",
      "timezone": "America/Sao_Paulo",
      "accountStatus": 1
    }
  ]
}
```

**Erros:**
- `401`: Não autenticado
- `403`: Sem acesso à conexão
- `404`: Conexão não encontrada

---

#### **POST /api/meta/insights/sync**
Cria job para buscar insights.

**Request:**
```json
{
  "connectionId": "conn_xxx",
  "adAccountId": "act_123",
  "timeWindow": {
    "start": "2024-12-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  },
  "objective": "LEAD", // LEAD | PURCHASE | INSTALL
  "primaryKpi": "cost_per_result",
  "secondaryKpi": "ctr", // opcional
  "topN": 10,
  "guardrails": {
    "minSpend": 100,
    "minConversions": 10,
    "minImpressions": 1000
  }
}
```

**Response:**
```json
{
  "status": "queued",
  "jobId": "job_xxx",
  "estimatedDuration": "2-5 minutos"
}
```

**Erros:**
- `400`: Parâmetros inválidos
- `401`: Token expirado
- `429`: Rate limit excedido

---

#### **POST /api/meta/top-creatives**
Retorna top N criativos (com cache).

**Request:**
```json
{
  "connectionId": "conn_xxx",
  "adAccountId": "act_123",
  "timeWindow": {
    "start": "2024-12-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  },
  "objective": "LEAD",
  "topN": 10
}
```

**Response:**
```json
{
  "status": "success",
  "creatives": [
    {
      "id": "creative_xxx",
      "metaAdId": "ad_123",
      "imageUrl": "https://...",
      "thumbnailUrl": "https://...",
      "performance": {
        "spend": 150.50,
        "impressions": 5000,
        "clicks": 250,
        "ctr": 0.05,
        "conversions": 15,
        "cost_per_result": 10.03,
        "roas": null // se objetivo != PURCHASE
      },
      "patterns": {
        "visual": {
          "colors": ["#FF5733", "#33FF57"],
          "style": "minimalist",
          "composition": "centered"
        },
        "message": {
          "headline": "Oferta Especial",
          "cta": "Saiba Mais",
          "tone": "urgent"
        },
        "approach": {
          "urgency": "high",
          "benefit": "discount"
        }
      },
      "extractedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "cacheHit": true,
  "cacheExpiresAt": "2025-01-15T11:30:00Z"
}
```

**Erros:**
- `404`: Insights não encontrados (precisa sync primeiro)
- `401`: Token expirado

---

#### **POST /api/meta/creatives/:id/extract-patterns**
Força extração de padrões (se não existir).

**Request:**
```json
{}
```

**Response:**
```json
{
  "status": "queued",
  "jobId": "job_xxx"
}
```

---

#### **POST /api/meta/generate-from-patterns**
Gera criativo inspirado a partir de padrões.

**Request:**
```json
{
  "creativeIds": ["creative_xxx", "creative_yyy"],
  "brief": {
    "productName": "Produto X",
    "targetAudience": "Jovens 18-35",
    "tone": "friendly",
    "platform": "facebook",
    "variations": 4
  }
}
```

**Response:**
```json
{
  "status": "success",
  "creativeOutput": {
    // Formato CreativeOutput existente
    "copy": "...",
    "conceptualImages": [...],
    "commercialImages": [...],
    "bestImage": {...},
    "metadata": {
      "inspiredBy": ["creative_xxx", "creative_yyy"],
      "antiCloneScore": 0.85 // 0-1, quanto maior, menos similar
    }
  }
}
```

**Erros:**
- `400`: creativeIds vazio ou inválido
- `404`: Criativos não encontrados
- `422`: Padrões não extraídos (precisa extrair primeiro)

---

### **4.2 Endpoints de Status**

#### **GET /api/meta/jobs/:jobId/status**
Status de um job assíncrono.

**Response:**
```json
{
  "status": "processing", // pending | processing | completed | failed
  "progress": 0.65,
  "message": "Processando insights...",
  "result": null, // se completed
  "error": null // se failed
}
```

---

## 🗄️ 5. MODELO DE DADOS (PRISMA)

### **5.1 Novas Tabelas**

```prisma
// Conexão Meta (OAuth)
model MetaConnection {
  id              String   @id @default(cuid())
  organizationId  String
  userId          String
  
  // Token genérico (não assume refreshToken padrão)
  accessTokenEncrypted String // AES-256-CBC
  expiresAt           DateTime
  scopes              String   @default("[]") // JSON array
  tokenType           String   @default("bearer") // bearer | oauth2
  renewalStrategy     String   @default("manual") // manual | auto | long_lived
  
  // Metadados
  metaUserId      String? // ID do usuário Meta
  metaUserName    String?
  connectedAt     DateTime @default(now())
  lastUsedAt      DateTime?
  revokedAt       DateTime?
  
  // Relações
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user            User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  adAccounts      MetaAdAccount[]
  creatives       MetaCreative[]
  insightCaches   MetaInsightCache[]
  
  @@unique([organizationId, userId])
  @@index([organizationId])
  @@index([expiresAt]) // Para limpeza de tokens expirados
  @@map("meta_connections")
}

// Ad Accounts autorizadas
model MetaAdAccount {
  id              String   @id @default(cuid())
  connectionId    String
  metaAccountId   String   // act_123
  name            String
  currency        String
  timezone        String
  accountStatus   Int      // 1 = ativo
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  connection      MetaConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  
  @@unique([connectionId, metaAccountId])
  @@map("meta_ad_accounts")
}

// Criativos (metadata-only no MVP)
model MetaCreative {
  id              String   @id @default(cuid())
  organizationId  String
  connectionId    String
  metaAdId        String   // ID do anúncio no Meta
  metaAccountId   String   // act_123
  
  // URLs (não baixamos asset no MVP)
  imageUrl        String   // URL original Meta
  thumbnailUrl    String?  // Thumbnail se disponível
  
  // Features extraídas (JSON)
  imageFeatures   String   @default("{}") // { width, height, format, hash }
  
  // Metadata (JSON)
  metadata        String   @default("{}") // { adName, adSetName, campaignName, theme }
  
  // Performance (JSON)
  performance     String   @default("{}") // { spend, impressions, clicks, ctr, conversions, etc }
  
  // Tema/Nicho (opcional, pode ser inferido)
  theme           String?
  
  // Retenção
  createdAt       DateTime @default(now())
  expiresAt       DateTime? // Calculado: createdAt + CREATIVE_RETENTION_DAYS
  
  // Relações
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  connection      MetaConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  patterns        CreativePattern[]
  
  @@unique([connectionId, metaAdId])
  @@index([organizationId, createdAt])
  @@index([expiresAt]) // Para limpeza
  @@map("meta_creatives")
}

// Padrões extraídos
model CreativePattern {
  id              String   @id @default(cuid())
  metaCreativeId  String
  patternType     String   // "visual" | "message" | "approach"
  data            String   @default("{}") // JSON com padrões extraídos
  confidence      Float?   // 0-1, confiança da extração
  extractedAt     DateTime @default(now())
  
  metaCreative    MetaCreative @relation(fields: [metaCreativeId], references: [id], onDelete: Cascade)
  
  @@unique([metaCreativeId, patternType])
  @@index([metaCreativeId])
  @@map("creative_patterns")
}

// Cache de Insights (TTL)
model MetaInsightCache {
  id              String   @id @default(cuid())
  organizationId  String
  connectionId    String
  metaAccountId   String
  
  // Cache key: hash(accountId + timeWindow + objective + kpi)
  cacheKey        String
  
  // Dados em cache (JSON)
  data            String   // Array de criativos com performance
  
  // TTL
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  
  connection      MetaConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  
  @@unique([organizationId, cacheKey])
  @@index([expiresAt]) // Para limpeza
  @@index([connectionId, metaAccountId])
  @@map("meta_insight_cache")
}

// Configuração por organização (guardrails + defaults)
model MetaCreativeConfig {
  id              String   @id @default(cuid())
  organizationId  String   @unique
  
  // Guardrails padrão
  defaultMinSpend         Float    @default(100)
  defaultMinConversions   Int      @default(10)
  defaultMinImpressions   Int      @default(1000)
  defaultTimeWindowDays   Int      @default(30)
  defaultTopN             Int      @default(10)
  
  // KPI weights por objetivo
  kpiWeightsLead          String   @default("{}") // JSON: { cost_per_result: 0.7, ctr: 0.3 }
  kpiWeightsPurchase      String   @default("{}") // JSON: { purchase_roas: 0.6, cost_per_purchase: 0.4 }
  kpiWeightsInstall       String   @default("{}") // JSON: { cost_per_install: 1.0 }
  
  // Retenção
  creativeRetentionDays   Int      @default(365)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@map("meta_creative_config")
}
```

### **5.2 Alterações em Tabelas Existentes**

**Organization:**
```prisma
model Organization {
  // ... campos existentes ...
  
  metaConnections MetaConnection[]
  metaCreatives   MetaCreative[]
  metaConfig      MetaCreativeConfig?
}
```

**User:**
```prisma
model User {
  // ... campos existentes ...
  
  metaConnections MetaConnection[]
}
```

---

## 🔐 6. ESTRATÉGIA DE TOKENS

### **6.1 Modelo Genérico (Não Assume Refresh Token)**

**Campos:**
- `accessTokenEncrypted`: Token criptografado (AES-256-CBC)
- `expiresAt`: Data de expiração
- `tokenType`: `bearer` ou `oauth2`
- `renewalStrategy`: `manual` | `auto` | `long_lived`

**Renewal Strategies:**
- `manual`: Usuário precisa reconectar quando expira
- `auto`: Sistema tenta renovar automaticamente (se Meta suportar)
- `long_lived`: Token de longa duração (60 dias Meta), renovar antes de expirar

### **6.2 Criptografia**

**Algoritmo:** AES-256-CBC  
**Key:** `ENCRYPTION_KEY` (32 chars, do env)  
**IV:** Gerado por token (armazenar junto)

**Implementação:**
```typescript
// lib/meta-token-encryption.ts
export function encryptToken(token: string, key: string): { encrypted: string, iv: string }
export function decryptToken(encrypted: string, iv: string, key: string): string
```

### **6.3 Renovação Automática**

**Worker:** `meta_token_refresh` (cron diário)
- Busca tokens que expiram em < 7 dias
- Tenta renovar via Meta API (se `renewalStrategy = "auto"`)
- Atualiza `expiresAt` e `accessTokenEncrypted`
- Notifica usuário se falhar (email/in-app)

---

## 📊 7. ESTRATÉGIA DE INSIGHTS

### **7.1 Batch Processing**

**Padrão:** Reutilizar `lib/wordpress/wordpress-sync-worker-runner.ts:87-125`

**Worker:** `lib/meta/meta-insights-worker.ts`
- Claim jobs `meta_insights_fetch` em batch (10 por vez)
- Processa múltiplas contas em paralelo (Promise.allSettled)
- Aplica guardrails antes de salvar

### **7.2 Cache TTL**

**TTL:** 1 hora (configurável via `MetaInsightCache.expiresAt`)

**Cache Key:** `hash(connectionId + adAccountId + timeWindow + objective + primaryKpi)`

**Invalidação:**
- Automática após TTL
- Manual via `DELETE /api/meta/insights/cache/:cacheKey`

### **7.3 Incremental Updates**

**Padrão:** Similar a `lib/wordpress/wordpress-incremental-sync.ts:51`

**Estratégia:**
- Primeira busca: full sync (últimos 30 dias)
- Updates incrementais: apenas novos criativos desde última sync
- Campo `lastSyncAt` em `MetaConnection`

### **7.4 Paginação Meta API**

**Limite:** 100 criativos por request  
**Cursor:** Usar `after` parameter da Meta API  
**Retry:** 3x com backoff exponencial (1s, 2s, 4s)

### **7.5 Rate Limiting / Backoff**

**Limites Meta:**
- 200 calls/hora por app (default)
- 4800 calls/hora por ad account (com `ads_read`)

**Implementação:**
- Cache agressivo (TTL 1h)
- Queue com rate limiting (max 10 jobs/hora por connection)
- Backoff automático em 429 (Retry-After header)

---

## 🎨 8. EXTRAÇÃO DE PADRÕES

### **8.1 Camadas de Extração**

#### **Camada 1: Visual (GPT-4 Vision)**
```json
{
  "colors": {
    "dominant": ["#FF5733", "#33FF57"],
    "palette": ["#FF5733", "#33FF57", "#3357FF"],
    "contrast": "high"
  },
  "composition": {
    "layout": "centered",
    "elements": ["product", "text", "cta_button"],
    "balance": "symmetrical"
  },
  "style": {
    "type": "minimalist",
    "mood": "energetic",
    "photography": false
  },
  "dimensions": {
    "width": 1200,
    "height": 628,
    "ratio": "1.91:1"
  }
}
```

#### **Camada 2: Mensagem (OCR + Copy)**
```json
{
  "headline": "Oferta Especial - 50% OFF",
  "body": "Aproveite agora mesmo",
  "cta": "Saiba Mais",
  "textInImage": true,
  "language": "pt-BR"
}
```

#### **Camada 3: Abordagem (Inferido)**
```json
{
  "urgency": "high",
  "benefit": "discount",
  "tone": "friendly",
  "targeting": "broad"
}
```

### **8.2 Pipeline de Extração**

1. **Download temporário:** Baixa thumbnail (não persiste)
2. **GPT-4 Vision:** Análise visual completa
3. **OCR:** Extração de texto (via Vision)
4. **Inferência:** Abordagem baseada em padrões detectados
5. **Salvamento:** 3 registros em `CreativePattern` (visual, message, approach)

### **8.3 Cache de Análises**

**Estratégia:** Hash da imagem (SHA-256)  
**TTL:** 30 dias (padrões não mudam)  
**Tabela:** `CreativePattern` (já tem `metaCreativeId` único)

---

## 🚫 9. ANTI-CLONE RULES

### **9.1 Regras de Prompt**

**Proibições:**
- Nomes de marcas concorrentes
- Logos de terceiros
- Texto idêntico (similaridade > 90%)
- Elementos visuais idênticos (hash match)

**Validação:**
```typescript
function validateAntiClone(brief: CreativeBrief, patterns: CreativePattern[]): {
  valid: boolean
  score: number // 0-1, quanto maior, menos similar
  violations: string[]
}
```

### **9.2 Limite de Similaridade**

**Embeddings:**
- Gerar embedding da imagem original (via OpenAI)
- Gerar embedding da imagem gerada
- Calcular cosine similarity
- **Threshold:** < 0.85 (rejeitar se > 0.85)

### **9.3 Variações Obrigatórias**

**Mínimo:** 2 variações por padrão  
**Máximo:** 4 variações  
**Diversidade:** Garantir diferenças visuais significativas

### **9.4 "Inspiration Only" Flag**

**Campo:** `inspiredBy: string[]` (array de `metaCreativeId`)  
**Uso:** Rastreamento de origem (compliance)  
**UI:** Mostrar "Inspirado em X criativos" (sem links diretos)

---

## 📈 10. OBSERVABILIDADE E AUDITORIA

### **10.1 Logs Estruturados**

**Níveis:**
- `INFO`: Operações normais (sync, extração)
- `WARN`: Rate limits, tokens expirando
- `ERROR`: Falhas de API, jobs falhados

**Campos obrigatórios:**
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "INFO",
  "service": "meta-creative-intelligence",
  "organizationId": "org_xxx",
  "userId": "user_xxx",
  "action": "insights_sync",
  "connectionId": "conn_xxx",
  "adAccountId": "act_123",
  "durationMs": 2500,
  "metadata": {}
}
```

### **10.2 Métricas**

**Tabela:** `AIMetric` (existente)  
**Tipo:** `meta_insights_fetch`, `meta_pattern_extract`, `meta_creative_generate`

**Métricas:**
- Total de requests
- Taxa de sucesso
- Duração média (p50, p95, p99)
- Custos (GPT-4 Vision)

### **10.3 Audit Trail**

**Tabela:** `MetaAuditLog` (nova, opcional no MVP)
```prisma
model MetaAuditLog {
  id              String   @id @default(cuid())
  organizationId  String
  userId          String?
  action          String   // "connect", "disconnect", "sync", "generate"
  resourceType    String   // "connection", "creative", "pattern"
  resourceId      String?
  metadata        String   @default("{}")
  createdAt       DateTime @default(now())
  
  @@index([organizationId, createdAt])
  @@map("meta_audit_logs")
}
```

---

## 🔒 11. SEGURANÇA E COMPLIANCE

### **11.1 Retenção de Dados**

**Configuração:** `MetaCreativeConfig.creativeRetentionDays` (default: 365)

**Worker:** `meta_retention_cleanup` (cron diário)
- Busca `MetaCreative` com `expiresAt < NOW()`
- Deleta criativo + padrões relacionados
- Log de exclusão em `MetaAuditLog`

### **11.2 Exclusão ao Desconectar**

**Endpoint:** `DELETE /api/meta/connections/:id`

**Ações:**
1. Revoga token na Meta (se possível)
2. Marca `MetaConnection.revokedAt = NOW()`
3. Agenda exclusão de dados (30 dias grace period)
4. Notifica usuário

### **11.3 LGPD/GDPR**

**Direitos:**
- **Acesso:** `GET /api/meta/connections/:id/data` (export JSON)
- **Exclusão:** `DELETE /api/meta/connections/:id` (com grace period)
- **Portabilidade:** Export em formato estruturado

**Implementação:**
- Campo `dataProcessingConsent` em `MetaConnection`
- Logs de consentimento em `MetaAuditLog`

---

## ✅ 12. DEFINITION OF DONE (MVP)

### **12.1 Módulo: OAuth + Conexão**

- [ ] POST /api/meta/connect retorna OAuth URL válida
- [ ] GET /api/meta/oauth/callback salva token criptografado
- [ ] GET /api/meta/ad-accounts lista contas autorizadas
- [ ] Tokens são criptografados (AES-256-CBC)
- [ ] Expiração de token detectada e notificada

### **12.2 Módulo: Insights Sync**

- [ ] POST /api/meta/insights/sync cria QueueJob
- [ ] Worker `meta_insights_fetch` processa em batch
- [ ] Guardrails aplicados (minSpend, minConversions, etc.)
- [ ] Ranking por KPI funciona corretamente
- [ ] Cache TTL de 1h implementado
- [ ] Rate limiting respeitado

### **12.3 Módulo: Creative Ingest**

- [ ] Worker `meta_creative_ingest` salva metadata-only
- [ ] Thumbnail URL extraído (se disponível)
- [ ] Features básicas salvas (dimensões, hash)
- [ ] Performance data salvo em JSON

### **12.4 Módulo: Pattern Extraction**

- [ ] Worker `meta_pattern_extract` processa assíncrono
- [ ] GPT-4 Vision analisa imagem
- [ ] OCR extrai texto (via Vision)
- [ ] 3 padrões salvos (visual, message, approach)
- [ ] Confidence score calculado

### **12.5 Módulo: Pattern → Prompt**

- [ ] POST /api/meta/generate-from-patterns combina padrões
- [ ] CreativeBrief gerado no formato correto
- [ ] Integração com `/api/creative/generate` funciona
- [ ] Anti-clone rules aplicadas
- [ ] Variações geradas (1-4)

### **12.6 Módulo: UI Mínima**

- [ ] Tela "Conectar conta Meta" (OAuth flow)
- [ ] Tela "Selecionar Ad Account"
- [ ] Formulário de parâmetros (período, objetivo, KPI)
- [ ] Lista de top criativos (com thumbnails)
- [ ] Botão "Gerar inspirado" funciona

### **12.7 Módulo: Compliance**

- [ ] Worker `meta_retention_cleanup` deleta expirados
- [ ] DELETE /api/meta/connections/:id revoga e agenda exclusão
- [ ] Logs de auditoria registrados
- [ ] Grace period de 30 dias implementado

### **12.8 Módulo: Observabilidade**

- [ ] Logs estruturados em todas as operações
- [ ] Métricas em `AIMetric` (se aplicável)
- [ ] Status de jobs acessível via API
- [ ] Alertas para tokens expirando

---

## ⚠️ 13. RISCOS (TOP 10)

| # | Risco | Probabilidade | Impacto | Blocker? | Mitigação |
|---|-------|---------------|---------|----------|-----------|
| 1 | **App Review Meta demora 2-4 semanas** | 🔴 Alta | 🔴 Alto | ✅ **SIM** | Iniciar App Review **imediatamente** em paralelo |
| 2 | **OAuth não implementado** | 🟢 Baixa | 🔴 Alto | ✅ **SIM** | Implementar provider customizado (MVP) |
| 3 | **Tokens expiram (60 dias)** | 🟡 Média | 🟡 Médio | ❌ Não | Renewal strategy + notificações |
| 4 | **Rate limits Meta API** | 🟡 Média | 🟡 Médio | ❌ Não | Cache agressivo + rate limiting |
| 5 | **Custos GPT-4 Vision** | 🟢 Baixa | 🟡 Médio | ❌ Não | Cache de análises + batch processing |
| 6 | **Compliance GDPR/LGPD** | 🟡 Média | 🔴 Alto | ⚠️ **PARCIAL** | Retenção + exclusão (MVP mínimo) |
| 7 | **Performance (muitos criativos)** | 🟡 Média | 🟡 Médio | ❌ Não | Processamento assíncrono (já existe) |
| 8 | **Ads Library não fornece métricas** | 🟢 Baixa | 🔴 Alto | ❌ Não | MVP = Modo A apenas |
| 9 | **Meta API muda/descontinua** | 🟢 Baixa | 🔴 Alto | ❌ Não | SDK oficial + versionamento |
| 10 | **Anti-clone insuficiente** | 🟡 Média | 🟡 Médio | ❌ Não | Validação + embeddings + threshold |

**BLOCKERS:**
- ✅ App Review Meta (iniciar paralelo)
- ✅ OAuth implementation (MVP core)

---

## 📦 14. DEPENDÊNCIAS

### **14.1 Novas Dependências**

```json
{
  "dependencies": {
    "facebook-nodejs-business-sdk": "^19.0.0",
    "crypto": "^1.0.1" // Node built-in, mas types necessários
  },
  "devDependencies": {
    "@types/crypto-js": "^4.2.2"
  }
}
```

### **14.2 Variáveis de Ambiente**

```env
# Meta Ads API
META_APP_ID="your-meta-app-id"
META_APP_SECRET="your-meta-app-secret"
META_API_VERSION="v19.0"
META_OAUTH_REDIRECT_URI="http://localhost:4000/api/meta/oauth/callback"
META_OAUTH_SCOPE="ads_read,ads_management,business_management"

# Encryption
ENCRYPTION_KEY="your-32-char-encryption-key-here"

# Retenção
CREATIVE_RETENTION_DAYS="365"
META_INSIGHT_CACHE_TTL_HOURS="1"

# Rate Limiting
META_API_RATE_LIMIT_PER_HOUR="10"
```

---

**FIM DA SPEC V3**







