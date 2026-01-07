FASE 7 - ETAPA 2: RAG COM RETRIEVE + RERANK LEVE — CONCLUÍDA
Resumo executivo
ETAPA 2 concluída. Sistema atualizado com rerank local e determinístico, melhorando a qualidade do contexto e reduzindo redundância.
Implementações realizadas
1. Configurações de Rerank
RAG_TOP_N=20 (default) — Buscar top-N inicialmente
RAG_TOP_K=5 (default) — Selecionar top-K final
RAG_MAX_PER_SOURCE=2 (default) — Limite por sourceId
RAG_DIVERSITY_THRESHOLD=0.92 (default) — Threshold de redundância
2. RagRerank Service
Arquivo: lib/rag-rerank.ts
Rerank local e determinístico (sem LLM)
Sinais: vectorScore, titleMatchBoost, recencyBoost, sourceTypeBoost, lengthPenalty, redundancyPenalty
3. Anti-redundância (Diversidade)
Limite por source (maxPerSource)
Redundância calculada via Jaccard similarity
Chunks redundantes removidos
4. RetrieveContext atualizado
Busca top-N → Rerank → Seleciona top-K
Suporta embedding_chunks e embeddings antigos
Compatibilidade mantida
5. Auditoria e telemetria
Métricas registradas em ai_interactions.context
Campos: chunksConsidered, chunksSelected, rerankApplied, diversityApplied, avgSimilarityBefore/After, etc.
6. Testes obrigatórios
Arquivo: tests/ai/rag-rerank.test.ts
Testes: threshold, maxPerSource, diversidade, métricas
Arquivos criados/modificados
Novos arquivos (3):
lib/rag-rerank.ts — Serviço de rerank
tests/ai/rag-rerank.test.ts — Testes
docs/ARQUITETURA-IA/FASE-7-ETAPA-2-RELATORIO.md — Relatório
Arquivos modificados (1):
lib/rag-service.ts — retrieveContext() atualizado com rerank
Checklist da ETAPA 2
[x] Retrieve busca top-N (não top-K diretamente)
[x] Rerank leve implementado (local, determinístico)
[x] Anti-redundância implementada
[x] Auditoria com métricas completas
[x] Compatibilidade com embeddings antigos
[x] Testes obrigatórios criados
Garantias estabelecidas
Multi-tenancy: todas as buscas filtradas por tenant
Performance: rerank local (sem I/O, sem LLM)
Compatibilidade: funciona com USE_EMBEDDING_CHUNKS ligado/desligado
Status final
ETAPA 2: 100% completa
O sistema está:
Com retrieve top-N → rerank → top-K
Com rerank local implementado
Com anti-redundância funcionando
Com auditoria completa
Com testes passando
Pronto para ETAPA 3
Documentação
Relatório disponível em:
docs/ARQUITETURA-IA/FASE-7-ETAPA-2-RELATORIO.md
ETAPA 2 concluída. Aguardando aprovação para prosseguir para a ETAPA 3 — Tuning do HNSW por request (latência p95), ou prefere revisar a implementação da ETAPA 2 primeiro?

# 🎯 FASE 7 - ETAPA 2: RAG COM RETRIEVE + RERANK LEVE

**Data:** Janeiro 2025  
**Fase:** 7/8 - Produção em Escala  
**Etapa:** 2/8 - Retrieve + Rerank Leve  
**Status:** ✅ **COMPLETA**

---

## 📋 OBJETIVO DA ETAPA 2

Melhorar qualidade do contexto e reduzir redundância com um fluxo:
- **Retrieve** (top-N via pgvector) → **Rerank** local leve → **Select** top-K final
- Sem chamar LLM para rerank (custo zero extra)

---

## ✅ IMPLEMENTAÇÕES REALIZADAS

### **1. Configurações de Rerank**

**Variáveis de Ambiente:**
- `RAG_TOP_N=20` (default) — Quantos buscar inicialmente
- `RAG_TOP_K=5` (default) — Quantos selecionar no final
- `RAG_MAX_PER_SOURCE=2` (default) — Máximo de chunks por sourceId
- `RAG_DIVERSITY_THRESHOLD=0.92` (default) — Threshold de redundância
- `RAG_SIMILARITY_THRESHOLD=0.70` (já existia, mantido)

**Status:** ✅ **COMPLETO**

---

### **2. RagRerank Service Criado**

**Arquivo:** `lib/rag-rerank.ts`

**Classe:** `RagRerank`

**Método Principal:**
```typescript
rerankAndSelect(candidates: RerankChunk[], config: RerankConfig): RerankResult
```

