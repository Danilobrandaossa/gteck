

# ⚡ FASE 7 - ETAPA 3: TUNING DO HNSW POR REQUEST

**Data:** Janeiro 2025  
**Fase:** 7/8 - Produção em Escala  
**Etapa:** 3/8 - Tuning HNSW  
**Status:** ✅ **COMPLETA**

---

## 📋 OBJETIVO DA ETAPA 3

Permitir ajustar o custo/qualidade do retrieve por request (use case / prioridade / tenant), controlando o trade-off:
- Menor p95 (mais rápido) com `ef_search` menor
- Maior recall (mais preciso) com `ef_search` maior

---

## ✅ IMPLEMENTAÇÕES REALIZADAS

### **1. Detecção de Suporte ao HNSW ef_search**

**Arquivo:** `lib/hnsw-tuning.ts`

**Função:** `detectHnswEfSearchSupport()`

**Implementação:**
- ✅ Tenta executar `SET LOCAL hnsw.ef_search = 40` em transação curta
- ✅ Captura erro e marca `supported=true|false`
- ✅ Cache em memória por processo (evita múltiplas verificações)
- ✅ Fallback silencioso se não suportado

**Status:** ✅ **COMPLETO**

---

### **2. SET LOCAL Seguro dentro do Helper**

**Arquivo:** `lib/hnsw-tuning.ts`

**Função:** `safeVectorSearchWithTuning()`

**Implementação:**
- ✅ `SET LOCAL` sempre dentro de transação
- ✅ Nunca expõe `SET LOCAL` fora do helper
- ✅ Fallback silencioso se falhar
- ✅ Registra no resultado se foi aplicado ou não

**Integração:**
- ✅ `safeVectorSearch()` estendido para aceitar `efSearch` e `tuningEnabled`
- ✅ Aplica tuning apenas se habilitado e `efSearch` fornecido

**Status:** ✅ **COMPLETO**

---

### **3. Policy de ef_search por Use Case/Prioridade**

**Arquivo:** `lib/hnsw-tuning.ts`

**Classe:** `HnswTuningPolicy`

**Defaults:**
- `low`: `ef_search = 20` (rápido, menor recall)
- `medium`: `ef_search = 40` (balanceado)
- `high`: `ef_search = 80` (maior recall, mais lento)
- `debug`: `ef_search = 120` (máximo recall, apenas admin/dev)

**Configuração via Env:**
- `RAG_EF_SEARCH_LOW=20`
- `RAG_EF_SEARCH_MEDIUM=40`
- `RAG_EF_SEARCH_HIGH=80`
- `RAG_EF_SEARCH_DEBUG=120`

**Método:**
```typescript
getEfSearch(priority?, useCase?, tenantOverride?): number
```

**Status:** ✅ **COMPLETO**

---

### **4. Integração no retrieveContext()**

**Arquivo:** `lib/rag-service.ts`

**Mudanças:**
1. Calcula `efSearch` baseado em `priority` (via `HnswTuningPolicy`)
2. Verifica suporte ao HNSW (`detectHnswEfSearchSupport()`)
3. Verifica feature flag (`RAG_HNSW_TUNING_ENABLED`)
4. Passa `efSearch` para `safeVectorSearch()` se habilitado
5. Mede `vectorQueryDurationMs` para auditoria

**Fluxo:**
```
Priority → efSearch → safeVectorSearch(efSearch) → SET LOCAL → Query → Results
```

**Status:** ✅ **COMPLETO**

---

### **5. Auditoria + Telemetria**

**Campos Adicionados em `ai_interactions.context`:**
- ✅ `hnswTuning.enabled` (boolean)
- ✅ `hnswTuning.supported` (boolean)
- ✅ `hnswTuning.applied` (boolean)
- ✅ `hnswTuning.efSearchRequested` (number)
- ✅ `hnswTuning.efSearchApplied` (number | undefined)
- ✅ `hnswTuning.vectorQueryDurationMs` (number)

**Também em `ragMeta` da resposta:**
- ✅ `hnswTuningEnabled`
- ✅ `hnswTuningSupported`
- ✅ `efSearchRequested`
- ✅ `efSearchApplied`
- ✅ `vectorQueryDurationMs`

**Status:** ✅ **COMPLETO**

---

### **6. Testes Obrigatórios**

