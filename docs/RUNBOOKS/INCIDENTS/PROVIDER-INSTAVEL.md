# 🔌 RUNBOOK: PROVIDER INSTÁVEL

**Severidade típica:** SEV2 (se error rate > 30%) ou SEV3 (se 15-30%)

**Tempo de resposta:** < 1h (SEV2) ou < 4h (SEV3)

---

## 🚨 SYMPTOMS

- ✅ Provider error rate > 15% (target: < 5%)
- ✅ Timeout errors frequentes
- ✅ Alert "PROVIDER_ERROR_RATE_HIGH"
- ✅ 429 (Rate Limit) ou 503 (Service Unavailable)

---

## 🔍 HOW TO CONFIRM

```bash
# Check health por provider
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health" | jq '.providers'

# {
#   "openai": {
#     "status": "DEGRADED",
#     "errorRate": 0.35,      ← alto!
#     "avgLatencyMs": 4500
#   },
#   "gemini": {
#     "status": "HEALTHY",
#     "errorRate": 0.02,
#     "avgLatencyMs": 1200
#   }
# }
```

---

## ⚡ IMMEDIATE MITIGATION (0-15min)

### **Forçar Provider Alternativo**

```bash
# Se OpenAI instável, forçar Gemini
export PREFERRED_PROVIDER=gemini
export FALLBACK_PROVIDER=gemini
export DISABLE_OPENAI=true

# Restart app

# Monitorar error rate
watch -n 10 "curl -s -H 'Authorization: Bearer $ADMIN_SECRET' \
  'http://localhost:4000/api/admin/ai/health' | jq '.slis.availability.error_rate'"
```

**Rollback:**
```bash
unset PREFERRED_PROVIDER
unset FALLBACK_PROVIDER
unset DISABLE_OPENAI
```

---

## 🔧 SAFE CONFIGURATION CHANGES

### **Ajustar Timeouts e Retries**

```bash
# Reduzir timeout para falhar rápido
export PROVIDER_TIMEOUT_MS=5000  # era 30000

# Reduzir retries
export PROVIDER_MAX_RETRIES=1    # era 3

# Restart app
```

---

## 🔬 DEEP DIAGNOSIS

```sql
-- Erros por provider
SELECT 
  provider,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as errors,
  ROUND(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::float / COUNT(*), 3) as error_rate
FROM ai_interactions
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY provider;
```

---

## 🛠️ PERMANENT FIX

### **Implementar Circuit Breaker**

```typescript
// Ver RAG-LENTO.md para implementação completa
```

---

## ✅ VERIFICATION

```bash
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health" | jq '.slis.availability.error_rate'

# Esperado: < 0.05
```

---

**Ver também:**
- [RAG-LENTO.md](RAG-LENTO.md) — Circuit breaker implementation










