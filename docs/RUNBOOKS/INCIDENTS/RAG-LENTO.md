# 🐌 RUNBOOK: RAG LENTO

**Severidade típica:** SEV2 (se p95 > 5000ms) ou SEV3 (se 3500-5000ms)

**Tempo de resposta:** < 1h (SEV2) ou < 4h (SEV3)

---

## 🚨 SYMPTOMS

- ✅ p95 `totalMs` > 3500ms (target: < 2000ms)
- ✅ p99 `totalMs` > 5000ms (target: < 3500ms)
- ✅ Feedback "TOO_SLOW" > 10%
- ✅ Timeout errors aumentando
- ✅ Usuários reclamando de lentidão

---

## 🔍 HOW TO CONFIRM

### **1. Check Health Dashboard**

```bash
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health" | jq '.slis.performance'

# Esperado:
# {
#   "p50_total_ms": 1500,
#   "p95_total_ms": 3800,  ← alto!
#   "p99_total_ms": 6500   ← muito alto!
# }
```

### **2. Check Alerts**

```bash
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/alerts?severity=HIGH" | jq

# Procurar:
# - "RAG_P95_HIGH"
# - "RAG_P99_CRITICAL"
```

### **3. Check Tuning Insights**

```bash
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights?windowDays=1" | \
  jq '.summary.performanceMetrics'

# {
#   "p95TotalMs": 3800,
#   "p95ProviderMs": 3500,   ← problema no provider!
#   "p95VectorSearchMs": 150  ← vector search OK
# }
```

### **4. Identificar Gargalo**

Se `p95ProviderMs` é alto (> 3000ms):
→ **Problema: Provider lento** (OpenAI/Gemini saturado ou timeout)

Se `p95VectorSearchMs` é alto (> 500ms):
→ **Problema: Vector search lento** (ef_search alto, índice desotimizado)

Se ambos OK mas `p95TotalMs` alto:
→ **Problema: Overhead** (rede, parsing, rerank, logs)

### **5. Pegar CorrelationIds de Amostra**

```sql
-- Query SQL (Prisma Studio ou psql)
SELECT 
  id,
  "createdAt",
  context->>'correlationId' as correlation_id,
  (context->'timings'->>'totalMs')::int as total_ms,
  (context->'timings'->>'providerMs')::int as provider_ms,
  (context->'timings'->>'vectorSearchMs')::int as vector_ms
FROM ai_interactions
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
  AND (context->'timings'->>'totalMs')::int > 3500
ORDER BY total_ms DESC
LIMIT 10;
```

---

## ⚡ IMMEDIATE MITIGATION (0-15min)

### **Cenário 1: Provider Lento (p95ProviderMs > 3000ms)**

**Ação:** Trocar para provider alternativo

```bash
# 1. Verificar qual provider está lento
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health" | jq '.providers'

# Se OpenAI está lento:
# 2. Forçar Gemini via env (temporário)
export PREFERRED_PROVIDER=gemini
export FALLBACK_PROVIDER=gemini

# 3. Restart app (ou hot-reload se disponível)

# 4. Monitorar p95 (esperado: cair 40-50%)
watch -n 10 "curl -s -H 'Authorization: Bearer $ADMIN_SECRET' \
  'http://localhost:4000/api/admin/ai/health' | jq '.slis.performance.p95_total_ms'"
```

**Rollback:**
```bash
unset PREFERRED_PROVIDER
unset FALLBACK_PROVIDER
# Restart app
```

---

### **Cenário 2: Vector Search Lento (p95VectorSearchMs > 500ms)**

**Ação:** Reduzir `ef_search` temporariamente

```bash
# 1. Reduzir ef_search
export RAG_EF_SEARCH_MEDIUM=30  # era 40
export RAG_EF_SEARCH_LOW=15     # era 20

# 2. Restart app

# 3. Monitorar vectorSearchMs
watch -n 10 "curl -s -H 'Authorization: Bearer $ADMIN_SECRET' \
  'http://localhost:4000/api/admin/ai/tuning/insights?windowDays=1' | \
  jq '.summary.performanceMetrics.p95VectorSearchMs'"
```

