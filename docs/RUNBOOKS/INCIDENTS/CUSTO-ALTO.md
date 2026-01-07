# 💰 RUNBOOK: CUSTO ALTO

**Severidade típica:** SEV1 (se > 200% budget) ou SEV2 (se 150-200%)

**Tempo de resposta:** Imediato (SEV1) ou < 1h (SEV2)

---

## 🚨 SYMPTOMS

- ✅ Daily cost > 150% do budget
- ✅ Alert "DAILY_COST_HIGH" ou "COST_EXPLOSION"
- ✅ Muitos tenants em THROTTLED/BLOCKED
- ✅ Custo por query > $0.10 (target: < $0.05)

---

## 🔍 HOW TO CONFIRM

### **1. Check Tenant Cost Dashboard**

```bash
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tenant-cost" | jq

# {
#   "topTenants": [
#     {
#       "organizationId": "org-1",
#       "dailySpend": 450.00,      ← muito alto!
#       "dailyBudget": 100.00,
#       "state": "BLOCKED",
#       "requestsToday": 15000
#     }
#   ]
# }
```

### **2. Identificar Tenant/Fonte**

```sql
-- Top tenants por custo (últimas 24h)
SELECT 
  "organizationId",
  "siteId",
  COUNT(*) as requests,
  SUM((context->'usage'->>'totalCost')::float) as total_cost,
  ROUND(AVG((context->'usage'->>'totalCost')::float)::numeric, 4) as avg_cost_per_query,
  AVG((context->'usage'->>'totalTokens')::int) as avg_tokens
FROM ai_interactions
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY "organizationId", "siteId"
ORDER BY total_cost DESC
LIMIT 10;
```

**Se 1 tenant domina:**
→ **Problema isolado** (abuso, bug, ou legítimo high volume)

**Se distribuído:**
→ **Problema global** (config errada, modelo caro, maxTokens alto)

---

## ⚡ IMMEDIATE MITIGATION (0-15min)

### **Opção 1: Reforçar Degradação FinOps**

```bash
# Tornar degradação mais agressiva
export THROTTLED_MAX_TOKENS_FACTOR=0.3  # era 0.5
export THROTTLED_TOP_K_FACTOR=0.5       # era 0.6
export BLOCKED_ALLOW_FALLBACK=true      # permitir fallback mesmo em BLOCKED

# Restart app

# Monitorar custo
watch -n 60 "curl -s -H 'Authorization: Bearer $ADMIN_SECRET' \
  'http://localhost:4000/api/admin/ai/tenant-cost' | jq '.summary.totalDailySpend'"
```

**Impacto:**
- ✅ Custo: -40-60%
- ⚠️ Qualidade: -20-30% para tenants THROTTLED

---

### **Opção 2: Usar Modelo Mais Barato**

```bash
# Forçar gemini-1.5-flash (muito mais barato que gpt-4)
export MODEL_POLICY_HIGH=gemini-1.5-flash
export MODEL_POLICY_MEDIUM=gemini-1.5-flash
export MODEL_POLICY_LOW=gemini-1.5-flash

# Restart app
```

**Impacto:**
- ✅ Custo: -60-80%
- ⚠️ Qualidade: -10-15% (validar com regressão)

---

### **Opção 3: Reduzir maxTokens Globalmente**

```bash
# Reduzir tokens máximos
export DEFAULT_MAX_TOKENS=1000  # era 2000

# Restart app
```

**Impacto:**
- ✅ Custo: -40-50%
- ⚠️ Completude: respostas mais curtas

---

### **Opção 4: Bloquear Tenant Abusivo (SEV1)**

```bash
# Se 1 tenant está causando explosão de custo

# Opção A: Via SQL (emergencial)
psql -c "UPDATE organizations 
         SET settings = jsonb_set(settings, '{aiDisabled}', 'true')
         WHERE id = 'org-abusivo';"

# Opção B: Via feature flag (se implementado)
export TENANT_BLOCKLIST=org-abusivo,org-outro

# Restart app
```

---

## 🔧 SAFE CONFIGURATION CHANGES

### **Ajustar Budgets Por Tenant**

```sql
-- Atualizar budget (se tenant legítimo mas budget baixo)
UPDATE organizations 
SET settings = jsonb_set(
  settings, 
  '{ai,dailyBudget}', 
  '500'  -- novo budget
)
WHERE id = 'org-1';
```

### **Aumentar Cache TTL**

```bash
# Reduzir chamadas ao LLM
export AI_RESPONSE_CACHE_TTL=14400  # 4h (era 1h)

# Restart app
```

