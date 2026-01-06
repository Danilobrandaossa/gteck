# 🚨 WP-INDEX-LAG-HIGH — WordPress Index Lag Alto

**Severidade:** HIGH  
**Tempo Estimado de Resolução:** 30-60 minutos

---

## 🔍 SYMPTOMS

- Conteúdo WordPress sincronizado mas não indexado
- `wpIndexLagMinutes > 360` (6 horas)
- RAG não retorna conteúdo WordPress recente
- Alertas `WP_INDEX_LAG_HIGH` ativos

---

## ✅ HOW TO CONFIRM

### **1. Verificar Lag de Indexação**
```sql
-- Lag entre sync e indexação
SELECT 
  s.id as site_id,
  s.name as site_name,
  s."wpLastSyncAt",
  (
    SELECT MAX(created_at) 
    FROM embedding_chunks ec 
    WHERE ec.site_id = s.id 
      AND ec.source_type IN ('wp_post', 'wp_page')
      AND ec.is_active = true
  ) as last_indexed_at,
  EXTRACT(EPOCH FROM (
    s."wpLastSyncAt" - (
      SELECT MAX(created_at) 
      FROM embedding_chunks ec 
      WHERE ec.site_id = s.id 
        AND ec.source_type IN ('wp_post', 'wp_page')
        AND ec.is_active = true
    )
  )) / 60 as lag_minutes
FROM sites s
WHERE s."wpConfigured" = true
  AND s."wpLastSyncAt" IS NOT NULL;
```

**Confirmar se:** `lag_minutes > 360` (6 horas)

---

### **2. Verificar Health Snapshot**
```bash
curl -X GET "https://your-domain.com/api/admin/ai/health" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}" | \
  jq '.wpIndexing.wpIndexLagMinutes'
```

**Confirmar se:** `wpIndexLagMinutes > 360`

---

### **3. Verificar Jobs de Embedding Pendentes**
```sql
-- Jobs de embedding WP pendentes
SELECT 
  COUNT(*) as jobs_pendentes,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'processing') as processing,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM queue_jobs
WHERE type LIKE 'embedding_%'
  AND data->>'sourceType' IN ('wp_post', 'wp_page')
  AND created_at >= NOW() - INTERVAL '24 hours';
```

**Confirmar se:** `jobs_pendentes > 50` ou muitos `failed`

---

### **4. Verificar FinOps Status**
```sql
-- Verificar se FinOps está bloqueando
SELECT 
  s.id as site_id,
  s."budgetDayUsd",
  COALESCE(SUM(ai.cost_usd), 0) as daily_cost,
  CASE 
    WHEN COALESCE(SUM(ai.cost_usd), 0) > s."budgetDayUsd" * 0.9 THEN 'THROTTLED'
    WHEN COALESCE(SUM(ai.cost_usd), 0) > s."budgetDayUsd" * 0.95 THEN 'BLOCKED'
    ELSE 'NORMAL'
  END as finops_state
FROM sites s
LEFT JOIN ai_interactions ai ON ai.site_id = s.id 
  AND ai.created_at >= CURRENT_DATE
WHERE s."wpConfigured" = true
GROUP BY s.id, s."budgetDayUsd";
```

**Confirmar se:** Algum site está `THROTTLED` ou `BLOCKED`

---

## 🚨 IMMEDIATE MITIGATION (0-15 MIN)

### **1. Verificar FinOps e Ajustar Budget (Se Necessário)**
```sql
-- Aumentar budget temporariamente se necessário
UPDATE sites 
SET "budgetDayUsd" = "budgetDayUsd" * 1.5
WHERE id = 'site-id-here';
```

**Rollback:** Reverter após correção

---

### **2. Processar Jobs Pendentes Manualmente**
```bash
# Trigger manual de processamento (se worker estiver rodando)
# Jobs serão processados automaticamente pelo worker
# Verificar se worker está rodando
```

---

### **3. Verificar Worker de Embedding**
```bash
# Verificar se worker está processando jobs
ps aux | grep "embedding-worker"
```

**Se não estiver rodando:** Iniciar worker

---

### **4. Limpar Jobs Stuck**
```bash
# Executar queue housekeeping
curl -X GET "https://your-domain.com/api/cron/ai/queue-housekeeping" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

---

## 🔧 SAFE CONFIG CHANGES (COM ROLLBACK)

### **1. Aumentar Prioridade de Jobs WP (Temporário)**
```sql
-- Aumentar prioridade de jobs WP
UPDATE queue_jobs
SET priority = priority + 10
WHERE type LIKE 'embedding_%'
  AND data->>'sourceType' IN ('wp_post', 'wp_page')
  AND status = 'pending';
