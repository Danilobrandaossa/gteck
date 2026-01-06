## 🎯 PLAYBOOK: TUNING DO RAG EM PRODUÇÃO

**FASE 8 - ETAPA 5**

Guia operacional para melhorar qualidade do RAG usando dados reais de feedback.

---

## 📊 1. MONITORAMENTO E SINAIS

### **Sinais de Qualidade (o que monitorar)**

| Métrica | Target | Warning | Critical | Ação |
|---------|--------|---------|----------|------|
| **negativeRate** | < 10% | 10-20% | > 20% | Investigar imediatamente |
| **fallbackRate** | < 5% | 5-10% | > 10% | Revisar retrieval ou conteúdo |
| **lowConfidenceRate** | < 15% | 15-25% | > 25% | Reindexar conteúdo |
| **avgSimilarity** | > 0.75 | 0.65-0.75 | < 0.65 | Ajustar thresholds |
| **p95 totalMs** | < 2000ms | 2000-3500ms | > 3500ms | Otimizar performance |
| **cacheHitRate** | > 40% | 20-40% | < 20% | Revisar cache TTL |

### **Como Coletar Sinais**

```bash
# 1. Dashboard de insights
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights?windowDays=7"

# 2. Filtrar por tenant específico
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights?windowDays=7&organizationId=org-1&siteId=site-1"

# 3. Apenas recomendações críticas/high
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights?minSeverity=high"
```

---

## 🔍 2. DIAGNÓSTICO POR REASON

### **INCORRECT: Respostas Incorretas**

**Hipóteses:**
1. **Retrieval fraco** (avgSimilarity < 0.70)
2. **Thresholds muito permissivos** (LOW confidence usado demais)
3. **Chunks redundantes** (diversity < 0.88)

**Como Diagnosticar:**

```bash
# Verificar correlação com similarity
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights" | jq '.correlation.negativeRateBySimilarity'

# Verificar correlação com confidence
jq '.correlation.negativeRateByConfidence'
```

**Ações:**

| Se | Fazer |
|----|-------|
| `avgSimilarity < 0.70` em 60% dos casos | Aumentar `RAG_CONF_HARD_THRESHOLD` (0.68→0.72)<br>Aumentar `RAG_TOP_N` (20→30) |
| `confidence=LOW` em 40% dos casos | Aumentar `RAG_CONF_SOFT_THRESHOLD` (0.75→0.78)<br>Aumentar `RAG_CONF_HARD_THRESHOLD` (0.68→0.72) |
| `diversity < 0.88` | Reduzir `RAG_DIVERSITY_THRESHOLD` (0.92→0.88) |

**Validação:**

```bash
# 1. Ajustar .env (ou config por tenant)
RAG_CONF_HARD_THRESHOLD=0.72
RAG_TOP_N=30

# 2. Rodar regressão
npm run test:rag-regression:run

# 3. Se passar, deploy canary 5%
# (implementar via feature flag ou routing)

# 4. Monitorar por 24h
curl "http://localhost:4000/api/admin/ai/tuning/insights?windowDays=1"

# 5. Verificar se negativeRate(INCORRECT) caiu
# Se sim: rollout 100%
# Se não: rollback
```

---

### **INCOMPLETE: Respostas Incompletas**

**Hipóteses:**
1. **maxTokens baixo** (< 1500)
2. **topK baixo** (< 3)
3. **Degradação FinOps agressiva** (THROTTLED com factor muito baixo)

**Como Diagnosticar:**

```bash
# Verificar correlação com tenantState
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights" | jq '.correlation.negativeRateByTenantState'

# Se THROTTLED tem >25% negativeRate → degradação muito agressiva
```

**Ações:**

| Se | Fazer |
|----|-------|
| Global (todos tenants) | Aumentar `DEFAULT_MAX_TOKENS` (1500→2000)<br>Aumentar `RAG_TOP_K` (3→5) |
| Apenas THROTTLED | Aumentar `THROTTLED_MAX_TOKENS_FACTOR` (0.5→0.7)<br>Aumentar `THROTTLED_TOP_K_FACTOR` (0.6→0.8) |
| Apenas BLOCKED | Revisar budgets ou usar fallback mais inteligente |

**Validação:**

```bash
# 1. Ajustar config
DEFAULT_MAX_TOKENS=2000
RAG_TOP_K=5

# 2. Rodar regressão
npm run test:rag-regression:run

# 3. Validar custo não explode
# Estimar: +20-30% custo esperado
# Verificar: budget por tenant suporta

# 4. Deploy canary
# 5. Monitorar custo real por 48h
```