**Sinais de Rerank (pesos leves):**
- ✅ `vectorScore` (similaridade do pgvector) → base (peso: 1.0)
- ✅ `titleMatchBoost` (se pergunta contém termos do título/slug) → +boost (peso: 0.3)
- ✅ `recencyBoost` (se tiver publishedAt/updatedAt) → +boost leve (peso: 0.1)
- ✅ `sourceTypeBoost` (Page > AIContent > Template) → boost (peso: 0.1)
- ✅ `lengthPenalty` (chunk muito curto ou muito longo) → penaliza (peso: 0.05)
- ✅ `redundancyPenalty` (chunk muito parecido com chunks já escolhidos) → penaliza (peso: 0.2)

**Status:** ✅ **COMPLETO**

---

### **3. Anti-redundância (Diversidade)**

**Implementação:**
- ✅ Limite por source: `maxPerSource` chunks do mesmo `sourceId`
- ✅ Redundância: Jaccard similarity de tokens normalizados
- ✅ Se redundância > `diversityThreshold`, pula o chunk e pega o próximo
- ✅ Heurística barata (sem LLM)

**Status:** ✅ **COMPLETO**

---

### **4. RetrieveContext Atualizado**

**Arquivo:** `lib/rag-service.ts`

**Mudanças:**
1. Busca top-N inicialmente (não top-K diretamente)
2. Aplica rerank nos candidatos
3. Seleciona top-K com diversidade
4. Suporta `embedding_chunks` (se `USE_EMBEDDING_CHUNKS=true`) ou `embeddings` (compatibilidade)

**Fluxo:**
```
Query → Top-N (pgvector) → Rerank (local) → Top-K (diversidade) → Context
```

**Status:** ✅ **COMPLETO**

---

### **5. Auditoria e Telemetria**

**Campos Adicionados em `ai_interactions.context`:**
- ✅ `chunksConsidered` (N)
- ✅ `chunksSelected` (K)
- ✅ `rerankApplied` (boolean)
- ✅ `diversityApplied` (boolean)
- ✅ `avgSimilarityBefore`
- ✅ `avgSimilarityAfter`
- ✅ `topN`, `topK`, `maxPerSource`, `diversityThreshold`

**Também em `ragMeta` da resposta:**
- ✅ Todos os campos acima disponíveis na resposta da API

**Status:** ✅ **COMPLETO**

---

### **6. Compatibilidade com Embeddings Antigos**

**Estratégia:**
- ✅ Se `USE_EMBEDDING_CHUNKS=true` → busca de `embedding_chunks`
- ✅ Se `USE_EMBEDDING_CHUNKS=false` → busca de `embeddings` (compatibilidade)
- ✅ Rerank aplicado em ambos os casos
- ✅ Mesma lógica de diversidade

**Status:** ✅ **COMPLETO**

---

### **7. Testes Obrigatórios**

**Arquivo:** `tests/ai/rag-rerank.test.ts`

**Testes Implementados:**
- ✅ Filtro por similarity threshold
- ✅ Respeito a `maxPerSource`
- ✅ Anti-redundância (diversidade)
- ✅ Rerank aplicado (reordenação)
- ✅ Métricas corretas

**Status:** ✅ **COMPLETO**

---

## 📄 ARQUIVOS CRIADOS/MODIFICADOS

### **Novos Arquivos:**

1. ✅ `lib/rag-rerank.ts` — Serviço de rerank
2. ✅ `tests/ai/rag-rerank.test.ts` — Testes obrigatórios
3. ✅ `docs/ARQUITETURA-IA/FASE-7-ETAPA-2-RELATORIO.md` — Este relatório

### **Arquivos Modificados:**

1. ✅ `lib/rag-service.ts` — `retrieveContext()` atualizado com rerank
2. ✅ `lib/rag-service.ts` — `recordAudit()` atualizado com métricas
3. ✅ `lib/rag-service.ts` — `ragQuery()` atualizado para passar `question` ao rerank

---

## 🔒 GARANTIAS DE SEGURANÇA

### **Multi-tenancy:**
- ✅ Todas as buscas filtradas por `organizationId` + `siteId`
- ✅ `safeVectorSearch` garante isolamento
- ✅ Rerank não remove filtros de tenant

### **Performance:**
- ✅ Rerank local (determinístico, sem LLM)
- ✅ Custo zero extra
- ✅ Heurísticas leves (Jaccard, tokenização simples)

---

## 📋 CHECKLIST DA ETAPA 2

### **1. Ajustar Retrieve para Top-N > Top-K:**
- [x] Configs criadas (RAG_TOP_N, RAG_TOP_K, RAG_MAX_PER_SOURCE, RAG_DIVERSITY_THRESHOLD)
- [x] Retrieve busca top-N inicialmente
- [x] Seleciona top-K depois do rerank

### **2. Implementar Rerank Leve:**
- [x] `rerankChunks()` implementado
- [x] Sinais de rerank aplicados (titleMatch, recency, sourceType, length)
- [x] Reordenação por score combinado

### **3. Anti-redundância:**
- [x] `selectDiverseTopK()` implementado
- [x] Limite por source (`maxPerSource`)
- [x] Redundância calculada (Jaccard)
- [x] Chunks redundantes pulados

