# ⚠️ RUNBOOK: FALLBACK ALTO

**Severidade típica:** SEV2 (se > 20%) ou SEV3 (se 10-20%)

**Tempo de resposta:** < 1h (SEV2) ou < 4h (SEV3)

---

## 🚨 SYMPTOMS

- ✅ `fallbackRate` > 10% (target: < 5%)
- ✅ `lowConfidenceRate` > 25% (target: < 15%)
- ✅ Usuários recebendo respostas genéricas
- ✅ Alert "RAG_FALLBACK_RATE_HIGH" ativo

---

## 🔍 HOW TO CONFIRM

###  **1. Check Health Dashboard**

```bash
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health" | jq '.slis.quality'

# {
#   "fallback_rate": 0.18,     ← alto!
#   "low_confidence_rate": 0.32  ← muito alto!
# }
```

### **2. Check Tuning Insights**

```bash
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights?windowDays=1" | \
  jq '{fallbackRate, lowConfidenceRate, similarityDistribution, byConfidence}'

# Se similarityDistribution.low é alto:
# → Problema: embeddings fracos ou conteúdo insuficiente
```

### **3. Identificar Causa**

```sql
-- Queries com fallback (última hora)
SELECT 
  id,
  prompt,
  context->>'correlationId' as correlation_id,
  context->'confidence'->>'level' as confidence,
  (context->>'averageSimilarity')::float as avg_similarity,
  (context->>'chunksCount')::int as chunks_used,
  context->>'fallbackUsed' as fallback_used
FROM ai_interactions
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
  AND context->>'fallbackUsed' = 'true'
ORDER BY "createdAt" DESC
LIMIT 20;
```

**Se `avg_similarity` < 0.68 em maioria:**
→ **Causa: Retrieval fraco** (thresholds muito altos ou conteúdo não indexado)

**Se `chunks_used` = 0 ou muito baixo:**
→ **Causa: Embeddings inexistentes** (reindex necessário)

---

## ⚡ IMMEDIATE MITIGATION (0-15min)

### **Opção 1: Reduzir Hard Threshold (Temporário)**

```bash
# Tornar threshold mais permissivo
export RAG_CONF_HARD_THRESHOLD=0.65  # era 0.68
export RAG_CONF_SOFT_THRESHOLD=0.72  # era 0.75

# Restart app

# Monitorar fallbackRate
watch -n 10 "curl -s -H 'Authorization: Bearer $ADMIN_SECRET' \
  'http://localhost:4000/api/admin/ai/health' | jq '.slis.quality.fallback_rate'"
```

**Rollback:**
```bash
export RAG_CONF_HARD_THRESHOLD=0.68
export RAG_CONF_SOFT_THRESHOLD=0.75
# Restart app
```

**Impacto:**
- ✅ Fallback: -40-60%
- ⚠️ Qualidade: -5-10% precisão (mais respostas LOW confidence)

---

### **Opção 2: Aumentar topN (Mais Chunks)**

```bash
# Buscar mais chunks para melhorar retrieval
export RAG_TOP_N=30  # era 20
export RAG_TOP_K=5   # era 3

# Restart app
```

**Impacto:**
- ✅ Fallback: -20-30%
- ⚠️ Latência: +100-200ms
- ⚠️ Custo: +10-15%

---

## 🔧 SAFE CONFIGURATION CHANGES

### **Rodar Reindex Incremental**

```bash
# Trigger reindex de conteúdo atualizado
curl -X GET -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:4000/api/cron/ai/reindex-incremental"

# {
#   "success": true,
#   "queuedCount": 145,
#   "skippedThrottledCount": 5,
#   "durationMs": 234
# }

# Aguardar processamento (5-30min dependendo do volume)

# Verificar progresso
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health" | jq '.queue'
```

---

## 🔬 DEEP DIAGNOSIS

### **1. Verificar Se Conteúdo Está Indexado**

```sql
-- Count de embeddings por tenant
SELECT 
  "organizationId",
  "siteId",
  COUNT(*) as embedding_count,
  COUNT(DISTINCT "sourceId") as unique_sources,
  MAX("createdAt") as last_indexed
FROM embedding_chunks
WHERE "isActive" = true
GROUP BY "organizationId", "siteId"
ORDER BY embedding_count ASC
LIMIT 10;
```

