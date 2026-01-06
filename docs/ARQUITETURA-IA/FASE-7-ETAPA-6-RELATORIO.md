ETAPA 6 concluída. Sistema atualizado com monitoramento ativo para produção, incluindo SLOs/SLIs definidos, health check interno e alertas configuráveis.
Implementações realizadas
1. SLOs e SLIs definidos
Arquivo: docs/ARQUITETURA-IA/FASE-7-ETAPA-6-SLOS.md
SLIs: disponibilidade, latência, qualidade, taxa de erro, custo, queue
SLOs: thresholds documentados e configuráveis via env
2. Health Snapshot (agregações)
Arquivo: lib/observability/health-snapshot.ts
Métricas: RAG, Providers, Queue, DB, Custo
Agregações baseadas em PostgreSQL
Sem PII
3. Endpoint interno de health
Arquivo: app/api/admin/ai/health/route.ts
Endpoint: GET /api/admin/ai/health
Proteção: ADMIN_HEALTH_SECRET
Retorna snapshot completo
4. Regras de alerta (thresholds)
Arquivo: lib/observability/alerts.ts
10 tipos de alertas implementados
Thresholds configuráveis via env
Safe defaults
5. Endpoint para checar alertas
Arquivo: app/api/admin/ai/alerts/route.ts
Endpoint: GET /api/admin/ai/alerts
Retorna lista de alertas ordenada por severidade
Snapshot resumido opcional
6. Cron opcional
Arquivo: app/api/cron/ai/alerts/route.ts
Endpoint: GET /api/cron/ai/alerts
Proteção: CRON_SECRET
Logs estruturados
7. Testes obrigatórios
Arquivo: tests/observability/health-snapshot.test.ts
Validação de estrutura e valores coerentes
Validação de alertas
Arquivos criados/modificados
Novos arquivos (8):
docs/ARQUITETURA-IA/FASE-7-ETAPA-6-SLOS.md — Documentação SLOs/SLIs
lib/observability/health-snapshot.ts — Serviço de snapshot
lib/observability/alerts.ts — Serviço de alertas
app/api/admin/ai/health/route.ts — Endpoint health
app/api/admin/ai/alerts/route.ts — Endpoint alertas
app/api/cron/ai/alerts/route.ts — Endpoint cron
tests/observability/health-snapshot.test.ts — Testes
docs/ARQUITETURA-IA/FASE-7-ETAPA-6-RELATORIO.md — Relatório
Checklist da ETAPA 6
[x] SLOs e SLIs documentados
[x] Health Snapshot implementado
[x] Endpoint de health criado
[x] Regras de alerta implementadas
[x] Endpoint de alertas criado
[x] Cron opcional criado
[x] Testes obrigatórios criados
Garantias estabelecidas
Existe /api/admin/ai/health retornando snapshot útil
Existe /api/admin/ai/alerts retornando alertas por regra
SLOs/SLIs documentados e alinhados com snapshot
Tudo protegido (admin/secret)
Testes passam
Status final
ETAPA 6: 100% completa
O sistema está:
Com SLOs/SLIs documentados
Com health check completo
Com alertas automáticos
Com endpoints protegidos
Com testes passando
Pronto para ETAPA 7
Documentação
Relatórios disponíveis em:
docs/ARQUITETURA-IA/FASE-7-ETAPA-6-SLOS.md — SLOs/SLIs
docs/ARQUITETURA-IA/FASE-7-ETAPA-6-RELATORIO.md — Relatório completo
ETAPA 6 concluída. Aguardando aprovação para prosseguir para a ETAPA 7 — Robustez de Resposta (anti-alucinação), ou prefere revisar a implementação da ETAPA 6 primeiro?

# 🚨 FASE 7 - ETAPA 6: ALERTAS E SLOs (PRODUÇÃO)

**Data:** Janeiro 2025  
**Fase:** 7/8 - Produção em Escala  
**Etapa:** 6/8 - Alertas e SLOs  
**Status:** ✅ **COMPLETA**

---

## 📋 OBJETIVO DA ETAPA 6

Criar monitoramento ativo para produção, com:
- SLOs (metas) e SLIs (métricas) definidos
- Alertas (thresholds) configuráveis por env
- Health check interno para status do RAG/Providers/Queue/DB
- Sem vazar PII e sem depender de UI avançada

---

## ✅ IMPLEMENTAÇÕES REALIZADAS

### **1. SLOs e SLIs Definidos**

**Arquivo:** `docs/ARQUITETURA-IA/FASE-7-ETAPA-6-SLOS.md`

