# 🔧 FASE 8 - ETAPA 3: ROTINAS DE MANUTENÇÃO

**Data:** Janeiro 2025  
**Fase:** 8/8 - Excelência Operacional  
**Etapa:** 3/6 - Rotinas de Manutenção (Jobs e Dados)  
**Status:** ✅ **COMPLETA**

---

## 📋 OBJETIVO DA ETAPA 3

Criar rotinas operacionais automatizadas para manter o sistema saudável:
- Limpeza de cache expirado
- Housekeeping de fila de jobs
- Reindexação incremental de conteúdo alterado
- Limpeza de embeddings antigos
- Relatórios operacionais detalhados

---

## ✅ IMPLEMENTAÇÕES REALIZADAS

### **1. Cron: Limpeza de Cache Expirado**

**Endpoint:** `GET /api/cron/ai/cleanup-cache`

**Funcionalidades:**
- ✅ Remove `ai_response_cache` com `expiresAt < now()`
- ✅ Proteção via `CRON_SECRET`
- ✅ Logs estruturados com `correlationId`
- ✅ Relatório com contadores e duração
- ✅ Idempotente (seguro executar múltiplas vezes)

**Exemplo de Resposta:**

```json
{
  "success": true,
  "correlationId": "abc-123",
  "type": "cache_cleanup",
  "timestamp": "2025-01-15T03:00:00Z",
  "result": {
    "removedCount": 1523,
    "durationMs": 245
  }
}
```

**Status:** ✅ **COMPLETO**

---

### **2. Cron: Housekeeping de QueueJob**

**Endpoint:** `GET /api/cron/ai/queue-housekeeping`

**Funcionalidades:**
- ✅ Arquiva jobs COMPLETED antigos (> 30 dias padrão)
- ✅ Arquiva jobs FAILED antigos (> 14 dias padrão)
- ✅ Recupera jobs stuck via `QueueClaim.recoverStuckJobs()`
- ✅ Retorna estatísticas da fila
- ✅ Configurável via env vars

**Configuração:**

```bash
QUEUE_KEEP_COMPLETED_DAYS=30  # Retenção de jobs completados
QUEUE_KEEP_FAILED_DAYS=14     # Retenção de jobs falhados (menor para debug)
```

**Exemplo de Resposta:**

```json
{
  "success": true,
  "correlationId": "def-456",
  "type": "queue_housekeeping",
  "timestamp": "2025-01-15T02:00:00Z",
  "result": {
    "archivedCompleted": 1250,
    "archivedFailed": 35,
    "recoveredStuck": 2,
    "currentStats": {
      "pending": 45,
      "processing": 12,
      "completed": 150,
      "failed": 8
    },
    "durationMs": 1850
  },
  "config": {
    "keepCompletedDays": 30,
    "keepFailedDays": 14
  }
}
```

**Status:** ✅ **COMPLETO**

---

### **3. Reindexação Incremental**

**Serviço:** `lib/maintenance/reindex-incremental.ts`  
**Endpoint:** `GET /api/cron/ai/reindex-incremental?limit=100`

**Funcionalidades:**
- ✅ Identifica conteúdo alterado (Pages, AIContent, Templates)
- ✅ Respeita FinOps: pula tenants THROTTLED/BLOCKED
- ✅ Limita por tenant (`REINDEX_MAX_PER_TENANT`)
- ✅ Enfileira jobs via `EmbeddingService`
- ✅ Relatório detalhado por tipo e tenant

**Estratégia de Seleção:**
- Conteúdo sem embeddings (`none`)
- Conteúdo atualizado nos últimos 7 dias
- Ordenado por `updatedAt DESC`

**Configuração:**

```bash
REINDEX_BATCH_LIMIT=100        # Limite total por execução
REINDEX_MAX_PER_TENANT=50      # Limite por tenant
```

**Exemplo de Resposta:**

