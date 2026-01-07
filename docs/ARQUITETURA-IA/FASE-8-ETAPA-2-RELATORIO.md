# 💰 FASE 8 - ETAPA 2: GESTÃO DE CUSTO POR TENANT (FINOPS)

**Data:** Janeiro 2025  
**Fase:** 8/8 - Excelência Operacional  
**Etapa:** 2/6 - Gestão de Custo por Tenant (FinOps)  
**Status:** ✅ **COMPLETA**

---

## 📋 OBJETIVO DA ETAPA 2

Implementar gestão de custo por tenant com:
- Orçamentos por tenant com múltiplos níveis de alerta
- Degradação graciosa conforme consumo (sem "cair" o produto)
- Alertas específicos por tenant
- Auditoria completa do motivo da degradação

---

## ✅ IMPLEMENTAÇÕES REALIZADAS

### **1. Níveis de Custo/Saúde do Tenant**

**Estados Definidos:**
- ✅ `NORMAL` — Uso < 70% do orçamento
- ✅ `CAUTION` — Uso >= 70% e < 90%
- ✅ `THROTTLED` — Uso >= 90% e < 100%
- ✅ `BLOCKED` — Uso >= 100%

**Configuração via Env:**

```bash
TENANT_BUDGET_WARN_PCT=0.7         # CAUTION threshold
TENANT_BUDGET_THROTTLE_PCT=0.9     # THROTTLED threshold
TENANT_BUDGET_BLOCK_PCT=1.0        # BLOCKED threshold
```

**Status:** ✅ **COMPLETO**

---

### **2. TenantCostPolicyService**

**Arquivo:** `lib/finops/tenant-cost-policy.ts`

**Funcionalidades:**
- ✅ `getSpend(org, site, window)` — Calcula gasto por janela (dia/mês)
- ✅ `getTenantSpend(org, site)` — Retorna informações completas de gasto
- ✅ `getCostState(spend)` — Determina estado (NORMAL/CAUTION/THROTTLED/BLOCKED)
- ✅ `applyDegradation(state, policy)` — Aplica ajustes baseados no estado
- ✅ `isTenantBlocked(org, site)` — Verifica bloqueio
- ✅ `getBlockedMessage(spend)` — Mensagem amigável para bloqueio

**Cálculo de Spend:**
- Baseado em `SUM(ai_interactions.costUSD)`
- Suporta janelas diárias e mensais
- Busca budgets em `site.settings.budgetDayUsd/budgetMonthUsd`

**Status:** ✅ **COMPLETO**

---

### **3. Degradação Graciosa por Estágio**

#### **NORMAL (< 70%)**
- ✅ Sem degradação
- ✅ Comportamento padrão

#### **CAUTION (70-90%)**
- ✅ Reduzir `maxTokens` em 30%
- ✅ Reduzir `topK` (5 → 3)
- ✅ Preferir modelo mais barato
- ✅ Reduzir `ef_search` (se > 40)
- ✅ Registrar: `degradationLevel=CAUTION`

#### **THROTTLED (90-100%)**
- ✅ Reduzir `maxTokens` em 50%
- ✅ Reduzir `topN` (20 → 12)
- ✅ Reduzir `topK` (5 → 2)
- ✅ Modelo mais barato obrigatório (`gpt-4o-mini`)
- ✅ `ef_search` mínimo (20)
- ✅ Aumentar `hardThreshold` (+0.05) — mais fallback, menos custo
- ✅ Registrar: `degradationLevel=THROTTLED`

#### **BLOCKED (>= 100%)**
- ✅ Bloquear chamadas ao provider (custo zero)
- ✅ Retornar mensagem amigável
- ✅ Registrar em `ai_interactions` com `type=limit_blocked` e `costUSD=0`

**Status:** ✅ **COMPLETO**

---

### **4. Integração nos Pontos Corretos**

**RagService.ragQuery():**
- ✅ Verifica estado de custo após validação de limites
- ✅ Se BLOCKED: retorna sem chamar provider
- ✅ Se CAUTION/THROTTLED: aplica degradação
- ✅ Registra política antes/depois
- ✅ Passa informações para auditoria

**Pontos de Integração:**
- ✅ `/api/rag/query` — Via RagService
- ✅ `/api/chat/query` — Via RagService
- ✅ Streaming — Decisão antes de iniciar stream

