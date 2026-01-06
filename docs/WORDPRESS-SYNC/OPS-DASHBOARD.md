# 📊 OPS DASHBOARD — WordPress Sync + IA

**Data:** Janeiro 2025  
**Objetivo:** Queries SQL e endpoints para monitoramento operacional

---

## 🔗 ENDPOINTS DE HEALTH/ALERTS

### **1. WordPress Sync Health**
```bash
# Health do sync por site
curl -X GET "https://your-domain.com/api/admin/wordpress/sync-health?organizationId={orgId}&siteId={siteId}" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"

# Health agregado por organização
curl -X GET "https://your-domain.com/api/admin/wordpress/sync-health?organizationId={orgId}" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"
```

**Response:**
```json
{
  "status": "healthy",
  "lastFullSyncAt": "2025-01-24T10:00:00Z",
  "lastIncrementalSyncAt": "2025-01-24T10:15:00Z",
  "pendingQueueJobs": 5,
  "errorRate24h": 0.02,
  "syncLagMs": 300000,
  "alerts": []
}
```

---

### **2. AI Health (Inclui WP Indexing)**
```bash
curl -X GET "https://your-domain.com/api/admin/ai/health?windowHours=24" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"
```

**Response inclui:**
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

---

### **3. AI Alerts (Inclui WP)**
```bash
curl -X GET "https://your-domain.com/api/admin/ai/alerts?windowHours=24" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"
```

**Response inclui alertas WP:**
- `WP_INDEX_LAG_HIGH`
- `WP_INDEX_ERROR_RATE_HIGH`

---

## 📊 QUERIES SQL PRONTAS

### **1. Sync Lag (now - wpModifiedGmt)**

```sql
-- Lag entre WordPress e CMS (última modificação WP vs último sync)
SELECT 
  s.id as site_id,
  s.name as site_name,
  s."wpLastSyncAt",
  (
    SELECT MAX("wpSyncedAt")
    FROM pages p
    WHERE p.site_id = s.id
      AND p."wpPostId" IS NOT NULL
  ) as last_synced_page,
  EXTRACT(EPOCH FROM (
    NOW() - COALESCE(s."wpLastSyncAt", '1970-01-01'::timestamp)
  )) / 60 as sync_lag_minutes
FROM sites s
WHERE s."wpConfigured" = true
ORDER BY sync_lag_minutes DESC;
```

---

### **2. Index Lag (lastWpSyncAt vs lastWpIndexedAt)**

```sql
-- Lag entre sync e indexação
SELECT 
  s.id as site_id,
  s.name as site_name,
  s."wpLastSyncAt" as last_sync,
  (
    SELECT MAX(created_at)
    FROM embedding_chunks ec
    WHERE ec.site_id = s.id
      AND ec.source_type IN ('wp_post', 'wp_page')
      AND ec.is_active = true
  ) as last_indexed,
  EXTRACT(EPOCH FROM (
    s."wpLastSyncAt" - (
      SELECT MAX(created_at)
      FROM embedding_chunks ec
      WHERE ec.site_id = s.id
        AND ec.source_type IN ('wp_post', 'wp_page')
        AND ec.is_active = true
    )
  )) / 60 as index_lag_minutes
FROM sites s
WHERE s."wpConfigured" = true
  AND s."wpLastSyncAt" IS NOT NULL
ORDER BY index_lag_minutes DESC NULLS LAST;
```

---

### **3. Error Rate por Job Type**

```sql
-- Taxa de erro por tipo de job WP
SELECT 
  type,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'processing') as processing,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) as error_rate_percent
FROM queue_jobs
WHERE (type LIKE 'wordpress_%' OR type LIKE 'wp_%')
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY type
ORDER BY error_rate_percent DESC;
```

---

### **4. Custo por Tenant/Site**

