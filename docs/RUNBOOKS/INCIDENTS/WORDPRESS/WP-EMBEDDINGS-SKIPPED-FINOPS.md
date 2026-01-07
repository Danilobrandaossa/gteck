# 🚨 WP-EMBEDDINGS-SKIPPED-FINOPS — Embeddings WordPress Pulados por FinOps

**Severidade:** MEDIUM  
**Tempo Estimado de Resolução:** 15-30 minutos

---

## 🔍 SYMPTOMS

- Embeddings WordPress não estão sendo gerados
- `wpItemsPendingIndex` aumentando
- Logs mostram "Tenant cost state: THROTTLED" ou "BLOCKED"
- RAG não retorna conteúdo WordPress recente

---

## ✅ HOW TO CONFIRM

### **1. Verificar FinOps Status**
```sql
-- Status FinOps por site
SELECT 
  s.id as site_id,
  s.name as site_name,
  s."budgetDayUsd",
  s."budgetMonthUsd",
  COALESCE(SUM(ai.cost_usd), 0) as daily_cost,
  COALESCE(SUM(ai.cost_usd) FILTER (WHERE ai.created_at >= DATE_TRUNC('month', NOW())), 0) as monthly_cost,
  CASE 
    WHEN COALESCE(SUM(ai.cost_usd), 0) > s."budgetDayUsd" * 0.95 THEN 'BLOCKED'
    WHEN COALESCE(SUM(ai.cost_usd), 0) > s."budgetDayUsd" * 0.9 THEN 'THROTTLED'
    WHEN COALESCE(SUM(ai.cost_usd), 0) > s."budgetDayUsd" * 0.7 THEN 'CAUTION'
    ELSE 'NORMAL'
  END as finops_state
FROM sites s
LEFT JOIN ai_interactions ai ON ai.site_id = s.id 
  AND ai.created_at >= CURRENT_DATE
WHERE s."wpConfigured" = true
GROUP BY s.id, s.name, s."budgetDayUsd", s."budgetMonthUsd";
```

**Confirmar se:** Algum site está `THROTTLED` ou `BLOCKED`

---

### **2. Verificar Embeddings Pulados**
```sql
-- Embeddings pulados por FinOps
SELECT 
  COUNT(*) as embeddings_pulados
FROM queue_jobs
WHERE type LIKE 'embedding_%'
  AND data->>'sourceType' IN ('wp_post', 'wp_page')
  AND result->>'skipReason' LIKE '%THROTTLED%' OR result->>'skipReason' LIKE '%BLOCKED%'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

**Confirmar se:** `embeddings_pulados > 10`

---

### **3. Verificar Itens Pendentes de Indexação**
```sql
-- Páginas WP aguardando indexação
SELECT 
  COUNT(*) as pages_pending_index
FROM pages
WHERE "wpPostId" IS NOT NULL
  AND (
    "embeddingGeneratedAt" IS NULL
    OR "embeddingGeneratedAt" < "wpSyncedAt"
  );
```

**Confirmar se:** `pages_pending_index > 20`

---

### **4. Verificar Health Snapshot**
```bash
curl -X GET "https://your-domain.com/api/admin/ai/health" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}" | \
  jq '.wpIndexing.wpItemsPendingIndex'
```

**Confirmar se:** `wpItemsPendingIndex > 20`

---

## 🚨 IMMEDIATE MITIGATION (0-15 MIN)

### **1. Aumentar Budget Temporariamente**
```sql
-- Aumentar budget diário em 50%
UPDATE sites 
SET "budgetDayUsd" = "budgetDayUsd" * 1.5
WHERE id = 'site-id-here';
```

**Rollback:** Reverter após correção

---

### **2. Verificar Custo Real vs Budget**
```sql
-- Verificar se custo está realmente alto
SELECT 
  s.id,
  s."budgetDayUsd",
  COALESCE(SUM(ai.cost_usd), 0) as daily_cost,
  (COALESCE(SUM(ai.cost_usd), 0) / NULLIF(s."budgetDayUsd", 0)) * 100 as budget_percentage
FROM sites s
LEFT JOIN ai_interactions ai ON ai.site_id = s.id 
  AND ai.created_at >= CURRENT_DATE
WHERE s.id = 'site-id-here'
GROUP BY s.id, s."budgetDayUsd";
```

**Se custo está dentro do budget:** Verificar cálculo de FinOps

---

### **3. Resetar Custo do Dia (Se Apropriado)**
```sql
-- Resetar custo do dia (apenas se for início do dia e cálculo errado)
-- CUIDADO: Apenas se tiver certeza que é cálculo errado
UPDATE ai_interactions
SET cost_usd = 0, cost_brl = 0
WHERE site_id = 'site-id-here'
  AND created_at >= CURRENT_DATE;
```

**Cuidado:** Apenas se cálculo estiver errado

---

## 🔧 SAFE CONFIG CHANGES (COM ROLLBACK)

### **1. Aumentar Thresholds de FinOps (Temporário)**
```typescript
// Em lib/finops/tenant-cost-policy.ts
// Aumentar thresholds temporariamente
const THROTTLED_THRESHOLD = 0.95; // Aumentar para 0.98
const BLOCKED_THRESHOLD = 0.98; // Aumentar para 0.99
```

**Rollback:** Reverter após correção

---

### **2. Permitir Indexação em THROTTLED (Temporário)**
```typescript
// Em lib/wordpress/wordpress-embedding-trigger.ts
// Permitir indexação mesmo em THROTTLED (temporário)
const canGenerateEmbeddings = costInfo.state === 'NORMAL' || 
                               costInfo.state === 'CAUTION' || 
                               costInfo.state === 'THROTTLED'; // Adicionar THROTTLED temporariamente
