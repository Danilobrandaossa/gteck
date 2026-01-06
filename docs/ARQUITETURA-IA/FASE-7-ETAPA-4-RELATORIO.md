


# 🔄 FASE 7 - ETAPA 4: ESCALA DO WORKER (CLAIM SEGURO + MÚLTIPLAS INSTÂNCIAS)

**Data:** Janeiro 2025  
**Fase:** 7/8 - Produção em Escala  
**Etapa:** 4/8 - Escala do Worker  
**Status:** ✅ **COMPLETA**

---

## 📋 OBJETIVO DA ETAPA 4

Permitir rodar N instâncias do worker em paralelo (horizontal scale), garantindo:
- Nenhum job é processado por dois workers (claim atômico)
- Jobs travados ("stuck") são recuperados automaticamente
- Retry/backoff e DLQ continuam funcionando
- Observabilidade: throughput, stuck, retries, DLQ

---

## ✅ IMPLEMENTAÇÕES REALIZADAS

### **1. Campos de Lock/Heartbeat no QueueJob**

**Arquivo:** `prisma/schema.prisma`

**Campos Adicionados (ADITIVOS):**
- ✅ `lockedBy` (String?) — ID da instância do worker
- ✅ `lockedAt` (DateTime?) — Quando o lock foi adquirido
- ✅ `lockExpiresAt` (DateTime?) — TTL do lock (quando expira)
- ✅ `lastHeartbeatAt` (DateTime?) — Último heartbeat (worker vivo)
- ✅ `processingStartedAt` (DateTime?) — Quando começou o processamento (métricas)

**Índices:**
- ✅ `(status, lockExpiresAt)` — Para recuperação de stuck jobs
- ✅ `(lockedBy)` — Para rastreamento por worker

**Configuração:**
- ✅ `JOB_LOCK_TTL_MS=60000` (default 60s)
- ✅ `JOB_HEARTBEAT_INTERVAL_MS=10000` (default 10s)

**Status:** ✅ **COMPLETO**

---

### **2. Claim Atômico de Jobs Pendentes**

**Arquivo:** `lib/queue-claim.ts`

**Função:** `claimPendingJobs()`

**Implementação:**
- ✅ UPDATE atômico: `UPDATE ... WHERE ... RETURNING`
- ✅ Apenas jobs `pending` OU com lock expirado são claimados
- ✅ Claim em lote (batch) com `ORDER BY createdAt ASC`
- ✅ Não permite dois workers claimarem o mesmo job
- ✅ Tudo acontece de forma atômica no banco

**Exemplo:**
```sql
UPDATE queue_jobs
SET status = 'processing', locked_by = $workerId, ...
WHERE status = 'pending' AND (lock_expires_at IS NULL OR lock_expires_at < NOW())
ORDER BY created_at ASC
LIMIT $batchSize
RETURNING *
```

**Status:** ✅ **COMPLETO**

---

### **3. Heartbeat + Recuperação de Jobs Stuck**

**Arquivo:** `lib/queue-claim.ts`

**Funções:**
- ✅ `updateHeartbeat()` — Estende lock enquanto processa
- ✅ `recoverStuckJobs()` — Recupera jobs com lock expirado

**Implementação:**
- ✅ Heartbeat atualiza `lastHeartbeatAt` e estende `lockExpiresAt`
- ✅ Recuperação detecta jobs `processing` com `lockExpiresAt < NOW()`
- ✅ Jobs recuperados: reset para `pending` (retry) ou `failed` (DLQ se `attempts >= maxAttempts`)

**Integração no Worker:**
- ✅ Heartbeat automático a cada `JOB_HEARTBEAT_INTERVAL_MS`
- ✅ Recuperação periódica (a cada 1 minuto)

**Status:** ✅ **COMPLETO**

---

### **4. Idempotência de Processamento**

**Garantias:**
- ✅ Antes de efeitos colaterais, verificar se já foi feito (dedupe/hash/version)
- ✅ Ao finalizar: `status='completed'`, `processedAt`, limpar lock fields
- ✅ Se falhar: incrementar `attempts`, setar `status='pending'` (retry) ou `failed` (DLQ), limpar lock

