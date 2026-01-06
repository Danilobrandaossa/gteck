# ⏸️ RUNBOOK: QUEUE STUCK

**Severidade típica:** SEV2 (se > 50 stuck) ou SEV3 (se 10-50)

**Tempo de resposta:** < 1h (SEV2) ou < 4h (SEV3)

---

## 🚨 SYMPTOMS

- ✅ Stuck jobs count > 10
- ✅ Jobs em "processing" por muito tempo (> 5min)
- ✅ Alert "QUEUE_STUCK_JOBS"
- ✅ Embeddings não sendo gerados

---

## 🔍 HOW TO CONFIRM

```bash
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health" | jq '.queue'

# {
#   "pendingCount": 500,
#   "processingCount": 25,
#   "stuckCount": 12,      ← problema!
#   "completedLast24h": 1500
# }
```

```sql
-- Jobs stuck
SELECT 
  id,
  type,
  status,
  "processingAt",
  "lockedBy",
  NOW() - "processingAt" as stuck_duration,
  "attemptCount"
FROM queue_jobs
WHERE status = 'processing'
  AND "processingAt" < NOW() - INTERVAL '5 minutes'
ORDER BY "processingAt"
LIMIT 20;
```

---

## ⚡ IMMEDIATE MITIGATION (0-15min)

### **Rodar Queue Housekeeping**

```bash
# Trigger recovery de stuck jobs
curl -X GET -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:4000/api/cron/ai/queue-housekeeping"

# {
#   "success": true,
#   "recoveredCount": 12,    ← stuck jobs recuperados
#   "archivedCompletedCount": 450,
#   "durationMs": 1234
# }

# Monitorar processamento
watch -n 10 "curl -s -H 'Authorization: Bearer $ADMIN_SECRET' \
  'http://localhost:4000/api/admin/ai/health' | jq '.queue.stuckCount'"
```

---

## 🔧 SAFE CONFIGURATION CHANGES

### **Ajustar Timeouts**

```bash
# Aumentar lock TTL
export QUEUE_LOCK_TTL_MS=600000  # 10min (era 5min)

# Aumentar heartbeat interval
export QUEUE_HEARTBEAT_INTERVAL_MS=30000  # 30s (era 60s)

# Restart worker
```

---

## 🔬 DEEP DIAGNOSIS

```sql
-- Jobs por tipo e status
SELECT 
  type,
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (NOW() - "createdAt"))) as avg_age_seconds
FROM queue_jobs
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY type, status
ORDER BY count DESC;
```

---

## 🛠️ PERMANENT FIX

### **Otimizar Worker**

```typescript
// lib/queue/worker.ts
// Processar jobs em batch
// Adicionar timeout por job
// Melhorar idempotência
```

---

## ✅ VERIFICATION

```bash
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/health" | jq '.queue.stuckCount'

# Esperado: 0
```

---

**Ver também:**
- [MAINTENANCE-JOBS.md](../MAINTENANCE-JOBS.md) — Queue housekeeping
- [FASE-7-ETAPA-4-RELATORIO.md](../../ARQUITETURA-IA/FASE-7-ETAPA-4-RELATORIO.md) — Queue implementation








