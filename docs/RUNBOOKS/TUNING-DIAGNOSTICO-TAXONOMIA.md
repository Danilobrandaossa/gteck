# 🔍 Taxonomia de Diagnóstico: Feedback → Hipóteses → Ações

**FASE 8 - ETAPA 5**

Este documento mapeia feedback negativo para hipóteses técnicas e ações de tuning.

---

## 📊 Tabela de Diagnóstico

| Feedback | Hipótese Primária | Sinais Técnicos | Ações Recomendadas | Validação |
|----------|-------------------|-----------------|--------------------|-----------| 
| **INCORRECT** | Retrieval fraco | `avgSimilarity < 0.70`<br>`confidence = LOW`<br>`chunksUsed < 3` | • Aumentar `RAG_CONF_HARD_THRESHOLD` (0.68→0.72)<br>• Aumentar `topN` (20→30) + rerank<br>• Reduzir `diversityThreshold` (0.92→0.88)<br>• Revisar qualidade dos embeddings | Regressão + monitorar `avgSimilarity` e `confidence` |
| **INCORRECT** | Chunks redundantes | `diversity < 0.88`<br>`chunksUsed > 5`<br>`avgSimilarity > 0.80` | • Aumentar `diversityThreshold` (0.92→0.94)<br>• Reduzir `topK` (5→3)<br>• Revisar rerank (boost por recência) | Regressão + monitorar `diversity` |
| **INCOMPLETE** | Contexto curto | `maxTokens < 1500`<br>`tenantState = THROTTLED`<br>`chunksUsed < 3` | • Aumentar `maxTokens` (1000→2000)<br>• Revisar degradação FinOps<br>• Aumentar `topK` (3→5) | Regressão + monitorar `completude` |
| **INCOMPLETE** | Degradação agressiva | `tenantState = THROTTLED/BLOCKED`<br>`maxTokens degradado`<br>`topK reduzido` | • Revisar thresholds de FinOps<br>• Usar modelo intermediário (não o mais barato)<br>• Aumentar budget ou ajustar degradação | Comparar qualidade NORMAL vs THROTTLED |
| **TOO_GENERIC** | Contexto redundante | `chunksUsed > 5`<br>`diversity < 0.85`<br>`confidence = MEDIUM` | • Aumentar `diversityThreshold` (0.92→0.95)<br>• Reduzir `topK` (5→3)<br>• Adicionar boost por especificidade | Regressão + monitorar especificidade |
| **TOO_GENERIC** | Prompt/policy | `confidence = MEDIUM`<br>Não há clarificação | • Revisar prompt system<br>• Adicionar instruções de especificidade<br>• Usar modelo mais capaz (gpt-4) | A/B test de prompts |
| **TOO_SLOW** | Provider lento | `providerMs p95 > 3000ms`<br>`vectorSearchMs < 200ms` | • Trocar provider (OpenAI→Gemini)<br>• Usar modelo mais rápido (gpt-4→gpt-4o-mini)<br>• Reduzir `maxTokens` | Monitorar `p95` e `p99` |
| **TOO_SLOW** | Vector search lento | `vectorSearchMs > 500ms`<br>`ef_search > 80` | • Reduzir `ef_search` (80→40)<br>• Reduzir `topN` (30→20)<br>• Verificar índices HNSW | Monitorar `vectorSearchMs` |
| **TOO_SLOW** | Cache miss alto | `cacheHitRate < 0.3` | • Aumentar TTL do cache<br>• Revisar cache key (incluir variations)<br>• Pre-warm cache para queries comuns | Monitorar `cacheHitRate` |
| **CONFUSING** | Prompt/estilo | `confidence = HIGH`<br>`avgSimilarity > 0.80` | • Revisar prompt system<br>• Adicionar instruções de clareza<br>• Usar modelo mais capaz | A/B test de prompts |
| **CONFUSING** | Contexto mal formatado | `chunksUsed > 5`<br>Chunks muito longos | • Revisar chunking (overlap, tamanho)<br>• Melhorar formatação no prompt<br>• Adicionar separadores claros | Validação manual + regressão |

---

## 🎯 Métricas de Referência (Baseline)

| Métrica | Target | Warning | Critical |
|---------|--------|---------|----------|
| `negativeRate` | < 10% | 10-20% | > 20% |
| `fallbackRate` | < 5% | 5-10% | > 10% |
| `lowConfidenceRate` | < 15% | 15-25% | > 25% |
| `avgSimilarity` | > 0.75 | 0.65-0.75 | < 0.65 |
| `p95 totalMs` | < 2000ms | 2000-3500ms | > 3500ms |
| `cacheHitRate` | > 40% | 20-40% | < 20% |

---

## 🧪 Correlações Importantes

### **1. Confidence vs Feedback**

| Confidence | Expected Negative Rate | Se Maior | Ação |
|------------|------------------------|----------|------|
| HIGH | < 5% | > 10% | Retrieval fraco OU prompt ruim |
| MEDIUM | < 15% | > 20% | Threshold muito permissivo |
| LOW | < 30% | > 40% | Não usar LOW (fallback sempre) |

### **2. AvgSimilarity vs Feedback**

| AvgSimilarity | Expected Negative Rate | Se Maior | Ação |
|---------------|------------------------|----------|------|
| > 0.85 | < 5% | > 10% | Problema de prompt/modelo |
| 0.70-0.85 | < 15% | > 20% | Aumentar topN ou rerank |
| < 0.70 | < 25% | > 30% | Retrieval muito fraco, aumentar threshold |