---

### **TOO_SLOW: Respostas Lentas**

**Hipóteses:**
1. **Provider lento** (p95ProviderMs > 3000ms)
2. **Vector search lento** (p95VectorSearchMs > 500ms)
3. **Cache miss alto** (cacheHitRate < 30%)

**Como Diagnosticar:**

```bash
# Verificar timings
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights" | jq '.summary.performanceMetrics'

# {
#   "p95TotalMs": 3800,
#   "p95ProviderMs": 3500,  ← problema aqui!
#   "p95VectorSearchMs": 150
# }
```

**Ações:**

| Se | Fazer |
|----|-------|
| `p95ProviderMs > 3000ms` | Trocar provider: `PREFERRED_PROVIDER=gemini`<br>Ou usar modelo mais rápido: `gemini-1.5-flash` |
| `p95VectorSearchMs > 500ms` | Reduzir `RAG_EF_SEARCH_MEDIUM` (40→30)<br>Reduzir `RAG_TOP_N` (30→20) |
| `cacheHitRate < 30%` | Aumentar `AI_RESPONSE_CACHE_TTL` (1h→4h)<br>Revisar cache key (incluir variations) |

**Validação:**

```bash
# 1. A/B test com Gemini
# Rodar 10% tráfego com PREFERRED_PROVIDER=gemini

# 2. Monitorar p95
# Esperar redução para ~1800-2000ms

# 3. Validar qualidade não degrada
npm run test:rag-regression:run

# 4. Se OK: rollout 100%
```

---

### **TOO_GENERIC: Respostas Genéricas**

**Hipóteses:**
1. **Contexto redundante** (diversity < 0.85)
2. **topK muito alto** (> 5)
3. **Prompt ruim** (falta instruções de especificidade)

**Como Diagnosticar:**

```bash
# Verificar chunks médio
# Se > 5 chunks e ainda genérico → redundância

# Verificar diversity score
# Se < 0.85 → chunks muito similares
```

**Ações:**

| Se | Fazer |
|----|-------|
| `chunksUsed > 5` e genérico | Aumentar `RAG_DIVERSITY_THRESHOLD` (0.92→0.95)<br>Reduzir `RAG_TOP_K` (5→3) |
| Contexto OK mas resposta genérica | Revisar prompt system<br>Adicionar: "Seja específico e direto" |
| `confidence=MEDIUM` sem clarificação | Adicionar regra de clarificação no prompt |

**Validação:**

```bash
# 1. Ajustar diversity
RAG_DIVERSITY_THRESHOLD=0.95
RAG_TOP_K=3

# 2. Rodar regressão
npm run test:rag-regression:run

# 3. Validar respostas não ficaram incompletas
# (tradeoff: menos chunks = menos contexto)

# 4. Deploy canary
```

---

### **CONFUSING: Respostas Confusas**

**Hipóteses:**
1. **Prompt ruim** (falta clareza)
2. **Contexto mal formatado** (chunks muito longos)
3. **Modelo inadequado** (usar gpt-4 se gpt-4o-mini confuso)

**Como Diagnosticar:**

```bash
# Se confidence=HIGH e avgSimilarity > 0.80 mas confuso
# → Problema de prompt ou modelo

# Se chunks muito longos (> 1000 chars)
# → Problema de chunking
```

**Ações:**

| Se | Fazer |
|----|-------|
| Prompt | Revisar prompt system<br>Adicionar: "Responda de forma clara e estruturada" |
| Chunking | Reduzir `CHUNK_SIZE` (800→600)<br>Aumentar `CHUNK_OVERLAP` (100→150) |
| Modelo | Usar `gpt-4` ao invés de `gpt-4o-mini` para high priority |

**Validação:**

```bash
# 1. A/B test de prompt
# (necessário implementar variantes)

# 2. Validar com amostra manual
# Pedir 5-10 pessoas testarem

# 3. Rodar regressão
npm run test:rag-regression:run
```

---

## 🛠️ 3. AÇÕES TÍPICAS (Quick Reference)

### **Ajustar Thresholds**

```bash
# Mais restritivo (menos respostas LOW, mais fallback)
RAG_CONF_HARD_THRESHOLD=0.72  # (era 0.68)
RAG_CONF_SOFT_THRESHOLD=0.78  # (era 0.75)

# Mais permissivo (menos fallback, mais LOW)
RAG_CONF_HARD_THRESHOLD=0.65
RAG_CONF_SOFT_THRESHOLD=0.72
```

