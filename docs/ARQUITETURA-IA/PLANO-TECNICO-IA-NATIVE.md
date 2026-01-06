# 🚀 PLANO TÉCNICO - TRANSFORMAÇÃO IA-NATIVE

**Data:** Janeiro 2025  
**Arquiteta:** IA Sênior - PostgreSQL, pgvector, Prisma, RAG  
**Objetivo:** Transformar CMS em plataforma IA-native sem quebrar compatibilidade

---

## 📋 SUMÁRIO EXECUTIVO

Este documento define o plano técnico completo para transformar o CMS Moderno em uma plataforma IA-native usando **PostgreSQL + pgvector + RAG**, mantendo 100% de compatibilidade com o código existente.

**Princípios:**
- ✅ Apenas adições (zero remoções)
- ✅ Backward compatible 100%
- ✅ Multi-tenancy preservado
- ✅ Enterprise-grade

---

## 1️⃣ INSTALAÇÃO DO PGVECTOR

### **1.1. SQL de Instalação**

```sql
-- Habilitar extensão pgvector no PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- Verificar instalação
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Quando executar:**
- **Desenvolvimento:** Na primeira migração
- **Produção:** Via migration Prisma ou manualmente (com permissões adequadas)

### **1.2. Escolha de Índice: HNSW vs IVFFLAT**

#### **HNSW (Hierarchical Navigable Small World)**
```sql
-- Recomendado para produção
CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops);
```

**Quando usar HNSW:**
- ✅ **Produção** (melhor performance)
- ✅ **Busca rápida** (< 10ms)
- ✅ **Alta concorrência**
- ✅ **Dados que não mudam frequentemente**
- ⚠️ **Maior uso de memória** (~30% mais que IVFFLAT)
- ⚠️ **Build mais lento** (mas aceitável para embeddings)

#### **IVFFLAT (Inverted File with Flat Compression)**
```sql
-- Alternativa para desenvolvimento/testes
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
```

**Quando usar IVFFLAT:**
- ✅ **Desenvolvimento** (build mais rápido)
- ✅ **Dados que mudam frequentemente**
- ✅ **Menor uso de memória**
- ⚠️ **Performance inferior** (~50-100ms vs <10ms)
- ⚠️ **Requer rebuild** quando dados mudam muito

**DECISÃO TÉCNICA:** Usar **HNSW** em produção, IVFFLAT apenas para desenvolvimento/testes.

---

## 2️⃣ MODELAGEM DO BANCO (PRISMA)

### **2.1. Nova Tabela: `Embedding`**

```prisma
model Embedding {
  id            String   @id @default(cuid())
  
  // Relacionamento com conteúdo
  pageId        String?
  page          Page?    @relation(fields: [pageId], references: [id], onDelete: Cascade)
  
  aiContentId   String?
  aiContent     AIContent? @relation(fields: [aiContentId], references: [id], onDelete: Cascade)
  
  templateId    String?
  template      Template? @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  // Multi-tenancy (obrigatório)
  siteId        String
  site          Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  
  organizationId String  // Denormalizado para performance
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Dados do embedding
  embedding     Unsupported("vector(1536)")  // pgvector - OpenAI ada-002 padrão
  model         String   @default("text-embedding-ada-002") // Modelo usado
  dimensions    Int      @default(1536) // Dimensões do vetor
  
  // Metadados
  contentType   String   // "page", "ai_content", "template"
  contentHash   String   // Hash do conteúdo original (evitar duplicatas)
  language      String   @default("pt-BR")
  
  // Versionamento
  version       Int      @default(1) // Versão do embedding (se conteúdo mudar)
  isActive      Boolean  @default(true) // Embedding ativo ou obsoleto
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Índices
  @@index([siteId, contentType, isActive], name: "embedding_site_content_idx")
  @@index([organizationId, contentType], name: "embedding_org_content_idx")
  @@index([contentHash], name: "embedding_hash_idx")
  @@index([model, dimensions], name: "embedding_model_idx")
  @@map("embeddings")
}
```

**Justificativas Técnicas:**
1. **`Unsupported("vector(1536)")`**: Prisma não suporta nativamente pgvector. Usamos `Unsupported` e gerenciamos via SQL raw.
2. **`organizationId` denormalizado**: Evita JOINs desnecessários em buscas semânticas (performance crítica).
3. **`contentHash`**: Evita gerar embeddings duplicados (economia de custos).
4. **`version` + `isActive`**: Permite versionamento e reindexação sem perder histórico.
5. **Múltiplos relacionamentos opcionais**: Um embedding pode ser de Page, AIContent ou Template.

---

### **2.2. Nova Tabela: `AIInteraction`**

```prisma
model AIInteraction {
  id            String   @id @default(cuid())
  
  // Multi-tenancy
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  siteId        String?
  site          Site?    @relation(fields: [siteId], references: [id], onDelete: SetNull)
  
  userId        String?
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  // Relacionamento com conteúdo (opcional)
  aiContentId   String?
  aiContent     AIContent? @relation(fields: [aiContentId], references: [id], onDelete: SetNull)
  
  pageId        String?
  page          Page?    @relation(fields: [pageId], references: [id], onDelete: SetNull)
  
  // Tipo de interação
  type          String   // "rag_query", "content_generation", "regeneration", "diagnostic", "suggestion"
  status        String   @default("pending") // "pending", "processing", "completed", "failed"
  
  // Prompt e contexto
  prompt        String   // Prompt original do usuário
  promptVersion String?  // Versão do prompt usado (referência a AIPrompt)
  context       String?  @default("{}") // JSON - contexto usado (RAG, etc)
  
  // Modelo usado
  provider      String   // "openai", "gemini", "claude"
  model         String   // "gpt-4o-mini", "gemini-2.0-flash", etc
  temperature   Float?   @default(0.7)
  maxTokens     Int?
  
  // Resposta
  response      String?  // Resposta da IA
  finishReason  String?  // "stop", "length", "content_filter", etc
  
  // Métricas de tokens
  promptTokens      Int?
  completionTokens  Int?
  totalTokens       Int?
  
  // Métricas de custo
  costUSD           Float?  // Custo em USD
  costBRL           Float?  // Custo em BRL (se aplicável)
  
  // Métricas de performance
  durationMs        Int?    // Tempo total em milissegundos
  embeddingDurationMs Int?  // Tempo para gerar/buscar embeddings
  aiCallDurationMs  Int?    // Tempo da chamada à IA
  
  // RAG específico
  ragUsed           Boolean @default(false)
  ragChunksCount    Int?    // Quantidade de chunks usados no contexto
  ragSimilarityThreshold Float? @default(0.7) // Threshold de similaridade usado
  
  // Erros
  errorMessage      String?
  errorCode         String?
  retryCount        Int     @default(0)
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  completedAt       DateTime?
  
  // Índices
  @@index([organizationId, type, status], name: "ai_interaction_org_type_status_idx")
  @@index([siteId, createdAt], name: "ai_interaction_site_created_idx")
  @@index([userId, createdAt], name: "ai_interaction_user_created_idx")
  @@index([provider, model], name: "ai_interaction_provider_model_idx")
  @@index([createdAt], name: "ai_interaction_created_at_idx")
  @@map("ai_interactions")
}
```

**Justificativas Técnicas:**
1. **Rastreamento completo**: Cada interação com IA é registrada (auditoria completa).
2. **Métricas detalhadas**: Tokens, custo, tempo (permite dashboards futuros).
3. **RAG tracking**: Campos específicos para rastrear uso de RAG.
4. **Multi-tenancy**: Filtros por organizationId e siteId garantem isolamento.

---

### **2.3. Nova Tabela: `AIMetric`**

```prisma
model AIMetric {
  id            String   @id @default(cuid())
  
  // Multi-tenancy
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  siteId        String?
  site          Site?    @relation(fields: [siteId], references: [id], onDelete: Cascade)
  
  userId        String?
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  // Agregação temporal
  period        String   // "hour", "day", "week", "month"
  periodStart   DateTime // Início do período
  periodEnd     DateTime // Fim do período
  
  // Agregação por tipo
  type          String?  // "rag_query", "content_generation", etc (null = todos)
  provider      String?  // "openai", "gemini", etc (null = todos)
  model         String?  // Modelo específico (null = todos)
  
  // Métricas agregadas
  totalRequests     Int     @default(0)
  successfulRequests Int    @default(0)
  failedRequests    Int     @default(0)
  
  totalTokens       BigInt  @default(0)
  promptTokens      BigInt  @default(0)
  completionTokens  BigInt  @default(0)
  
  totalCostUSD      Decimal @default(0) @db.Decimal(10, 4)
  totalCostBRL      Decimal @default(0) @db.Decimal(10, 4)
  
  avgDurationMs     Int?    // Duração média em ms
  p50DurationMs     Int?    // Percentil 50
  p95DurationMs     Int?    // Percentil 95
  p99DurationMs     Int?    // Percentil 99
  
  // RAG específico
  ragRequestsCount  Int     @default(0)
  avgRagChunksCount Float?  // Média de chunks por RAG
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Índices
  @@unique([organizationId, siteId, userId, period, periodStart, type, provider, model], name: "ai_metric_unique_idx")
  @@index([organizationId, period, periodStart], name: "ai_metric_org_period_idx")
  @@index([siteId, period, periodStart], name: "ai_metric_site_period_idx")
  @@index([periodStart, periodEnd], name: "ai_metric_period_range_idx")
  @@map("ai_metrics")
}
```

**Justificativas Técnicas:**
1. **Agregação pré-calculada**: Evita queries pesadas em dashboards (performance).
2. **Múltiplos níveis de granularidade**: Por organização, site, usuário.
3. **Percentis**: P50, P95, P99 para análise de performance.
4. **Unique constraint**: Evita duplicatas e permite upsert eficiente.

---

### **2.4. Nova Tabela: `AIPrompt`**

```prisma
model AIPrompt {
  id            String   @id @default(cuid())
  
  // Multi-tenancy
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  siteId        String?
  site          Site?    @relation(fields: [siteId], references: [id], onDelete: Cascade)
  
  // Identificação
  name          String   // Nome do prompt (ex: "content_generation_blog_post")
  slug          String   // Slug único
  description   String?  // Descrição do prompt
  
  // Versionamento
  version       Int      @default(1)
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false) // Versão padrão
  
  // Conteúdo
  prompt        String   // Template do prompt
  variables     String   @default("[]") // JSON array - variáveis disponíveis
  
  // Configurações
  provider      String?  // "openai", "gemini", etc (null = qualquer)
  model         String?  // Modelo recomendado (null = qualquer)
  temperature   Float?   @default(0.7)
  maxTokens     Int?
  
  // Categoria
  category      String   // "content_generation", "rag_query", "diagnostic", "editing", etc
  
  // Metadados
  tags          String?  // Tags separadas por vírgula
  examples      String?  @default("[]") // JSON array - exemplos de uso
  
  // Auditoria
  createdBy     String?  // userId que criou
  updatedBy     String?  // userId que atualizou
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Índices
  @@unique([slug, version], name: "ai_prompt_slug_version_idx")
  @@index([organizationId, siteId, category, isActive], name: "ai_prompt_org_site_category_idx")
  @@index([category, isDefault], name: "ai_prompt_category_default_idx")
  @@map("ai_prompts")
}
```

**Justificativas Técnicas:**
1. **Versionamento**: Permite evoluir prompts sem quebrar funcionalidades existentes.
2. **Multi-tenancy**: Prompts podem ser customizados por organização/site.
3. **Variáveis**: Template system permite reutilização.
4. **Auditoria**: Rastreia quem criou/atualizou.

---

## 3️⃣ ALTERAÇÕES ADITIVAS EM MODELS EXISTENTES

### **3.1. Model `Page` - Adições**

```prisma
model Page {
  // ... campos existentes (NÃO ALTERAR) ...
  
  // NOVOS CAMPOS (aditivos apenas)
  embeddingGeneratedAt DateTime? // Quando o embedding foi gerado
  embeddingModel       String?   // Modelo usado para gerar embedding
  embeddingVersion     Int       @default(1) // Versão do embedding
  
  // NOVOS RELACIONAMENTOS
  embeddings Embedding[]
  aiInteractions AIInteraction[]
  
  // ... resto do model permanece igual ...
}
```

---

### **3.2. Model `AIContent` - Adições**

```prisma
model AIContent {
  // ... campos existentes (NÃO ALTERAR) ...
  
  // NOVOS CAMPOS (aditivos apenas)
  embeddingGeneratedAt DateTime?
  embeddingModel       String?
  embeddingVersion     Int       @default(1)
  
  // NOVOS RELACIONAMENTOS
  embeddings Embedding[]
  aiInteractions AIInteraction[]
  
  // ... resto do model permanece igual ...
}
```

---

### **3.3. Model `Template` - Adições**

```prisma
model Template {
  // ... campos existentes (NÃO ALTERAR) ...
  
  // NOVOS CAMPOS (aditivos apenas)
  embeddingGeneratedAt DateTime?
  embeddingModel       String?
  embeddingVersion     Int       @default(1)
  
  // NOVOS RELACIONAMENTOS
  embeddings Embedding[]
  
  // ... resto do model permanece igual ...
}
```

---

### **3.4. Model `AIContentHistory` - Adições**

```prisma
model AIContentHistory {
  // ... campos existentes (NÃO ALTERAR) ...
  
  // NOVOS CAMPOS (aditivos apenas)
  tokensUsed      Int?    // Tokens usados nesta ação
  costUSD         Float?  // Custo em USD
  durationMs      Int?    // Duração em ms
  modelUsed       String? // Modelo usado
  providerUsed    String? // Provider usado
  
  // NOVO RELACIONAMENTO
  aiInteractionId String?
  aiInteraction   AIInteraction? @relation(fields: [aiInteractionId], references: [id], onDelete: SetNull)
  
  // ... resto do model permanece igual ...
}
```

---

### **3.5. Model `Organization` - Adições**

```prisma
model Organization {
  // ... campos existentes (NÃO ALTERAR) ...
  
  // NOVOS RELACIONAMENTOS
  embeddings Embedding[]
  aiInteractions AIInteraction[]
  aiMetrics AIMetric[]
  aiPrompts AIPrompt[]
  
  // ... resto do model permanece igual ...
}
```

---

### **3.6. Model `Site` - Adições**

```prisma
model Site {
  // ... campos existentes (NÃO ALTERAR) ...
  
  // NOVOS RELACIONAMENTOS
  embeddings Embedding[]
  aiInteractions AIInteraction[]
  aiMetrics AIMetric[]
  aiPrompts AIPrompt[]
  
  // ... resto do model permanece igual ...
}
```

---

### **3.7. Model `User` - Adições**

```prisma
model User {
  // ... campos existentes (NÃO ALTERAR) ...
  
  // NOVOS RELACIONAMENTOS
  aiInteractions AIInteraction[]
  aiMetrics AIMetric[]
  aiPromptsCreated AIPrompt[] @relation("AIPromptCreatedBy")
  aiPromptsUpdated AIPrompt[] @relation("AIPromptUpdatedBy")
  
  // ... resto do model permanece igual ...
}
```

---

## 4️⃣ ÍNDICES E PERFORMANCE

### **4.1. Índice Vetorial (pgvector)**

```sql
-- Índice HNSW para busca semântica (produção)
CREATE INDEX embeddings_embedding_hnsw_idx 
ON embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Parâmetros HNSW:
-- m = 16: Número de conexões bidirecionais (padrão recomendado)
-- ef_construction = 64: Tamanho da lista dinâmica durante construção
```

**Quando usar:**
- ✅ Busca semântica (RAG)
- ✅ Similaridade de conteúdo
- ✅ Recomendações

---

### **4.2. Índices Compostos para Multi-tenancy**

```sql
-- Índice para busca por site + tipo + status
CREATE INDEX embeddings_site_content_active_idx 
ON embeddings (site_id, content_type, is_active)
WHERE is_active = true;