### **3. TenantState vs Feedback**

| State | Expected Negative Rate | Se Maior | Ação |
|-------|------------------------|----------|------|
| NORMAL | < 10% | > 15% | Problema sistêmico |
| CAUTION | < 15% | > 20% | Degradação suave OK |
| THROTTLED | < 25% | > 35% | Degradação muito agressiva |
| BLOCKED | 100% (fallback) | N/A | Revisar budgets |

### **4. Model vs Feedback**

| Model | Expected Negative Rate | Se Maior | Ação |
|-------|------------------------|----------|------|
| gpt-4 | < 8% | > 12% | Prompt/retrieval |
| gpt-4o-mini | < 15% | > 20% | Usar modelo melhor |
| gemini-1.5-pro | < 10% | > 15% | Revisar compatibilidade |

---

## 🔄 Fluxo de Diagnóstico

```
1. Identificar Symptom
   ↓
   "negativeRate > 15% nas últimas 24h"
   
2. Segmentar por Reason
   ↓
   INCORRECT: 40%
   INCOMPLETE: 30%
   TOO_GENERIC: 20%
   
3. Analisar Correlações
   ↓
   INCORRECT correlacionado com:
   - avgSimilarity < 0.68 (60% dos casos)
   - confidence = LOW (40% dos casos)
   
4. Formular Hipótese
   ↓
   "Retrieval está fraco. Hard threshold muito permissivo."
   
5. Gerar Recomendação
   ↓
   - Aumentar RAG_CONF_HARD_THRESHOLD: 0.68 → 0.72
   - Aumentar topN: 20 → 30
   - Aumentar topK: 3 → 5
   
6. Validar Impacto
   ↓
   - Rodar regressão com novos valores
   - Se passar: deploy canary 5%
   - Monitorar negativeRate por 24h
   - Se melhorar: rollout 100%
   - Se piorar: rollback
```

---

## 📋 Checklist de Ação

Antes de aplicar qualquer tuning:

- [ ] Confirmar que o problema é real (> 7 dias de dados)
- [ ] Segmentar por tenant (é global ou específico?)
- [ ] Confirmar correlação (> 60% dos casos)
- [ ] Formular hipótese clara
- [ ] Estimar impacto (qualidade/custo/latência)
- [ ] Documentar mudança
- [ ] Rodar regressão com novos parâmetros
- [ ] Deploy canary (5-10% tráfego)
- [ ] Monitorar por 24-48h
- [ ] Rollout completo se OK
- [ ] Atualizar baseline

---

## 🚨 Sinais de Alerta (Red Flags)

| Sinal | Significado | Ação Imediata |
|-------|-------------|---------------|
| `negativeRate > 30%` em 24h | Regressão severa | Investigar deploy recente, rollback se necessário |
| `fallbackRate > 20%` | Retrieval quebrado | Verificar índices, reindexar se necessário |
| `p95 > 5000ms` | Latência crítica | Reduzir ef_search, trocar provider |
| `lowConfidenceRate > 40%` | Embeddings fracos | Reindexar conteúdo, revisar chunking |
| `cacheHitRate < 10%` | Cache ineficaz | Revisar cache key, aumentar TTL |

---

## 🎓 Casos de Uso

### **Caso 1: Feedback INCORRECT alto**

```
Dados:
- negativeRate(INCORRECT): 25%
- avgSimilarity média: 0.64
- confidence: 40% LOW, 60% MEDIUM

Diagnóstico:
→ Retrieval fraco (similarity baixa)
→ Threshold muito permissivo (LOW sendo usado)

Ação:
1. Aumentar RAG_CONF_HARD_THRESHOLD: 0.68 → 0.72
2. Aumentar topN: 20 → 30
3. Rodar regressão

Impacto esperado:
✅ Menos respostas LOW (mais fallback)
✅ Respostas MEDIUM/HIGH mais precisas
⚠️ Fallback pode aumentar 5-10%
```

### **Caso 2: Feedback INCOMPLETE alto**

```
Dados:
- negativeRate(INCOMPLETE): 30%
- maxTokens médio: 800 (degradado)
- tenantState: 60% THROTTLED

Diagnóstico:
→ Degradação FinOps muito agressiva
→ maxTokens muito baixo

Ação:
1. Revisar THROTTLED_MAX_TOKENS_FACTOR: 0.5 → 0.7
2. Ou aumentar budgets
3. Rodar regressão

Impacto esperado:
✅ Respostas mais completas
⚠️ Custo aumenta ~30%
```

### **Caso 3: Feedback TOO_SLOW alto**

```
Dados:
- negativeRate(TOO_SLOW): 20%
- p95 totalMs: 4200ms
- providerMs: 3800ms (90% do tempo)

Diagnóstico:
→ Provider lento (OpenAI saturado)

Ação:
1. Trocar para Gemini 1.5 Flash (mais rápido)
2. Ou reduzir maxTokens: 2000 → 1500
3. Rodar regressão

Impacto esperado:
✅ p95 cai para ~2000ms
⚠️ Qualidade pode cair 5% (validar)
```

---

## 🔗 Integração com Release Gate

Toda mudança de tuning deve:

1. Ser documentada em `TUNING_CHANGES.md`
2. Rodar regressão via `npm run test:rag-regression:run`
3. Passar pelo release gate
4. Deploy canary antes de rollout completo

---

**Próximo:** Ver TUNING-PLAYBOOK.md para processo completo.








