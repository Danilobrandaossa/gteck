# 🧠 FASE 4 - PIPELINE DE EMBEDDINGS

**Data:** Janeiro 2025  
**Fase:** 4/8 - Pipeline de Embeddings  
**Status:** ✅ Completo

---

## 📋 OBJETIVO DA FASE

Implementar um pipeline completo, seguro e escalável de geração de embeddings, totalmente compatível com:
- ✅ Arquitetura multi-tenant (organizationId + siteId)
- ✅ Banco PostgreSQL + pgvector (FASE 3)
- ✅ Helpers de segurança (safeQueryRaw, safeVectorSearch)
- ✅ Múltiplos provedores de IA (OpenAI, Gemini, futuros)
- ✅ Preparação total para RAG (FASE 5)

⚠️ **Esta fase NÃO implementa RAG nem respostas com IA.**
Ela é exclusivamente estrutural e de pipeline.

---

## ✅ IMPLEMENTAÇÕES REALIZADAS

### **1️⃣ EMBEDDING PROVIDERS**

#### **Arquivo:** `lib/embedding-providers.ts`

**Interface Criada:**
```typescript
interface EmbeddingProvider {
  name: 'openai' | 'gemini' | 'cohere' | 'huggingface'
  model: string
  dimensions: number
  maxTokens: number
  generateEmbedding(text: string): Promise<EmbeddingResult>
  calculateCost(tokens: number): number
}
```

**Providers Implementados:**

1. **OpenAIEmbeddingProvider**
   - Modelos: `text-embedding-ada-002`, `text-embedding-3-small`, `text-embedding-3-large`
   - Dimensões: 1536 (ada-002, 3-small) ou 3072 (3-large)
   - Custo: $0.10 por 1M tokens (ada-002)

2. **GeminiEmbeddingProvider**
   - Modelos: `embedding-001`, `text-embedding-004`
   - Dimensões: 768
   - Custo: Gratuito (verificar documentação atualizada)

**Factory Function:**
```typescript
createEmbeddingProvider(provider, apiKey, model?, dimensions?)
```

**Status:** ✅ **COMPLETO**

---

### **2️⃣ EMBEDDING SERVICE**

#### **Arquivo:** `lib/embedding-service.ts`

**Métodos Principais:**

1. **`enqueueEmbeddingJob()`**
   - Valida contexto de tenant
   - Calcula contentHash
   - Verifica duplicatas
   - Cria QueueJob
   - Retorna jobId imediatamente

2. **`processEmbeddingJob()`**
   - Processa job assíncrono
   - Gera embedding via provider
   - Desativa embeddings antigos (versionamento)
   - Salva embedding no banco (pgvector)
   - Atualiza metadados do source
   - Registra auditoria completa

3. **`reindexContent()`**
   - Busca conteúdos para reindexar
   - Enfileira jobs para cada conteúdo
   - Retorna lista de jobIds

4. **`disableOldEmbeddings()`**
   - Desativa embeddings antigos
   - Mantém histórico (não deleta)
   - Garante apenas um embedding ativo por source

**Garantias de Segurança:**
- ✅ Sempre usa `safeQueryRaw` / `safeExecuteRaw`
- ✅ Valida `organizationId` + `siteId` em todas as operações
- ✅ Nunca acessa banco diretamente

**Status:** ✅ **COMPLETO**

---

### **3️⃣ PIPELINE ASSÍNCRONO**

#### **Arquivo:** `lib/embedding-worker.ts`

**Classe:** `EmbeddingWorker`

**Funcionalidades:**

1. **Processamento em Lote**
   - Busca jobs pendentes
   - Processa em paralelo (limitado por `maxConcurrent`)
   - Polling configurável

2. **Retry com Backoff**
   - Tentativas: 3 (configurável)
   - Backoff: 1s, 5s, 30s (configurável)
   - Retry automático em caso de falha

3. **Dead-Letter Queue**
   - Jobs que falharam após maxAttempts
   - Logs estruturados
   - Não bloqueia processamento de outros jobs

4. **Observabilidade**
   - Logs estruturados com:
     - jobId
     - organizationId
     - siteId
     - provider
     - model
     - duration
     - status

**Configuração:**
```typescript
{
  batchSize: 10,
  pollInterval: 5000, // 5 segundos
  maxConcurrent: 3,
  retryBackoff: [1000, 5000, 30000]
}
```

**Status:** ✅ **COMPLETO**

