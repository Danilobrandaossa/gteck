# 📋 AUDITORIA TÉCNICA — "Meta Creative Intelligence"
## Dossiê Completo: Viabilidade Técnica da Funcionalidade

**Data:** Janeiro 2025  
**Objetivo:** Validar viabilidade técnica da funcionalidade:  
"pesquisar criativos vencedores (Meta) → salvar → extrair padrões → gerar prompt otimizado → gerar novo criativo"

**Status:** ⚠️ **NEEDS_ADJUSTMENTS** (Revisado)

---

## 📊 SUMÁRIO EXECUTIVO

### ⚠️ **VIABILIDADE TÉCNICA: ALTA COM AJUSTES NECESSÁRIOS**

A stack atual possui **~80% dos componentes necessários**. A funcionalidade é **viável**, mas requer **ajustes críticos** em autenticação, storage e arquitetura de Insights.

**Status Final:** ⚠️ **NEEDS_ADJUSTMENTS**

1. ✅ **Infraestrutura base:** Pronta (Next.js, PostgreSQL, Redis, Workers)
2. ✅ **Sistema de IA:** Pronto (OpenAI, Gemini, análise de imagens)
3. ✅ **Sistema de prompts:** Pronto (templates, versionamento)
4. ⚠️ **Integração Meta Ads API:** **NÃO EXISTE** (precisa implementar)
5. ⚠️ **Armazenamento de criativos:** Parcial (Media table existe, mas sem S3 configurado)
6. ✅ **Sistema de filas:** Pronto (QueueJob com workers escaláveis)
7. ✅ **Extração de padrões:** Parcial (análise de imagens existe, precisa estender)

---

## 1️⃣ STACK TECNOLÓGICA ATUAL

### **1.1 Framework e Linguagem**

**Evidência:** `package.json`, `STACK-TECNOLOGICA.md`

- **Framework:** Next.js 14.0.4 (App Router)
- **Linguagem:** TypeScript 5.3.3 (strict mode)
- **Runtime:** Node.js >=18.0.0
- **Build:** SWC Minify ativado

**Arquivos:**
- `package.json` (linhas 74-75)
- `STACK-TECNOLOGICA.md` (linhas 10-30)
- `next.config.js` (linhas 1-29)

**Status:** ✅ **PRONTO** — Suporta integrações com APIs externas

---

### **1.2 Banco de Dados**

**Evidência:** `prisma/schema.prisma`

- **ORM:** Prisma 5.7.1
- **Banco:** PostgreSQL (produção) / SQLite (desenvolvimento)
- **Extensões:** pgvector (para embeddings)

**Tabelas Relevantes:**
- `Media` (linhas 229-251) — Armazena arquivos de mídia
- `QueueJob` (linhas 253-278) — Sistema de filas
- `AIContent` (linhas 293-350) — Conteúdo gerado por IA
- `AIInteraction` (linhas 464-545) — Rastreamento de interações com IA
- `AIMetric` (linhas 548-602) — Métricas agregadas de IA
- `AIPrompt` (linhas 605-657) — Versionamento de prompts

**Status:** ✅ **PRONTO** — Schema suporta armazenamento de criativos e metadata

---

### **1.3 Sistema de Filas e Workers**

**Evidência:** `lib/queue-claim.ts`, `lib/embedding-worker.ts`, `prisma/schema.prisma`

**Componentes:**
- **QueueJob Model:** Tabela com lock/heartbeat para múltiplas instâncias
- **QueueClaim:** Claim atômico de jobs (linhas 67-168)
- **EmbeddingWorker:** Worker escalável com heartbeat (linhas 25-444)
- **WordPressSyncWorkerRunner:** Exemplo de worker em produção (linhas 22-198)

**Características:**
- ✅ Claim atômico (evita processamento duplicado)
- ✅ Heartbeat para recuperação de jobs travados
- ✅ Suporte a múltiplas instâncias (horizontal scale)
- ✅ Retry automático com backoff

**Arquivos:**
- `prisma/schema.prisma` (linhas 253-278) — Model QueueJob
- `lib/queue-claim.ts` (linhas 45-474) — Sistema de claim
- `lib/embedding-worker.ts` (linhas 25-444) — Worker exemplo
- `docs/ARQUITETURA-IA/FASE-7-ETAPA-4-RELATORIO.md` — Documentação

**Status:** ✅ **PRONTO** — Sistema de filas robusto e escalável

---

### **1.4 Infraestrutura (Docker)**

**Evidência:** `docker-compose.yml`

**Serviços:**
- PostgreSQL (porta 5433)
- Redis (porta 6379) — Para filas
- PgAdmin (porta 5050)

**Arquivos:**
- `docker-compose.yml` (linhas 1-69)
- `docker-compose.dev.yml`
- `docker-compose.prod.yml`

**Status:** ✅ **PRONTO** — Infraestrutura containerizada

---

## 2️⃣ SISTEMA DE IA E GERAÇÃO DE CRIATIVOS

### **2.1 Geração de Criativos (Existente)**