```sql
-- Custo diário por site
SELECT 
  s.id as site_id,
  s.name as site_name,
  o.id as org_id,
  o.name as org_name,
  s."budgetDayUsd",
  s."budgetMonthUsd",
  COALESCE(SUM(ai.cost_usd), 0) as daily_cost_usd,
  COALESCE(SUM(ai.cost_brl), 0) as daily_cost_brl,
  COALESCE(
    SUM(ai.cost_usd) FILTER (WHERE ai.created_at >= DATE_TRUNC('month', NOW())),
    0
  ) as monthly_cost_usd,
  ROUND(
    (COALESCE(SUM(ai.cost_usd), 0) / NULLIF(s."budgetDayUsd", 0)) * 100,
    2
  ) as budget_percentage_daily,
  CASE 
    WHEN COALESCE(SUM(ai.cost_usd), 0) > s."budgetDayUsd" * 0.95 THEN 'BLOCKED'
    WHEN COALESCE(SUM(ai.cost_usd), 0) > s."budgetDayUsd" * 0.9 THEN 'THROTTLED'
    WHEN COALESCE(SUM(ai.cost_usd), 0) > s."budgetDayUsd" * 0.7 THEN 'CAUTION'
    ELSE 'NORMAL'
  END as finops_state
FROM sites s
JOIN organizations o ON o.id = s."organizationId"
LEFT JOIN ai_interactions ai ON ai.site_id = s.id 
  AND ai.created_at >= CURRENT_DATE
WHERE s."wpConfigured" = true
GROUP BY s.id, s.name, o.id, o.name, s."budgetDayUsd", s."budgetMonthUsd"
ORDER BY daily_cost_usd DESC;
```

---

### **5. Top CorrelationIds por Latência**

```sql
-- Top 10 correlationIds com maior latência
SELECT 
  context->>'correlationId' as correlation_id,
  COUNT(*) as interaction_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000), 2) as avg_latency_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000), 2) as p95_latency_ms,
  MAX(EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000) as max_latency_ms
FROM ai_interactions
WHERE type = 'rag_query'
  AND context->>'correlationId' IS NOT NULL
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY context->>'correlationId'
ORDER BY avg_latency_ms DESC
LIMIT 10;
```

---

### **6. Feedback Negativo por Confidence/Model/Provider**

```sql
-- Feedback negativo correlacionado com métricas RAG
SELECT 
  ai.provider,
  ai.model,
  ROUND(AVG((ai.context->>'avgSimilarity')::numeric), 3) as avg_similarity,
  COUNT(*) FILTER (WHERE af.rating = -1) as negative_feedback,
  COUNT(*) FILTER (WHERE af.rating = 1) as positive_feedback,
  ROUND(
    COUNT(*) FILTER (WHERE af.rating = -1) * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) as negative_rate_percent,
  ROUND(AVG((ai.context->>'avgSimilarity')::numeric) FILTER (WHERE af.rating = -1), 3) as avg_similarity_negative,
  ROUND(AVG((ai.context->>'avgSimilarity')::numeric) FILTER (WHERE af.rating = 1), 3) as avg_similarity_positive
FROM ai_interactions ai
LEFT JOIN ai_response_feedback af ON af."aiInteractionId" = ai.id
WHERE ai.type = 'rag_query'
  AND ai.created_at >= NOW() - INTERVAL '7 days'
GROUP BY ai.provider, ai.model
HAVING COUNT(*) > 10
ORDER BY negative_rate_percent DESC;
```

---

### **7. Itens WP Pendentes de Indexação**

```sql
-- Páginas WP aguardando indexação
SELECT 
  s.id as site_id,
  s.name as site_name,
  COUNT(*) as pages_pending_index
FROM pages p
JOIN sites s ON s.id = p.site_id
WHERE p."wpPostId" IS NOT NULL
  AND (
    p."embeddingGeneratedAt" IS NULL
    OR p."embeddingGeneratedAt" < p."wpSyncedAt"
  )
  AND s."wpConfigured" = true
GROUP BY s.id, s.name
ORDER BY pages_pending_index DESC;
```

---

### **8. Conflitos Abertos por Site**