```

**Rollback:** Remover THROTTLED após correção

---

## 🔍 DEEP DIAGNOSIS

### **1. Verificar Cálculo de Custo**
```sql
-- Verificar custo por tipo de interação
SELECT 
  type,
  provider,
  model,
  COUNT(*) as count,
  SUM(cost_usd) as total_cost
FROM ai_interactions
WHERE site_id = 'site-id-here'
  AND created_at >= CURRENT_DATE
GROUP BY type, provider, model
ORDER BY total_cost DESC;
```

**Problema:** Algum tipo de interação pode estar custando muito

---

### **2. Verificar Custo de Embeddings**
```sql
-- Custo de embeddings
SELECT 
  COUNT(*) as embedding_count,
  SUM(cost_usd) as embedding_cost
FROM ai_interactions
WHERE type = 'embedding_generate'
  AND site_id = 'site-id-here'
  AND created_at >= CURRENT_DATE;
```

**Problema:** Embeddings podem estar custando mais que o esperado

---

### **3. Verificar Rate Limits de Provider**
```bash
# Verificar se provider está retornando rate limit
grep "rate limit" logs/app.log | tail -20
```

**Problema:** Rate limits podem estar causando retries e aumentando custo

---

### **4. Verificar Budget Configurado**
```sql
-- Verificar se budget está configurado corretamente
SELECT 
  id,
  name,
  "budgetDayUsd",
  "budgetMonthUsd"
FROM sites
WHERE id = 'site-id-here';
```

**Problema:** Budget pode estar muito baixo

---

## 🛠️ PERMANENT FIX

### **1. Ajustar Budget Realista**
```sql
-- Ajustar budget baseado em custo histórico
UPDATE sites 
SET 
  "budgetDayUsd" = (
    SELECT AVG(daily_cost) * 1.2 
    FROM (
      SELECT DATE(created_at) as day, SUM(cost_usd) as daily_cost
      FROM ai_interactions
      WHERE site_id = 'site-id-here'
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
    ) daily_costs
  ),
  "budgetMonthUsd" = "budgetDayUsd" * 30
WHERE id = 'site-id-here';
```

### **2. Otimizar Custo de Embeddings**
```typescript
// Usar modelo mais barato para embeddings
// Reduzir dimensões se possível
// Usar cache de embeddings quando possível
```

### **3. Implementar Degradação Mais Inteligente**
```typescript
// Em THROTTLED, indexar apenas conteúdo crítico
// Priorizar posts/pages mais recentes
```

### **4. Adicionar Alertas de Budget**
```typescript
// Alertar quando budget atinge 70% (CAUTION)
// Alertar quando budget atinge 90% (THROTTLED)
```

---

## ✅ VERIFICATION

### **1. Verificar FinOps Status Normalizado**
```sql
-- Verificar status após correção
SELECT 
  s.id,
  CASE 
    WHEN COALESCE(SUM(ai.cost_usd), 0) > s."budgetDayUsd" * 0.95 THEN 'BLOCKED'
    WHEN COALESCE(SUM(ai.cost_usd), 0) > s."budgetDayUsd" * 0.9 THEN 'THROTTLED'
    ELSE 'NORMAL'
  END as finops_state
FROM sites s
LEFT JOIN ai_interactions ai ON ai.site_id = s.id 
  AND ai.created_at >= CURRENT_DATE
WHERE s.id = 'site-id-here'
GROUP BY s.id, s."budgetDayUsd";
```

**Esperado:** `finops_state = 'NORMAL'` ou `'CAUTION'`

---

### **2. Verificar Embeddings Sendo Gerados**
```sql
-- Verificar embeddings sendo gerados
SELECT COUNT(*) as embeddings_gerados
FROM queue_jobs
WHERE type LIKE 'embedding_%'
  AND data->>'sourceType' IN ('wp_post', 'wp_page')
  AND status = 'completed'
  AND created_at >= NOW() - INTERVAL '1 hour';
```

**Esperado:** `embeddings_gerados > 0`

---

### **3. Verificar Itens Pendentes Reduzidos**
```sql
-- Verificar itens pendentes após correção
SELECT COUNT(*) as pages_pending_index
FROM pages
WHERE "wpPostId" IS NOT NULL
  AND (
    "embeddingGeneratedAt" IS NULL
    OR "embeddingGeneratedAt" < "wpSyncedAt"
  );
```

**Esperado:** `pages_pending_index < 10`

---

## 📋 CHECKLIST

- [ ] FinOps status confirmado (THROTTLED/BLOCKED)
- [ ] Budget verificado e ajustado se necessário
- [ ] Custo real verificado
- [ ] Embeddings sendo gerados
- [ ] Itens pendentes reduzidos < 10
- [ ] FinOps status normalizado

---

**Status:** ✅ **RUNBOOK PRONTO**