**Status:** ✅ **COMPLETO**

---

### **5. Auditoria Completa**

**Em `ai_interactions.context`:**

```json
{
  "tenantCost": {
    "state": "THROTTLED",
    "daySpendUsd": 9.50,
    "monthSpendUsd": 95.00,
    "budgetDayUsd": 10.00,
    "budgetMonthUsd": 100.00,
    "degradationActions": [
      "reduced_max_tokens_50pct",
      "cheapest_model_enforced",
      "reduced_topk_minimal",
      "reduced_topn",
      "reduced_ef_search_minimal",
      "increased_hard_threshold"
    ],
    "policyBefore": {
      "model": "gpt-4",
      "maxTokens": 1000,
      "topK": 5,
      "topN": 20
    },
    "policyAfter": {
      "model": "gpt-4o-mini",
      "maxTokens": 500,
      "topK": 2,
      "topN": 12
    }
  }
}
```

**Rastreabilidade 100%:**
- ✅ Estado do tenant no momento da query
- ✅ Gasto atual (dia/mês)
- ✅ Orçamento configurado
- ✅ Ações de degradação aplicadas
- ✅ Política antes/depois
- ✅ `correlationId` mantido

**Status:** ✅ **COMPLETO**

---

### **6. Alertas por Tenant**

**Arquivo:** `lib/finops/tenant-alerts.ts`

**Funcionalidades:**
- ✅ `evaluateTenantCostAlerts(org, site)` — Alertas para um tenant
- ✅ `evaluateAllTenantAlerts()` — Alertas para todos os tenants com budget
- ✅ `filterCriticalAlerts(alerts)` — Apenas alertas críticos
- ✅ `groupBySeverity(alerts)` — Agrupa por severidade

**Alertas Gerados:**
- ✅ `TENANT_BUDGET_CAUTION` (70-90%) — Severidade: MEDIUM
- ✅ `TENANT_BUDGET_THROTTLED` (90-100%) — Severidade: HIGH
- ✅ `TENANT_BUDGET_BLOCKED` (>= 100%) — Severidade: CRITICAL

**Status:** ✅ **COMPLETO**

---

### **7. Dashboard Mínimo**

**Endpoint:** `GET /api/admin/ai/tenant-cost`

**Proteção:** `Authorization: Bearer ADMIN_HEALTH_SECRET`

**Resposta:**

```json
{
  "timestamp": "2025-01-15T10:00:00Z",
  "stats": {
    "totalTenants": 50,
    "normalTenants": 40,
    "cautionTenants": 7,
    "throttledTenants": 2,
    "blockedTenants": 1,
    "totalDaySpend": 450.50,
    "totalMonthSpend": 12500.00,
    "criticalAlerts": 1,
    "highAlerts": 2
  },
  "top10": [
    {
      "organizationId": "org-1",
      "siteId": "site-1",
      "siteName": "Site Principal",
      "state": "THROTTLED",
      "spend": {
        "daySpendUsd": 95.00,
        "monthSpendUsd": 2500.00,
        "budgetDayUsd": 100.00,
        "budgetMonthUsd": 3000.00
      },
      "percentages": {
        "day": 95.0,
        "month": 83.3
      },
      "trend": [
        { "date": "2025-01-08", "cost": 80.00 },
        { "date": "2025-01-09", "cost": 85.00 },
        { "date": "2025-01-10", "cost": 90.00 }
      ]
    }
  ],
  "alerts": [
    {
      "id": "tenant_budget_blocked_org-2_site-5",
      "severity": "CRITICAL",
      "message": "Tenant bloqueado: orçamento esgotado",
      "organizationId": "org-2",
      "siteId": "site-5",
      "tenantName": "Site Bloqueado"
    }
  ]
}
```

**Status:** ✅ **COMPLETO**

---

### **8. Testes Obrigatórios**

**Arquivo:** `tests/finops/tenant-cost-policy.test.ts`

**Cobertura:**
- ✅ `getCostState` para todos os estados (NORMAL/CAUTION/THROTTLED/BLOCKED)
- ✅ Budget diário vs mensal (usa o mais restritivo)
- ✅ `applyDegradation` para cada estado
- ✅ Ações de degradação registradas
- ✅ Mensagens de bloqueio
- ✅ Multi-tenant isolation