**Impacto:**
- ✅ Custo: -20-40% (para queries repetidas)
- ⚠️ Staleness: cache por 4h

---

## 🔬 DEEP DIAGNOSIS

### **1. Analisar Padrão de Uso**

```sql
-- Requests por hora (últimas 24h)
SELECT 
  DATE_TRUNC('hour', "createdAt") as hour,
  COUNT(*) as requests,
  ROUND(SUM((context->'usage'->>'totalCost')::float)::numeric, 2) as cost,
  ROUND(AVG((context->'usage'->>'totalTokens')::int)::numeric, 0) as avg_tokens
FROM ai_interactions
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

**Se spike em horário específico:**
→ **Causa: Pico de tráfego** (legítimo ou ataque)

**Se constante mas alto:**
→ **Causa: Config errada** (maxTokens muito alto, modelo caro)

---

### **2. Identificar Queries Caras**

```sql
-- Top 10 queries mais caras
SELECT 
  id,
  prompt,
  model,
  (context->'usage'->>'totalTokens')::int as tokens,
  (context->'usage'->>'totalCost')::float as cost,
  "createdAt"
FROM ai_interactions
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY (context->'usage'->>'totalCost')::float DESC
LIMIT 10;
```

**Se queries têm muitos tokens:**
→ **Causa: Prompts muito longos ou maxTokens alto**

---

### **3. Verificar Uso de Modelos**

```sql
-- Custo por modelo
SELECT 
  model,
  provider,
  COUNT(*) as requests,
  ROUND(SUM((context->'usage'->>'totalCost')::float)::numeric, 2) as total_cost,
  ROUND(AVG((context->'usage'->>'totalCost')::float)::numeric, 4) as avg_cost
FROM ai_interactions
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY model, provider
ORDER BY total_cost DESC;
```

**Se gpt-4 domina:**
→ **Causa: Usando modelo caro demais**

---

## 🛠️ PERMANENT FIX

### **Fix 1: Implementar Rate Limiting Agressivo**

```typescript
// lib/finops/tenant-limits.ts
// Adicionar limite de requests por hora

export const DEFAULT_HOURLY_LIMIT = 100  // requests/hora

// Se exceder, retornar 429 (Too Many Requests)
```

---

### **Fix 2: Otimizar Model Selection**

```typescript
// lib/ai/model-policy.ts
// Usar modelo mais barato por default

export function selectModel(priority: string, budget: string): string {
  // Se budget baixo, sempre usar gemini-flash
  if (budget === 'low' || budget === 'throttled') {
    return 'gemini-1.5-flash'
  }
  
  // High priority: gemini-pro (não gpt-4, muito caro)
  if (priority === 'high') {
    return 'gemini-1.5-pro'
  }
  
  // Default: gemini-flash
  return 'gemini-1.5-flash'
}
```

---

### **Fix 3: Alertar Proativamente**

```typescript
// lib/observability/alerts.ts
// Adicionar alert de custo por tenant

{
  id: 'TENANT_COST_HIGH',
  severity: 'HIGH',
  condition: (tenant) => tenant.dailySpend > tenant.dailyBudget * 0.8,
  message: 'Tenant approaching budget (80%)',
  action: 'Apply CAUTION state'
}
```

---

## ✅ VERIFICATION

```bash
# 1. Custo deve ter caído
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tenant-cost" | \
  jq '.summary.totalDailySpend'

# Esperado: dentro do budget

# 2. Verificar tenants BLOCKED
jq '.topTenants[] | select(.state == "BLOCKED" or .state == "THROTTLED")'

# 3. Rodar regressão (se mudou modelo)
npm run test:rag-regression:run
```

---

## 📝 POST-INCIDENT NOTES

### **Causas Comuns:**
1. Tenant abusivo (bot, loop, bug)
2. Modelo muito caro (gpt-4 para tudo)
3. maxTokens muito alto (> 2000)
4. Cache não funcionando (hit rate < 20%)
5. Budgets não calibrados

### **Prevenção:**
- Monitorar custo por tenant diariamente
- Alertas em 80% do budget
- Rate limiting agressivo
- Usar modelos baratos por default
- Cache com TTL adequado

---

**Ver também:**
- [FASE-8-ETAPA-2-RELATORIO.md](../../ARQUITETURA-IA/FASE-8-ETAPA-2-RELATORIO.md) — FinOps
- `/api/admin/ai/tenant-cost` — Dashboard de custo