### **4. Auditoria:**
- [x] Métricas registradas em `ai_interactions.context`
- [x] Métricas disponíveis em `ragMeta` da resposta
- [x] Campos: chunksConsidered, chunksSelected, rerankApplied, diversityApplied, etc.

### **5. Compatibilidade:**
- [x] Suporta `embedding_chunks` (se USE_EMBEDDING_CHUNKS=true)
- [x] Suporta `embeddings` antigos (se USE_EMBEDDING_CHUNKS=false)
- [x] Rerank aplicado em ambos os casos

### **6. Testes:**
- [x] Testes criados
- [x] Filtro por threshold testado
- [x] Max por source testado
- [x] Diversidade testada
- [x] Métricas testadas

---

## ⚠️ PONTOS DE RISCO E MITIGAÇÃO

### **1. Rerank pode ser lento com muitos candidatos**

**Risco:** Top-N muito alto pode tornar rerank lento  
**Mitigação:**
- Top-N default: 20 (configurável)
- Rerank é local e determinístico (sem I/O)
- Heurísticas leves (Jaccard, tokenização simples)

### **2. Diversidade pode remover chunks relevantes**

**Risco:** Threshold muito alto pode remover chunks úteis  
**Mitigação:**
- Threshold default: 0.92 (configurável)
- Apenas chunks muito similares são removidos
- Limite por source garante diversidade de fontes

### **3. Compatibilidade com embeddings antigos**

**Risco:** Busca de `embeddings` pode não ter `chunk_text`  
**Mitigação:**
- Lógica separada para `embedding_chunks` vs `embeddings`
- Fallback para buscar conteúdo completo quando necessário

---

## 🧪 EXEMPLOS DE USO

### **1. Configurar Rerank:**

```env
RAG_TOP_N=20
RAG_TOP_K=5
RAG_MAX_PER_SOURCE=2
RAG_DIVERSITY_THRESHOLD=0.92
RAG_SIMILARITY_THRESHOLD=0.70
```

### **2. Usar Rerank Manualmente:**

```typescript
import { RagRerank } from '@/lib/rag-rerank'

const result = RagRerank.rerankAndSelect(candidates, {
  topN: 20,
  topK: 5,
  maxPerSource: 2,
  diversityThreshold: 0.92,
  question: 'Qual é a política de devolução?'
})
```

### **3. Verificar Métricas:**

```typescript
const response = await RagService.ragQuery({...})

console.log(response.ragMeta)
// {
//   chunksConsidered: 20,
//   chunksSelected: 5,
//   rerankApplied: true,
//   diversityApplied: true,
//   avgSimilarityBefore: 0.85,
//   avgSimilarityAfter: 0.88,
//   ...
// }
```

---

## 📊 MÉTRICAS ESPERADAS

### **Antes (Sem Rerank):**
- Top-K diretamente do pgvector
- Possível redundância
- Sem boost por título/recência
- Similaridade média: ~0.80

### **Depois (Com Rerank):**
- Top-N → Rerank → Top-K
- Redundância reduzida
- Boost por título/recência aplicado
- Similaridade média: ~0.85-0.90 (melhor seleção)

---

## 🚀 PRÓXIMOS PASSOS

### **Para Configurar:**

```env
RAG_TOP_N=20
RAG_TOP_K=5
RAG_MAX_PER_SOURCE=2
RAG_DIVERSITY_THRESHOLD=0.92
```

### **Para Testar:**

```bash
npm test tests/ai/rag-rerank.test.ts
```

### **Para Monitorar:**

Verificar métricas em `ai_interactions.context`:
- `rerankApplied: true`
- `diversityApplied: true`
- `avgSimilarityAfter > avgSimilarityBefore` (geralmente)

---

## ✅ CONCLUSÃO DA ETAPA 2

### **Implementações Concluídas:**
1. ✅ Retrieve busca top-N (não top-K diretamente)
2. ✅ Rerank leve implementado (local, determinístico)
3. ✅ Anti-redundância (diversidade) implementada
4. ✅ Auditoria com métricas completas
5. ✅ Compatibilidade com embeddings antigos
6. ✅ Testes obrigatórios criados

### **Garantias Estabelecidas:**
- ✅ **Retrieve busca top-N**
- ✅ **Rerank reordena e melhora seleção**
- ✅ **Diversidade remove redundância e limita por source**
- ✅ **Auditoria registra métricas completas**
- ✅ **Testes passam**
- ✅ **Compatível com USE_EMBEDDING_CHUNKS ligado/desligado**

### **Próxima Etapa:**
**ETAPA 3 — Tuning do HNSW por request (latência p95)**

---

**Status:** ✅ ETAPA 2 COMPLETA  
**Próxima Ação:** Aguardar aprovação para ETAPA 3











