# 📊 FASE 7 - ETAPA 6: SLOs E SLIs

**Data:** Janeiro 2025  
**Fase:** 7/8 - Produção em Escala  
**Etapa:** 6/8 - Alertas e SLOs  
**Status:** ✅ **DEFINIDO**

---

## 📋 SLIs (Service Level Indicators)

### **1. Disponibilidade (RAG)**

**SLI:** `availability_rag_24h`

**Definição:**
```
availability_rag_24h = (total_completed / total_requests) * 100
```

**Onde:**
- `total_completed`: Contagem de `ai_interactions` com `type='rag_query'` e `status='completed'` nas últimas 24h
- `total_requests`: Contagem total de `ai_interactions` com `type='rag_query'` nas últimas 24h

**Fonte:** Tabela `ai_interactions`

---

### **2. Latência (RAG)**

**SLI:** `latency_p50_total_ms_24h`, `latency_p95_total_ms_24h`, `latency_p95_provider_ms_24h`

**Definição:**
```
latency_p50_total_ms_24h = PERCENTILE_CONT(0.50) de context::json->'timings'->>'totalMs'
latency_p95_total_ms_24h = PERCENTILE_CONT(0.95) de context::json->'timings'->>'totalMs'
latency_p95_provider_ms_24h = PERCENTILE_CONT(0.95) de context::json->'timings'->>'providerMs'
```

**Fonte:** Tabela `ai_interactions`, campo `context` (JSON)

---

### **3. Qualidade**

**SLI:** `fallback_rate_24h`, `low_confidence_rate_24h`, `avg_similarity_24h`

**Definição:**
```
fallback_rate_24h = (total_fallback / total_completed) * 100
low_confidence_rate_24h = (total_low_confidence / total_completed) * 100
avg_similarity_24h = AVG(context::json->'ragMeta'->>'averageSimilarity')
```

**Onde:**
- `total_fallback`: Contagem de `ai_interactions` com `context::json->'ragMeta'->>'fallbackUsed' = 'true'`
- `total_low_confidence`: Contagem de `ai_interactions` com `context::json->'lowConfidence' = 'true'` (se existir)

**Fonte:** Tabela `ai_interactions`, campo `context` (JSON)

---

### **4. Taxa de Erro**

**SLI:** `error_rate_24h`, `provider_error_rate_24h`

**Definição:**
```
error_rate_24h = (total_failed / total_requests) * 100
provider_error_rate_24h = (total_provider_errors / total_requests) * 100
```

**Onde:**
- `total_failed`: Contagem de `ai_interactions` com `status='failed'`
- `total_provider_errors`: Contagem de `ai_interactions` com `error_code` relacionado a provider

**Fonte:** Tabela `ai_interactions`

---

### **5. Custo**

**SLI:** `cost_daily_usd`, `cost_daily_brl`

**Definição:**
```
cost_daily_usd = SUM(cost_usd) WHERE created_at >= NOW() - INTERVAL '24 hours'
cost_daily_brl = SUM(cost_brl) WHERE created_at >= NOW() - INTERVAL '24 hours'
```

**Fonte:** Tabela `ai_interactions`

---

### **6. Queue (Jobs)**

**SLI:** `queue_pending_count`, `queue_processing_count`, `queue_failed_count`, `queue_stuck_count`, `queue_avg_duration_ms_24h`

**Definição:**
```
queue_pending_count = COUNT(*) WHERE status='pending'
queue_processing_count = COUNT(*) WHERE status='processing'
queue_failed_count = COUNT(*) WHERE status='failed'
queue_stuck_count = COUNT(*) WHERE status='processing' AND lock_expires_at < NOW()
queue_avg_duration_ms_24h = AVG(processed_at - processing_started_at) WHERE status='completed' AND processed_at >= NOW() - INTERVAL '24 hours'
```

**Fonte:** Tabela `queue_jobs`

---

## 🎯 SLOs (Service Level Objectives)

### **1. Disponibilidade**

**SLO:** `availability_rag_24h >= 99%`

**Config:** `ALERT_RAG_AVAILABILITY_MIN=0.99` (default)

**Severidade:** `HIGH`

**Ação Sugerida:** Investigar erros recentes, verificar providers, verificar DB

---

### **2. Latência**

**SLO:** 
- `latency_p95_total_ms_24h <= 2500ms`
- `latency_p95_provider_ms_24h <= 2000ms`

**Config:** 
- `ALERT_RAG_P95_TOTAL_MS_MAX=2500` (default)
- `ALERT_RAG_P95_PROVIDER_MS_MAX=2000` (default)

**Severidade:** `MEDIUM`

**Ação Sugerida:** Verificar tuning HNSW, otimizar rerank, verificar latência do provider

---

### **3. Qualidade**

**SLO:**
- `fallback_rate_24h <= 8%`
- `avg_similarity_24h >= 0.70`

**Config:**
- `ALERT_FALLBACK_RATE_MAX=0.08` (default)
- `ALERT_AVG_SIMILARITY_MIN=0.70` (default)

**Severidade:** `MEDIUM`

**Ação Sugerida:** Verificar embeddings, ajustar similarity threshold, melhorar contexto

---

### **4. Taxa de Erro**

**SLO:** `provider_error_rate_24h <= 2%`

**Config:** `ALERT_PROVIDER_ERROR_RATE_MAX=0.02` (default)

**Severidade:** `HIGH`

**Ação Sugerida:** Verificar API keys, verificar rate limits do provider, verificar conectividade

---

### **5. Custo**

**SLO:** `cost_daily_usd <= 50 USD` (global) ou por tenant

**Config:** `ALERT_DAILY_COST_USD_MAX=50` (default)

**Severidade:** `LOW`

**Ação Sugerida:** Revisar uso, otimizar modelos, verificar cache

---

### **6. Queue**

**SLO:**
- `queue_stuck_count = 0`
- `queue_avg_duration_ms_24h <= 5000ms`

**Config:**
- `ALERT_QUEUE_STUCK_MAX=0` (default)
- `ALERT_QUEUE_AVG_DURATION_MS_MAX=5000` (default)

**Severidade:** `HIGH` (stuck), `MEDIUM` (duration)

**Ação Sugerida:** Verificar workers, verificar locks, escalar workers

---

## ⚙️ Configuração via Env

```env
# Janela de tempo para métricas
ALERT_WINDOW_HOURS=24

# Disponibilidade
ALERT_RAG_AVAILABILITY_MIN=0.99

# Latência
ALERT_RAG_P95_TOTAL_MS_MAX=2500
ALERT_RAG_P95_PROVIDER_MS_MAX=2000

# Qualidade
ALERT_FALLBACK_RATE_MAX=0.08
ALERT_AVG_SIMILARITY_MIN=0.70

# Taxa de Erro
ALERT_PROVIDER_ERROR_RATE_MAX=0.02

# Custo
ALERT_DAILY_COST_USD_MAX=50

# Queue
ALERT_QUEUE_STUCK_MAX=0
ALERT_QUEUE_AVG_DURATION_MS_MAX=5000
```

---

## 📊 Métricas Adicionais (Não SLO, mas úteis)

- `total_requests_24h`: Total de requisições RAG nas últimas 24h
- `total_tokens_24h`: Total de tokens consumidos nas últimas 24h
- `provider_distribution`: Distribuição de uso por provider/model
- `top_errors`: Top 5 erros mais frequentes (sem PII)

---

## 🔄 Atualização

SLOs e SLIs devem ser revisados periodicamente (mensalmente) e ajustados conforme:
- Performance real do sistema
- Feedback dos usuários
- Custos operacionais
- Capacidade de infraestrutura