**Arquivo:** `tests/ai/hnsw-tuning.test.ts`

**Testes Implementados:**
- ✅ Policy retorna valores corretos para cada prioridade
- ✅ Tenant override funciona
- ✅ Default (medium) funciona
- ✅ Feature flag respeitada

**Status:** ✅ **COMPLETO**

---

## 📄 ARQUIVOS CRIADOS/MODIFICADOS

### **Novos Arquivos:**

1. ✅ `lib/hnsw-tuning.ts` — Detecção, tuning e policy de ef_search
2. ✅ `tests/ai/hnsw-tuning.test.ts` — Testes obrigatórios
3. ✅ `docs/ARQUITETURA-IA/FASE-7-ETAPA-3-RELATORIO.md` — Este relatório

### **Arquivos Modificados:**

1. ✅ `lib/tenant-security.ts` — `safeVectorSearch()` estendido com `efSearch` e `tuningEnabled`
2. ✅ `lib/rag-service.ts` — `retrieveContext()` integrado com tuning
3. ✅ `lib/rag-service.ts` — `ragQuery()` atualizado para passar `priority`
4. ✅ `lib/rag-service.ts` — `recordAudit()` atualizado com métricas de tuning
5. ✅ `lib/rag-service.ts` — Interfaces atualizadas (`RAGQueryParams`, `RAGContext`, `RAGResponse`)

---

## 🔒 GARANTIAS DE SEGURANÇA

### **Multi-tenancy:**
- ✅ `SET LOCAL` aplicado dentro de transação (não afeta outras queries)
- ✅ Filtros de tenant sempre aplicados (nunca removidos)
- ✅ `safeVectorSearch` garante isolamento

### **Segurança:**
- ✅ `SET LOCAL` nunca exposto fora do helper
- ✅ Fallback silencioso se falhar
- ✅ Feature flag obrigatória (`RAG_HNSW_TUNING_ENABLED`)

### **Compatibilidade:**
- ✅ Funciona com `USE_EMBEDDING_CHUNKS=true` (chunks)
- ✅ Funciona com `USE_EMBEDDING_CHUNKS=false` (embeddings antigos)
- ✅ Fallback se HNSW não suportado

---

## 📋 CHECKLIST DA ETAPA 3

### **1. Validar Suporte:**
- [x] `detectHnswEfSearchSupport()` implementado
- [x] Cache em memória por processo
- [x] Fallback se não suportado
- [x] Registro na auditoria (`hnswTuningSupported`)

### **2. SET LOCAL Seguro:**
- [x] `safeVectorSearchWithTuning()` implementado
- [x] `SET LOCAL` sempre dentro de transação
- [x] Nunca exposto fora do helper
- [x] Fallback silencioso se falhar

### **3. Policy de ef_search:**
- [x] `HnswTuningPolicy` criado
- [x] Defaults por prioridade (low/medium/high/debug)
- [x] Config via env vars
- [x] Suporte a tenant override (preparado)

### **4. Integração:**
- [x] `retrieveContext()` calcula `efSearch`
- [x] Passa para `safeVectorSearch()` se habilitado
- [x] Mede `vectorQueryDurationMs`
- [x] Funciona com chunks e embeddings antigos

### **5. Auditoria:**
- [x] Métricas registradas em `ai_interactions.context`
- [x] Métricas disponíveis em `ragMeta` da resposta
- [x] Campos: enabled, supported, applied, efSearchRequested, efSearchApplied, vectorQueryDurationMs

### **6. Testes:**
- [x] Testes criados
- [x] Policy testada
- [x] Feature flag testada
- [x] Valores corretos testados

---

## ⚠️ PONTOS DE RISCO E MITIGAÇÃO

### **1. SET LOCAL pode não ser suportado**

**Risco:** PostgreSQL/pgvector pode não suportar `hnsw.ef_search`  
**Mitigação:**
- Detecção automática no início
- Fallback silencioso (query funciona normalmente)
- Registro na auditoria (`hnswTuningSupported=false`)

### **2. Transação pode afetar performance**

**Risco:** Transação extra pode adicionar latência  
**Mitigação:**
- Transação é curta (apenas SET LOCAL + query)
- Overhead mínimo comparado ao ganho de performance
- Pode ser desabilitado via feature flag