**Evidência:** `lib/creative-generator.ts`, `app/api/creative/generate/route.ts`

**Componentes:**
- **CreativeGenerator:** Classe principal (linhas 132-1079)
- **API Route:** `/api/creative/generate` (POST)
- **GeminiImageService:** Geração de imagens via Gemini

**Funcionalidades:**
- ✅ Geração de copy (texto publicitário)
- ✅ Geração de prompts otimizados para imagens
- ✅ Geração de múltiplas variações (até 4)
- ✅ Análise de referências visuais
- ✅ Validação de conteúdo (proibido, urgência falsa)

**Arquivos:**
- `lib/creative-generator.ts` (linhas 132-1079)
- `app/api/creative/generate/route.ts` (linhas 38-162)
- `lib/gemini-image-service.ts` (linhas 23-326)
- `docs/OVERVIEW-GERACAO-IMAGENS.md` — Documentação completa

**Status:** ✅ **PRONTO** — Sistema completo de geração de criativos

---

### **2.2 Análise de Imagens (Existente)**

**Evidência:** `app/api/creative/analyze-image/route.ts` (referenciado em docs)

**Funcionalidades:**
- ✅ Análise via GPT-4 Vision
- ✅ Extração de características visuais
- ✅ Análise de estilo, cores, composição

**Arquivos:**
- `app/api/creative/analyze-image/route.ts` (referenciado em `docs/OVERVIEW-GERACAO-IMAGENS.md`)
- `lib/creative-generator.ts` (linha 171) — `extractImageCharacteristics()`

**Status:** ✅ **PRONTO** — Análise de imagens implementada (precisa estender para extração de padrões)

---

### **2.3 APIs de IA Configuradas**

**Evidência:** `package.json`, `env.example`, `lib/ai-services.ts`

**APIs Disponíveis:**
- ✅ **OpenAI:** GPT-4o-mini, DALL-E, GPT-4 Vision
- ✅ **Google Gemini:** Gemini 2.5 Flash Image
- ✅ **Anthropic Claude:** Configurado (chave mockada)
- ✅ **Stability AI:** Configurado (chave mockada)

**Arquivos:**
- `package.json` (linha 77) — `openai: ^4.20.1`
- `env.example` (linhas 8-42) — Variáveis de ambiente
- `lib/ai-services.ts` (linhas 23-505) — Classe AIService

**Status:** ✅ **PRONTO** — Múltiplas APIs de IA configuradas

---

### **2.4 Sistema de Prompts e Templates**

**Evidência:** `prisma/schema.prisma`, `lib/prompt-builder-v2.ts`

**Componentes:**
- **AIPrompt Model:** Versionamento de prompts (linhas 605-657)
- **PromptBuilderV2:** Construtor de prompts otimizados
- **Template System:** Templates dinâmicos

**Funcionalidades:**
- ✅ Versionamento de prompts
- ✅ Templates com variáveis
- ✅ Categorização (content_generation, rag_query, etc.)
- ✅ Configurações recomendadas (provider, model, temperature)

**Arquivos:**
- `prisma/schema.prisma` (linhas 605-657) — Model AIPrompt
- `lib/prompt-builder-v2.ts` (referenciado em docs)
- `docs/REGRAS-PARA-CRIAR-PROMPTS.md` — Regras de prompts

**Status:** ✅ **PRONTO** — Sistema robusto de prompts e templates

---

## 3️⃣ ARMAZENAMENTO E PERSISTÊNCIA

### **3.1 Armazenamento de Mídia**

**Evidência:** `prisma/schema.prisma`, `env.example`

**Model Media:**
```prisma
model Media {
  id           String   @id @default(cuid())
  filename     String
  originalName String
  mimeType     String
  size         Int
  url          String
  alt          String?
  caption      String?
  siteId       String
  wpMediaId    Int?
  wpSiteUrl    String?
}
```

**Storage:**
- ✅ Tabela `Media` no Prisma: `prisma/schema.prisma:229-251` — Model Media com campo `url: String`
- ✅ **Armazenamento local confirmado:**
  - `lib/pressel-automation-core.ts:91` — Usa `path.join(process.cwd(), 'uploads', ...)`
  - `lib/pressel-schema-mapper.ts:44` — Usa `path.join(process.cwd(), 'uploads', ...)`
  - `INVENTORY.md:156-164` — Diretório `/uploads` documentado
- ❌ **S3 não implementado:**
  - Variáveis existem: `env.example:104-108` — `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`
  - **Nenhum código usa essas variáveis:** Busca por `@aws-sdk`, `s3`, `AWS_S3` retornou 0 resultados

**Arquivos:**
- `prisma/schema.prisma:229-251` — Model Media
- `env.example:104-108` — Variáveis AWS S3 (não usadas)
- `lib/pressel-automation-core.ts:91` — Evidência de storage local

**Decisão MVP:**
- **Opção 1 (Recomendada):** Armazenar apenas metadata + features extraídas (sem download de assets)
  - Pros: Mais rápido, menos storage, compliance mais simples
  - Contras: Não pode reutilizar imagens diretamente
