# 🔒 RUNBOOK: MULTI-TENANT SUSPEITA

**Severidade típica:** SEV1 (suspeita confirmada) ou SEV2 (investigação)

**Tempo de resposta:** IMEDIATO

---

## 🚨 SYMPTOMS

- ✅ Reclamação de dados "de outro cliente"
- ✅ Anomalia em query logs
- ✅ Embeddings cross-tenant detectados
- ✅ Suspeita de SQL injection ou bypass de filtros

---

## 🔍 HOW TO CONFIRM

### **1. Pegar Detalhes da Reclamação**

- CorrelationId da resposta suspeita
- Tenant que reclamou (organizationId + siteId)
- O que o usuário viu (screenshot/texto)
- Quando aconteceu

### **2. Verificar Interação**

```sql
-- Buscar interação suspeita
SELECT 
  id,
  "organizationId",
  "siteId",
  prompt,
  response,
  context,
  "createdAt"
FROM ai_interactions
WHERE context->>'correlationId' = 'correlation-id-aqui'
  OR id = 'interaction-id-aqui';
```

**Verificar:**
- `organizationId` e `siteId` estão corretos?
- `context.chunksUsed` são do tenant correto?

### **3. Verificar Chunks Usados**

```sql
-- Verificar chunks da resposta
SELECT 
  ec.id,
  ec."organizationId",
  ec."siteId",
  ec."sourceType",
  ec."sourceId",
  ec."chunkText"
FROM embedding_chunks ec
WHERE ec.id = ANY(
  SELECT jsonb_array_elements_text(
    (SELECT context->'chunksUsed' FROM ai_interactions WHERE id = 'interaction-id-aqui')
  )::uuid[]
);
```

**Se chunks são de outro organizationId/siteId:**
→ **VAZAMENTO CONFIRMADO** 🚨

---

## ⚡ IMMEDIATE MITIGATION (0-5min)

### **SEV1: Vazamento Confirmado**

```bash
# 1. COLOCAR SISTEMA EM MODO RESTRITO
export AI_FEATURES_DISABLED=true
export RAG_FORCE_FALLBACK=true  # só respostas genéricas

# Restart app IMEDIATAMENTE

# 2. NOTIFICAR
# - CTO
# - Security team
# - Legal (se PII envolvido)

# 3. REGISTRAR EVIDÊNCIAS
# - Screenshots de queries SQL
# - Logs de correlationId
# - Dumps de interação/chunks
```

### **SEV2: Suspeita em Investigação**

```bash
# Aumentar fallback temporariamente
export RAG_CONF_HARD_THRESHOLD=0.85  # muito alto, força fallback

# Restart app
```

---

## 🔬 DEEP DIAGNOSIS

### **1. Auditoria de Helpers de Segurança**

```typescript
// lib/tenant-security.ts
// Verificar se todos usam helpers seguros

// ❌ NUNCA fazer:
const chunks = await db.$queryRaw`
  SELECT * FROM embedding_chunks 
  WHERE embedding <-> ${embedding} < 0.3
`

// ✅ SEMPRE usar helper:
const chunks = await safeVectorSearch({
  organizationId,
  siteId,
  embedding,
  threshold: 0.3
})
```

### **2. Verificar Todos os Queries**

```bash
# Buscar queries perigosos
grep -r "queryRaw\|executeRaw" lib/ app/

# Cada um DEVE usar tenant_security helpers
```

### **3. Testar Isolamento**

```typescript
// tests/security/isolation.test.ts
// Adicionar testes de isolamento

describe('Multi-tenant Isolation', () => {
  it('should never return chunks from other tenants', async () => {
    const result = await vectorSearch({
      organizationId: 'tenant-A',
      siteId: 'site-A',
      query: 'test'
    })

    // Verificar que NENHUM chunk é de tenant-B
    result.chunks.forEach(chunk => {
      expect(chunk.organizationId).toBe('tenant-A')
      expect(chunk.siteId).toBe('site-A')
    })
  })
})
```

---

## 🛠️ PERMANENT FIX

### **Fix 1: Code Review Completo**

```bash
# Revisar TODOS os queries
# Garantir que TODOS usam helpers seguros
# Adicionar linter rule para bloquear $queryRaw direto
```

### **Fix 2: Adicionar Validação Runtime**

```typescript
// lib/tenant-security.ts
// Adicionar validação automática

export function validateTenantOwnership(
  result: any[], 
  expectedOrg: string, 
  expectedSite: string
) {
  const violations = result.filter(
    r => r.organizationId !== expectedOrg || r.siteId !== expectedSite
  )

  if (violations.length > 0) {
    // LOG CRÍTICO + ALERT + EXCEPTION
    logger.critical('TENANT_ISOLATION_VIOLATION', { violations })
    throw new Error('Tenant isolation violation detected')
  }

  return result
}
```

### **Fix 3: Adicionar Testes de Segurança no CI**

```bash
# .github/workflows/security.yml
# Rodar testes de isolamento em CADA PR
npm run test:security:isolation

# Bloquear merge se falhar
```

---

## ✅ VERIFICATION

```bash
# 1. Rodar testes de isolamento
npm run test:security:isolation

# DEVE PASSAR 100%

# 2. Auditoria manual de queries
grep -r "queryRaw" lib/ app/

# NENHUM deve usar raw queries sem helper

# 3. Verificar logs
# Não deve haver "TENANT_ISOLATION_VIOLATION"
```

---

## 📝 POST-INCIDENT NOTES

### **Causas Possíveis:**
1. Query raw sem filtro de tenant
2. Bug em helper de segurança
3. Index corrompido (chunks com org/site errado)
4. Cache cross-tenant (muito raro)

### **Ações Obrigatórias:**
1. **Postmortem completo** (< 24h)
2. **Notificar tenants afetados** (transparência)
3. **Revisar TODOS os queries** (code audit)
4. **Adicionar testes** (isolation tests no CI)
5. **Monitoramento** (alert em qualquer suspeita)

### **Prevenção:**
- Code review obrigatório para queries
- Linter bloqueando $queryRaw/$executeRaw
- Testes de isolamento no CI (CADA PR)
- Runtime validation automática
- Logs de auditoria

---

**⚠️ ESTE É O INCIDENTE MAIS CRÍTICO**

Se confirmado, pode ter implicações legais (LGPD/GDPR), perda de confiança e churn massivo.

**Prioridade absoluta.**

---

**Ver também:**
- [lib/tenant-security.ts](../../lib/tenant-security.ts) — Helpers seguros
- [FASE-2-RELATORIO.md](../../ARQUITETURA-IA/FASE-2-RELATORIO.md) — Tenant security








