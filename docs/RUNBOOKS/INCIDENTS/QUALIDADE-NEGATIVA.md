# 👎 RUNBOOK: QUALIDADE NEGATIVA

**Severidade típica:** SEV2 (se > 25%) ou SEV3 (se 15-25%)

**Tempo de resposta:** < 1h (SEV2) ou < 4h (SEV3)

---

## 🚨 SYMPTOMS

- ✅ Negative feedback rate > 15% (target: < 10%)
- ✅ Alert "NEGATIVE_FEEDBACK_HIGH"
- ✅ Reclamações de usuários
- ✅ Feedback INCORRECT/INCOMPLETE alto

---

## 🔍 HOW TO CONFIRM

```bash
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights?windowDays=1" | \
  jq '{totals: .summary.totals, byReason: .summary.byReason, recommendations}'

# {
#   "totals": {
#     "negativeRate": 0.22,  ← alto!
#     "negativeCount": 45
#   },
#   "byReason": [
#     {"reason": "INCORRECT", "count": 20, "percentage": 0.13},
#     {"reason": "INCOMPLETE", "count": 15, "percentage": 0.10}
#   ],
#   "recommendations": [...]  ← seguir!
# }
```

---

## ⚡ IMMEDIATE MITIGATION (0-15min)

### **Aplicar Recomendações do Tuning Insights**

```bash
# Ver recomendações
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights?minSeverity=high" | \
  jq '.recommendations[] | {id, severity, changes}'

# Aplicar mudanças sugeridas (ex: aumentar threshold)
export RAG_CONF_HARD_THRESHOLD=0.72  # sugerido
export RAG_TOP_N=30                   # sugerido

# Restart app
```

---

## 🔧 SAFE CONFIGURATION CHANGES

### **Rodar Canary com Novos Parâmetros**

```bash
# Aplicar para 5% do tráfego via experiment
export RAG_EXPERIMENT_ID=quality-fix-001
export RAG_EXPERIMENT_CONFIG='{"trafficPercentage": 5, "config": {"RAG_TOP_N": 30}}'

# Monitorar por 2h
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights?windowDays=1" | \
  jq '.summary.totals.negativeRate'
```

---

## 🔬 DEEP DIAGNOSIS

```sql
-- Feedback negativo com contexto
SELECT 
  f.id,
  f.rating,
  f.reason,
  i.model,
  i.provider,
  i.context->'confidence'->>'level' as confidence,
  i.context->>'averageSimilarity' as similarity,
  i.context->>'chunksCount' as chunks
FROM ai_response_feedback f
JOIN ai_interactions i ON f."aiInteractionId" = i.id
WHERE f.rating = -1
  AND f."createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY f."createdAt" DESC
LIMIT 50;
```

---

## 🛠️ PERMANENT FIX

### **Seguir TUNING-PLAYBOOK.md**

```bash
# Ver playbook completo
cat docs/RUNBOOKS/TUNING-PLAYBOOK.md

# Processo:
# 1. Diagnosticar causa (INCORRECT vs INCOMPLETE vs etc)
# 2. Aplicar mudanças sugeridas
# 3. Rodar regressão
# 4. Deploy canary 5%
# 5. Monitorar 24-48h
# 6. Rollout completo
```

---

## ✅ VERIFICATION

```bash
# Rodar regressão
npm run test:rag-regression:run

# Monitorar feedback
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/feedback?rating=-1&windowDays=1" | \
  jq '.total'

# Esperado: redução de 30-50%
```

---

**Ver também:**
- [TUNING-PLAYBOOK.md](../TUNING-PLAYBOOK.md) — Processo completo
- [TUNING-DIAGNOSTICO-TAXONOMIA.md](../TUNING-DIAGNOSTICO-TAXONOMIA.md) — Diagnóstico
- [FASE-8-ETAPA-5-RELATORIO.md](../../ARQUITETURA-IA/FASE-8-ETAPA-5-RELATORIO.md) — Tuning insights