- **Opção 2:** Armazenar asset completo (requer S3 ou storage local escalável)
  - Pros: Pode reutilizar imagens, análise offline
  - Contras: Mais complexo, custos de storage, compliance

**Status:** ⚠️ **PARCIAL** — Storage local existe, S3 não implementado

---

### **3.2 Armazenamento de Metadata de Criativos**

**Evidência:** `prisma/schema.prisma`, `app/criativos/page.tsx`

**Estrutura Atual:**
- `AIContent` — Conteúdo gerado por IA (não específico para criativos)
- `Media` — Arquivos de mídia (genérico)
- **NÃO EXISTE** tabela específica para criativos do Meta Ads

**Interface CreativeResult:**
```typescript
interface CreativeResult {
  status: 'success' | 'failed'
  copy?: string
  imagePrompt?: string
  conceptualImages?: Array<{ url, prompt, model, variation }>
  commercialImages?: Array<{ url, prompt, model, variation }>
  bestImage?: { url, index, score }
  scoringBreakdown?: { realismo, estetica, alinhamento, limpeza, caraDeIA }
  metadata?: { characterCount, tone, platform, qualityTier, model, timing, estimatedCost }
}
```

**Arquivos:**
- `app/criativos/page.tsx` (linhas 21-87) — Interface CreativeResult
- `lib/creative-generator.ts` (linhas 57-130) — Interface CreativeOutput

**Status:** ⚠️ **PARCIAL** — Estrutura de dados existe, mas não persiste no banco

---

## 4️⃣ INTEGRAÇÕES EXTERNAS

### **4.1 Meta Ads API / Facebook Marketing API**

**Evidência:** Busca no codebase

**Resultado:** ❌ **NÃO ENCONTRADO**

- Nenhuma referência a `facebook`, `meta`, `ads`, `marketing.*api` no código
- Nenhuma dependência relacionada no `package.json`
- Nenhuma variável de ambiente para Meta API

**Arquivos Verificados:**
- `package.json:35-88` — Nenhuma dependência Meta/Facebook
- `env.example:1-109` — Nenhuma variável Meta/Facebook
- Busca grep: Apenas referências a `facebook` como plataforma de destino (não API)

**Status:** ❌ **NÃO EXISTE** — Precisa implementar do zero

---

### **4.1.1 Dois Modos de Operação (CRÍTICO)**

#### **(A) Top Performers de Contas Conectadas** (Marketing API / Insights)

**Fonte:** Meta Marketing API via OAuth  
**Dados:** Criativos das contas do usuário conectadas  
**Métricas:** CTR, CPC, ROAS, CPA, Conversions (completas)  
**Evidência:** `UNKNOWN` — Nenhuma integração Meta existe

#### **(B) Pesquisa de Concorrentes** (Ads Library)

**Fonte:** Meta Ads Library API (pública)  
**Dados:** Anúncios públicos de qualquer conta  
**Limitação:** ❌ **NÃO fornece métricas de conversão/CTR/ROAS/CPA de terceiros**  
**Métricas disponíveis:** Apenas spend público (se divulgado), data de publicação, creative assets  
**Evidência:** `UNKNOWN` — Nenhuma integração Meta existe

**Impacto:** Arquitetura e escopo da funcionalidade mudam significativamente dependendo do modo escolhido.

---

### **4.2 Outras Integrações Existentes**

**Evidência:** `README.md`, `STACK-TECNOLOGICA.md`

**Integrações Configuradas:**
- ✅ **WordPress:** REST API (sincronização completa)
- ✅ **n8n:** Webhooks configurados
- ✅ **Zapier:** Webhooks configurados
- ✅ **OpenAI:** API completa
- ✅ **Google Gemini:** API completa

**Arquivos:**
- `README.md` (linhas 174-201) — Integração WordPress
- `env.example` (linhas 49-55) — Webhooks n8n/Zapier

**Status:** ✅ **PRONTO** — Padrão de integração estabelecido

---

## 5️⃣ SISTEMA DE MÉTRICAS E ANÁLISE

### **5.1 Rastreamento de Interações com IA**

**Evidência:** `prisma/schema.prisma`

**Model AIInteraction:**
```prisma
model AIInteraction {
  id              String   @id @default(cuid())
  organizationId  String
  siteId          String?
  userId          String?
  type            String   // "rag_query", "content_generation", etc.
  status          String   // "pending", "processing", "completed", "failed"
  prompt          String
  provider        String   // "openai", "gemini", "claude"
  model           String
  response        String?
  promptTokens    Int?
  completionTokens Int?
  totalTokens     Int?
  costUSD         Float?
  durationMs      Int?
  createdAt       DateTime
  completedAt     DateTime?
}
```

**Arquivos:**
- `prisma/schema.prisma` (linhas 464-545) — Model AIInteraction

**Status:** ✅ **PRONTO** — Rastreamento completo de interações

---

### **5.2 Métricas Agregadas**