---

### **4️⃣ DEDUPLICAÇÃO E VERSIONAMENTO**

#### **Deduplicação:**

**Mecanismo:**
- `contentHash` (SHA-256) calculado do conteúdo
- Verificação antes de gerar embedding
- Se existe embedding ativo com mesmo hash → skip

**Código:**
```typescript
const contentHash = EmbeddingService.calculateContentHash(content)
const existing = await findExistingEmbedding(organizationId, siteId, contentHash, provider, model)
if (existing) return existing.id // Skip
```

#### **Versionamento:**

**Mecanismo:**
- Antes de criar novo embedding, desativa antigos
- `isActive = false` (não deleta)
- `version` incrementa no source
- Histórico completo mantido

**Código:**
```typescript
await disableOldEmbeddings(organizationId, siteId, sourceType, sourceId)
// Depois cria novo embedding com version = 1
```

**Status:** ✅ **COMPLETO**

---

### **5️⃣ REGISTRO E AUDITORIA COMPLETA**

#### **Tabela:** `ai_interactions`

**Campos Registrados:**
- ✅ `organizationId`, `siteId`, `userId`
- ✅ `type`: 'embedding_generation'
- ✅ `status`: 'completed' | 'failed'
- ✅ `provider`, `model`
- ✅ `promptTokens`, `totalTokens`
- ✅ `costUSD`
- ✅ `durationMs`
- ✅ `errorMessage` (se falhou)

**Registro Automático:**
- Sucesso: após salvar embedding
- Erro: após falha no processamento
- Não bloqueia job se auditoria falhar

**Status:** ✅ **COMPLETO**

---

### **6️⃣ SEGURANÇA E ISOLAMENTO**

#### **Garantias Implementadas:**

1. **Validação de Tenant**
   - `validateTenantContext()` em todas as operações
   - `validateSiteBelongsToOrganization()` antes de queries

2. **Helpers Seguros**
   - `safeQueryRaw()` para SELECT
   - `safeExecuteRaw()` para UPDATE/DELETE
   - `safeVectorSearch()` para busca vetorial (FASE 5)

3. **Nunca SQL Raw Direto**
   - Todas as queries usam helpers
   - Filtros de tenant sempre aplicados
   - Impossível bypassar isolamento

**Status:** ✅ **COMPLETO**

---

### **7️⃣ REINDEXAÇÃO SEGURA**

#### **Fluxo:**

1. **Buscar Conteúdos**
   - Por `sourceType` (opcional)
   - Por `sourceId` (opcional)
   - Filtrado por `organizationId` + `siteId`

2. **Enfileirar Jobs**
   - Um job por conteúdo
   - Assíncrono (não bloqueia)
   - Retorna lista de jobIds

3. **Processamento Incremental**
   - Jobs processados em background
   - Sem downtime
   - Embeddings antigos permanecem até novos serem criados

**Status:** ✅ **COMPLETO**

---

### **8️⃣ OBSERVABILIDADE**

#### **Logs Estruturados:**

**Formato:**
```json
{
  "timestamp": "2025-01-XX...",
  "level": "info|error|warn",
  "message": "[EmbeddingService] Job enqueued",
  "jobId": "...",
  "organizationId": "...",
  "siteId": "...",
  "sourceType": "page",
  "sourceId": "...",
  "contentHash": "...",
  "provider": "openai",
  "model": "text-embedding-ada-002",
  "duration": 1234
}
```

**Pontos de Log:**
- ✅ Início do job
- ✅ Sucesso
- ✅ Erro
- ✅ Retry
- ✅ DLQ

**Status:** ✅ **COMPLETO**

---

## 📄 ARQUIVOS CRIADOS

1. ✅ `lib/embedding-providers.ts` - Interface e implementações de providers
2. ✅ `lib/embedding-service.ts` - Serviço principal de embeddings
3. ✅ `lib/embedding-worker.ts` - Worker para processar jobs
4. ✅ `app/api/embeddings/generate/route.ts` - Endpoint para gerar embedding
5. ✅ `app/api/embeddings/reindex/route.ts` - Endpoint para reindexar

---

## 🔒 GARANTIAS DE SEGURANÇA

### **Multi-tenancy:**

- ✅ Todas as operações validam `organizationId` + `siteId`
- ✅ Nenhuma query sem filtros de tenant
- ✅ Impossível vazamento de dados entre tenants

### **Auditoria:**

