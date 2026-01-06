# 🔄 RUNBOOK: DEPLOY COM REGRESSÃO

**Severidade típica:** SEV2 (regressão confirmada) ou SEV3 (suspeita)

**Tempo de resposta:** < 1h (SEV2) ou < 4h (SEV3)

---

## 🚨 SYMPTOMS

- ✅ Release gate falhou
- ✅ Métricas pioraram após deploy
- ✅ Alert "REGRESSION_DETECTED"
- ✅ Feedback negativo aumentou > 10% pós-deploy
- ✅ p95 aumentou > 1000ms pós-deploy

---

## 🔍 HOW TO CONFIRM

### **1. Verificar Release Gate**

```bash
# Ver último resultado do gate
cat tests/ai/reports/rag-regression.latest.json

# {
#   "summary": {
#     "passed": 35,
#     "failed": 15,  ← regressão!
#     "passRate": 0.70  ← abaixo de 90%
#   },
#   "failures": [...]
# }
```

### **2. Comparar Métricas Before/After**

```bash
# Métricas atuais
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health" | jq '.slis'

# Comparar com baseline (antes do deploy)
cat monitoring/baseline-metrics.json
```

### **3. Identificar Mudança**

```bash
# Ver commits do último deploy
git log -5 --oneline

# Ver diff de configs
git diff HEAD~1 .env
git diff HEAD~1 lib/rag-service.ts
```

---

## ⚡ IMMEDIATE MITIGATION (0-15min)

### **Rollback Imediato**

```bash
# 1. Rollback do código
git revert HEAD
# ou
git reset --hard HEAD~1

# 2. Deploy rollback
# (processo específico da infra)

# 3. Verificar métricas
watch -n 30 "curl -s -H 'Authorization: Bearer $ADMIN_SECRET' \
  'http://localhost:4000/api/admin/ai/health' | jq '.slis.quality.negative_rate'"

# Esperado: voltar ao baseline em 5-15min
```

### **Se Rollback Não é Possível (Hotfix)**

```bash
# Reverter apenas configs problemáticas
export RAG_CONF_HARD_THRESHOLD=0.68  # valor antes do deploy
export RAG_TOP_N=20                   # valor antes do deploy

# Restart app
```

---

## 🔧 SAFE CONFIGURATION CHANGES

### **Desabilitar Feature Flags/Experiments**

```bash
# Se deploy incluiu experimento
unset RAG_EXPERIMENT_ID
unset RAG_EXPERIMENT_CONFIG

# Restart app
```

---

## 🔬 DEEP DIAGNOSIS

### **1. Rodar Regressão Localmente**

```bash
# Rodar com código atual
npm run test:rag-regression:run

# Rodar com código anterior (checkout branch anterior)
git checkout HEAD~1
npm run test:rag-regression:run

# Comparar relatórios
diff tests/ai/reports/rag-regression.latest.json \
     tests/ai/reports/rag-regression.baseline.json
```

### **2. Identificar Casos Que Falharam**

```bash
# Ver apenas falhas
jq '.cases[] | select(.passed == false) | {id, reason, metrics}' \
  tests/ai/reports/rag-regression.latest.json
```

**Se falhas são em:**
- `minAvgSimilarity` → Mudança em retrieval/thresholds
- `maxTotalMs` → Mudança em performance
- `mustIncludeAny` → Mudança em qualidade de resposta

### **3. Analisar Logs de Deploy**

```bash
# Ver logs do período de deploy
# (últimos 30min)
kubectl logs -l app=cms --since=30m | grep -i error

# ou
tail -f /var/log/app.log | grep ERROR
```

---

## 🛠️ PERMANENT FIX

### **Fix 1: Corrigir Mudança Problemática**

```bash
# Identificar linha específica que causou regressão
git diff HEAD~1 lib/rag-service.ts

# Corrigir
# Rodar regressão localmente
npm run test:rag-regression:run

# Se passar (> 95%):
git commit -m "fix: corrige regressão de qualidade"
git push
```

### **Fix 2: Melhorar Dataset de Regressão**

```typescript
// tests/ai/datasets/rag-regression.json
// Adicionar casos que falharam

{
  "id": "new-case-001",
  "organizationId": "org-1",
  "siteId": "site-1",
  "question": "pergunta que falhou",
  "expected": {
    "minAvgSimilarity": 0.75,
    "maxFallbackAllowed": false
  }
}
```

### **Fix 3: Reforçar Release Gate**

```yaml
# .github/workflows/release-gate.yml
# Adicionar step de comparação com baseline

- name: Compare with baseline
  run: |
    npm run test:rag-regression:compare-baseline
    # Falha se regressão > 5%
```

---

## ✅ VERIFICATION

```bash
# 1. Rodar regressão
npm run test:rag-regression:run

# Deve passar > 95%

# 2. Verificar métricas
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health"

# Deve estar no baseline

# 3. Monitorar feedback (próximas 2h)
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/feedback?rating=-1&windowDays=1"

# negativeCount não deve aumentar
```

---

## 📝 POST-INCIDENT NOTES

### **Causas Comuns:**
1. Mudança em threshold sem validação
2. Nova feature quebrou retrieval
3. Config errada em .env
4. Dependency update (LLM SDK)
5. Experimento aplicado a 100% sem canary

### **Prevenção:**
- Release gate SEMPRE ativo
- Nunca fazer deploy direto para 100%
- Canary deployment (5% → 50% → 100%)
- Monitorar métricas por 24h pós-deploy
- Rollback automático se métricas pioram

### **Checklist Pós-Rollback:**
- [ ] Identificar causa raiz
- [ ] Corrigir código/config
- [ ] Adicionar caso ao dataset de regressão
- [ ] Rodar regressão localmente (deve passar)
- [ ] Re-deploy com canary (5% por 2h)
- [ ] Monitorar métricas
- [ ] Rollout gradual
- [ ] Atualizar baseline

---

**Ver também:**
- [RELEASE-PROCESS.md](../RELEASE-PROCESS.md) — Processo de release
- [FASE-7-ETAPA-8-RELATORIO.md](../../ARQUITETURA-IA/FASE-7-ETAPA-8-RELATORIO.md) — Regression testing
- [FASE-8-ETAPA-1-RELATORIO.md](../../ARQUITETURA-IA/FASE-8-ETAPA-1-RELATORIO.md) — Release gate