**SLIs Definidos:**
- ✅ Disponibilidade RAG: `availability_rag_24h`
- ✅ Latência RAG: `latency_p50_total_ms_24h`, `latency_p95_total_ms_24h`, `latency_p95_provider_ms_24h`
- ✅ Qualidade: `fallback_rate_24h`, `avg_similarity_24h`
- ✅ Taxa de Erro: `error_rate_24h`, `provider_error_rate_24h`
- ✅ Custo: `cost_daily_usd`, `cost_daily_brl`
- ✅ Queue: `queue_pending_count`, `queue_processing_count`, `queue_failed_count`, `queue_stuck_count`, `queue_avg_duration_ms_24h`

**SLOs Definidos:**
- ✅ Disponibilidade: `>= 99%`
- ✅ Latência p95 total: `<= 2500ms`
- ✅ Latência p95 provider: `<= 2000ms`
- ✅ Fallback rate: `<= 8%`
- ✅ Taxa de erro provider: `<= 2%`
- ✅ Custo diário: `<= $50 USD`
- ✅ Queue stuck: `= 0`
- ✅ Queue avg duration: `<= 5000ms`

**Status:** ✅ **COMPLETO**

---

### **2. Health Snapshot (Agregações)**

**Arquivo:** `lib/observability/health-snapshot.ts`

**Classe:** `HealthSnapshotService`

**Métodos:**
- ✅ `generateSnapshot()` — Gera snapshot completo
- ✅ `getRAGMetrics()` — Métricas RAG
- ✅ `getProviderMetrics()` — Métricas por provider/model
- ✅ `getQueueMetrics()` — Métricas de queue
- ✅ `getDBStatus()` — Status DB
- ✅ `getCostMetrics()` — Métricas de custo

**Estrutura do Snapshot:**
```typescript
{
  timestamp: string
  windowHours: number
  rag: {
    availability24h: number
    p50TotalMs24h: number
    p95TotalMs24h: number
    p95ProviderMs24h: number
    fallbackRate24h: number
    errorRate24h: number
    avgSimilarity24h: number
    totalRequests24h: number
  }
  providers: { ... }
  queue: { ... }
  db: { ... }
  cost: { ... }
}
```

**Status:** ✅ **COMPLETO**

---

### **3. Endpoint Interno de Health**

**Arquivo:** `app/api/admin/ai/health/route.ts`

**Endpoint:** `GET /api/admin/ai/health`

**Proteção:**
- ✅ Header `Authorization: Bearer {ADMIN_HEALTH_SECRET}`
- ✅ Fallback para desenvolvimento se não configurado

**Query Params:**
- ✅ `windowHours` (opcional, default: 24)

**Response:**
- ✅ JSON com snapshot completo
- ✅ Header `x-correlation-id`

**Status:** ✅ **COMPLETO**

---

### **4. Regras de Alerta (Thresholds)**

**Arquivo:** `lib/observability/alerts.ts`

**Classe:** `AlertService`

**Método:** `evaluateAlerts()`

**Alertas Implementados:**
- ✅ `RAG_AVAILABILITY_LOW` — Disponibilidade abaixo de 99%
- ✅ `RAG_P95_TOTAL_HIGH` — P95 total acima de 2500ms
- ✅ `RAG_P95_PROVIDER_HIGH` — P95 provider acima de 2000ms
- ✅ `FALLBACK_RATE_HIGH` — Taxa de fallback acima de 8%
- ✅ `AVG_SIMILARITY_LOW` — Similaridade média abaixo de 0.70
- ✅ `PROVIDER_ERROR_RATE_HIGH` — Taxa de erro do provider acima de 2%
- ✅ `COST_DAILY_HIGH` — Custo diário acima de $50
- ✅ `QUEUE_STUCK_JOBS` — Jobs stuck > 0
- ✅ `QUEUE_AVG_DURATION_HIGH` — Duração média acima de 5000ms
- ✅ `DB_UNHEALTHY` / `DB_DEGRADED` — Status DB

**Configuração via Env:**
- ✅ Todos os thresholds configuráveis
- ✅ Safe defaults

**Status:** ✅ **COMPLETO**

---

### **5. Endpoint para Checar Alertas**

**Arquivo:** `app/api/admin/ai/alerts/route.ts`

**Endpoint:** `GET /api/admin/ai/alerts`

**Proteção:**
- ✅ Header `Authorization: Bearer {ADMIN_HEALTH_SECRET}`
- ✅ Fallback para desenvolvimento se não configurado

**Query Params:**
- ✅ `windowHours` (opcional, default: 24)
- ✅ `includeSnapshot` (opcional, default: false)

**Response:**
- ✅ JSON com lista de alertas
- ✅ Snapshot resumido (opcional)
- ✅ Header `x-correlation-id`

**Status:** ✅ **COMPLETO**

---

### **6. Cron Opcional**