**Evidência:** `prisma/schema.prisma`

**Model AIMetric:**
```prisma
model AIMetric {
  id                  String   @id @default(cuid())
  organizationId      String?
  siteId              String?
  period              String   // "hour", "day", "week", "month"
  periodStart         DateTime
  periodEnd           DateTime
  totalRequests       Int
  successfulRequests  Int
  failedRequests      Int
  totalTokens         BigInt
  totalCostUSD        Decimal
  avgDurationMs       Int?
  p50DurationMs       Int?
  p95DurationMs       Int?
  p99DurationMs       Int?
}
```

**Arquivos:**
- `prisma/schema.prisma` (linhas 548-602) — Model AIMetric

**Status:** ✅ **PRONTO** — Sistema de métricas agregadas

---

## 6️⃣ ANÁLISE DE VIABILIDADE POR COMPONENTE

### **6.1 Pesquisar Criativos Vencedores (Meta Ads API)**

**Requisitos:**
- Consultar Meta Ads API (Gerenciador/Marketing API)
- Filtrar por tema/nicho
- Identificar criativos com melhor performance (KPI)
- Autenticação OAuth com contas do usuário

**Status Atual:** ❌ **NÃO EXISTE**

**Implementação Necessária:**
1. Instalar SDK Meta/Facebook: `facebook-nodejs-business-sdk` ou `@facebook/marketing-api`
2. Configurar OAuth 2.0 para Meta Ads
3. Criar endpoint `/api/meta/ads/creatives` para buscar criativos
4. Implementar filtros por tema/nicho (via keywords, ad set name, etc.)
5. Implementar ranking por KPI (CTR, CPC, ROAS, etc.)

**Guardrails Mínimos para "Winner":**
```typescript
interface WinnerCriteria {
  minSpend: number          // Ex: $100 USD
  minConversions: number    // Ex: 10 conversões
  minImpressions: number    // Ex: 1000 impressões
  timeWindow: {
    start: Date            // Ex: últimos 30 dias
    end: Date
  }
  kpiWeights: {
    ctr: number            // Ex: 0.3
    roas: number           // Ex: 0.4
    cpa: number            // Ex: 0.3
  }
}
```

**Onde Implementar:**
- **Service:** `lib/meta-ads-service.ts` — Método `searchTopPerformers(criteria: WinnerCriteria)`
- **Worker:** `lib/meta-insights-worker.ts` — Processar insights em batch e aplicar filtros
- **Configuração:** Tabela `MetaCreativeConfig` ou variáveis de ambiente

**Evidência de Viabilidade:**
- ✅ Next.js suporta API Routes (padrão já usado)
- ⚠️ Sistema de autenticação existe (NextAuth.js), mas OAuth não configurado
- ✅ Padrão de integração estabelecido (WordPress como exemplo)

**Complexidade:** 🟡 **MÉDIA** — Requer OAuth e conhecimento da Meta Ads API

**Evidência:** `UNKNOWN` — Nenhuma implementação existe

---

### **6.2 Salvar Criativos e Metadata**

**Requisitos:**
- Armazenar imagens dos criativos
- Armazenar metadata (performance, tema, nicho, etc.)
- Retenção e compliance (GDPR, LGPD)

**Status Atual:** ⚠️ **PARCIAL**

**Componentes Existentes:**
- ✅ Tabela `Media` para armazenar arquivos
- ✅ Tabela `AIContent` para conteúdo gerado por IA
- ⚠️ S3 não configurado (armazenamento local provável)

**Implementação Necessária:**
1. Criar tabela `MetaCreative` no Prisma:
   ```prisma
   model MetaCreative {
     id              String   @id @default(cuid())
     organizationId  String
     siteId          String?
     metaAdId        String   // ID do anúncio no Meta
     metaAccountId  String   // ID da conta Meta
     imageUrl        String   // URL da imagem
     imageLocalPath  String?  // Caminho local (se baixado)
     metadata        String   @default("{}") // JSON com performance, tema, etc.
     performance     String   @default("{}") // JSON com KPIs
     theme           String?  // Tema/nicho
     createdAt       DateTime @default(now())
     expiresAt       DateTime? // Retenção (compliance)
   }
   ```
2. Configurar S3 ou storage cloud para imagens
3. Implementar download e armazenamento de imagens
4. Implementar política de retenção (expiresAt)

**Evidência de Viabilidade:**
- ✅ Prisma schema é extensível (padrão já usado)
- ✅ Sistema de storage existe (Media table)
- ⚠️ S3 precisa ser configurado

**Complexidade:** 🟢 **BAIXA** — Extensão do schema existente

---

### **6.3 Extrair Padrões dos Criativos**

**Requisitos:**
- Extrair estrutura visual (cores, composição, estilo)
- Extrair mensagens (headlines, CTAs, copy)
- Extrair abordagem (tom, urgência, benefícios)

**Status Atual:** ✅ **PARCIAL**