-- Índice para métricas por organização + período
CREATE INDEX ai_metrics_org_period_idx 
ON ai_metrics (organization_id, period, period_start DESC);

-- Índice para interações recentes por site
CREATE INDEX ai_interactions_site_recent_idx 
ON ai_interactions (site_id, created_at DESC)
WHERE status = 'completed';
```

**Justificativas:**
- **Filtros multi-tenancy primeiro**: Garante isolamento antes de busca vetorial.
- **WHERE clauses**: Índices parciais para dados ativos apenas (menor tamanho).
- **DESC**: Para queries de "últimos N" mais rápidas.

---

## 5️⃣ PIPELINE DE EMBEDDINGS

### **5.1. Fluxo de Geração de Embeddings**

```
1. EVENTO DISPARADOR
   ├─ Criação de Page/AIContent/Template
   ├─ Edição de conteúdo existente
   └─ Reindexação manual (admin)

2. VALIDAÇÃO
   ├─ Verificar se conteúdo mudou (contentHash)
   ├─ Verificar se embedding já existe e está atualizado
   └─ Se não mudou → SKIP

3. GERAÇÃO ASSÍNCRONA (QueueJob)
   ├─ Criar QueueJob tipo "generate_embedding"
   ├─ Status: "pending"
   └─ Retornar resposta imediata ao usuário