```json
{
  "success": true,
  "correlationId": "ghi-789",
  "type": "reindex_incremental",
  "timestamp": "2025-01-15T06:00:00Z",
  "result": {
    "queued": 85,
    "skippedThrottled": 10,
    "skippedBlocked": 5,
    "byType": {
      "page": 60,
      "aiContent": 15,
      "template": 10
    },
    "byTenant": {
      "org-1:site-1": 45,
      "org-2:site-2": 30,
      "org-3:site-3": 10
    },
    "errors": [],
    "durationMs": 3200
  },
  "config": {
    "limit": 100,
    "maxPerTenant": 50
  }
}
```

**Status:** ✅ **COMPLETO**

---

### **4. Housekeeping de Embeddings**

**Endpoint:** `GET /api/cron/ai/embedding-housekeeping`

**Funcionalidades:**
- ✅ Conta embeddings inativos antigos
- ✅ Por padrão, NÃO deleta (apenas reporta)
- ✅ Estatísticas de embeddings ativos/inativos
- ✅ Configurável via env

**Configuração:**

```bash
EMBEDDING_KEEP_INACTIVE_DAYS=90  # Dias para considerar "antigo"
```

**Exemplo de Resposta:**

```json
{
  "success": true,
  "correlationId": "jkl-012",
  "type": "embedding_housekeeping",
  "timestamp": "2025-01-14T01:00:00Z",
  "result": {
    "inactiveChunksOldCount": 2500,
    "inactiveEmbeddingsOldCount": 850,
    "deleted": 0,
    "stats": {
      "activeChunks": 125000,
      "inactiveChunks": 5000,
      "activeEmbeddings": 45000,
      "inactiveEmbeddings": 2000
    },
    "durationMs": 850
  },
  "config": {
    "keepInactiveDays": 90,
    "deletionEnabled": false
  },
  "note": "Deletion is disabled by default."
}
```

**Status:** ✅ **COMPLETO**

---

### **5. Relatórios Operacionais**

**Formato Padrão de Resposta:**

Todos os endpoints retornam estrutura consistente:

```typescript
{
  success: boolean
  correlationId: string
  type: string // 'cache_cleanup' | 'queue_housekeeping' | etc
  timestamp: string (ISO)
  result: {
    // Métricas específicas do job
    durationMs: number
  }
  config?: {
    // Configuração usada
  }
  error?: string // Apenas em caso de falha
}
```

**Logs Estruturados:**

Todos os jobs usam `StructuredLogger`:
- `correlationId`: Único por execução
- `action`: Fase do job
- `component`: "maintenance"
- `durationMs`: Tempo de execução

**Status:** ✅ **COMPLETO**

---

### **6. Testes Obrigatórios**

**Arquivo:** `tests/maintenance/cron-endpoints.test.ts`

**Cobertura:**
- ✅ Autenticação: bloqueia sem `CRON_SECRET`
- ✅ Autenticação: bloqueia com token inválido
- ✅ Autenticação: permite com token válido
- ✅ Cleanup cache: remove apenas expirados
- ✅ Queue housekeeping: respeita retenção
- ✅ Queue housekeeping: diferentes períodos para completed/failed
- ✅ Reindex: limita por tenant
- ✅ Reindex: pula THROTTLED/BLOCKED
- ✅ Reindex: conta por tipo
- ✅ Embedding housekeeping: identifica inativos antigos
- ✅ Estrutura de relatório padronizada

**Status:** ✅ **COMPLETO**

---

### **7. Documentação Runbook**

**Arquivo:** `docs/RUNBOOKS/MAINTENANCE-JOBS.md`

**Conteúdo:**
- ✅ Visão geral dos jobs
- ✅ Autenticação e segurança
- ✅ Detalhes de cada job:
  - O que faz
  - Quando rodar
  - Configuração
  - Exemplos de execução
  - Métricas esperadas
  - Troubleshooting
- ✅ Monitoramento e alertas
- ✅ Runbook de incidentes
- ✅ Schedule recomendado (crontab)
- ✅ Checklist semanal

**Status:** ✅ **COMPLETO**

---

## 📄 ARQUIVOS CRIADOS/MODIFICADOS