**Rollback:**
```bash
export RAG_EF_SEARCH_MEDIUM=40
export RAG_EF_SEARCH_LOW=20
# Restart app
```

**Impacto:**
- ✅ Latência: -30-40%
- ⚠️ Qualidade: -5-8% recall (aceitável para mitigação)

---

### **Cenário 3: Ambos OK, Overhead Alto**

**Ação:** Otimizações leves

```bash
# 1. Reduzir topN (menos chunks para rerank)
export RAG_TOP_N=15  # era 20

# 2. Reduzir topK (menos contexto final)
export RAG_TOP_K=3   # era 5

# 3. Restart app

# 4. Monitorar p95
```

**Rollback:**
```bash
export RAG_TOP_N=20
export RAG_TOP_K=5
# Restart app
```

**Impacto:**
- ✅ Latência: -10-15%
- ⚠️ Qualidade: -5% completude (aceitável)

---

## 🔧 SAFE CONFIGURATION CHANGES

### **Opção 1: Usar Modelo Mais Rápido**

```bash
# Para prioridade média/baixa, usar gemini-1.5-flash (muito mais rápido)
export MODEL_POLICY_MEDIUM=gemini-1.5-flash
export MODEL_POLICY_LOW=gemini-1.5-flash

# High priority continua com gpt-4

# Restart app
```

**Validação:**
```bash
# Rodar regressão para validar qualidade
npm run test:rag-regression:run

# Se passar (> 95%): OK
# Se falhar: rollback
```

---

### **Opção 2: Aumentar Cache TTL**

```bash
# Se cache hit rate está baixo (< 30%), aumentar TTL
export AI_RESPONSE_CACHE_TTL=14400  # 4h (era 1h)

# Restart app

# Monitorar cache hit rate
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health" | jq '.cache.hitRate'
```

**Impacto:**
- ✅ Latência: -20-30% (para queries repetidas)
- ⚠️ Staleness: respostas podem ficar desatualizadas por 4h

---

## 🔬 DEEP DIAGNOSIS

### **1. Analisar Distribuição de Latência**

```sql
-- Histograma de latência (última hora)
SELECT 
  CASE 
    WHEN (context->'timings'->>'totalMs')::int < 1000 THEN '< 1s'
    WHEN (context->'timings'->>'totalMs')::int < 2000 THEN '1-2s'
    WHEN (context->'timings'->>'totalMs')::int < 3000 THEN '2-3s'
    WHEN (context->'timings'->>'totalMs')::int < 5000 THEN '3-5s'
    ELSE '> 5s'
  END as latency_bucket,
  COUNT(*) as count,
  ROUND(AVG((context->'timings'->>'providerMs')::int), 0) as avg_provider_ms,
  ROUND(AVG((context->'timings'->>'vectorSearchMs')::int), 0) as avg_vector_ms
FROM ai_interactions
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY latency_bucket
ORDER BY latency_bucket;
```

### **2. Identificar Tenant/Site Específico**

```sql
-- Latência por tenant
SELECT 
  "organizationId",
  "siteId",
  COUNT(*) as requests,
  ROUND(AVG((context->'timings'->>'totalMs')::int), 0) as avg_total_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (context->'timings'->>'totalMs')::int), 0) as p95
FROM ai_interactions
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY "organizationId", "siteId"
HAVING AVG((context->'timings'->>'totalMs')::int) > 3000
ORDER BY p95 DESC
LIMIT 10;
```

Se 1 tenant domina:
→ **Problema isolado** (dados do tenant, queries complexas)

Se distribuído:
→ **Problema global** (provider, infra, config)

### **3. Verificar Correlação com Priority**

```sql
-- Latência por priority
SELECT 
  context->>'priority' as priority,
  COUNT(*) as count,
  ROUND(AVG((context->'timings'->>'totalMs')::int), 0) as avg_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (context->'timings'->>'totalMs')::int), 0) as p95
FROM ai_interactions
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY context->>'priority';
```

