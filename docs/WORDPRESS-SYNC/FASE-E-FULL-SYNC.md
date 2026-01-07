# 🔄 FASE E — FULL SYNC (WP → CMS) + JOBS

**Data:** 24 de Dezembro de 2025  
**Fase:** E/9 — Full Sync WordPress → CMS  
**Status:** ✅ **COMPLETA**

---

## 📋 ÍNDICE

1. [Objetivo da FASE E](#1-objetivo-da-fase-e)
2. [Arquitetura do Sync](#2-arquitetura-do-sync)
3. [Componentes Implementados](#3-componentes-implementados)
4. [Fluxo de Execução](#4-fluxo-de-execução)
5. [Garantias e Validações](#5-garantias-e-validações)
6. [Integração com IA](#6-integração-com-ia)
7. [FinOps](#7-finops)
8. [Observabilidade](#8-observabilidade)
9. [Relatório Final](#9-relatório-final)

---

## 1️⃣ OBJETIVO DA FASE E

Implementar sincronização completa WordPress → CMS de forma:
- ✅ Completa (Posts, Pages, Media, Terms, ACF)
- ✅ Idempotente (rodar 2x = mesmo resultado)
- ✅ Multi-tenant isolado
- ✅ Assíncrona (Queue + Worker)
- ✅ Integrada com IA (Embeddings/RAG)
- ✅ Segura em custo (FinOps)
- ✅ Observável (correlationId + métricas)
- ✅ Com relatório final auditável

---

## 2️⃣ ARQUITETURA DO SYNC

### **2.1. Fluxo Geral**

```
1. POST /api/wordpress/sync-all
   ↓
2. Validar ownership + credenciais
   ↓
3. Criar 4 QueueJobs (Terms → Media → Pages → Posts)
   ↓
4. Worker processa jobs em ordem
   ↓
5. Para cada item:
   - Fetch WP REST API
   - Upsert idempotente (wpId ↔ localId)
   - Gerar embedding (se FinOps permitir)
   ↓
6. Relatório final consolidado
```

### **2.2. Ordem de Processamento**

1. **Terms** (Categories/Tags) — Criar primeiro (dependências)
2. **Media** — Criar segundo (referenciado por Pages/Posts)
3. **Pages** — Criar terceiro (referencia Terms/Media)
4. **Posts** — Criar último (referencia Terms/Media)

---

## 3️⃣ COMPONENTES IMPLEMENTADOS

### **3.1. Endpoint de Start**

**Arquivo**: `app/api/wordpress/sync-all/route.ts`

**Funcionalidades**:
- ✅ Valida ownership (site pertence à organization)
- ✅ Valida credenciais WordPress configuradas
- ✅ Gera `syncId` único
- ✅ Cria 4 QueueJobs (Terms, Media, Pages, Posts)
- ✅ Retorna resposta imediata com `syncId` e `queuedJobsCount`

**Request**:
```json
{
  "siteId": "c...",
  "organizationId": "c...",
  "batchSize": 50
}
```

**Response**:
```json
{
  "syncId": "uuid",
  "status": "queued",
  "queuedJobsCount": 4,
  "message": "WordPress sync started successfully"
}
```

---

### **3.2. Worker de Sync (Core)**

**Arquivo**: `lib/wordpress/wordpress-sync-worker.ts`

**Classe**: `WordPressSyncWorker`

**Métodos Principais**:
- `processSyncJob(jobId)`: Processa um job de sincronização
- `fetchWordPressItems()`: Busca itens do WordPress REST API
- `processWordPressItem()`: Processa um item individual
- `upsertCategory()`: Upsert Category (Term)
- `upsertMedia()`: Upsert Media
- `upsertPage()`: Upsert Page (com ACF)
- `upsertPost()`: Upsert Post (similar a Page)

**Características**:
- ✅ Fetch paginado do WordPress
- ✅ Upsert idempotente (usa `wpId ↔ localId`)
- ✅ Last Write Wins (compara `wpModifiedAt` vs `localUpdatedAt`)
- ✅ Suporte a ACF (via `wpPage.acf` ou API ACF)
- ✅ Integração com Embeddings (respeitando FinOps)

---

### **3.3. Worker Runner**

**Arquivo**: `lib/wordpress/wordpress-sync-worker-runner.ts`

**Classe**: `WordPressSyncWorkerRunner`

**Funcionalidades**:
- ✅ Claim atômico de jobs (usa `QueueClaim`)
- ✅ Processamento em batch
- ✅ Heartbeat para manter locks vivos
- ✅ Retry automático (via QueueJob)
- ✅ DLQ após maxAttempts

**Configuração**:
```typescript
const worker = new WordPressSyncWorkerRunner({
  workerId: 'wp-sync-worker-1',
  batchSize: 5,
  pollIntervalMs: 5000,
  lockTtlMs: 60000,
  heartbeatIntervalMs: 10000
})

await worker.start()
```

---

### **3.4. Relatório Final**

**Arquivo**: `app/api/wordpress/sync/[syncId]/route.ts`

**Endpoint**: `GET /api/wordpress/sync/[syncId]`

**Response**:
```json
{
  "syncId": "uuid",
  "siteId": "c...",
  "organizationId": "c...",
  "startedAt": "2025-12-24T...",
  "finishedAt": "2025-12-24T...",
  "status": "completed",
  "totals": {
    "terms": 10,
    "media": 25,
    "pages": 50,
    "posts": 100
  },
  "created": 150,
  "updated": 35,
  "skipped": 0,
  "failed": 0,
  "embeddingsQueued": 135,
  "embeddingsSkipped": 15,
  "durationMs": 45000,
  "jobs": [...]
}
```

---

## 4️⃣ FLUXO DE EXECUÇÃO

### **4.1. Início do Sync**

1. Cliente chama `POST /api/wordpress/sync-all`
2. Endpoint valida ownership e credenciais
3. Cria 4 QueueJobs (um por tipo de entidade)
4. Retorna `syncId` imediatamente

### **4.2. Processamento**

1. Worker Runner faz claim de jobs pendentes
2. Para cada job:
   - Fetch itens do WordPress (paginado)
   - Para cada item:
     - Verificar se já existe (via `wpId`)
     - Upsert idempotente
     - Gerar embedding (se FinOps permitir)
   - Atualizar job como `completed`

### **4.3. Finalização**

1. Todos os jobs completados
2. Cliente consulta `GET /api/wordpress/sync/[syncId]`
3. Recebe relatório consolidado

---

## 5️⃣ GARANTIAS E VALIDAÇÕES

### **5.1. Idempotência**

- ✅ Unique constraints: `(siteId, wpPostId)`, `(siteId, wpTermId)`, `(siteId, wpMediaId)`
- ✅ Upsert usa essas chaves
- ✅ Sync 2x = mesmo resultado (não duplica)

### **5.2. Multi-Tenant**

- ✅ Ownership validado antes de criar jobs
- ✅ Todos os upserts incluem `siteId`
- ✅ Nenhum vazamento entre tenants

### **5.3. Last Write Wins (LWW)**

- ✅ Compara `wpModifiedAt` vs `localUpdatedAt`
- ✅ WP vence se mais recente
- ✅ Local vence se mais recente (skip)

---

## 6️⃣ INTEGRAÇÃO COM IA

### **6.1. Embeddings**

Após upsert de Page/Post:
- ✅ Se tenant `NORMAL` ou `CAUTION`: `enqueueEmbeddingJob()`
- ✅ Se tenant `THROTTLED` ou `BLOCKED`: SKIP embedding
- ✅ `sourceType`: `wp_page` ou `wp_post`
- ✅ Conteúdo: `title + content`

### **6.2. RAG Consistency**

- ✅ Conteúdo WP aparece no retrieve do RAG
- ✅ `sourceType` consistente
- ✅ Embeddings gerados com mesmo modelo/provider

---

## 7️⃣ FINOPS

### **7.1. Verificação de Custo**

Antes de gerar embeddings:
- ✅ Consulta `TenantCostPolicyService.getTenantCostInfo()`
- ✅ Se `THROTTLED` ou `BLOCKED`: SKIP
- ✅ Registra `skipReason` no contexto

### **7.2. Auditoria**

- ✅ `embeddingsQueued`: Quantos embeddings foram enfileirados
- ✅ `embeddingsSkipped`: Quantos foram pulados (FinOps)
- ✅ `costState`: Estado do tenant no momento do sync

---

## 8️⃣ OBSERVABILIDADE

### **8.1. CorrelationId**

- ✅ Gerado no início do sync
- ✅ Propagado para todos os jobs
- ✅ Presente em todos os logs

### **8.2. Métricas**

- ✅ `wpRequestMs`: Tempo de fetch WordPress
- ✅ `upsertMs`: Tempo de upsert no banco
- ✅ `embeddingQueued`: Boolean
- ✅ `errorsCount`: Quantidade de erros
- ✅ `totalProcessed`: Total processado

### **8.3. Logs Estruturados**

- ✅ Todos os logs incluem `correlationId`
- ✅ Logs sem senhas (segurança)
- ✅ Auditoria completa de operações

---

## 9️⃣ RELATÓRIO FINAL

### **9.1. Estrutura**

```typescript
interface SyncReport {
  syncId: string
  siteId: string
  organizationId: string
  startedAt: Date
  finishedAt: Date | null
  status: 'queued' | 'processing' | 'completed' | 'failed'
  totals: { terms, media, pages, posts }
  created: number
  updated: number
  skipped: number
  failed: number
  embeddingsQueued: number
  embeddingsSkipped: number
  durationMs: number | null
  jobs: Array<{ jobId, type, status, result, error }>
}
```

### **9.2. Endpoint**

`GET /api/wordpress/sync/[syncId]`

- ✅ Busca todos os jobs da sincronização
- ✅ Consolida resultados
- ✅ Calcula totais e estatísticas
- ✅ Retorna relatório completo

---

## 📊 RESUMO DAS IMPLEMENTAÇÕES

| Componente | Arquivo | Status |
|------------|---------|--------|
| **Endpoint Start** | `app/api/wordpress/sync-all/route.ts` | ✅ |
| **Worker Core** | `lib/wordpress/wordpress-sync-worker.ts` | ✅ |
| **Worker Runner** | `lib/wordpress/wordpress-sync-worker-runner.ts` | ✅ |
| **Relatório** | `app/api/wordpress/sync/[syncId]/route.ts` | ✅ |

---

## 🚀 PRÓXIMOS PASSOS

### **FASE F — INCREMENTAL SYNC (WP ↔ CMS) + WEBHOOKS** (3-4 dias)
1. ⏳ Webhooks WP → App
2. ⏳ Pull incremental (cron)
3. ⏳ Conflitos e resolução
4. ⏳ Sync bidirecional

---

## ✅ FASE E — CONCLUSÃO

### **Entregas Completas**

- [x] ✅ Endpoint de start (`POST /api/wordpress/sync-all`)
- [x] ✅ Worker de sync (core)
- [x] ✅ Worker runner (claim atômico)
- [x] ✅ Ordem e dependências (Terms → Media → Pages → Posts)
- [x] ✅ ACF handling
- [x] ✅ Integração com IA (Embeddings)
- [x] ✅ FinOps (respeitar THROTTLED/BLOCKED)
- [x] ✅ Observabilidade (correlationId + métricas)
- [x] ✅ Relatório final (`GET /api/wordpress/sync/[syncId]`)

---

**Status Final**: ✅ **FASE E COMPLETA**

**Próximo Marco**: **FASE F — Incremental Sync + Webhooks**

---

**Assinatura Digital**:  
🤖 IA Arquiteta/Dev Sênior  
📅 24 de Dezembro de 2025  
🔖 WordPress Sync Integration — FASE E v1.0