**Status:** ✅ **COMPLETO**

---

## 📄 ARQUIVOS CRIADOS/MODIFICADOS

### **Novos Arquivos (5):**
1. ✅ `lib/finops/tenant-cost-policy.ts` — Service principal
2. ✅ `lib/finops/tenant-alerts.ts` — Alertas por tenant
3. ✅ `app/api/admin/ai/tenant-cost/route.ts` — API dashboard
4. ✅ `tests/finops/tenant-cost-policy.test.ts` — Testes
5. ✅ `docs/ARQUITETURA-IA/FASE-8-ETAPA-2-RELATORIO.md` — Este relatório

### **Arquivos Modificados (1):**
1. ✅ `lib/rag-service.ts` — Integração de custo e degradação

---

## 🔒 GARANTIAS DE SEGURANÇA

### **Multi-tenancy:**
- ✅ Cálculos sempre por `organizationId` + `siteId`
- ✅ Sem vazamento entre tenants
- ✅ Budgets isolados por site

### **Fail-Safe:**
- ✅ Se não há budget definido → sempre NORMAL
- ✅ Se cálculo falhar → não bloqueia (registra erro)
- ✅ BLOCKED retorna mensagem amigável (não erro HTTP)

### **Auditoria:**
- ✅ 100% das decisões são registradas
- ✅ Ações de degradação rastreáveis
- ✅ `correlationId` mantido

### **Privacidade:**
- ✅ Sem PII nos logs
- ✅ Apenas métricas agregadas

---

## 📋 CHECKLIST DA ETAPA 2

### **Implementação:**
- [x] Níveis de custo definidos
- [x] TenantCostPolicyService criado
- [x] Degradação graciosa implementada
- [x] Integração no RagService
- [x] Bloqueio em BLOCKED
- [x] Auditoria completa
- [x] Alertas por tenant
- [x] API de dashboard

### **Testes:**
- [x] Testes de estado (NORMAL/CAUTION/THROTTLED/BLOCKED)
- [x] Testes de degradação
- [x] Testes de mensagens
- [x] Testes multi-tenant

### **Documentação:**
- [x] Relatório completo
- [x] Exemplos de uso
- [x] API documentada

---

## 🧪 EXEMPLOS DE USO

### **1. Tenant em NORMAL:**

```bash
# Query normal
POST /api/rag/query
{
  "question": "Como fazer login?",
  "organizationId": "org-1",
  "siteId": "site-1"
}

# Resposta: sem degradação
{
  "answer": "Para fazer login...",
  "metadata": {
    "model": "gpt-4",
    "provider": "openai"
  },
  "usage": {
    "costUSD": 0.015
  }
}

# Auditoria:
{
  "tenantCost": {
    "state": "NORMAL",
    "daySpendUsd": 5.00,
    "budgetDayUsd": 10.00,
    "degradationActions": []
  }
}
```

---

### **2. Tenant em CAUTION:**

```bash
# Query com degradação leve
POST /api/rag/query
{
  "question": "Como fazer login?",
  "organizationId": "org-2",
  "siteId": "site-2"
}

# Resposta: degradação leve aplicada
{
  "answer": "Para fazer login...",
  "metadata": {
    "model": "gpt-4o-mini",  # Modelo mais barato
    "provider": "openai"
  },
  "usage": {
    "costUSD": 0.005  # Custo menor
  }
}

# Auditoria:
{
  "tenantCost": {
    "state": "CAUTION",
    "daySpendUsd": 7.50,
    "budgetDayUsd": 10.00,
    "degradationActions": [
      "reduced_max_tokens_30pct",
      "cheaper_model",
      "reduced_topk"
    ],
    "policyBefore": { "model": "gpt-4", "maxTokens": 1000 },
    "policyAfter": { "model": "gpt-4o-mini", "maxTokens": 700 }
  }
}
```

---

### **3. Tenant em THROTTLED:**