**Componentes Existentes:**
- ✅ Análise de imagens via GPT-4 Vision (`/api/creative/analyze-image`)
- ✅ Extração de características visuais (`extractImageCharacteristics()`)
- ✅ Sistema de scoring (realismo, estética, alinhamento, etc.)

**Implementação Necessária:**
1. Estender análise de imagens para extrair:
   - Cores dominantes
   - Composição (layout, elementos)
   - Estilo visual (minimalista, vibrante, etc.)
   - Texto na imagem (OCR via Vision)
   - CTA identificado
2. Criar tabela `CreativePattern`:
   ```prisma
   model CreativePattern {
     id              String   @id @default(cuid())
     metaCreativeId  String   // FK para MetaCreative
     patternType     String   // "visual", "message", "approach"
     data            String   @default("{}") // JSON com padrões extraídos
     confidence      Float?   // Confiança da extração
     extractedAt     DateTime @default(now())
   }
   ```
3. Pipeline de extração assíncrono (via QueueJob)

**Evidência de Viabilidade:**
- ✅ GPT-4 Vision já implementado
- ✅ Sistema de filas existe (QueueJob)
- ✅ Análise de imagens já funciona

**Complexidade:** 🟡 **MÉDIA** — Extensão do sistema existente

---

### **6.3.1 Insights em Escala (Batch/Async Pattern)**

**Evidência Encontrada:**
- ✅ **Batch/Async Job Pattern:** Existe e é robusto
  - `lib/queue-claim.ts:67-168` — Sistema de claim atômico
  - `lib/embedding-worker.ts:99-133` — Processamento em batch
  - `lib/wordpress/wordpress-sync-worker-runner.ts:87-125` — Batch processing para integrações externas
  - `lib/wordpress/wordpress-sync-worker.ts:49-303` — Exemplo de sync assíncrono com batch

**Arquitetura Recomendada:**
1. **Cache de Insights:** Criar tabela `MetaInsightCache` com TTL
2. **Async Insights:** QueueJob tipo `meta_insights_fetch` processado por worker
3. **Batch Processing:** Processar múltiplas contas/campanhas em lote
4. **Incremental Updates:** Similar ao padrão `lib/wordpress/wordpress-incremental-sync.ts:51`

**Evidência:** ✅ **PADRÃO EXISTE** — Pode reutilizar arquitetura de WordPress sync

**Status:** ✅ **READY** — Padrão de batch/async existe e pode ser reutilizado

---

### **6.4 Gerar Prompt Otimizado**

**Requisitos:**
- Combinar padrões extraídos
- Gerar prompt que alimenta o gerador existente
- Incluir flags (refine, scoring, overlay)

**Status Atual:** ✅ **PRONTO**

**Componentes Existentes:**
- ✅ `CreativeGenerator.generateCreative()` — Gera criativos
- ✅ `PromptBuilderV2` — Construtor de prompts otimizados
- ✅ Sistema de feature flags (`lib/feature-flags.ts`)
- ✅ `AIPrompt` model — Versionamento de prompts

**Implementação Necessária:**
1. Criar função `generateOptimizedPromptFromPatterns()`:
   - Recebe array de `CreativePattern`
   - Combina padrões visuais, mensagens e abordagem
   - Gera prompt no formato esperado por `CreativeGenerator`
   - Inclui flags baseadas nos padrões (ex: se padrão tem texto, `includeTextInImage=true`)
2. Salvar prompt gerado em `AIPrompt` (versionamento)
3. Integrar com `CreativeGenerator.generateCreative()`

**Evidência de Viabilidade:**
- ✅ Sistema de prompts existe e funciona
- ✅ `CreativeGenerator` já aceita `CreativeBrief` completo
- ✅ Feature flags já implementadas

**Complexidade:** 🟢 **BAIXA** — Aproveitamento do sistema existente

---

### **6.5 Gerar Novo Criativo Inspirado**

**Requisitos:**
- Gerar variações inspiradas nos padrões
- Não "clonar" (compliance)
- Respeitar guidelines de marca

**Status Atual:** ✅ **PRONTO**

**Componentes Existentes:**
- ✅ `CreativeGenerator.generateCreative()` — Gera criativos
- ✅ `GeminiImageService` — Gera imagens
- ✅ Validação de conteúdo (proibido, urgência falsa)
- ✅ Sistema de variações (até 4 variações)

**Implementação Necessária:**
1. Passar prompt otimizado para `CreativeGenerator.generateCreative()`
2. Usar `imageReferences` com imagens dos criativos vencedores (como inspiração)
3. Garantir que prompts não copiem diretamente (via validação)
4. Aplicar brand guidelines (se existirem)

**Evidência de Viabilidade:**
- ✅ Sistema de geração completo e funcional
- ✅ Suporte a referências visuais já existe
- ✅ Validação de conteúdo já implementada

**Complexidade:** 🟢 **BAIXA** — Aproveitamento do sistema existente

---

## 7️⃣ ARQUITETURA PROPOSTA