### **Novos Arquivos (8):**
1. ✅ `app/api/cron/ai/cleanup-cache/route.ts` — Endpoint de limpeza de cache
2. ✅ `app/api/cron/ai/queue-housekeeping/route.ts` — Endpoint de housekeeping de fila
3. ✅ `app/api/cron/ai/reindex-incremental/route.ts` — Endpoint de reindex
4. ✅ `app/api/cron/ai/embedding-housekeeping/route.ts` — Endpoint de limpeza de embeddings
5. ✅ `lib/maintenance/reindex-incremental.ts` — Serviço de reindex
6. ✅ `tests/maintenance/cron-endpoints.test.ts` — Testes
7. ✅ `docs/RUNBOOKS/MAINTENANCE-JOBS.md` — Runbook
8. ✅ `docs/ARQUITETURA-IA/FASE-8-ETAPA-3-RELATORIO.md` — Este relatório

---

## 🔒 GARANTIAS DE SEGURANÇA

### **Autenticação:**
- ✅ Todos os endpoints protegidos por `CRON_SECRET`
- ✅ Sem acesso público
- ✅ Token verificado em cada request

### **Idempotência:**
- ✅ Rodar múltiplas vezes não causa dano
- ✅ Queries são sempre baseadas em timestamps/estados
- ✅ Sem efeitos colaterais indesejados

### **Multi-tenant:**
- ✅ Reindex respeita isolamento por tenant
- ✅ FinOps aplicado por tenant
- ✅ Sem vazamento de dados

### **Auditoria:**
- ✅ Sem deletar `ai_interactions` (auditoria crítica)
- ✅ Jobs/cache arquivados (não perdidos)
- ✅ Logs estruturados para rastreamento

---

## 📋 CHECKLIST DA ETAPA 3

### **Implementação:**
- [x] Endpoint de limpeza de cache
- [x] Endpoint de housekeeping de fila
- [x] Serviço de reindex incremental
- [x] Endpoint de reindex
- [x] Endpoint de housekeeping de embeddings
- [x] Relatórios padronizados
- [x] Logs estruturados

### **Segurança:**
- [x] Autenticação via CRON_SECRET
- [x] Idempotência garantida
- [x] Multi-tenant aware

### **Testes:**
- [x] Autenticação
- [x] Lógica de cleanup
- [x] Lógica de housekeeping
- [x] Lógica de reindex
- [x] Estrutura de relatórios

### **Documentação:**
- [x] Runbook completo
- [x] Troubleshooting
- [x] Schedule recomendado
- [x] Checklist semanal

---

## 🧪 EXEMPLOS DE USO

### **1. Executar Limpeza de Cache:**

```bash
curl -X GET \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:4000/api/cron/ai/cleanup-cache

# Resposta:
{
  "success": true,
  "correlationId": "uuid",
  "type": "cache_cleanup",
  "timestamp": "2025-01-15T03:00:00Z",
  "result": {
    "removedCount": 1523,
    "durationMs": 245
  }
}
```

---

### **2. Executar Queue Housekeeping:**

```bash
curl -X GET \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:4000/api/cron/ai/queue-housekeeping

# Resposta:
{
  "success": true,
  "result": {
    "archivedCompleted": 1250,
    "archivedFailed": 35,
    "recoveredStuck": 2,
    "currentStats": {
      "pending": 45,
      "processing": 12
    }
  }
}
```

---

### **3. Executar Reindex Incremental:**

```bash
# Com limite padrão (100)
curl -X GET \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:4000/api/cron/ai/reindex-incremental

# Com limite customizado
curl -X GET \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "http://localhost:4000/api/cron/ai/reindex-incremental?limit=200"

# Resposta:
{
  "success": true,
  "result": {
    "queued": 85,
    "skippedThrottled": 10,
    "skippedBlocked": 5,
    "byType": {
      "page": 60,
      "aiContent": 15,
      "template": 10
    }
  }
}
```

---

### **4. Executar Embedding Housekeeping:**

```bash
curl -X GET \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:4000/api/cron/ai/embedding-housekeeping

# Resposta:
{
  "success": true,
  "result": {
    "inactiveChunksOldCount": 2500,
    "deleted": 0,
    "stats": {
      "activeChunks": 125000,
      "inactiveChunks": 5000
    }
  },
  "config": {
    "deletionEnabled": false
  }
}
```