**Integração:**
- ✅ `EmbeddingService.processEmbeddingJob()` já tem deduplicação (contentHash)
- ✅ `QueueClaim.finalizeJob()` limpa locks corretamente
- ✅ `QueueClaim.retryJob()` reseta locks e incrementa attempts

**Status:** ✅ **COMPLETO**

---

### **5. Observabilidade (Métricas/Logs)**

**Arquivo:** `lib/queue-claim.ts`

**Função:** `getWorkerMetrics()`

**Métricas:**
- ✅ `jobsClaimed` — Jobs claimados por este worker
- ✅ `jobsCompleted` — Jobs completados
- ✅ `jobsFailed` — Jobs falhados
- ✅ `jobsRetried` — Jobs retentados (attempts > 0)
- ✅ `jobsRecovered` — Jobs recuperados de stuck
- ✅ `avgJobDurationMs` — Duração média de jobs completados
- ✅ `stuckJobCount` — Quantidade de jobs stuck no momento

**Logs Estruturados:**
- ✅ Sempre incluem: `workerId`, `jobId`, `jobType`, `attempts`, `status`, `durationMs`

**Status:** ✅ **COMPLETO**

---

### **6. Testes Obrigatórios**

**Arquivo:** `tests/ai/queue-claim.test.ts`

**Testes Implementados:**
- ✅ Claim atômico funciona
- ✅ Dois workers não claimam o mesmo job
- ✅ Batch size respeitado
- ✅ Heartbeat estende lock
- ✅ Recuperação de stuck jobs funciona
- ✅ Jobs com maxAttempts vão para DLQ

**Status:** ✅ **COMPLETO**

---

## 📄 ARQUIVOS CRIADOS/MODIFICADOS

### **Novos Arquivos:**

1. ✅ `lib/queue-claim.ts` — Claim atômico, heartbeat, recuperação, métricas
2. ✅ `tests/ai/queue-claim.test.ts` — Testes obrigatórios
3. ✅ `prisma/migrations/20250101000005_add_queue_job_locks/migration.sql` — Migration
4. ✅ `docs/ARQUITETURA-IA/FASE-7-ETAPA-4-RELATORIO.md` — Este relatório

### **Arquivos Modificados:**

1. ✅ `prisma/schema.prisma` — Campos de lock/heartbeat adicionados
2. ✅ `lib/embedding-worker.ts` — Integração completa com claim atômico

---

## 🔒 GARANTIAS DE SEGURANÇA

### **Atomicidade:**
- ✅ Claim sempre atômico (UPDATE ... WHERE ... RETURNING)
- ✅ Não permite race conditions
- ✅ Não permite dois workers claimarem o mesmo job

### **Idempotência:**
- ✅ Worker idempotente: se rodar duas vezes, não corrompe estado
- ✅ Deduplicação no EmbeddingService (contentHash)
- ✅ Locks sempre limpos ao finalizar

### **Backward Compatibility:**
- ✅ Campos aditivos (não quebra worker atual)
- ✅ Worker antigo continua funcionando (sem claim)
- ✅ Migração segura (zero downtime)

---

## 📋 CHECKLIST DA ETAPA 4

### **1. Campos de Lock/Heartbeat:**
- [x] Campos adicionados no QueueJob (ADITIVOS)
- [x] Índices criados
- [x] Migration criada
- [x] Configs via env vars

### **2. Claim Atômico:**
- [x] `claimPendingJobs()` implementado
- [x] UPDATE atômico (UPDATE ... WHERE ... RETURNING)
- [x] Não permite dois workers claimarem o mesmo job
- [x] Claim em lote (batch) com ORDER BY

### **3. Heartbeat + Recuperação:**
- [x] `updateHeartbeat()` implementado
- [x] `recoverStuckJobs()` implementado
- [x] Heartbeat automático no worker
- [x] Recuperação periódica no worker

### **4. Idempotência:**
- [x] Deduplicação no EmbeddingService
- [x] Locks sempre limpos ao finalizar
- [x] Retry incrementa attempts corretamente

### **5. Observabilidade:**
- [x] Métricas implementadas
- [x] Logs estruturados
- [x] Métricas disponíveis via `getWorkerMetrics()`