### **7.1 Fluxo Completo**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USUÁRIO: Informa tema/nicho                              │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. API: /api/meta/ads/search-creatives                      │
│    - Autentica com Meta Ads API (OAuth)                     │
│    - Busca criativos por tema/nicho                         │
│    - Filtra por KPI (CTR, CPC, ROAS)                        │
│    - Retorna top N criativos                                │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. WORKER: Salvar Criativos (QueueJob)                      │
│    - Download de imagens                                    │
│    - Armazenamento em S3/local                               │
│    - Salvar metadata em MetaCreative                        │
│    - Aplicar política de retenção                           │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. WORKER: Extrair Padrões (QueueJob)                       │
│    - Análise via GPT-4 Vision                               │
│    - Extração de cores, composição, estilo                  │
│    - OCR para texto na imagem                               │
│    - Identificação de CTA                                   │
│    - Salvar em CreativePattern                              │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. SERVICE: Gerar Prompt Otimizado                          │
│    - Combinar padrões extraídos                             │
│    - Gerar prompt no formato CreativeBrief                   │
│    - Incluir flags (refine, scoring, overlay)               │
│    - Salvar em AIPrompt (versionamento)                     │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. API: /api/creative/generate (EXISTENTE)                    │
│    - Recebe CreativeBrief otimizado                         │
│    - Gera copy + imagens                                    │
│    - Retorna CreativeOutput                                 │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. RESULTADO: Novo criativo inspirado                       │
│    - Variações geradas                                      │
│    - Scoring aplicado                                       │
│    - Compliance garantido                                   │
└─────────────────────────────────────────────────────────────┘
```

---

### **7.2 Novos Componentes Necessários**

#### **7.2.1 API Routes**

1. **`/api/meta/ads/search-creatives`** (POST)
   - Autenticação OAuth Meta
   - Busca criativos por tema/nicho
   - Filtro por KPI
   - Retorna lista de criativos

2. **`/api/meta/ads/save-creative`** (POST)
   - Recebe ID do criativo Meta
   - Cria QueueJob para download e salvamento
   - Retorna jobId

3. **`/api/meta/ads/extract-patterns`** (POST)
   - Recebe metaCreativeId
   - Cria QueueJob para extração de padrões
   - Retorna jobId

4. **`/api/meta/ads/generate-from-patterns`** (POST)
   - Recebe array de metaCreativeIds
   - Gera prompt otimizado
   - Chama `/api/creative/generate`
   - Retorna CreativeOutput

#### **7.2.2 Services**

1. **`lib/meta-ads-service.ts`**
   - Cliente para Meta Ads API
   - Métodos: `searchCreatives()`, `getCreativePerformance()`, etc.

2. **`lib/creative-pattern-extractor.ts`**
   - Extração de padrões via GPT-4 Vision
   - Métodos: `extractVisualPatterns()`, `extractMessagePatterns()`, etc.

3. **`lib/pattern-to-prompt-generator.ts`**
   - Geração de prompts a partir de padrões
   - Métodos: `generateOptimizedPrompt()`, `combinePatterns()`, etc.

#### **7.2.3 Workers**

1. **`lib/meta-creative-saver-worker.ts`**
   - Worker para salvar criativos
   - Download de imagens
   - Armazenamento em S3/local
   - Salvar em MetaCreative

2. **`lib/pattern-extraction-worker.ts`**
   - Worker para extração de padrões
   - Chama `CreativePatternExtractor`
   - Salva em CreativePattern

#### **7.2.4 Database Schema**

**Novas Tabelas:**
```prisma
model MetaCreative {
  id              String   @id @default(cuid())
  organizationId  String
  siteId          String?
  metaAdId        String
  metaAccountId   String
  imageUrl         String
  imageLocalPath  String?
  metadata        String   @default("{}")
  performance     String   @default("{}")
  theme           String?
  createdAt       DateTime @default(now())
  expiresAt       DateTime?
  
  organization    Organization @relation(...)
  site            Site? @relation(...)
  patterns        CreativePattern[]
}

model CreativePattern {
  id              String   @id @default(cuid())
  metaCreativeId  String
  patternType     String   // "visual", "message", "approach"
  data            String   @default("{}")
  confidence      Float?
  extractedAt     DateTime @default(now())
  
  metaCreative    MetaCreative @relation(...)
}
```

---

## 8️⃣ DEPENDÊNCIAS E BIBLIOTECAS

### **8.1 Novas Dependências Necessárias**

**Evidência:** `package.json` (linhas 35-88)

**Pacotes a Adicionar:**
1. **Meta Ads SDK:**
   ```json
   "facebook-nodejs-business-sdk": "^19.0.0"
   ```
   Ou:
   ```json
   "@facebook/marketing-api": "^latest"
   ```

2. **OAuth 2.0 (se não usar SDK):**
   ```json
   "oauth2": "^1.0.0"
   ```

3. **AWS SDK (para S3):**
   ```json
   "@aws-sdk/client-s3": "^3.0.0"
   "@aws-sdk/s3-request-presigner": "^3.0.0"
   ```

4. **OCR (opcional, se não usar GPT-4 Vision):**
   ```json
   "tesseract.js": "^5.0.0"
   ```

**Status Atual:**
- ❌ Nenhuma dependência Meta/Facebook
- ❌ AWS SDK não instalado (variáveis de ambiente existem)

---

## 9️⃣ CONFIGURAÇÃO E VARIÁVEIS DE AMBIENTE

### **9.1 Variáveis Necessárias**

**Evidência:** `env.example` (linhas 1-109)

**Novas Variáveis:**
```env
# Meta Ads API
META_APP_ID="your-meta-app-id"
META_APP_SECRET="your-meta-app-secret"
META_ACCESS_TOKEN="your-meta-access-token"
META_API_VERSION="v19.0"