**Arquivo:** `app/api/cron/ai/alerts/route.ts`

**Endpoint:** `GET /api/cron/ai/alerts`

**Proteção:**
- ✅ Header `Authorization: Bearer {CRON_SECRET}`
- ✅ Fallback para desenvolvimento se não configurado

**Função:**
- ✅ Roda snapshot + rules
- ✅ Grava no log (StructuredLogger)
- ✅ Retorna resumo de alertas

**Status:** ✅ **COMPLETO**

---

### **7. Testes Obrigatórios**

**Arquivo:** `tests/observability/health-snapshot.test.ts`

**Testes Implementados:**
- ✅ Snapshot retorna estrutura correta
- ✅ Métricas RAG com valores coerentes (0-1 para rates, >=0 para latências)
- ✅ Métricas de queue com valores coerentes
- ✅ Status DB válido
- ✅ Alertas disparam quando thresholds violados
- ✅ Alertas não disparam quando thresholds respeitados

**Status:** ✅ **COMPLETO**

---

## 📄 ARQUIVOS CRIADOS/MODIFICADOS

### **Novos Arquivos:**

1. ✅ `docs/ARQUITETURA-IA/FASE-7-ETAPA-6-SLOS.md` — Documentação de SLOs/SLIs
2. ✅ `lib/observability/health-snapshot.ts` — Serviço de snapshot
3. ✅ `lib/observability/alerts.ts` — Serviço de alertas
4. ✅ `app/api/admin/ai/health/route.ts` — Endpoint de health
5. ✅ `app/api/admin/ai/alerts/route.ts` — Endpoint de alertas
6. ✅ `app/api/cron/ai/alerts/route.ts` — Endpoint cron
7. ✅ `tests/observability/health-snapshot.test.ts` — Testes
8. ✅ `docs/ARQUITETURA-IA/FASE-7-ETAPA-6-RELATORIO.md` — Este relatório

---

## 🔒 GARANTIAS DE SEGURANÇA

### **Autorização:**
- ✅ Endpoints protegidos por secret (env)
- ✅ Fallback apenas em desenvolvimento
- ✅ Nunca expõe dados sensíveis

### **Privacidade:**
- ✅ Nunca retorna prompts/respostas completos
- ✅ Erros sanitizados (sem PII)
- ✅ Apenas agregações e metadados

### **Multi-tenancy:**
- ✅ Health é global (admin), mas pode ser filtrado por tenant no futuro
- ✅ Métricas agregadas respeitam isolamento

---

## 📋 CHECKLIST DA ETAPA 6

### **1. SLOs e SLIs:**
- [x] Documentação criada
- [x] SLIs definidos
- [x] SLOs definidos
- [x] Configuração via env documentada

### **2. Health Snapshot:**
- [x] `HealthSnapshotService` criado
- [x] Métricas RAG implementadas
- [x] Métricas Providers implementadas
- [x] Métricas Queue implementadas
- [x] Status DB implementado
- [x] Métricas de Custo implementadas

### **3. Endpoint Health:**
- [x] Endpoint criado
- [x] Autorização implementada
- [x] CorrelationId integrado
- [x] Logs estruturados

### **4. Regras de Alerta:**
- [x] `AlertService` criado
- [x] Todos os alertas implementados
- [x] Thresholds configuráveis
- [x] Safe defaults

### **5. Endpoint Alerts:**
- [x] Endpoint criado
- [x] Autorização implementada
- [x] Snapshot resumido opcional
- [x] CorrelationId integrado

### **6. Cron Opcional:**
- [x] Endpoint criado
- [x] Autorização implementada
- [x] Logs estruturados

### **7. Testes:**
- [x] Testes criados
- [x] Validação de estrutura
- [x] Validação de valores coerentes
- [x] Validação de alertas

---

## ⚠️ PONTOS DE RISCO E MITIGAÇÃO

### **1. Performance de Agregações**

**Risco:** Agregações podem ser lentas com muitos dados  
**Mitigação:**
- Índices em `created_at`, `status`, `type`
- Janela de tempo limitada (24h default)
- Cache opcional (futuro)

### **2. Falsos Positivos**

**Risco:** Alertas podem disparar incorretamente  
**Mitigação:**
- Thresholds configuráveis
- Safe defaults conservadores
- Revisão periódica de thresholds

### **3. Volume de Alertas**

**Risco:** Muitos alertas podem causar fadiga  
**Mitigação:**
- Severidade clara (LOW/MEDIUM/HIGH/CRITICAL)
- Ordenação por severidade
- Ações sugeridas claras

---

## 🧪 EXEMPLOS DE USO

### **1. Verificar Health:**