Se `high priority` também está lento:
→ **Problema de provider** (não adianta ajustar ef_search)

---

## 🛠️ PERMANENT FIX

### **Fix 1: Otimizar Provider Strategy**

```typescript
// lib/ai/model-policy.ts
// Adicionar fallback rápido se provider lento

export function selectProvider(priority: string, timeoutMs: number): string {
  // Se request tem timeout agressivo, usar Gemini
  if (timeoutMs < 3000) {
    return 'gemini'
  }
  
  // Se high priority e não tem restrição de tempo, usar OpenAI (melhor)
  if (priority === 'high') {
    return 'openai'
  }
  
  // Default: Gemini (mais rápido)
  return 'gemini'
}
```

---

### **Fix 2: Tuning de Vector Search**

```bash
# Se vector search está lento:

# 1. Verificar índices HNSW
psql -c "SELECT schemaname, tablename, indexname 
         FROM pg_indexes 
         WHERE tablename = 'embedding_chunks';"

# 2. Se índice está desotimizado, recriar
# (fazer em janela de baixo tráfego)

# 3. Ajustar ef_search por priority permanentemente
# Editar .env:
RAG_EF_SEARCH_HIGH=80
RAG_EF_SEARCH_MEDIUM=30
RAG_EF_SEARCH_LOW=15
```

---

### **Fix 3: Implementar Circuit Breaker**

Se provider está instável (timeout frequente):

```typescript
// lib/ai/circuit-breaker.ts
// Implementar circuit breaker para provider

class ProviderCircuitBreaker {
  private failureCount = 0
  private lastFailure: Date | null = null
  private isOpen = false

  async call<T>(fn: () => Promise<T>, provider: string): Promise<T> {
    // Se circuit aberto, usar fallback imediatamente
    if (this.isOpen) {
      throw new Error(`Circuit breaker open for ${provider}`)
    }

    try {
      const result = await fn()
      this.reset()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  private recordFailure() {
    this.failureCount++
    this.lastFailure = new Date()

    // Se > 5 falhas em 1min, abrir circuit
    if (this.failureCount > 5) {
      this.isOpen = true
      // Fechar após 30s
      setTimeout(() => this.reset(), 30000)
    }
  }

  private reset() {
    this.failureCount = 0
    this.isOpen = false
  }
}
```

---

## ✅ VERIFICATION

### **1. Monitorar Métricas (15-30min após mudança)**

```bash
# p95 deve ter melhorado
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health" | \
  jq '.slis.performance'

# Esperado:
# p95_total_ms: < 2500ms (era > 3500ms)
```

### **2. Verificar Feedback**

```bash
# TOO_SLOW deve ter reduzido
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights?windowDays=1" | \
  jq '.summary.byReason[] | select(.reason == "TOO_SLOW")'

# percentage deve ser < 0.05 (5%)
```

### **3. Rodar Regressão (se mudou config)**

```bash
npm run test:rag-regression:run

# Deve passar > 95%
```

---

## 📝 POST-INCIDENT NOTES

### **Causas Comuns:**
1. Provider OpenAI saturado (horário de pico US)
2. ef_search muito alto para volume de dados
3. Modelo muito grande (gpt-4) para prioridade baixa
4. Cache hit rate baixo (queries sempre diferentes)
5. Rede/latência de região

### **Prevenção:**
- Monitorar p95 por provider
- Tuning de ef_search por priority
- Usar modelos rápidos para low/medium priority
- Aumentar cache TTL
- Circuit breaker para providers

### **Metrics to Track:**
- p95/p99 totalMs
- p95 providerMs
- p95 vectorSearchMs
- Cache hit rate
- Feedback TOO_SLOW

---

**Ver também:**
- [PROVIDER-INSTAVEL.md](PROVIDER-INSTAVEL.md) — Se erro de provider
- [TUNING-PLAYBOOK.md](../TUNING-PLAYBOOK.md) — Processo de tuning








