# 🔧 Runbook: Maintenance Jobs

**Última atualização:** Janeiro 2025  
**Owner:** Equipe SRE  
**Fase:** FASE 8 - ETAPA 3

---

## 📋 Visão Geral

Este runbook descreve os jobs de manutenção automatizados do sistema RAG, incluindo:
- Limpeza de cache expirado
- Housekeeping de fila de jobs
- Reindexação incremental
- Limpeza de embeddings antigos

---

## 🔐 Autenticação

Todos os endpoints de manutenção são protegidos por `CRON_SECRET`:

```bash
# Header obrigatório
Authorization: Bearer ${CRON_SECRET}
```

**Configuração:**

```bash
# .env
CRON_SECRET=your-secure-secret-here
```

---

## 🧹 Job 1: Limpeza de Cache Expirado

### **Endpoint:**

```
GET /api/cron/ai/cleanup-cache
```

### **O que faz:**
- Remove registros de `ai_response_cache` com `expiresAt < now()`
- Mantém cache válido intacto
- Idempotente: rodar múltiplas vezes não causa problemas

### **Quando rodar:**
- **Frequência:** Diária
- **Horário recomendado:** 03:00 AM (baixo tráfego)

### **Exemplo de Execução:**

```bash
curl -X GET \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:4000/api/cron/ai/cleanup-cache
```

### **Resposta de Sucesso:**

```json
{
  "success": true,
  "correlationId": "uuid-here",
  "type": "cache_cleanup",
  "timestamp": "2025-01-15T03:00:00.000Z",
  "result": {
    "removedCount": 1523,
    "durationMs": 245
  }
}
```

### **Métricas Esperadas:**
- **Duração:** 100-500ms
- **Itens removidos:** Varia (depende do tráfego)
- **Frequência de falha:** < 0.1%

### **Troubleshooting:**

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| Duração > 5s | Muitos registros expirados | Aumentar frequência para 2x/dia |
| removedCount = 0 | Cache não está expirando | Verificar `expiresAt` dos registros |
| Error 401 | CRON_SECRET inválido | Verificar variável de ambiente |

---

## 📦 Job 2: Housekeeping de Fila de Jobs

### **Endpoint:**

```
GET /api/cron/ai/queue-housekeeping
```

### **O que faz:**
1. Arquiva jobs COMPLETED antigos (> 30 dias por padrão)
2. Arquiva jobs FAILED antigos (> 14 dias por padrão)
3. Recupera jobs stuck (via `recoverStuckJobs()`)
4. Retorna estatísticas da fila

### **Quando rodar:**
- **Frequência:** Diária
- **Horário recomendado:** 02:00 AM

### **Configuração:**

```bash
# .env
QUEUE_KEEP_COMPLETED_DAYS=30  # Retenção de jobs completados
QUEUE_KEEP_FAILED_DAYS=14     # Retenção de jobs falhados (menor para debug)
```

### **Exemplo de Execução:**

```bash
curl -X GET \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:4000/api/cron/ai/queue-housekeeping
```

### **Resposta de Sucesso:**

```json
{
  "success": true,
  "correlationId": "uuid-here",
  "type": "queue_housekeeping",
  "timestamp": "2025-01-15T02:00:00.000Z",
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

### **Métricas Esperadas:**
- **Duração:** 500ms - 3s
- **Jobs arquivados:** Varia
- **Jobs recuperados:** < 5 por dia (ideal: 0)

### **Troubleshooting:**

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| recoveredStuck > 10 | Workers instáveis ou travando | Investigar logs dos workers, reiniciar workers |
| archivedCompleted > 5000 | Retenção muito longa | Reduzir `QUEUE_KEEP_COMPLETED_DAYS` |
| currentStats.pending > 1000 | Workers não acompanham demanda | Escalar workers horizontalmente |
| currentStats.failed > 50 | Muitas falhas | Investigar erros comuns, corrigir código/config |

---

## 🔄 Job 3: Reindexação Incremental

### **Endpoint:**

```
GET /api/cron/ai/reindex-incremental?limit=100
```

### **O que faz:**
1. Identifica conteúdo alterado (Pages, AIContent, Templates)
2. Respeita estado de custo do tenant (pula THROTTLED/BLOCKED)
3. Enfileira jobs de embedding via `EmbeddingService`
4. Limita por tenant (`REINDEX_MAX_PER_TENANT`)

### **Quando rodar:**
- **Frequência:** A cada 6 horas
- **Horários:** 00:00, 06:00, 12:00, 18:00

### **Configuração:**

```bash
# .env
REINDEX_BATCH_LIMIT=100        # Limite total por execução
REINDEX_MAX_PER_TENANT=50      # Limite por tenant (evita dominação)
```

### **Exemplo de Execução:**

```bash
# Com limite padrão
curl -X GET \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:4000/api/cron/ai/reindex-incremental