```bash
# Query com degradação significativa
POST /api/rag/query
{
  "question": "Como fazer login?",
  "organizationId": "org-3",
  "siteId": "site-3"
}

# Resposta: degradação pesada
{
  "answer": "Para fazer login...",
  "metadata": {
    "model": "gpt-4o-mini",  # Modelo econômico obrigatório
    "provider": "openai"
  },
  "usage": {
    "costUSD": 0.003  # Custo muito reduzido
  }
}

# Auditoria:
{
  "tenantCost": {
    "state": "THROTTLED",
    "daySpendUsd": 9.50,
    "budgetDayUsd": 10.00,
    "degradationActions": [
      "reduced_max_tokens_50pct",
      "cheapest_model_enforced",
      "reduced_topk_minimal",
      "reduced_topn",
      "increased_hard_threshold"
    ]
  }
}
```

---

### **4. Tenant em BLOCKED:**

```bash
# Query bloqueada
POST /api/rag/query
{
  "question": "Como fazer login?",
  "organizationId": "org-4",
  "siteId": "site-4"
}

# Resposta: mensagem amigável, sem custo
{
  "answer": "Limite de uso diário atingido. Por favor, tente novamente amanhã ou entre em contato com o suporte para aumentar seu limite.",
  "metadata": {
    "provider": "none",
    "model": "none",
    "fallbackUsed": false
  },
  "usage": {
    "costUSD": 0.000  # ZERO CUSTO
  }
}

# Auditoria:
{
  "type": "limit_blocked",  # Tipo especial
  "tenantCost": {
    "state": "BLOCKED",
    "daySpendUsd": 10.00,
    "budgetDayUsd": 10.00,
    "degradationActions": ["blocked_no_provider_call"]
  },
  "costUSD": 0.000
}
```

---

### **5. Dashboard de Custo:**

```bash
# Visualizar todos os tenants
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  http://localhost:4000/api/admin/ai/tenant-cost

# Resposta: top 10 + alertas + estatísticas
```

---

## 📊 MÉTRICAS ESPERADAS

### **Antes (Sem Gestão de Custo):**
- Sem controle de gasto por tenant
- Custos podem explodir sem aviso
- Não há degradação graciosa
- Bloqueio total ou nada

### **Depois (Com Gestão de Custo):**
- ✅ Controle fino por tenant
- ✅ Alertas em 70%, 90%, 100%
- ✅ Degradação graciosa (reduz custo sem quebrar)
- ✅ Bloqueio suave com mensagem amigável
- ✅ Auditoria 100% rastreável
- ✅ Dashboard de custos em tempo real

---

## ⚠️ PONTOS DE ATENÇÃO

### **1. Configuração de Budgets:**
- Definir budgets realistas por tenant
- Monitorar tendências antes de definir limites
- Ajustar conforme necessário

### **2. Thresholds:**
- Default: 70%/90%/100%
- Ajustar via env se necessário
- Testar com tenants de teste primeiro

### **3. Degradação:**
- Degradação deve ser transparente para o usuário final
- Qualidade pode diminuir levemente, mas não deve "quebrar"
- Mensagens de bloqueio devem ser amigáveis

---

## ✅ CONCLUSÃO DA ETAPA 2

### **Implementações Concluídas:**
1. ✅ Níveis de custo/saúde definidos
2. ✅ TenantCostPolicyService completo
3. ✅ Degradação graciosa implementada
4. ✅ Integração no RagService
5. ✅ Auditoria completa
6. ✅ Alertas por tenant
7. ✅ Dashboard de custos
8. ✅ Testes completos

### **Garantias Estabelecidas:**
- ✅ **Controle fino de custo por tenant**
- ✅ **Degradação graciosa sem quebrar o produto**
- ✅ **Alertas proativos (70%/90%/100%)**
- ✅ **Auditoria 100% rastreável**
- ✅ **Dashboard de visibilidade**
- ✅ **Multi-tenant seguro**

### **Benefícios:**
- ✅ Previsibilidade de custos
- ✅ Proteção contra explosão de gastos
- ✅ Experiência do usuário preservada
- ✅ Visibilidade completa
- ✅ Ações automatizadas

---

**Status:** ✅ ETAPA 2 COMPLETA  
**Próximo:** ETAPA 3 - Rotinas de Manutenção

---

**Aguardando aprovação para prosseguir para a ETAPA 3, ou prefere revisar a implementação da ETAPA 2 primeiro?**