### **Ajustar Retrieval**

```bash
# Mais contexto (melhor qualidade, mais custo)
RAG_TOP_N=30        # (era 20)
RAG_TOP_K=5         # (era 3)

# Menos contexto (mais rápido, mais barato)
RAG_TOP_N=15
RAG_TOP_K=2
```

### **Ajustar Performance**

```bash
# Mais rápido (menos recall)
RAG_EF_SEARCH_MEDIUM=30  # (era 40)
RAG_EF_SEARCH_LOW=15     # (era 20)

# Melhor recall (mais lento)
RAG_EF_SEARCH_HIGH=100   # (era 80)
```

### **Ajustar Diversity**

```bash
# Mais diversidade (menos redundância)
RAG_DIVERSITY_THRESHOLD=0.95  # (era 0.92)

# Menos diversidade (permite chunks similares)
RAG_DIVERSITY_THRESHOLD=0.88
```

### **Ajustar FinOps**

```bash
# Menos agressivo (melhor qualidade, mais custo)
THROTTLED_MAX_TOKENS_FACTOR=0.7  # (era 0.5)
THROTTLED_TOP_K_FACTOR=0.8       # (era 0.6)

# Mais agressivo (menos custo, pior qualidade)
THROTTLED_MAX_TOKENS_FACTOR=0.4
THROTTLED_TOP_K_FACTOR=0.5
```

---

## ✅ 4. PROCESSO DE VALIDAÇÃO

### **Checklist Obrigatório**

Antes de aplicar qualquer tuning:

- [ ] **Confirmar problema** (> 7 dias de dados)
- [ ] **Segmentar** (é global ou específico de tenant?)
- [ ] **Confirmar correlação** (> 60% dos casos)
- [ ] **Formular hipótese clara**
- [ ] **Estimar impacto** (qualidade/custo/latência)
- [ ] **Documentar mudança** (TUNING_CHANGES.md)
- [ ] **Rodar regressão** (`npm run test:rag-regression:run`)
- [ ] **Deploy canary** (5-10% tráfego)
- [ ] **Monitorar 24-48h**
- [ ] **Rollout completo** se OK
- [ ] **Atualizar baseline**

### **Como Rodar Regressão**

```bash
# 1. Ajustar .env com novos valores
vi .env

# 2. Rodar regressão
npm run test:rag-regression:run

# 3. Verificar saída
# ✅ Se 100% passou: OK para deploy
# ⚠️ Se 90-99% passou: revisar falhas
# ❌ Se < 90% passou: rollback

# 4. Comparar com baseline
# Verificar: negativeRate, avgSimilarity, p95
```

### **Como Deploy Canary**

```bash
# Opção 1: Feature flag (recomendado)
# Implementar: RAG_EXPERIMENT_ID=canary-001
# Aplicar para: 5% tráfego random

# Opção 2: Tenant específico
# Selecionar 1-2 tenants piloto
# Aplicar novos valores apenas para eles

# Opção 3: Admin only
# Aplicar para: userId em admin list
# Validar manualmente antes de rollout
```

### **Métricas de Sucesso**

| Objetivo | Métrica | Target | Como Medir |
|----------|---------|--------|------------|
| Reduzir INCORRECT | negativeRate(INCORRECT) | -20-30% | Dashboard insights (windowDays=1 vs 7) |
| Aumentar completude | negativeRate(INCOMPLETE) | -15-25% | Dashboard insights |
| Melhorar latência | p95TotalMs | -20-40% | Dashboard insights performance |
| Manter custo | totalCost | +0-15% | `/api/admin/ai/tenant-cost` |

---

## 🔄 5. ROLLBACK

### **Quando Fazer Rollback**

| Sinal | Ação |
|-------|------|
| negativeRate aumentou > 5% | Rollback imediato |
| p95 aumentou > 1000ms | Rollback imediato |
| Custo aumentou > 50% | Rollback imediato |
| Fallback aumentou > 15% | Investigar, rollback se severo |

### **Como Fazer Rollback**

```bash
# 1. Reverter .env para valores anteriores
git checkout HEAD~1 .env

# 2. Restart app
# (ou hot-reload se suportado)

# 3. Rodar regressão para confirmar
npm run test:rag-regression:run

# 4. Monitorar por 1h
curl "http://localhost:4000/api/admin/ai/tuning/insights?windowDays=1"

# 5. Investigar causa raiz
# - O que mudou?
# - Por que falhou?
# - Como validar melhor na próxima?
```

---

## 🧪 6. EXPERIMENTOS CONTROLADOS

