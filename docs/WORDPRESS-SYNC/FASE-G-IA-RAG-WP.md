# 🧠 FASE G — IA: Embeddings + RAG Coerentes com WordPress

**Data:** Janeiro 2025  
**Fase:** G/9 - WordPress Sync Integration  
**Status:** ✅ **COMPLETA**

---

## 📋 OBJETIVO DA FASE G

Garantir que TODO conteúdo do WordPress sincronizado:
1. Seja indexado corretamente (chunks + embeddings) com versionamento
2. Seja recuperável no RAG de forma consistente e multi-tenant
3. Dispare reindex automaticamente após sync (full e incremental)
4. Respeite FinOps (não gerar embeddings quando THROTTLED/BLOCKED)
5. Seja observável e auditável end-to-end (correlationId)

---

## ✅ IMPLEMENTAÇÕES REALIZADAS

### **FASE G.1 — Source Types WordPress para IA**

**Arquivo:** `lib/embedding-service.ts`, `lib/rag-service.ts`, `lib/rag-rerank.ts`, `lib/tenant-security.ts`

**Alterações:**
- ✅ Estendido `SourceType` para incluir: `'wp_post' | 'wp_page' | 'wp_media' | 'wp_term'`
- ✅ Atualizado `RAGContext`, `RerankChunk`, `RAGQueryParams` para suportar WP sourceTypes
- ✅ Atualizado `safeVectorSearch` para filtrar por `wp_post`/`wp_page`

**Status:** ✅ **COMPLETO**

---

### **FASE G.2 — Normalização de Conteúdo WP**

**Arquivo:** `lib/wordpress/wordpress-content-normalizer.ts`

**Classe:** `WordPressContentNormalizer`

**Métodos:**
- ✅ `normalize()` — Normaliza conteúdo WordPress (HTML → Texto IA)
- ✅ `stripHtml()` — Remove HTML preservando estrutura (headings, listas, links)
- ✅ `extractAcfText()` — Extrai texto relevante de campos ACF

**Características:**
- ✅ Preserva headings (H1-H6) como markdown
- ✅ Inclui título, excerpt, categorias, tags
- ✅ Trata ACF fields (recursivo)
- ✅ Remove shortcodes WordPress

**Status:** ✅ **COMPLETO**

---

### **FASE G.3 — Trigger de Embeddings Após Upsert**

**Arquivo:** `lib/wordpress/wordpress-embedding-trigger.ts`

**Classe:** `WordPressEmbeddingTrigger`

**Métodos:**
- ✅ `triggerEmbedding()` — Enfileira embedding após upsert WP
  - Verifica FinOps (NORMAL/CAUTION permitem, THROTTLED/BLOCKED bloqueiam)
  - Normaliza conteúdo usando `WordPressContentNormalizer`
  - Verifica hash (não reindexa se conteúdo não mudou)
  - Desativa chunks antigos (versionamento)
  - Enfileira job via `EmbeddingService.enqueueEmbeddingJob`

**Integração:**
- ✅ `wordpress-sync-worker.ts` — Usa `WordPressEmbeddingTrigger` após upsert de pages/posts
- ✅ `wordpress-incremental-sync.ts` — Usa `WordPressEmbeddingTrigger` após upsert incremental

**Status:** ✅ **COMPLETO**

---

### **FASE G.4 — Versionamento e Reindex Correto**

**Arquivo:** `lib/embedding-service.ts`, `lib/wordpress/wordpress-embedding-trigger.ts`

**Implementação:**
- ✅ `disableOldEmbeddings()` — Desativa chunks antigos antes de criar novos
- ✅ `deactivateOldChunks()` — Desativa chunks via `isActive=false`
- ✅ Chunks antigos ficam `isActive=false`, novos ficam `isActive=true`
- ✅ `retrieveContext` filtra apenas `isActive=true`

**Idempotência:**
- ✅ Chave: `(siteId + sourceType + wpId + chunkIndex + chunkHash + model/provider/version)`
- ✅ Hash SHA-256 do conteúdo normalizado

**Status:** ✅ **COMPLETO**

---

### **FASE G.5 — FinOps: Controle de Custo na Indexação**

**Arquivo:** `lib/wordpress/wordpress-embedding-trigger.ts`

**Implementação:**
- ✅ Consulta `TenantCostPolicyService.getTenantCostInfo()` antes de enfileirar
- ✅ Estados:
  - `NORMAL`/`CAUTION`: Indexa normalmente
  - `THROTTLED`/`BLOCKED`: Pula e registra skip com `skipReason`