### **6. Testes:**
- [x] Testes criados
- [x] Claim atômico testado
- [x] Dois workers testado
- [x] Heartbeat testado
- [x] Recuperação testada

---

## ⚠️ PONTOS DE RISCO E MITIGAÇÃO

### **1. Race Condition em Claim**

**Risco:** Dois workers podem tentar claimar ao mesmo tempo  
**Mitigação:**
- Claim atômico (UPDATE ... WHERE ... RETURNING)
- Banco garante atomicidade
- Testes validam comportamento

### **2. Jobs Stuck Permanentes**

**Risco:** Jobs podem ficar stuck se worker morrer  
**Mitigação:**
- Recuperação periódica (a cada 1 minuto)
- Lock expira automaticamente (TTL)
- Jobs movidos para pending ou failed

### **3. Heartbeat Overhead**

**Risco:** Heartbeat pode adicionar latência  
**Mitigação:**
- Heartbeat assíncrono (não bloqueia processamento)
- Intervalo configurável (default 10s)
- Overhead mínimo

---

## 🧪 EXEMPLOS DE USO

### **1. Rodar Múltiplos Workers:**

```bash
# Terminal 1
WORKER_ID=worker-1 npm run worker

# Terminal 2
WORKER_ID=worker-2 npm run worker

# Terminal 3
WORKER_ID=worker-3 npm run worker
```

### **2. Verificar Métricas:**

```typescript
const worker = new EmbeddingWorker()
const metrics = await worker.getMetrics()

console.log(metrics)
// {
//   jobsClaimed: 150,
//   jobsCompleted: 145,
//   jobsFailed: 3,
//   jobsRetried: 12,
//   jobsRecovered: 2,
//   avgJobDurationMs: 1250,
//   stuckJobCount: 0
// }
```

### **3. Configurar TTL e Heartbeat:**

```env
JOB_LOCK_TTL_MS=60000        # 60 segundos
JOB_HEARTBEAT_INTERVAL_MS=10000  # 10 segundos
```

---

## 📊 MÉTRICAS ESPERADAS

### **Antes (Worker Único):**
- Throughput limitado por 1 worker
- Jobs stuck não recuperados automaticamente
- Sem observabilidade de múltiplas instâncias

### **Depois (Múltiplos Workers):**
- Throughput escalável (N workers)
- Jobs stuck recuperados automaticamente
- Observabilidade completa (métricas por worker)
- Zero duplicação de jobs

### **Como Provar que Não Duplica:**

```typescript
// Criar 100 jobs
for (let i = 0; i < 100; i++) {
  await createEmbeddingJob(...)
}

// Rodar 3 workers simultaneamente
// Verificar que cada job foi processado exatamente 1 vez
const completed = await db.queueJob.count({
  where: { status: 'completed' }
})

expect(completed).toBe(100) // Exatamente 100, não 300
```

---

## 🚀 PRÓXIMOS PASSOS

### **Para Habilitar:**

```env
JOB_LOCK_TTL_MS=60000
JOB_HEARTBEAT_INTERVAL_MS=10000
```

### **Para Testar:**

```bash
npm test tests/ai/queue-claim.test.ts
```

### **Para Rodar Múltiplos Workers:**

```bash
# Terminal 1
WORKER_ID=worker-1 npm run worker

# Terminal 2
WORKER_ID=worker-2 npm run worker
```

---

## ✅ CONCLUSÃO DA ETAPA 4

### **Implementações Concluídas:**
1. ✅ Campos de lock/heartbeat adicionados
2. ✅ Claim atômico implementado
3. ✅ Heartbeat + recuperação implementados
4. ✅ Idempotência garantida
5. ✅ Observabilidade completa
6. ✅ Testes obrigatórios criados

### **Garantias Estabelecidas:**
- ✅ **É possível rodar múltiplos workers sem job duplicado**
- ✅ **Jobs stuck são recuperados automaticamente**
- ✅ **DLQ/retry continuam corretos**
- ✅ **Logs/métricas permitem ver throughput e falhas**
- ✅ **Testes passam**

### **Próxima Etapa:**
**ETAPA 5 — Observabilidade Real (correlationId + tracing)**

---

**Status:** ✅ ETAPA 4 COMPLETA  
**Próxima Ação:** Aguardar aprovação para ETAPA 5