- ✅ Todas as gerações são registradas
- ✅ Custos rastreados
- ✅ Erros logados

### **Performance:**

- ✅ Processamento assíncrono (não bloqueia API)
- ✅ Retry com backoff (evita sobrecarga)
- ✅ Processamento em paralelo (limitado)

---

## 🧪 EXEMPLOS DE USO

### **1. Enfileirar Geração de Embedding:**

```typescript
const jobId = await EmbeddingService.enqueueEmbeddingJob({
  organizationId: 'org-123',
  siteId: 'site-456',
  sourceType: 'page',
  sourceId: 'page-789',
  content: 'Conteúdo da página...',
  language: 'pt-BR',
  provider: 'openai',
  model: 'text-embedding-ada-002'
})
```

### **2. Processar Job (Worker):**

```typescript
const worker = new EmbeddingWorker({
  batchSize: 10,
  pollInterval: 5000,
  maxConcurrent: 3
})

await worker.start() // Loop infinito
```

### **3. Reindexar Conteúdo:**

```typescript
const jobIds = await EmbeddingService.reindexContent({
  organizationId: 'org-123',
  siteId: 'site-456',
  sourceType: 'page', // Opcional
  provider: 'openai',
  model: 'text-embedding-ada-002'
})
```

---

## 📋 CHECKLIST DE CONCLUSÃO

### **Providers**
- [x] Interface EmbeddingProvider criada
- [x] OpenAIEmbeddingProvider implementado
- [x] GeminiEmbeddingProvider implementado
- [x] Factory function criada

### **Service**
- [x] EmbeddingService criado
- [x] enqueueEmbeddingJob() implementado
- [x] processEmbeddingJob() implementado
- [x] reindexContent() implementado
- [x] disableOldEmbeddings() implementado

### **Pipeline Assíncrono**
- [x] EmbeddingWorker criado
- [x] Processamento em lote
- [x] Retry com backoff
- [x] Dead-letter queue

### **Deduplicação e Versionamento**
- [x] contentHash implementado
- [x] Verificação de duplicatas
- [x] Desativação de embeddings antigos
- [x] Versionamento no source

### **Auditoria**
- [x] Registro em ai_interactions
- [x] Tokens rastreados
- [x] Custos rastreados
- [x] Erros logados

### **Segurança**
- [x] Validação de tenant em todas as operações
- [x] Uso de helpers seguros
- [x] Nenhum SQL raw direto

### **Reindexação**
- [x] Busca de conteúdos
- [x] Enfileiramento assíncrono
- [x] Processamento incremental

### **Observabilidade**
- [x] Logs estruturados
- [x] Pontos de log definidos
- [x] Informações de contexto incluídas

---

## 🚀 PRÓXIMOS PASSOS

### **Para Executar o Worker:**

```typescript
// Criar arquivo: scripts/embedding-worker.ts
import { getEmbeddingWorker } from '@/lib/embedding-worker'

const worker = getEmbeddingWorker({
  batchSize: 10,
  pollInterval: 5000,
  maxConcurrent: 3
})

worker.start()
```

### **Para Executar via Cron:**

```typescript
// Criar arquivo: app/api/cron/embeddings/route.ts
import { getEmbeddingWorker } from '@/lib/embedding-worker'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const worker = getEmbeddingWorker()
  const result = await worker.processAllPending()
  
  return Response.json(result)
}
```

---

## ✅ CONCLUSÃO DA FASE 4

### **Implementações Concluídas**
1. ✅ Interface e providers de embeddings
2. ✅ EmbeddingService completo
3. ✅ Pipeline assíncrono com worker
4. ✅ Deduplicação e versionamento
5. ✅ Auditoria completa
6. ✅ Segurança multi-tenant garantida
7. ✅ Reindexação segura
8. ✅ Observabilidade completa

### **Garantias Estabelecidas**
- ✅ **Preparado para milhares de embeddings**
- ✅ **Seguro para múltiplos tenants**
- ✅ **Auditável (custos + uso)**
- ✅ **Provider-agnostic**
- ✅ **Pronto para FASE 5 (RAG + Chat IA)**

### **Próxima Fase**
**FASE 5 - RAG (Retrieval Augmented Generation)**
- Busca semântica usando embeddings
- Montagem de contexto
- Geração de respostas com IA
- Integração completa com chat

---

**Status:** ✅ FASE 4 COMPLETA  
**Próxima Ação:** Aguardar aprovação para FASE 5









