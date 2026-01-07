# ✅ FASE G — Checklist: IA (WP Embeddings + RAG)

**Data:** Janeiro 2025  
**Status:** ✅ **COMPLETA**

---

## 📋 CHECKLIST GERAL

### **FASE G.1 — Source Types WordPress**
- [x] Estendido `SourceType` para incluir `wp_post`, `wp_page`, `wp_media`, `wp_term`
- [x] Atualizado `RAGContext` para suportar WP sourceTypes
- [x] Atualizado `RerankChunk` para suportar WP sourceTypes
- [x] Atualizado `safeVectorSearch` para filtrar por WP sourceTypes
- [x] Atualizado `RAGQueryParams.contentType` para incluir `wp_post`/`wp_page`

### **FASE G.2 — Normalização de Conteúdo WP**
- [x] Criado `WordPressContentNormalizer.normalize()`
- [x] Implementado `stripHtml()` (preserva headings, listas, links)
- [x] Implementado `extractAcfText()` (recursivo)
- [x] Testes unitários básicos (entrada HTML → saída texto)

### **FASE G.3 — Trigger de Embeddings**
- [x] Criado `WordPressEmbeddingTrigger.triggerEmbedding()`
- [x] Integrado com `wordpress-sync-worker.ts` (full sync)
- [x] Integrado com `wordpress-incremental-sync.ts` (incremental sync)
- [x] Verifica FinOps antes de enfileirar
- [x] Normaliza conteúdo antes de enfileirar
- [x] Verifica hash (não reindexa se conteúdo não mudou)
- [x] Desativa chunks antigos (versionamento)

### **FASE G.4 — Versionamento**
- [x] `disableOldEmbeddings()` desativa chunks antigos
- [x] Chunks antigos ficam `isActive=false`
- [x] Chunks novos ficam `isActive=true`
- [x] `retrieveContext` filtra apenas `isActive=true`
- [x] Idempotência: hash SHA-256 do conteúdo normalizado

### **FASE G.5 — FinOps**
- [x] Consulta `TenantCostPolicyService` antes de indexar
- [x] Estados NORMAL/CAUTION: indexa normalmente
- [x] Estados THROTTLED/BLOCKED: pula e registra skip
- [x] Auditoria: `tenantCost.state`, `actionTaken`

### **FASE G.6 — RAG Retrieve**
- [x] `retrieveContext` busca chunks WP quando `contentType='all'` ou `'wp_post'`/`'wp_page'`
- [x] Filtra por `isActive=true` e `organizationId`/`siteId`
- [x] Rerank e diversity funcionam para WP
- [x] Confidence gate usa métricas corretas

### **FASE G.7 — Health + Alerts**
- [x] Métricas `wpIndexing` adicionadas ao health snapshot
- [x] Alertas `WP_INDEX_LAG_HIGH` e `WP_INDEX_ERROR_RATE_HIGH` criados
- [x] Thresholds configuráveis via env

### **FASE G.8 — Testes E2E**
- [x] Teste: Sync WP → chunks criados
- [x] Teste: Update WP → chunks antigos inativos, novos ativos
- [x] Teste: RAG recupera conteúdo WP
- [x] Teste: FinOps THROTTLED/BLOCKED bloqueia indexação
- [x] Teste: Multi-tenant isolation
- [x] Teste: correlationId propagado

---

## 🎯 CRITÉRIO DE CONCLUSÃO

**FASE G está 100% completa** quando:
- [x] ✅ Todos os 8 sub-fases implementadas
- [x] ✅ Testes E2E criados
- [x] ✅ Documentação técnica criada
- [x] ✅ Checklist criado
- [x] ✅ Resumo executivo criado

**Status Atual**: ✅ **FASE G COMPLETA**

---

**Assinatura Digital**:  
🤖 IA Arquiteta/Dev Sênior  
📅 Janeiro 2025  
🔖 WordPress Sync Integration — FASE G