**Se embedding_count = 0 ou muito baixo:**
→ **Problema: Conteúdo não foi indexado**

**Ação:**
```bash
# Forçar full reindex para tenant específico
# (implementar endpoint se necessário)
```

---

### **2. Verificar Distribuição de Similarity**

```sql
-- Histograma de avgSimilarity
SELECT 
  CASE 
    WHEN (context->>'averageSimilarity')::float > 0.85 THEN '> 0.85 (excelente)'
    WHEN (context->>'averageSimilarity')::float > 0.75 THEN '0.75-0.85 (bom)'
    WHEN (context->>'averageSimilarity')::float > 0.65 THEN '0.65-0.75 (regular)'
    ELSE '< 0.65 (ruim)'
  END as similarity_bucket,
  COUNT(*) as count,
  ROUND(AVG((context->>'chunksCount')::int), 1) as avg_chunks
FROM ai_interactions
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
  AND context->>'averageSimilarity' IS NOT NULL
GROUP BY similarity_bucket
ORDER BY similarity_bucket;
```

**Se maioria está em "< 0.65":**
→ **Problema: Embeddings de baixa qualidade ou model incompatível**

---

### **3. Verificar Chunk Quality**

```sql
-- Sample de chunks por similarity
SELECT 
  ec."chunkText",
  ec."model",
  ec."dimensions",
  ec."createdAt"
FROM embedding_chunks ec
WHERE ec."isActive" = true
  AND ec."organizationId" = 'org-1'  -- ajustar
  AND ec."siteId" = 'site-1'          -- ajustar
ORDER BY ec."createdAt" DESC
LIMIT 5;
```

**Se chunks estão vazios ou mal formatados:**
→ **Problema: Chunking ou parsing**

---

## 🛠️ PERMANENT FIX

### **Fix 1: Ajustar Thresholds Baseado em Dados**

```bash
# Usar tuning insights para decidir
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights?windowDays=7" | \
  jq '.recommendations[] | select(.id == "high-fallback")'

# Seguir recomendações
# Ex: Se fallback alto mas similarity OK → thresholds muito altos
```

---

### **Fix 2: Melhorar Chunking**

```typescript
// lib/embeddings/chunking.ts
// Ajustar tamanho e overlap de chunks

export const CHUNK_CONFIG = {
  size: 800,      // era 1000 (muito grande)
  overlap: 150,   // era 100
  minSize: 200    // descartar chunks muito pequenos
}
```

---

### **Fix 3: Reindexar Com Modelo Melhor**

```bash
# Se embeddings estão com modelo antigo:
# Atualizar para text-embedding-3-large (OpenAI)

export EMBEDDING_MODEL=text-embedding-3-large
export EMBEDDING_DIMENSIONS=3072

# Rodar full reindex (janela de baixo tráfego)
```

---

## ✅ VERIFICATION

```bash
# 1. fallbackRate deve ter caído
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health" | \
  jq '.slis.quality.fallback_rate'

# Esperado: < 0.05 (5%)

# 2. lowConfidenceRate deve ter caído
jq '.slis.quality.low_confidence_rate'

# Esperado: < 0.15 (15%)

# 3. Rodar regressão
npm run test:rag-regression:run
```

---

## 📝 POST-INCIDENT NOTES

### **Causas Comuns:**
1. Conteúdo novo não foi indexado
2. Thresholds muito altos (calibração errada)
3. Embeddings com modelo antigo/fraco
4. Chunking ruim (chunks muito grandes/pequenos)
5. Queries fora do domínio do conteúdo

### **Prevenção:**
- Monitorar fallbackRate diariamente
- Rodar reindex incremental regularmente (cron)
- Validar embeddings após mudanças
- Tuning de thresholds baseado em feedback

---

**Ver também:**
- [QUALIDADE-NEGATIVA.md](QUALIDADE-NEGATIVA.md) — Feedback negativo
- [TUNING-PLAYBOOK.md](../TUNING-PLAYBOOK.md) — Processo de tuning
- [MAINTENANCE-JOBS.md](../MAINTENANCE-JOBS.md) — Reindex incremental