### **3. ef_search muito alto pode ser lento**

**Risco:** `ef_search=120` pode ser muito lento  
**Mitigação:**
- Defaults conservadores (low=20, medium=40, high=80)
- Apenas debug usa 120
- Configurável por env

---

## 🧪 EXEMPLOS DE USO

### **1. Configurar Tuning:**

```env
# Habilitar tuning
RAG_HNSW_TUNING_ENABLED=true

# Configurar ef_search por prioridade
RAG_EF_SEARCH_LOW=20
RAG_EF_SEARCH_MEDIUM=40
RAG_EF_SEARCH_HIGH=80
RAG_EF_SEARCH_DEBUG=120
```

### **2. Usar com Prioridade:**

```typescript
const response = await RagService.ragQuery({
  organizationId: "org-123",
  siteId: "site-456",
  question: "Qual é a política de devolução?",
  priority: "high" // Usa ef_search=80
})
```

### **3. Verificar Métricas:**

```typescript
const response = await RagService.ragQuery({...})

console.log(response.ragMeta.hnswTuningEnabled) // true
console.log(response.ragMeta.hnswTuningSupported) // true
console.log(response.ragMeta.efSearchRequested) // 40 (medium)
console.log(response.ragMeta.efSearchApplied) // 40
console.log(response.ragMeta.vectorQueryDurationMs) // 150ms
```

---

## 📊 MÉTRICAS ESPERADAS

### **Antes (Sem Tuning):**
- `ef_search` = padrão do pgvector (geralmente 40)
- p50: ~100-200ms
- p95: ~300-500ms
- Recall: variável

### **Depois (Com Tuning):**
- `ef_search` configurável por prioridade
- **Low (20):** p50: ~50-100ms, p95: ~150-250ms, recall menor
- **Medium (40):** p50: ~100-200ms, p95: ~300-500ms, recall balanceado
- **High (80):** p50: ~200-400ms, p95: ~500-800ms, recall maior

### **Como Medir:**

```sql
-- P50/P95 de vectorQueryDurationMs por ef_search
SELECT 
  (context::json->'hnswTuning'->>'efSearchApplied')::int as ef_search,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (context::json->'hnswTuning'->>'vectorQueryDurationMs')::int) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (context::json->'hnswTuning'->>'vectorQueryDurationMs')::int) as p95
FROM ai_interactions
WHERE type = 'rag_query'
  AND context::json->'hnswTuning'->>'applied' = 'true'
GROUP BY ef_search
ORDER BY ef_search;
```

---

## 🚀 PRÓXIMOS PASSOS

### **Para Habilitar:**

```env
RAG_HNSW_TUNING_ENABLED=true
RAG_EF_SEARCH_LOW=20
RAG_EF_SEARCH_MEDIUM=40
RAG_EF_SEARCH_HIGH=80
```

### **Para Testar:**

```bash
npm test tests/ai/hnsw-tuning.test.ts
```

### **Para Monitorar:**

Verificar métricas em `ai_interactions.context`:
- `hnswTuning.enabled: true`
- `hnswTuning.supported: true`
- `hnswTuning.applied: true`
- `efSearchRequested` e `efSearchApplied` devem ser iguais
- `vectorQueryDurationMs` deve melhorar com `ef_search` menor

---

## ✅ CONCLUSÃO DA ETAPA 3

### **Implementações Concluídas:**
1. ✅ Detecção de suporte ao HNSW ef_search
2. ✅ SET LOCAL seguro dentro do helper
3. ✅ Policy de ef_search por prioridade
4. ✅ Integração no retrieveContext()
5. ✅ Auditoria completa
6. ✅ Testes obrigatórios criados

### **Garantias Estabelecidas:**
- ✅ **Tuning é opcional (feature flag)**
- ✅ **É seguro (SET LOCAL dentro de transaction e helper)**
- ✅ **Funciona com chunks e embeddings antigos**
- ✅ **Registra auditoria completa**
- ✅ **Testes passam**
- ✅ **Permite controlar p95 x recall**

### **Próxima Etapa:**
**ETAPA 4 — Escala do Worker (claim seguro + múltiplas instâncias)**

---

**Status:** ✅ ETAPA 3 COMPLETA  
**Próxima Ação:** Aguardar aprovação para ETAPA 4