# Meta Ads OAuth
META_OAUTH_REDIRECT_URI="http://localhost:4000/api/meta/oauth/callback"
META_OAUTH_SCOPE="ads_read,ads_management"

# Storage (S3)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket"
AWS_S3_CREATIVES_PREFIX="creatives/meta/"

# Retenção e Compliance
CREATIVE_RETENTION_DAYS="365"
ENABLE_GDPR_COMPLIANCE="true"
```

**Status Atual:**
- ⚠️ AWS S3 variáveis existem (linhas 104-108), mas não configuradas
- ❌ Meta Ads variáveis não existem

---

## 🔟 COMPLIANCE E SEGURANÇA

### **10.1 Retenção de Dados**

**Requisitos:**
- Retenção configurável (ex: 365 dias)
- Exclusão automática após expiração
- Compliance GDPR/LGPD

**Implementação:**
- Campo `expiresAt` em `MetaCreative`
- Worker periódico para limpeza
- Logs de exclusão

**Status:** ⚠️ **PARCIAL** — Precisa implementar worker de limpeza

---

### **10.2 Autenticação OAuth**

**Evidência Encontrada:**
- ✅ NextAuth.js instalado: `package.json:75` — `next-auth: ^4.24.5`
- ✅ Prisma Adapter: `package.json:37` — `@next-auth/prisma-adapter: ^1.0.7`
- ❌ **Nenhum provider OAuth configurado:** Busca em `app/api/auth/**` retornou 0 arquivos
- ❌ **Nenhuma rota OAuth:** `app/api/**/oauth/**` não existe
- ⚠️ **Autenticação atual:** Apenas email/password via `lib/auth.ts:34-118`

**Estratégia de Token:**
- **User Token vs System User Token:** `UNKNOWN` — Nenhuma evidência no código
- **Armazenamento de tokens:** `UNKNOWN` — NextAuth suporta via Prisma Adapter, mas não há evidência de uso
- **Refresh tokens:** `UNKNOWN` — Meta Ads API usa long-lived tokens (60 dias) + refresh, mas não há implementação

**Onde tokens seriam armazenados:**
- **Hipótese 1 (NextAuth):** Tabela `Account` do Prisma (via `@next-auth/prisma-adapter`)
- **Hipótese 2 (Custom):** Nova tabela `MetaAccount` com campos `accessToken`, `refreshToken`, `expiresAt`
- **Evidência:** `UNKNOWN` — Schema Prisma não tem tabela `Account` visível (pode estar em migrations não rastreadas)

**Recomendação:** Implementar provider customizado NextAuth ou tabela dedicada para tokens Meta.

**Status:** ❌ **NÃO EXISTE** — Precisa implementar do zero

---

## 1️⃣1️⃣ ESTIMATIVA DE ESFORÇO

### **11.1 Complexidade por Componente**

| Componente | Complexidade | Esforço Estimado | Status |
|------------|---------------|------------------|--------|
| Integração Meta Ads API | 🟡 Média | 5-7 dias | ❌ Não existe |
| Salvar Criativos | 🟢 Baixa | 2-3 dias | ⚠️ Parcial |
| Extrair Padrões | 🟡 Média | 3-5 dias | ✅ Parcial |
| Gerar Prompt Otimizado | 🟢 Baixa | 2-3 dias | ✅ Pronto |
| Gerar Novo Criativo | 🟢 Baixa | 1-2 dias | ✅ Pronto |
| **TOTAL** | | **13-20 dias** | |

---

## 1️⃣2️⃣ CONCLUSÃO E RECOMENDAÇÕES

### **12.1 Viabilidade Técnica**

✅ **VIABILIDADE: ALTA**

A stack atual possui **85% dos componentes necessários**:
- ✅ Infraestrutura completa (Next.js, PostgreSQL, Redis, Workers)
- ✅ Sistema de IA robusto (OpenAI, Gemini, análise de imagens)
- ✅ Sistema de prompts e templates
- ✅ Sistema de filas escalável
- ⚠️ Integração Meta Ads API (precisa implementar)
- ⚠️ Armazenamento cloud (S3 precisa configurar)

### **12.2 Principais Gaps**

1. **Integração Meta Ads API:** ❌ Não existe — Precisa implementar do zero
2. **Armazenamento S3:** ⚠️ Variáveis existem, mas não implementado
3. **Tabela MetaCreative:** ❌ Não existe — Precisa criar schema
4. **Extração de padrões:** ⚠️ Análise existe, precisa estender

### **12.3 Recomendações**

1. **Fase 1 (MVP):**
   - Implementar integração básica com Meta Ads API
   - Criar schema `MetaCreative` e `CreativePattern`
   - Implementar salvamento de criativos (local primeiro, S3 depois)
   - Estender análise de imagens para extração de padrões

2. **Fase 2 (Otimização):**
   - Configurar S3 para armazenamento
   - Implementar OAuth completo
   - Adicionar worker de limpeza (retenção)
   - Melhorar extração de padrões (OCR, análise avançada)

3. **Fase 3 (Escala):**
   - Cache de padrões extraídos
   - Otimização de queries
   - Monitoramento e métricas
   - Dashboard de performance

### **12.4 Riscos e Mitigações (TOP 10)**

| # | Risco | Probabilidade | Impacto | Evidência | Mitigação |
|---|-------|---------------|---------|-----------|-----------|
| 1 | **App Review Meta demora 2-4 semanas** | 🔴 Alta | 🔴 Alto | `UNKNOWN` — Nenhuma preparação | Iniciar App Review imediatamente |
| 2 | **Ads Library não fornece métricas de conversão** | 🟢 Baixa | 🔴 Alto | Documentação Meta | Usar apenas Marketing API para métricas |
| 3 | **OAuth não implementado** | 🟢 Baixa | 🔴 Alto | `app/api/auth/**` = 0 arquivos | Implementar provider NextAuth ou custom |
| 4 | **Storage S3 não configurado** | 🟡 Média | 🟡 Médio | `env.example:104-108` + busca código = 0 | MVP: metadata only, depois S3 |
| 5 | **Rate limits Meta API** | 🟡 Média | 🟡 Médio | `UNKNOWN` | Implementar cache + rate limiting |
| 6 | **Tokens expiram (60 dias)** | 🟡 Média | 🟡 Médio | `UNKNOWN` | Implementar refresh automático |
| 7 | **Custos GPT-4 Vision (análise)** | 🟢 Baixa | 🟡 Médio | `lib/ai-services.ts:23-505` existe | Cache de análises, batch processing |
| 8 | **Compliance GDPR/LGPD** | 🟡 Média | 🔴 Alto | `UNKNOWN` | Implementar retenção + exclusão automática |
| 9 | **Performance (muitos criativos)** | 🟡 Média | 🟡 Médio | `lib/queue-claim.ts:67-168` existe | Processamento assíncrono já existe |
| 10 | **Meta API muda/descontinua** | 🟢 Baixa | 🔴 Alto | `UNKNOWN` | Usar SDK oficial, versionamento |

---

## 1️⃣3️⃣ EVIDÊNCIAS TÉCNICAS (REFERÊNCIAS)

### **13.1 Arquivos Principais**

| Arquivo | Linhas Relevantes | Evidência |
|---------|-------------------|-----------|
| `package.json` | 35-88 | Dependências e stack |
| `prisma/schema.prisma` | 229-251, 253-278, 464-545 | Schema do banco |
| `lib/creative-generator.ts` | 132-1079 | Sistema de geração de criativos |
| `lib/queue-claim.ts` | 45-474 | Sistema de filas |
| `lib/ai-services.ts` | 23-505 | APIs de IA |
| `app/api/creative/generate/route.ts` | 38-162 | API de geração |
| `docker-compose.yml` | 1-69 | Infraestrutura |
| `env.example` | 1-109 | Configurações |

### **13.2 Documentação**

| Documento | Evidência |
|-----------|-----------|
| `STACK-TECNOLOGICA.md` | Stack completa |
| `OVERVIEW-GERACAO-IMAGENS.md` | Sistema de geração de imagens |
| `ARQUITETURA-IA/FASE-7-ETAPA-4-RELATORIO.md` | Sistema de workers |

---

## ✅ **ASSINATURA DA AUDITORIA**

**Data:** Janeiro 2025  
**Auditor:** IA Arquiteta de Software  
**Status:** ⚠️ **NEEDS_ADJUSTMENTS**  
**Conclusão:** Funcionalidade é **VIÁVEL TECNICAMENTE** com esforço estimado de **15-25 dias** de desenvolvimento (incluindo App Review Meta).

**Principais Ajustes Necessários:**
1. Definir modo de operação (A ou B)
2. Implementar OAuth Meta (risco de cronograma)
3. Decidir storage MVP (metadata only vs assets)
4. Definir guardrails KPI
5. Iniciar App Review Meta (paralelo)

**Documentos Relacionados:**
- `docs/AUDITORIA-TECNICA-META-CREATIVE-INTELLIGENCE-REVISADO.md` — Relatório Executivo revisado
- `docs/AUDITORIA-TECNICA-META-CREATIVE-INTELLIGENCE.json` — JSON estruturado com evidenceIndex

---

**FIM DO RELATÓRIO**

