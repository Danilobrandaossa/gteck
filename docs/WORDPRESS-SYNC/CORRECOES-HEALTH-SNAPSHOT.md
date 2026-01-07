# 🔧 Correções — Health Snapshot

**Data:** 29 de Dezembro de 2025  
**Problema:** Erros no endpoint `/api/admin/ai/health`

---

## 🐛 ERROS IDENTIFICADOS

1. **RAG Metrics**: `Cannot read properties of undefined (reading 'count')`
2. **Provider Metrics**: `Raw query failed. Code: 1. Message: near "(": syntax error`
3. **Queue Metrics**: `no such column: lock_expires_at`
4. **Cost Metrics**: `no such table: ai_interactions`
5. **WP Indexing Metrics**: `Unknown argument wpConfigured`

---

## ✅ CORREÇÕES APLICADAS

### **1. Nomes de Tabelas (snake_case → camelCase com aspas)**

**Antes:**
```sql
FROM ai_interactions
```

**Depois:**
```sql
FROM "AIInteraction"
```

---

### **2. Nomes de Colunas (snake_case → camelCase com aspas)**

**Antes:**
```sql
WHERE created_at >= ${windowStart}
AND cost_usd IS NOT NULL
```

**Depois:**
```sql
WHERE "createdAt" >= ${windowStart}
AND "costUsd" IS NOT NULL
```

---

### **3. Queue Metrics - Lock Expires**

**Antes:**
```sql
WHERE lock_expires_at < NOW()
```

**Depois:**
```sql
WHERE "lockedAt" IS NOT NULL
AND "lockedAt" < NOW() - INTERVAL '5 minutes'
```

---

### **4. Tratamento de Erros**

Adicionado `try-catch` em todas as queries para evitar que erros quebrem o endpoint:

```typescript
try {
  // Query
} catch (error) {
  console.error('[HealthSnapshot] Error getting X:', error)
  return defaultValue
}
```

---

### **5. Prisma Client Regenerado**

```bash
npm run db:generate
```

Isso garante que o Prisma Client reconheça os campos WordPress (`wpConfigured`, `wpLastSyncAt`, etc.)

---

## 📋 QUERIES CORRIGIDAS

1. ✅ **RAG Metrics** - Fallback rate
2. ✅ **RAG Metrics** - Latency metrics
3. ✅ **Provider Metrics** - Provider stats
4. ✅ **Provider Metrics** - Last errors
5. ✅ **Queue Metrics** - Stuck jobs
6. ✅ **Queue Metrics** - Avg duration
7. ✅ **Cost Metrics** - Daily cost
8. ✅ **WP Indexing Metrics** - Usa Prisma ORM (não raw SQL)

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Prisma Client regenerado
2. ⏳ **Reiniciar servidor** para aplicar mudanças
3. ⏳ Testar endpoint `/api/admin/ai/health`

---

## 🧪 TESTE

```powershell
# Testar endpoint após reiniciar servidor
Invoke-WebRequest -Uri "http://localhost:4000/api/admin/ai/health?windowHours=24" `
  -Headers @{"Authorization"="Bearer test-secret"}
```

---

**Status:** ✅ **CORREÇÕES APLICADAS**

**Ação Necessária:** Reiniciar servidor (`npm run dev`)