### **Setup de Experimento**

```bash
# 1. Criar configuração de experimento
cat > experiments/canary-001.json <<EOF
{
  "experimentId": "canary-001",
  "description": "Aumentar RAG_TOP_N para reduzir INCORRECT",
  "startDate": "2025-01-20",
  "targetTenants": ["org-1"],
  "trafficPercentage": 5,
  "config": {
    "RAG_TOP_N": 30,
    "RAG_TOP_K": 5,
    "RAG_CONF_HARD_THRESHOLD": 0.72
  }
}
EOF

# 2. Aplicar via env var
export RAG_EXPERIMENT_ID=canary-001
export RAG_EXPERIMENT_CONFIG='{"RAG_TOP_N":30,...}'

# 3. Registrar no ai_interactions.context
# { "experimentId": "canary-001", ... }

# 4. Monitorar experimento
curl "http://localhost:4000/api/admin/ai/tuning/insights?organizationId=org-1&windowDays=1"

# 5. Comparar com controle
# Experimento: negativeRate = 8%
# Controle: negativeRate = 12%
# Resultado: -33% ✅ Sucesso!

# 6. Rollout completo
```

---

## 📋 7. DOCUMENTAÇÃO DE MUDANÇAS

### **Template: TUNING_CHANGES.md**

```markdown
# TUNING CHANGE LOG

## 2025-01-20: Reduzir INCORRECT aumentando threshold

**Problema:**
- negativeRate(INCORRECT): 18%
- avgSimilarity < 0.70 em 65% dos casos

**Hipótese:**
- Threshold muito permissivo (LOW confidence usado demais)

**Mudanças:**
- `RAG_CONF_HARD_THRESHOLD`: 0.68 → 0.72
- `RAG_TOP_N`: 20 → 30

**Impacto Esperado:**
- Qualidade: +15-20%
- Custo: +10-15%
- Latência: +100-200ms

**Validação:**
- [x] Regressão passou (100%)
- [x] Canary 5% por 24h
- [x] negativeRate(INCORRECT) caiu para 12% (-33%)
- [x] Custo aumentou 12% (dentro do esperado)
- [x] Rollout 100%

**Resultado:**
✅ Sucesso. Manter novos valores.
```

---

## 🚨 8. INCIDENT RESPONSE

### **Qualidade Degradada (negativeRate > 25%)**

```bash
# 1. Verificar deploy recente
git log --oneline -n 10

# 2. Verificar mudanças de config
git diff HEAD~1 .env

# 3. Verificar alertas críticos
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/alerts?severity=CRITICAL"

# 4. Rollback se regressão confirmada
git checkout HEAD~1 .env && restart

# 5. Investigar causa raiz
# - Mudança de código?
# - Mudança de config?
# - Problema de infra (provider lento)?
# - Conteúdo novo indexado?
```

### **Latência Alta (p95 > 5000ms)**

```bash
# 1. Verificar provider
curl "http://localhost:4000/api/admin/ai/health" | jq '.providers'

# 2. Se provider lento → trocar
export PREFERRED_PROVIDER=gemini

# 3. Ou reduzir ef_search emergencialmente
export RAG_EF_SEARCH_MEDIUM=20  # (era 40)

# 4. Monitorar
```

### **Custo Explodindo**

```bash
# 1. Verificar top tenants
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tenant-cost"

# 2. Aplicar THROTTLED emergencialmente
# (manual ou via script)

# 3. Investigar causa
# - Tenant fazendo spam?
# - Mudança de config aumentou maxTokens?
# - Bug gerando requests duplicados?
```

---

## 🔗 9. INTEGRAÇÃO COM RELEASE GATE

Toda mudança de tuning deve passar pelo release gate:

```yaml
# .github/workflows/tuning-change.yml
name: Tuning Change Validation

on:
  push:
    paths:
      - '.env'
      - 'config/rag.ts'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test:rag-regression:run
      - name: Check alerts
        run: |
          curl -f "http://prod/api/admin/ai/alerts?severity=CRITICAL" || exit 1
```

---

## 📚 10. REFERÊNCIAS

- **Taxonomia de Diagnóstico:** `TUNING-DIAGNOSTICO-TAXONOMIA.md`
- **Feedback Guide:** `docs/GUIAS/FEEDBACK-GUIA-RAPIDO.md`
- **Release Process:** `docs/RUNBOOKS/RELEASE-PROCESS.md`
- **Maintenance Jobs:** `docs/RUNBOOKS/MAINTENANCE-JOBS.md`

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Trimestral