```bash
curl -X GET http://localhost:3000/api/admin/ai/health \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}" \
  -H "x-correlation-id: my-id"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-15T10:30:45.123Z",
    "windowHours": 24,
    "rag": {
      "availability24h": 0.995,
      "p50TotalMs24h": 1200,
      "p95TotalMs24h": 2300,
      "p95ProviderMs24h": 1800,
      "fallbackRate24h": 0.05,
      "errorRate24h": 0.01,
      "avgSimilarity24h": 0.75,
      "totalRequests24h": 1500
    },
    "providers": {
      "openai": {
        "gpt-4o-mini": {
          "errorRate24h": 0.01,
          "p95ProviderMs24h": 1800,
          "totalRequests24h": 1200,
          "lastErrors": []
        }
      }
    },
    "queue": {
      "pendingCount": 5,
      "processingCount": 2,
      "failedCount": 0,
      "stuckCount": 0,
      "avgJobDurationMs24h": 3500
    },
    "db": {
      "status": "healthy",
      "connectionTimeMs": 45
    },
    "cost": {
      "dailyUSD": 12.50,
      "dailyBRL": 62.50
    }
  }
}
```

### **2. Verificar Alertas:**

```bash
curl -X GET "http://localhost:3000/api/admin/ai/alerts?includeSnapshot=true" \
  -H "Authorization: Bearer ${ADMIN_HEALTH_SECRET}"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "RAG_P95_TOTAL_HIGH",
        "severity": "MEDIUM",
        "message": "RAG p95 total latency is above threshold: 2600ms",
        "metrics": {
          "p95TotalMs24h": 2600,
          "p50TotalMs24h": 1300
        },
        "suggestedAction": "Check HNSW tuning, optimize rerank, verify provider latency",
        "threshold": {
          "expected": "<= 2500ms",
          "actual": "2600ms"
        }
      }
    ],
    "snapshot": {
      "timestamp": "2025-01-15T10:30:45.123Z",
      "windowHours": 24,
      "rag": {
        "availability24h": 0.995,
        "p95TotalMs24h": 2600,
        "fallbackRate24h": 0.05
      },
      "db": {
        "status": "healthy"
      },
      "queue": {
        "stuckCount": 0,
        "pendingCount": 5
      }
    }
  }
}
```

### **3. Configurar Thresholds:**

```env
# Janela de tempo
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

# Secrets
ADMIN_HEALTH_SECRET=your-secret-here
CRON_SECRET=your-cron-secret-here
```

---

## 📊 MÉTRICAS ESPERADAS

### **Antes (Sem Monitoramento):**
- Sem visibilidade de saúde do sistema
- Sem alertas automáticos
- Sem SLOs definidos
- Dificuldade para debugar problemas

### **Depois (Com Monitoramento):**
- Health check completo disponível
- Alertas automáticos por threshold
- SLOs/SLIs documentados e medidos
- Fácil identificação de problemas

---

## 🚀 PRÓXIMOS PASSOS

### **Para Usar:**

1. Configurar secrets no `.env`:
   ```env
   ADMIN_HEALTH_SECRET=your-secret
   CRON_SECRET=your-cron-secret
   ```

2. Configurar thresholds (opcional):
   ```env
   ALERT_RAG_AVAILABILITY_MIN=0.99
   ALERT_RAG_P95_TOTAL_MS_MAX=2500
   ...
   ```

3. Chamar endpoints:
   - `GET /api/admin/ai/health` — Ver saúde
   - `GET /api/admin/ai/alerts` — Ver alertas
   - `GET /api/cron/ai/alerts` — Cron job

### **Para Integrar com Cron:**

```bash
# Adicionar ao crontab
*/15 * * * * curl -X GET "http://localhost:3000/api/cron/ai/alerts" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

---

## ✅ CONCLUSÃO DA ETAPA 6

### **Implementações Concluídas:**
1. ✅ SLOs e SLIs documentados
2. ✅ Health Snapshot implementado
3. ✅ Endpoint de health criado
4. ✅ Regras de alerta implementadas
5. ✅ Endpoint de alertas criado
6. ✅ Cron opcional criado
7. ✅ Testes obrigatórios criados

### **Garantias Estabelecidas:**
- ✅ **Existe /api/admin/ai/health retornando snapshot útil**
- ✅ **Existe /api/admin/ai/alerts retornando alertas por regra**
- ✅ **SLOs/SLIs documentados e alinhados com snapshot**
- ✅ **Tudo protegido (admin/secret)**
- ✅ **Testes passam**

### **Próxima Etapa:**
**ETAPA 7 — Robustez de Resposta (anti-alucinação)**

---

**Status:** ✅ ETAPA 6 COMPLETA  
**Próxima Ação:** Aguardar aprovação para ETAPA 7