```sql
-- Conflitos abertos por site
SELECT 
  s.id as site_id,
  s.name as site_name,
  sc."entityType",
  sc."conflictType",
  COUNT(*) as conflicts_count
FROM sync_conflicts sc
JOIN sites s ON s.id = sc."siteId"
WHERE sc."resolutionStatus" = 'open'
GROUP BY s.id, s.name, sc."entityType", sc."conflictType"
ORDER BY conflicts_count DESC;
```

---

### **9. Jobs Stuck (Lock Expirado)**

```sql
-- Jobs stuck (lock expirado há mais de 5 minutos)
SELECT 
  id,
  type,
  status,
  "lockedBy",
  "lockedAt",
  EXTRACT(EPOCH FROM (NOW() - "lockedAt")) / 60 as lock_age_minutes
FROM queue_jobs
WHERE status = 'processing'
  AND "lockedAt" IS NOT NULL
  AND "lockedAt" < NOW() - INTERVAL '5 minutes'
ORDER BY lock_age_minutes DESC;
```

---

### **10. Taxa de Fallback por Site**

```sql
-- Taxa de fallback RAG por site
SELECT 
  s.id as site_id,
  s.name as site_name,
  COUNT(*) as total_queries,
  COUNT(*) FILTER (WHERE ai."fallbackUsed" = true) as fallback_count,
  ROUND(
    COUNT(*) FILTER (WHERE ai."fallbackUsed" = true) * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) as fallback_rate_percent,
  ROUND(AVG((ai.context->>'avgSimilarity')::numeric), 3) as avg_similarity
FROM ai_interactions ai
JOIN sites s ON s.id = ai.site_id
WHERE ai.type = 'rag_query'
  AND ai.created_at >= NOW() - INTERVAL '24 hours'
  AND s."wpConfigured" = true
GROUP BY s.id, s.name
HAVING COUNT(*) > 5
ORDER BY fallback_rate_percent DESC;
```

---

### **11. Chunks WP por Site**

```sql
-- Estatísticas de chunks WP por site
SELECT 
  s.id as site_id,
  s.name as site_name,
  ec.source_type,
  COUNT(*) as total_chunks,
  COUNT(*) FILTER (WHERE ec.is_active = true) as active_chunks,
  COUNT(*) FILTER (WHERE ec.is_active = false) as inactive_chunks,
  MAX(ec.created_at) as last_chunk_created
FROM embedding_chunks ec
JOIN sites s ON s.id = ec.site_id
WHERE ec.source_type IN ('wp_post', 'wp_page')
  AND s."wpConfigured" = true
GROUP BY s.id, s.name, ec.source_type
ORDER BY total_chunks DESC;
```

---

### **12. Webhooks Recebidos vs Processados**

```sql
-- Webhooks recebidos vs processados nas últimas 24h
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as webhooks_received,
  COUNT(*) FILTER (WHERE status = 'completed') as processed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) as error_rate_percent
FROM queue_jobs
WHERE type LIKE 'wp_sync_item_%'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

---

## 📈 DASHBOARD RECOMENDADO

### **Métricas Principais (Grafana/Datadog)**
1. **Sync Lag** (minutos) — Query #1
2. **Index Lag** (minutos) — Query #2
3. **Error Rate** (%) — Query #3
4. **Custo Diário** (USD) — Query #4
5. **Fallback Rate** (%) — Query #10
6. **Webhooks/hora** — Query #12

### **Alertas Recomendados**
- Sync Lag > 30 minutos
- Index Lag > 60 minutos
- Error Rate > 5%
- Custo > 80% do budget
- Fallback Rate > 10%

---

## 🔗 LINKS ÚTEIS

- **Health Endpoints:** `/api/admin/ai/health`, `/api/admin/wordpress/sync-health`
- **Alerts:** `/api/admin/ai/alerts`
- **Runbooks:** `docs/RUNBOOKS/INCIDENTS/WORDPRESS/`

---

**Status:** ✅ **OPS DASHBOARD PRONTO**