4. PROCESSAMENTO (Worker)
   ├─ Buscar QueueJob
   ├─ Gerar embedding via OpenAI/Gemini
   ├─ Calcular contentHash
   ├─ Verificar duplicatas
   ├─ Salvar Embedding no banco
   ├─ Atualizar Page/AIContent/Template (embeddingGeneratedAt)
   └─ Marcar QueueJob como "completed"

5. TRATAMENTO DE ERROS
   ├─ Se falhar → retry (até 3x)
   ├─ Se ainda falhar → marcar como "failed"
   └─ Log de erro para debug
```

---

### **5.2. Código: Geração de Embedding**

```typescript
// lib/embedding-service.ts

import { db } from '@/lib/db'
import { QueueJob } from '@prisma/client'
import { AIService } from '@/lib/ai-services'
import crypto from 'crypto'

interface GenerateEmbeddingParams {
  contentType: 'page' | 'ai_content' | 'template'
  contentId: string
  content: string
  siteId: string
  organizationId: string
  language?: string
}

export class EmbeddingService {
  private static readonly EMBEDDING_MODEL = 'text-embedding-ada-002'
  private static readonly EMBEDDING_DIMENSIONS = 1536
  
  /**
   * Gera hash do conteúdo para evitar duplicatas
   */
  private static generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex')
  }
  
  /**
   * Verifica se embedding já existe e está atualizado
   */
  private static async checkExistingEmbedding(
    contentType: string,
    contentId: string,
    contentHash: string
  ): Promise<boolean> {
    const existing = await db.$queryRaw`
      SELECT id FROM embeddings
      WHERE 
        ${contentType}_id = ${contentId}
        AND content_hash = ${contentHash}
        AND is_active = true
      LIMIT 1
    `
    
    return existing.length > 0
  }
  
  /**
   * Gera embedding via OpenAI
   */
  private static async generateEmbeddingVector(
    content: string
  ): Promise<number[]> {
    const aiService = new AIService({
      id: 'embedding-service',
      name: 'Embedding Service',
      type: 'openai',
      status: 'active',
      credentials: {
        apiKey: process.env.OPENAI_API_KEY!,
        endpoint: 'https://api.openai.com/v1'
      },
      settings: {},
      lastUsed: new Date(),
      usage: { requests: 0, tokens: 0, cost: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.EMBEDDING_MODEL,
        input: content
      })
    })
    
    if (!response.ok) {
      throw new Error(`OpenAI embedding error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.data[0].embedding
  }
  
  /**
   * Salva embedding no banco (via SQL raw devido ao pgvector)
   */
  private static async saveEmbedding(
    params: GenerateEmbeddingParams,
    embedding: number[],
    contentHash: string
  ): Promise<string> {
    const embeddingId = crypto.randomUUID()
    
    // Usar SQL raw para inserir vector
    await db.$executeRaw`
      INSERT INTO embeddings (
        id,
        ${params.contentType}_id,
        site_id,
        organization_id,
        embedding,
        model,
        dimensions,
        content_type,
        content_hash,
        language,
        version,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        ${embeddingId}::uuid,
        ${params.contentId}::uuid,
        ${params.siteId}::uuid,
        ${params.organizationId}::uuid,
        ${JSON.stringify(embedding)}::vector,
        ${this.EMBEDDING_MODEL},
        ${this.EMBEDDING_DIMENSIONS},
        ${params.contentType},
        ${contentHash},
        ${params.language || 'pt-BR'},
        1,
        true,
        NOW(),
        NOW()
      )
    `
    
    return embeddingId
  }
  
  /**
   * Método principal: Gera embedding (assíncrono via QueueJob)
   */
  static async generateEmbedding(
    params: GenerateEmbeddingParams
  ): Promise<{ queued: boolean; jobId?: string }> {
    // 1. Validar conteúdo
    if (!params.content || params.content.trim().length === 0) {
      throw new Error('Content is required')
    }
    
    // 2. Gerar hash
    const contentHash = this.generateContentHash(params.content)
    
    // 3. Verificar se já existe
    const exists = await this.checkExistingEmbedding(
      params.contentType,
      params.contentId,
      contentHash
    )
    
    if (exists) {
      return { queued: false }
    }
    
    // 4. Criar QueueJob
    const job = await db.queueJob.create({
      data: {
        type: 'generate_embedding',
        status: 'pending',
        data: JSON.stringify(params),
        maxAttempts: 3
      }
    })
    
    // 5. Processar em background (ou via worker)
    this.processEmbeddingJob(job.id).catch(console.error)
    
    return { queued: true, jobId: job.id }
  }
  
  /**
   * Processa job de embedding (worker)
   */
  private static async processEmbeddingJob(jobId: string): Promise<void> {
    const job = await db.queueJob.findUnique({ where: { id: jobId } })
    
    if (!job || job.status !== 'pending') {
      return
    }
    
    try {
      // Atualizar status
      await db.queueJob.update({
        where: { id: jobId },
        data: { status: 'processing' }
      })
      
      // Parse params
      const params = JSON.parse(job.data) as GenerateEmbeddingParams
      
      // Gerar embedding
      const embedding = await this.generateEmbeddingVector(params.content)
      const contentHash = this.generateContentHash(params.content)
      
      // Salvar
      const embeddingId = await this.saveEmbedding(params, embedding, contentHash)
      
      // Atualizar conteúdo original
      const updateData: any = {
        embeddingGeneratedAt: new Date(),
        embeddingModel: this.EMBEDDING_MODEL,
        embeddingVersion: 1
      }
      
      if (params.contentType === 'page') {
        await db.page.update({
          where: { id: params.contentId },
          data: updateData
        })
      } else if (params.contentType === 'ai_content') {
        await db.aIContent.update({
          where: { id: params.contentId },
          data: updateData
        })
      } else if (params.contentType === 'template') {
        await db.template.update({
          where: { id: params.contentId },
          data: updateData
        })
      }
      
      // Marcar job como completo
      await db.queueJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          result: JSON.stringify({ embeddingId }),
          processedAt: new Date()
        }
      })
      
    } catch (error) {
      // Marcar como falha
      await db.queueJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          attempts: { increment: 1 }
        }
      })
      
      // Retry se ainda tiver tentativas
      const updatedJob = await db.queueJob.findUnique({ where: { id: jobId } })
      if (updatedJob && updatedJob.attempts < updatedJob.maxAttempts) {
        // Reagendar (exemplo: após 5 minutos)
        setTimeout(() => {
          this.processEmbeddingJob(jobId).catch(console.error)
        }, 5 * 60 * 1000)
      }
    }
  }
}
```

---

### **5.3. Reindexação**

```typescript
// lib/embedding-reindex-service.ts

export class EmbeddingReindexService {
  /**
   * Reindexa todos os conteúdos de um site
   */
  static async reindexSite(siteId: string): Promise<{ queued: number }> {
    // Buscar todas as páginas
    const pages = await db.page.findMany({
      where: { siteId },
      select: { id: true, content: true }
    })
    
    // Buscar todos os conteúdos IA
    const aiContents = await db.aIContent.findMany({
      where: { siteId },
      select: { id: true, content: true }
    })
    
    // Buscar todos os templates
    const templates = await db.template.findMany({
      select: { id: true, content: true }
    })
    
    let queued = 0
    
    // Gerar embeddings para páginas
    for (const page of pages) {
      if (page.content) {
        await EmbeddingService.generateEmbedding({
          contentType: 'page',
          contentId: page.id,
          content: page.content,
          siteId,
          organizationId: (await db.site.findUnique({ where: { id: siteId } }))!.organizationId
        })
        queued++
      }
    }
    
    // Gerar embeddings para conteúdos IA
    for (const content of aiContents) {
      if (content.content) {
        await EmbeddingService.generateEmbedding({
          contentType: 'ai_content',
          contentId: content.id,
          content: content.content,
          siteId,
          organizationId: (await db.site.findUnique({ where: { id: siteId } }))!.organizationId
        })
        queued++
      }
    }
    
    // Gerar embeddings para templates
    for (const template of templates) {
      if (template.content) {
        const site = await db.site.findFirst({ where: { id: siteId } })
        if (site) {
          await EmbeddingService.generateEmbedding({
            contentType: 'template',
            contentId: template.id,
            content: template.content,
            siteId,
            organizationId: site.organizationId
          })
          queued++
        }
      }
    }
    
    return { queued }
  }
}
```

---

## 6️⃣ FLUXO RAG (PASSO A PASSO)

### **6.1. Diagrama de Fluxo**

```
┌─────────────┐
│   Usuário   │
│   Pergunta  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ 1. Identificar      │
│    Contexto          │
│  - siteId           │
│  - organizationId   │
│  - language         │
│  - contentType      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 2. Gerar Embedding  │
│    da Pergunta      │
│  (OpenAI ada-002)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 3. Busca Semântica  │
│    (pgvector)       │
│  - Similarity > 0.7 │
│  - Filtro siteId    │
│  - Limite: 5 chunks │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 4. Montar Contexto  │
│  - Ordenar por      │
│    similaridade     │
│  - Adicionar        │
│    metadados        │
│  - Limitar tokens   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 5. Chamar IA        │
│  - OpenAI/Gemini    │
│  - Prompt + Contexto │
│  - Rastrear tokens   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 6. Persistir        │
│  - AIInteraction    │
│  - Métricas         │
│  - Resposta         │
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│  Resposta   │
│  ao Usuário │
└─────────────┘
```

---

### **6.2. Código: Serviço RAG**

```typescript
// lib/rag-service.ts

import { db } from '@/lib/db'
import { EmbeddingService } from './embedding-service'
import { AIService } from './ai-services'

interface RAGQueryParams {
  query: string
  siteId: string
  organizationId: string
  userId?: string
  language?: string
  contentType?: 'page' | 'ai_content' | 'template' | 'all'
  maxChunks?: number
  similarityThreshold?: number
  provider?: 'openai' | 'gemini'
  model?: string
}

interface RAGResponse {
  answer: string
  chunks: Array<{
    id: string
    contentType: string
    contentId: string
    content: string
    similarity: number
  }>
  metrics: {
    tokensUsed: number
    costUSD: number
    durationMs: number
  }
}

export class RAGService {
  /**
   * Executa query RAG completa
   */
  static async query(params: RAGQueryParams): Promise<RAGResponse> {
    const startTime = Date.now()
    
    // 1. Gerar embedding da pergunta
    const queryEmbedding = await EmbeddingService.generateEmbeddingVector(params.query)
    
    // 2. Busca semântica no pgvector
    const chunks = await this.semanticSearch({
      queryEmbedding,
      siteId: params.siteId,
      organizationId: params.organizationId,
      contentType: params.contentType || 'all',
      maxChunks: params.maxChunks || 5,
      similarityThreshold: params.similarityThreshold || 0.7
    })
    
    // 3. Montar contexto
    const context = this.buildContext(chunks)
    
    // 4. Chamar IA
    const aiResponse = await this.callAI({
      query: params.query,
      context,
      provider: params.provider || 'openai',
      model: params.model
    })
    
    // 5. Persistir interação
    const interaction = await db.aiInteraction.create({
      data: {
        organizationId: params.organizationId,
        siteId: params.siteId,
        userId: params.userId,
        type: 'rag_query',
        status: 'completed',
        prompt: params.query,
        provider: aiResponse.provider,
        model: aiResponse.model,
        response: aiResponse.answer,
        promptTokens: aiResponse.usage.promptTokens,
        completionTokens: aiResponse.usage.completionTokens,
        totalTokens: aiResponse.usage.totalTokens,
        costUSD: aiResponse.usage.costUSD,
        durationMs: Date.now() - startTime,
        ragUsed: true,
        ragChunksCount: chunks.length,
        ragSimilarityThreshold: params.similarityThreshold || 0.7,
        completedAt: new Date()
      }
    })
    
    return {
      answer: aiResponse.answer,
      chunks: chunks.map(c => ({
        id: c.id,
        contentType: c.contentType,
        contentId: c.contentId,
        content: c.content,
        similarity: c.similarity
      })),
      metrics: {
        tokensUsed: aiResponse.usage.totalTokens,
        costUSD: aiResponse.usage.costUSD,
        durationMs: Date.now() - startTime
      }
    }
  }
  
  /**
   * Busca semântica usando pgvector
   */
  private static async semanticSearch(params: {
    queryEmbedding: number[]
    siteId: string
    organizationId: string
    contentType: string
    maxChunks: number
    similarityThreshold: number
  }): Promise<Array<{
    id: string
    contentType: string
    contentId: string
    content: string
    similarity: number
  }>> {
    // SQL raw para busca vetorial
    const contentTypeFilter = params.contentType === 'all' 
      ? '' 
      : `AND content_type = '${params.contentType}'`
    
    const results = await db.$queryRaw<Array<{
      id: string
      content_type: string
      page_id: string | null
      ai_content_id: string | null
      template_id: string | null
      similarity: number
    }>>`
      SELECT 
        e.id,
        e.content_type,
        e.page_id,
        e.ai_content_id,
        e.template_id,
        1 - (e.embedding <=> ${JSON.stringify(params.queryEmbedding)}::vector) as similarity
      FROM embeddings e
      WHERE 
        e.site_id = ${params.siteId}::uuid
        AND e.organization_id = ${params.organizationId}::uuid
        AND e.is_active = true
        ${contentTypeFilter}
      ORDER BY e.embedding <=> ${JSON.stringify(params.queryEmbedding)}::vector
      LIMIT ${params.maxChunks}
    `
    
    // Filtrar por threshold e buscar conteúdo
    const chunks = []
    for (const result of results) {
      if (result.similarity >= params.similarityThreshold) {
        // Buscar conteúdo original
        let content = ''
        let contentId = ''
        
        if (result.page_id) {
          const page = await db.page.findUnique({
            where: { id: result.page_id },
            select: { content: true }
          })
          content = page?.content || ''
          contentId = result.page_id
        } else if (result.ai_content_id) {
          const aiContent = await db.aIContent.findUnique({
            where: { id: result.ai_content_id },
            select: { content: true }
          })
          content = aiContent?.content || ''
          contentId = result.ai_content_id
        } else if (result.template_id) {
          const template = await db.template.findUnique({
            where: { id: result.template_id },
            select: { content: true }
          })
          content = template?.content || ''
          contentId = result.template_id
        }
        
        if (content) {
          chunks.push({
            id: result.id,
            contentType: result.content_type,
            contentId,
            content,
            similarity: result.similarity
          })
        }
      }
    }
    
    return chunks
  }
  
  /**
   * Monta contexto para a IA
   */
  private static buildContext(chunks: Array<{ content: string; similarity: number }>): string {
    const contextParts = chunks
      .sort((a, b) => b.similarity - a.similarity)
      .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
      .join('\n\n')
    
    return `Contexto relevante encontrado:\n\n${contextParts}`
  }
  
  /**
   * Chama IA com contexto
   */
  private static async callAI(params: {
    query: string
    context: string
    provider: 'openai' | 'gemini'
    model?: string
  }): Promise<{
    answer: string
    provider: string
    model: string
    usage: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
      costUSD: number
    }
  }> {
    const prompt = `Com base no contexto fornecido abaixo, responda à pergunta do usuário de forma precisa e útil.

${params.context}

Pergunta do usuário: ${params.query}

Resposta:`
    
    const aiService = new AIService({
      id: 'rag-service',
      name: 'RAG Service',
      type: params.provider,
      status: 'active',
      credentials: {
        apiKey: params.provider === 'openai' 
          ? process.env.OPENAI_API_KEY!
          : process.env.GOOGLE_API_KEY!,
        endpoint: params.provider === 'openai'
          ? 'https://api.openai.com/v1'
          : 'https://generativelanguage.googleapis.com/v1beta'
      },
      settings: {},
      lastUsed: new Date(),
      usage: { requests: 0, tokens: 0, cost: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    const response = await aiService.generateContent({
      prompt,
      model: params.model || (params.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.0-flash'),
      maxTokens: 2000,
      temperature: 0.7,
      type: 'text'
    })
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'AI generation failed')
    }
    
    return {
      answer: response.data.content,
      provider: params.provider,
      model: response.data.model,
      usage: {
        promptTokens: response.usage?.promptTokens || 0,
        completionTokens: response.usage?.completionTokens || 0,
        totalTokens: response.usage?.totalTokens || 0,
        costUSD: response.usage?.cost || 0
      }
    }
  }
}
```

---

## 7️⃣ ORQUESTRAÇÃO DE IA EVOLUÍDA

### **7.1. Evolução do AIOrchestrator**

```typescript
// lib/ai-orchestrator-v2.ts

import { db } from '@/lib/db'
import { AIService } from './ai-services'

interface AIOrchestratorRequest {
  type: 'rag_query' | 'content_generation' | 'editing_review' | 'multimodal' | 'wordpress_diagnostic'
  prompt: string
  context?: any
  siteId: string
  organizationId: string
  userId?: string
  priority?: 'low' | 'medium' | 'high'
  multimodal?: boolean
  maxTokens?: number
  temperature?: number
  preferredProvider?: 'openai' | 'gemini'
}

interface AIOrchestratorResponse {
  model: string
  provider: string
  content: string
  interactionId: string
  usage: {
    tokens: number
    costUSD: number
    durationMs: number
  }
  metadata: {
    fallbackUsed: boolean
    decisionReason: string
  }
}

export class AIOrchestratorV2 {
  /**
   * Seleciona modelo baseado em regras + histórico
   */
  private async selectModel(request: AIOrchestratorRequest): Promise<{
    provider: 'openai' | 'gemini'
    model: string
    reason: string
  }> {
    // 1. Verificar preferência do usuário
    if (request.preferredProvider) {
      return {
        provider: request.preferredProvider,
        model: request.preferredProvider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.0-flash',
        reason: 'user_preference'
      }
    }
    
    // 2. Verificar histórico de sucesso por tipo
    const recentInteractions = await db.aiInteraction.findMany({
      where: {
        organizationId: request.organizationId,
        type: request.type,
        status: 'completed',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    // Calcular taxa de sucesso por provider
    const openaiSuccess = recentInteractions
      .filter(i => i.provider === 'openai')
      .reduce((acc, i) => acc + (i.status === 'completed' ? 1 : 0), 0) / 
      Math.max(recentInteractions.filter(i => i.provider === 'openai').length, 1)
    
    const geminiSuccess = recentInteractions
      .filter(i => i.provider === 'gemini')
      .reduce((acc, i) => acc + (i.status === 'completed' ? 1 : 0), 0) / 
      Math.max(recentInteractions.filter(i => i.provider === 'gemini').length, 1)
    
    // 3. Regras específicas por tipo
    if (request.type === 'multimodal' || request.multimodal) {
      return {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        reason: 'multimodal_required'
      }
    }
    
    if (request.type === 'wordpress_diagnostic' || request.priority === 'high') {
      return {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        reason: 'complex_task'
      }
    }
    
    // 4. Decisão baseada em custo + performance
    if (request.priority === 'low' || request.type === 'content_generation') {
      return {
        provider: 'openai',
        model: 'gpt-4o-mini',
        reason: 'cost_optimization'
      }
    }
    
    // 5. Default: melhor taxa de sucesso recente
    if (geminiSuccess > openaiSuccess + 0.1) {
      return {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        reason: 'better_success_rate'
      }
    }
    
    return {
      provider: 'openai',
      model: 'gpt-4o-mini',
      reason: 'default'
    }
  }
  
  /**
   * Processa requisição com fallback automático
   */
  async processRequest(request: AIOrchestratorRequest): Promise<AIOrchestratorResponse> {
    const startTime = Date.now()
    
    // Criar interação inicial
    const interaction = await db.aiInteraction.create({
      data: {
        organizationId: request.organizationId,
        siteId: request.siteId,
        userId: request.userId,
        type: request.type,
        status: 'processing',
        prompt: request.prompt,
        context: JSON.stringify(request.context || {}),
        createdAt: new Date()
      }
    })
    
    // Selecionar modelo
    const modelSelection = await this.selectModel(request)
    
    let response: AIOrchestratorResponse | null = null
    let fallbackUsed = false
    
    try {
      // Tentar com modelo selecionado
      response = await this.callAI({
        ...request,
        provider: modelSelection.provider,
        model: modelSelection.model,
        interactionId: interaction.id
      })
      
      // Atualizar interação
      await db.aiInteraction.update({
        where: { id: interaction.id },
        data: {
          status: 'completed',
          provider: modelSelection.provider,
          model: modelSelection.model,
          response: response.content,
          promptTokens: response.usage.tokens,
          totalTokens: response.usage.tokens,
          costUSD: response.usage.costUSD,
          durationMs: response.usage.durationMs,
          completedAt: new Date()
        }
      })
      
    } catch (error) {
      // Fallback: tentar com outro provider
      const fallbackProvider = modelSelection.provider === 'openai' ? 'gemini' : 'openai'
      const fallbackModel = fallbackProvider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.0-flash'
      
      try {
        response = await this.callAI({
          ...request,
          provider: fallbackProvider,
          model: fallbackModel,
          interactionId: interaction.id
        })
        
        fallbackUsed = true
        
        // Atualizar interação com fallback
        await db.aiInteraction.update({
          where: { id: interaction.id },
          data: {
            status: 'completed',
            provider: fallbackProvider,
            model: fallbackModel,
            response: response.content,
            promptTokens: response.usage.tokens,
            totalTokens: response.usage.tokens,
            costUSD: response.usage.costUSD,
            durationMs: response.usage.durationMs,
            completedAt: new Date(),
            errorMessage: `Fallback used: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        })
        
      } catch (fallbackError) {
        // Ambos falharam
        await db.aiInteraction.update({
          where: { id: interaction.id },
          data: {
            status: 'failed',
            errorMessage: `Both providers failed. Original: ${error instanceof Error ? error.message : 'Unknown'}. Fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`,
            errorCode: 'BOTH_PROVIDERS_FAILED'
          }
        })
        
        throw new Error('All AI providers failed')
      }
    }
    
    return {
      ...response!,
      interactionId: interaction.id,
      metadata: {
        fallbackUsed,
        decisionReason: modelSelection.reason
      }
    }
  }
  
  /**
   * Chama IA e rastreia métricas
   */
  private async callAI(params: AIOrchestratorRequest & {
    provider: 'openai' | 'gemini'
    model: string
    interactionId: string
  }): Promise<AIOrchestratorResponse> {
    const startTime = Date.now()
    
    const aiService = new AIService({
      id: 'orchestrator',
      name: 'AI Orchestrator',
      type: params.provider,
      status: 'active',
      credentials: {
        apiKey: params.provider === 'openai'
          ? process.env.OPENAI_API_KEY!
          : process.env.GOOGLE_API_KEY!,
        endpoint: params.provider === 'openai'
          ? 'https://api.openai.com/v1'
          : 'https://generativelanguage.googleapis.com/v1beta'
      },
      settings: {},
      lastUsed: new Date(),
      usage: { requests: 0, tokens: 0, cost: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    const aiResponse = await aiService.generateContent({
      prompt: params.prompt,
      model: params.model,
      maxTokens: params.maxTokens || 2000,
      temperature: params.temperature || 0.7,
      type: 'text'
    })
    
    if (!aiResponse.success || !aiResponse.data) {
      throw new Error(aiResponse.error || 'AI generation failed')
    }
    
    const durationMs = Date.now() - startTime
    
    return {
      model: params.model,
      provider: params.provider,
      content: aiResponse.data.content,
      interactionId: params.interactionId,
      usage: {
        tokens: aiResponse.usage?.totalTokens || 0,
        costUSD: aiResponse.usage?.cost || 0,
        durationMs
      },
      metadata: {
        fallbackUsed: false,
        decisionReason: ''
      }
    }
  }
}
```

---

## 8️⃣ SEGURANÇA E MULTI-TENANCY

### **8.1. Garantias de Isolamento**

#### **Filtros Obrigatórios em Todas as Queries**

```typescript
// Exemplo: Busca semântica SEMPRE filtra por organizationId e siteId
const results = await db.$queryRaw`
  SELECT * FROM embeddings
  WHERE 
    organization_id = ${organizationId}::uuid  -- ✅ OBRIGATÓRIO
    AND site_id = ${siteId}::uuid              -- ✅ OBRIGATÓRIO
    AND is_active = true
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 10
`
```

#### **Middleware de Validação**

```typescript
// lib/middleware/tenant-validation.ts

export function validateTenantAccess(
  userId: string,
  organizationId: string,
  siteId?: string
): Promise<boolean> {
  // Verificar se usuário pertence à organização
  // Verificar se site pertence à organização (se siteId fornecido)
  // Retornar true apenas se ambos válidos
}
```

---

### **8.2. Prompts Customizados por Site**

```typescript
// Buscar prompt customizado do site, ou usar padrão
const prompt = await db.aiPrompt.findFirst({
  where: {
    siteId: siteId,
    category: 'content_generation',
    isActive: true,
    isDefault: true
  },
  orderBy: { version: 'desc' }
}) || await db.aiPrompt.findFirst({
  where: {
    organizationId: organizationId,
    siteId: null, // Prompt global da organização
    category: 'content_generation',
    isActive: true,
    isDefault: true
  },
  orderBy: { version: 'desc' }
}) || await db.aiPrompt.findFirst({
  where: {
    organizationId: null, // Prompt global do sistema
    siteId: null,
    category: 'content_generation',
    isActive: true,
    isDefault: true
  },
  orderBy: { version: 'desc' }
})
```

**Hierarquia de Prompts:**
1. Site específico (mais específico)
2. Organização (médio)
3. Sistema (padrão)

---

## 9️⃣ CHECKLIST EXECUTÁVEL

### **9.1. Backend**

- [ ] **Instalar dependências**
  ```bash
  npm install @prisma/client
  # pgvector será gerenciado via SQL, não precisa de pacote npm
  ```

- [ ] **Criar migrations Prisma**
  ```bash
  npx prisma migrate dev --name add_ai_native_tables
  ```

- [ ] **Executar SQL de pgvector**
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

- [ ] **Criar índices vetoriais**
  ```sql
  CREATE INDEX embeddings_embedding_hnsw_idx ON embeddings USING hnsw (embedding vector_cosine_ops);
  ```

- [ ] **Implementar EmbeddingService**
  - [ ] `lib/embedding-service.ts`
  - [ ] Geração de embeddings
  - [ ] Verificação de duplicatas
  - [ ] Integração com QueueJob

- [ ] **Implementar RAGService**
  - [ ] `lib/rag-service.ts`
  - [ ] Busca semântica
  - [ ] Montagem de contexto
  - [ ] Chamada de IA

- [ ] **Evoluir AIOrchestrator**
  - [ ] `lib/ai-orchestrator-v2.ts`
  - [ ] Seleção de modelo baseada em histórico
  - [ ] Fallback automático
  - [ ] Persistência de decisões

- [ ] **Criar endpoints de API**
  - [ ] `POST /api/rag/query` - Query RAG
  - [ ] `POST /api/embeddings/generate` - Gerar embedding
  - [ ] `POST /api/embeddings/reindex` - Reindexar site
  - [ ] `GET /api/ai-interactions` - Listar interações
  - [ ] `GET /api/ai-metrics` - Métricas agregadas

---

### **9.2. Banco de Dados**

- [ ] **Habilitar extensão pgvector**
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

- [ ] **Executar migrations**
  ```bash
  npx prisma migrate deploy
  ```

- [ ] **Criar índices vetoriais**
  ```sql
  -- HNSW para produção
  CREATE INDEX embeddings_embedding_hnsw_idx 
  ON embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
  ```

- [ ] **Criar índices compostos**
  ```sql
  CREATE INDEX embeddings_site_content_active_idx 
  ON embeddings (site_id, content_type, is_active)
  WHERE is_active = true;
  ```

- [ ] **Validar índices**
  ```sql
  SELECT * FROM pg_indexes WHERE tablename = 'embeddings';
  ```

---

### **9.3. IA**

- [ ] **Configurar chaves de API**
  - [ ] OpenAI API Key
  - [ ] Google Gemini API Key

- [ ] **Testar geração de embeddings**
  ```typescript
  const embedding = await EmbeddingService.generateEmbeddingVector('test content')
  console.log('Embedding dimensions:', embedding.length)
  ```

- [ ] **Testar busca semântica**
  ```typescript
  const results = await RAGService.query({
    query: 'Como criar conteúdo?',
    siteId: '...',
    organizationId: '...'
  })
  ```

- [ ] **Validar custos**
  - [ ] Verificar custo por embedding
  - [ ] Verificar custo por query RAG
  - [ ] Configurar alertas de limite

---

### **9.4. WordPress**

- [ ] **Reindexar conteúdo WordPress existente**
  ```typescript
  await EmbeddingReindexService.reindexSite(siteId)
  ```

- [ ] **Configurar webhook para novos conteúdos**
  - [ ] Quando novo post criado → gerar embedding
  - [ ] Quando post atualizado → atualizar embedding

---

### **9.5. Produção**

- [ ] **Backup antes de deploy**
  ```bash
  pg_dump -h localhost -U user -d cms_modern > backup_before_ai_native.sql
  ```

- [ ] **Deploy em staging primeiro**
  - [ ] Testar todas as funcionalidades
  - [ ] Validar performance
  - [ ] Validar custos

- [ ] **Monitorar métricas**
  - [ ] Tokens usados
  - [ ] Custos
  - [ ] Performance de busca semântica
  - [ ] Taxa de erro

- [ ] **Configurar alertas**
  - [ ] Custo diário > limite
  - [ ] Taxa de erro > threshold
  - [ ] Performance degradada

---

## 🔟 RESUMO TÉCNICO

### **O Que Foi Adicionado:**

1. **4 novas tabelas:**
   - `Embedding` - Armazena vetores de conteúdo
   - `AIInteraction` - Rastreia todas as interações com IA
   - `AIMetric` - Métricas agregadas
   - `AIPrompt` - Prompts versionados

2. **Campos aditivos em tabelas existentes:**
   - `Page`, `AIContent`, `Template`: campos de embedding
   - `AIContentHistory`: métricas de IA

3. **Novos serviços:**
   - `EmbeddingService` - Geração de embeddings
   - `RAGService` - Busca semântica e RAG
   - `AIOrchestratorV2` - Orquestração evoluída

4. **Infraestrutura:**
   - pgvector habilitado
   - Índices HNSW para busca rápida
   - Índices compostos para multi-tenancy

### **Compatibilidade:**

- ✅ **100% backward compatible**
- ✅ **Nenhuma tabela removida**
- ✅ **Nenhum campo alterado**
- ✅ **Apenas adições**

### **Próximos Passos:**

1. Executar migrations
2. Implementar serviços
3. Testar em staging
4. Deploy em produção
5. Monitorar métricas

---

**Data de Criação:** Janeiro 2025  
**Status:** ✅ Plano Técnico Completo e Executável