- ✅ Auditoria: `tenantCost.state`, `actionTaken` (indexed/skipped/degraded)

**Status:** ✅ **COMPLETO**

---

### **FASE G.6 — RAG Retrieve: Buscar WP Chunks**

**Arquivo:** `lib/rag-service.ts`, `lib/tenant-security.ts`

**Alterações:**
- ✅ `retrieveContext()` busca chunks WP (`wp_post`, `wp_page`) quando `contentType='all'` ou `contentType='wp_post'`/`'wp_page'`
- ✅ Filtra por `isActive=true` e `organizationId`/`siteId` (multi-tenant)
- ✅ Rerank e diversity funcionam igual para WP
- ✅ Confidence gate usa `avgSimilarity`/`topSimilarity`/`chunksSelected` corretamente

**Status:** ✅ **COMPLETO**

---

### **FASE G.7 — Health + Alerts: WP IA Ready**

**Arquivo:** `lib/observability/health-snapshot.ts`, `lib/observability/alerts.ts`

**Métricas Adicionadas:**
- ✅ `wpIndexing.lastWpSyncAt` — Último sync completo
- ✅ `wpIndexing.lastWpIndexedAt` — Último embedding gerado para WP
- ✅ `wpIndexing.wpItemsPendingIndex` — Itens WP aguardando indexação
- ✅ `wpIndexing.wpIndexLagMinutes` — Lag entre sync e indexação
- ✅ `wpIndexing.wpIndexErrorRate24h` — Taxa de erro na indexação WP

**Alertas Criados:**
- ✅ `WP_INDEX_LAG_HIGH` — Lag > 6h (HIGH)
- ✅ `WP_INDEX_ERROR_RATE_HIGH` — Taxa de erro > 10% (MEDIUM)

**Status:** ✅ **COMPLETO**

---

### **FASE G.8 — Testes E2E**

**Arquivo:** `tests/wordpress/wp-rag-e2e.test.ts`

**Cenários Testados:**
1. ✅ Após sync de post WP, chunks/embeddings são criados (quando FinOps permite)
2. ✅ Após update do mesmo post WP, chunks antigos ficam inativos e novos ativos
3. ✅ RAG recupera conteúdo WP (pergunta → retrieve encontra wp_post/wp_page)
4. ✅ FinOps THROTTLED/BLOCKED: não indexa e registra skip corretamente
5. ✅ Multi-tenant: WP do tenant A não indexa nem aparece no RAG do tenant B
6. ✅ Observabilidade: correlationId propagado sync → job → embeddings → ai_interactions

**Status:** ✅ **COMPLETO**

---

## 📊 ARQUIVOS CRIADOS/MODIFICADOS

### **Novos Arquivos (5):**
1. `lib/wordpress/wordpress-content-normalizer.ts` — Normalizador de conteúdo WP
2. `lib/wordpress/wordpress-embedding-trigger.ts` — Trigger de embeddings após sync
3. `tests/wordpress/wp-rag-e2e.test.ts` — Testes E2E
4. `docs/WORDPRESS-SYNC/FASE-G-IA-RAG-WP.md` — Esta documentação
5. `docs/WORDPRESS-SYNC/FASE-G-CHECKLIST.md` — Checklist

### **Arquivos Modificados (10):**
1. `lib/embedding-service.ts` — Suporte a `wp_post`/`wp_page`/`wp_media`/`wp_term`
2. `lib/rag-service.ts` — Busca chunks WP no retrieveContext
3. `lib/rag-rerank.ts` — Suporte a WP sourceTypes
4. `lib/tenant-security.ts` — Filtro por WP sourceTypes
5. `lib/wordpress/wordpress-sync-worker.ts` — Integração com `WordPressEmbeddingTrigger`
6. `lib/wordpress/wordpress-incremental-sync.ts` — Integração com `WordPressEmbeddingTrigger`
7. `lib/observability/health-snapshot.ts` — Métricas de indexação WP
8. `lib/observability/alerts.ts` — Alertas de indexação WP
9. `docs/WORDPRESS-SYNC/README.md` — Atualizado com FASE G
10. `docs/WORDPRESS-SYNC/FASE-G-RESUMO-EXECUTIVO.md` — Resumo executivo

---

## 🔍 DETALHES TÉCNICOS

### **Normalização de Conteúdo**