# Com limite customizado
curl -X GET \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "http://localhost:4000/api/cron/ai/reindex-incremental?limit=200"
```

### **Resposta de Sucesso:**

```json
{
  "success": true,
  "correlationId": "uuid-here",
  "type": "reindex_incremental",
  "timestamp": "2025-01-15T06:00:00.000Z",
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

### **Métricas Esperadas:**
- **Duração:** 1-5s
- **Queued:** Varia (depende de updates)
- **Skipped:** < 10% do queued
- **Errors:** 0 (ideal)

### **Troubleshooting:**

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| queued = 0 sempre | Conteúdo não está sendo atualizado | Normal se sem mudanças |
| skippedBlocked > 20% | Muitos tenants no limite | Revisar budgets ou otimizar uso |
| errors.length > 0 | Problemas ao enfileirar | Verificar logs, investigar erros específicos |
| byTenant dominado por 1 tenant | Tenant com muitas mudanças | Normal, mas verificar se não é abuso |

---

## 🧹 Job 4: Housekeeping de Embeddings

### **Endpoint:**

```
GET /api/cron/ai/embedding-housekeeping
```

### **O que faz:**
1. Conta embeddings inativos antigos
2. **Por padrão, NÃO deleta** (apenas reporta)
3. Fornece estatísticas de embeddings ativos/inativos

### **Quando rodar:**
- **Frequência:** Semanal
- **Horário:** Domingo, 01:00 AM

### **Configuração:**

```bash
# .env
EMBEDDING_KEEP_INACTIVE_DAYS=90  # Dias para considerar "antigo"

# Para habilitar deleção (não recomendado), modificar código:
# - Descomentar seção de deleção no route.ts
```

### **Exemplo de Execução:**

```bash
curl -X GET \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:4000/api/cron/ai/embedding-housekeeping
```

### **Resposta de Sucesso:**

```json
{
  "success": true,
  "correlationId": "uuid-here",
  "type": "embedding_housekeeping",
  "timestamp": "2025-01-14T01:00:00.000Z",
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

### **Métricas Esperadas:**
- **Duração:** 500ms - 2s
- **Inativos antigos:** Varia
- **Deleted:** 0 (por padrão)

### **Troubleshooting:**

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| inactiveChunks > 50% de active | Muitas versões antigas | Considerar habilitar deleção após 90+ dias |
| stats crescendo rapidamente | Muitos updates de conteúdo | Normal, mas monitorar storage |
| Duração > 5s | Muitos registros | Otimizar queries ou adicionar índices |

---

## 📊 Monitoramento e Alertas

### **Métricas para Acompanhar:**

1. **Duração dos Jobs:**
   - Alerta se > 10s
   - Crítico se > 30s

2. **Taxa de Sucesso:**
   - Alerta se < 95%
   - Crítico se < 90%

3. **Jobs Stuck Recuperados:**
   - Alerta se > 5/dia
   - Crítico se > 20/dia

4. **Skipped por Budget:**
   - Informativo se < 10%
   - Alerta se > 20%

### **Logs Estruturados:**

Todos os jobs usam `StructuredLogger` com:
- `correlationId`: Único por execução
- `action`: Fase do job
- `component`: "maintenance"
- `durationMs`: Tempo de execução

**Exemplo:**

```json
{
  "timestamp": "2025-01-15T03:00:00.000Z",
  "level": "info",
  "message": "Cache cleanup completed",
  "correlationId": "uuid-here",
  "action": "cleanup_cache_complete",
  "component": "maintenance",
  "removedCount": 1523,
  "durationMs": 245
}
```

---

## 🚨 Runbook de Incidentes

### **Job Falhando Consistentemente:**

1. Verificar logs com `correlationId`
2. Verificar autenticação (CRON_SECRET)
3. Verificar conexão com banco
4. Verificar permissões do usuário do banco
5. Escalar para Dev se erro persistir

### **Jobs Não Executando:**

1. Verificar cron schedule
2. Verificar se endpoint está acessível
3. Verificar logs do sistema de cron
4. Verificar se `CRON_SECRET` está correto

### **Performance Degradada:**

1. Verificar carga do banco
2. Verificar número de registros sendo processados
3. Considerar aumentar frequência de jobs
4. Considerar reduzir batch size

---

## 📅 Schedule Recomendado

```bash
# Crontab exemplo

# Limpeza de cache - Diária às 03:00
0 3 * * * curl -H "Authorization: Bearer $CRON_SECRET" http://api/cron/ai/cleanup-cache

# Queue housekeeping - Diária às 02:00
0 2 * * * curl -H "Authorization: Bearer $CRON_SECRET" http://api/cron/ai/queue-housekeeping

# Reindex incremental - A cada 6 horas
0 */6 * * * curl -H "Authorization: Bearer $CRON_SECRET" http://api/cron/ai/reindex-incremental

# Embedding housekeeping - Semanal (Domingo 01:00)
0 1 * * 0 curl -H "Authorization: Bearer $CRON_SECRET" http://api/cron/ai/embedding-housekeeping

# Alertas - A cada hora (já existe da FASE 7)
0 * * * * curl -H "Authorization: Bearer $CRON_SECRET" http://api/cron/ai/alerts
```

---

## ✅ Checklist Semanal de Manutenção

- [ ] Verificar logs de todos os jobs da semana
- [ ] Verificar métricas de duração (não devem crescer)
- [ ] Verificar taxa de sucesso (deve ser > 95%)
- [ ] Verificar jobs stuck recuperados (deve ser < 35/semana)
- [ ] Verificar crescimento de storage (embeddings)
- [ ] Revisar tenants com budget issues (skipped)
- [ ] Atualizar este runbook se necessário

---

## 📚 Recursos Relacionados

- **Código:** `app/api/cron/ai/*/route.ts`
- **Serviços:** `lib/maintenance/reindex-incremental.ts`
- **Testes:** `tests/maintenance/cron-endpoints.test.ts`
- **FinOps:** `docs/ARQUITETURA-IA/FASE-8-ETAPA-2-RELATORIO.md`
- **Health/Alerts:** `docs/ARQUITETURA-IA/FASE-7-ETAPA-6-SLOS.md`

---

**Última revisão:** Janeiro 2025  
**Próxima revisão:** Março 2025