---

### **5. Erro de Autenticação:**

```bash
# Sem token
curl -X GET http://localhost:4000/api/cron/ai/cleanup-cache

# Resposta:
{
  "error": "Unauthorized"
}
# Status: 401
```

---

## 📊 MÉTRICAS ESPERADAS

### **Por Job:**

| Job | Duração Esperada | Frequência | Itens Processados |
|-----|------------------|------------|-------------------|
| cleanup-cache | 100-500ms | Diária | 500-2000 |
| queue-housekeeping | 500ms-3s | Diária | 500-2000 |
| reindex-incremental | 1-5s | A cada 6h | 50-100 |
| embedding-housekeeping | 500ms-2s | Semanal | N/A (apenas conta) |

### **Alertas Recomendados:**

- **Duração > 10s:** Alerta
- **Duração > 30s:** Crítico
- **Taxa de sucesso < 95%:** Alerta
- **recoveredStuck > 5/dia:** Alerta
- **recoveredStuck > 20/dia:** Crítico

---

## 📅 SCHEDULE RECOMENDADO

```bash
# Crontab

# Limpeza de cache - Diária às 03:00
0 3 * * * curl -H "Authorization: Bearer $CRON_SECRET" \
  http://api/cron/ai/cleanup-cache

# Queue housekeeping - Diária às 02:00
0 2 * * * curl -H "Authorization: Bearer $CRON_SECRET" \
  http://api/cron/ai/queue-housekeeping

# Reindex incremental - A cada 6 horas
0 */6 * * * curl -H "Authorization: Bearer $CRON_SECRET" \
  http://api/cron/ai/reindex-incremental

# Embedding housekeeping - Semanal (Domingo 01:00)
0 1 * * 0 curl -H "Authorization: Bearer $CRON_SECRET" \
  http://api/cron/ai/embedding-housekeeping
```

---

## ⚠️ PONTOS DE ATENÇÃO

### **1. Reindex e FinOps:**
- Reindex automático pula tenants THROTTLED/BLOCKED
- Tenants devem voltar a NORMAL para reindex automático
- Reindex manual ainda possível via API

### **2. Deleção de Embeddings:**
- Por padrão, DESABILITADA
- Apenas reporta inativos antigos
- Se habilitar, testar em staging primeiro

### **3. Retenção de Jobs:**
- COMPLETED: 30 dias (pode ajustar)
- FAILED: 14 dias (menor para debug)
- Não deletar se precisar investigar

### **4. Frequência:**
- Começar com schedule recomendado
- Ajustar baseado em carga e métricas
- Aumentar frequência se backlogs crescerem

---

## ✅ CONCLUSÃO DA ETAPA 3

### **Implementações Concluídas:**
1. ✅ Limpeza de cache expirado
2. ✅ Housekeeping de fila de jobs
3. ✅ Reindexação incremental
4. ✅ Housekeeping de embeddings
5. ✅ Relatórios operacionais
6. ✅ Testes completos
7. ✅ Runbook detalhado

### **Garantias Estabelecidas:**
- ✅ **Autenticação segura** (CRON_SECRET)
- ✅ **Idempotência** (seguro rodar múltiplas vezes)
- ✅ **Multi-tenant aware** (reindex respeita isolamento)
- ✅ **FinOps integrado** (pula tenants throttled/blocked)
- ✅ **Auditoria preservada** (sem deletar ai_interactions)
- ✅ **Logs estruturados** (rastreamento completo)

### **Benefícios:**
- ✅ Sistema limpo e saudável
- ✅ Performance mantida
- ✅ Storage otimizado
- ✅ Conteúdo sempre atualizado
- ✅ Problemas detectados e resolvidos automaticamente

---

**Status:** ✅ ETAPA 3 COMPLETA  
**Próximo:** ETAPA 4 - Qualidade com Feedback

---

**Aguardando aprovação para prosseguir para a ETAPA 4, ou prefere revisar a implementação da ETAPA 3 primeiro?**