```

**Rollback:** Reverter prioridade após correção

---

### **2. Reduzir Batch Size (Temporário)**
```bash
# Reduzir batch size de embedding
export EMBEDDING_BATCH_SIZE=5
```

**Rollback:** Reverter após correção

---

## 🔍 DEEP DIAGNOSIS

### **1. Verificar Taxa de Erro de Embedding**
```sql
-- Taxa de erro de embedding WP
SELECT 
  COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) as error_rate,
  COUNT(*) as total_jobs
FROM queue_jobs
WHERE type LIKE 'embedding_%'
  AND data->>'sourceType' IN ('wp_post', 'wp_page')
  AND created_at >= NOW() - INTERVAL '24 hours';
```

**Problema:** Taxa de erro alta pode estar bloqueando indexação

---

### **2. Verificar Provider API**
```bash
# Testar provider API diretamente
curl -X POST "https://api.openai.com/v1/embeddings" \
  -H "Authorization: Bearer ${OPENAI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"input": "test", "model": "text-embedding-ada-002"}'
```

**Problema:** Provider API pode estar com problemas (rate limit, downtime)

---

### **3. Verificar Conteúdo Normalizado**
```sql
-- Verificar se conteúdo está sendo normalizado corretamente
SELECT 
  COUNT(*) as pages_sem_conteudo
FROM pages
WHERE "wpPostId" IS NOT NULL
  AND (content IS NULL OR content = '');
```

**Problema:** Conteúdo vazio não pode ser indexado

---

### **4. Verificar Hash de Conteúdo**
```sql
-- Verificar se hash está impedindo reindex
SELECT 
  COUNT(*) as chunks_duplicados
FROM embedding_chunks
WHERE site_id = 'site-id-here'
  AND source_type IN ('wp_post', 'wp_page')
  AND is_active = true
GROUP BY chunk_hash
HAVING COUNT(*) > 1;
```

**Problema:** Hash duplicado pode estar impedindo reindex (comportamento esperado)

---

## 🛠️ PERMANENT FIX

### **1. Aumentar Capacidade de Worker**
```bash
# Escalar workers de embedding
# Adicionar mais instâncias de worker
```

### **2. Otimizar Processamento de Embedding**
```typescript
// Em lib/embedding-service.ts
// Processar embeddings em batches maiores
// Usar paralelismo quando possível
```

### **3. Melhorar Retry de Embedding**
```typescript
// Adicionar retry com backoff exponencial
// Melhorar tratamento de erros de provider
```

### **4. Adicionar Monitoramento de Lag**
```typescript
// Alertar quando lag > 2 horas (antes de 6 horas)
// Dashboard de lag por site
```

---

## ✅ VERIFICATION

### **1. Verificar Lag Reduzido**
```sql
-- Verificar lag após correção
SELECT 
  s.id,
  EXTRACT(EPOCH FROM (
    s."wpLastSyncAt" - (
      SELECT MAX(created_at) 
      FROM embedding_chunks ec 
      WHERE ec.site_id = s.id 
        AND ec.source_type IN ('wp_post', 'wp_page')
        AND ec.is_active = true
    )
  )) / 60 as lag_minutes
FROM sites s
WHERE s."wpConfigured" = true;
```

**Esperado:** `lag_minutes < 60` (1 hora)

---

### **2. Verificar Jobs Sendo Processados**
```sql
-- Verificar jobs sendo processados
SELECT 
  COUNT(*) as jobs_processando
FROM queue_jobs
WHERE type LIKE 'embedding_%'
  AND data->>'sourceType' IN ('wp_post', 'wp_page')
  AND status = 'processing';
```

**Esperado:** `jobs_processando > 0`

---

### **3. Verificar Chunks Sendo Criados**
```sql
-- Verificar chunks criados recentemente
SELECT COUNT(*) as chunks_criados
FROM embedding_chunks
WHERE site_id = 'site-id-here'
  AND source_type IN ('wp_post', 'wp_page')
  AND is_active = true
  AND created_at >= NOW() - INTERVAL '1 hour';
```

**Esperado:** `chunks_criados > 0`

---

## 📋 CHECKLIST

- [ ] Lag confirmado > 360 minutos
- [ ] FinOps verificado (não bloqueando)
- [ ] Jobs pendentes processados
- [ ] Worker de embedding rodando
- [ ] Lag reduzido < 60 minutos
- [ ] Chunks sendo criados

---

**Status:** ✅ **RUNBOOK PRONTO**