```typescript
// Entrada: HTML WordPress
const html = '<h1>Título</h1><p>Conteúdo <strong>importante</strong>.</p>'

// Saída: Texto normalizado para IA
const normalized = WordPressContentNormalizer.normalize({
  title: 'Título',
  content: html,
  excerpt: 'Resumo...',
  categories: ['Categoria 1'],
  tags: ['Tag 1']
})

// Resultado:
// # Título
//
// **Resumo:** Resumo...
//
// **Categorias:** Categoria 1
// **Tags:** Tag 1
//
// # Título
//
// Conteúdo **importante**.
```

### **Trigger de Embeddings**

```typescript
// Após upsert WP (full ou incremental)
const result = await WordPressEmbeddingTrigger.triggerEmbedding({
  organizationId,
  siteId,
  sourceType: 'wp_post', // ou 'wp_page'
  sourceId: pageId,
  wpId: 123,
  title: 'Título',
  content: '<p>Conteúdo HTML</p>',
  excerpt: 'Resumo',
  categories: ['1', '2'],
  tags: ['tag1'],
  acfFields: { campo: 'valor' },
  correlationId
})

// Resultado:
// {
//   enqueued: true,
//   skipped: false,
//   jobId: 'embedding_job_123',
//   tenantCostState: 'NORMAL'
// }
```

### **Versionamento**

```typescript
// Antes de criar novos chunks:
// 1. Desativar chunks antigos
await db.embeddingChunk.updateMany({
  where: {
    siteId,
    sourceType: 'wp_post',
    sourceId: pageId,
    isActive: true
  },
  data: { isActive: false }
})

// 2. Criar novos chunks (isActive=true)
// 3. retrieveContext filtra apenas isActive=true
```

### **FinOps Integration**

```typescript
// Verificar FinOps antes de indexar
const costInfo = await TenantCostPolicyService.getTenantCostInfo(
  organizationId,
  siteId
)

if (costInfo.state === 'THROTTLED' || costInfo.state === 'BLOCKED') {
  return {
    enqueued: false,
    skipped: true,
    skipReason: `Tenant cost state: ${costInfo.state}`
  }
}
```

---

## 🎯 GARANTIAS

### **Segurança Multi-tenant**
- ✅ Todos os chunks filtrados por `organizationId` + `siteId`
- ✅ `safeVectorSearch` valida tenant antes de buscar
- ✅ Isolamento garantido em todos os níveis

### **Idempotência**
- ✅ Hash SHA-256 do conteúdo normalizado
- ✅ Não reindexa se hash igual
- ✅ Versionamento correto (chunks antigos inativos)

### **FinOps Compliance**
- ✅ Não gera embeddings quando THROTTLED/BLOCKED
- ✅ Registra skip com motivo
- ✅ Auditoria completa

### **Observabilidade**
- ✅ `correlationId` propagado: sync → job → embeddings → ai_interactions
- ✅ Health snapshot inclui métricas WP
- ✅ Alertas configuráveis

---

## 📈 MÉTRICAS E MONITORAMENTO

### **Health Snapshot**
```json
{
  "wpIndexing": {
    "lastWpSyncAt": "2025-01-24T10:00:00Z",
    "lastWpIndexedAt": "2025-01-24T10:05:00Z",
    "wpItemsPendingIndex": 5,
    "wpIndexLagMinutes": 5,
    "wpIndexErrorRate24h": 0.02
  }
}
```

### **Alertas**
- `WP_INDEX_LAG_HIGH`: Lag > 6h (configurável via `ALERT_WP_INDEX_LAG_MINUTES_MAX`)
- `WP_INDEX_ERROR_RATE_HIGH`: Taxa de erro > 10% (configurável via `ALERT_WP_INDEX_ERROR_RATE_MAX`)

---

## ✅ CHECKLIST DA FASE G

- [x] FASE G.1: Source types WordPress definidos
- [x] FASE G.2: Normalizador de conteúdo WP criado
- [x] FASE G.3: Trigger de embeddings após upsert (full + incremental)
- [x] FASE G.4: Versionamento correto (chunks antigos inativos)
- [x] FASE G.5: FinOps integrado (THROTTLED/BLOCKED bloqueiam)
- [x] FASE G.6: RAG retrieve busca chunks WP
- [x] FASE G.7: Health + alerts para indexação WP
- [x] FASE G.8: Testes E2E criados

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **FASE G Completa**: IA (WP Embeddings + RAG) integrada
2. ⏳ **FASE H**: Testes end-to-end completos (multi-tenant, webhooks, conflitos)
3. ⏳ **FASE I**: Runbooks + Go-live

---

**Status:** ✅ **FASE G — IA (WP Embeddings + RAG) CONCLUÍDA**






