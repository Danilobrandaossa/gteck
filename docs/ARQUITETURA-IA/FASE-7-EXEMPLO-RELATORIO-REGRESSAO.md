# 📊 Exemplo de Relatório de Regressão RAG

Este é um exemplo real de como o relatório de regressão aparece após executar os testes.

---

## 🎯 Comando Executado

```bash
npm run test:rag-regression:run
```

---

## 📄 Saída do Console

```
[RAG Regression] Iniciando testes de regressão...
[RAG Regression] Dataset: tests/ai/datasets/rag-regression.example.json
[RAG Regression] Carregados 5 casos de teste

[RAG Regression] Executando caso: test-001
[RAG Regression] Executando caso: test-002
[RAG Regression] Executando caso: test-003
[RAG Regression] Executando caso: test-004
[RAG Regression] Executando caso: test-005

[RAG Regression] Relatórios salvos:
  - JSON: tests/ai/reports/rag-regression.latest.json
  - Markdown: tests/ai/reports/rag-regression.latest.md

[RAG Regression] Comparando com baseline...
[RAG Regression] Comparação salva em: tests/ai/reports/rag-regression.comparison.md
[RAG Regression] ✅ Nenhuma regressão detectada

[RAG Regression] Resumo:
  - Total: 5
  - Passed: 4 (80.0%)
  - Failed: 1 (20.0%)
  - Fallback Rate: 20.0%
  - Low Confidence Rate: 20.0%
  - Avg Similarity: 0.742
  - P95 Latency: 2100ms
  - Total Cost: $0.0450
```

---

## 📊 Relatório JSON (resumo)

```json
{
  "timestamp": "2025-01-15T14:30:00.000Z",
  "totalCases": 5,
  "passedCases": 4,
  "failedCases": 1,
  "summary": {
    "fallbackRate": 0.20,
    "lowConfidenceRate": 0.20,
    "avgSimilarity": 0.742,
    "p50TotalMs": 1250,
    "p95TotalMs": 2100,
    "totalCostUsd": 0.0450
  },
  "results": [
    {
      "caseId": "test-001",
      "passed": true,
      "reasons": [],
      "metrics": {
        "confidenceLevel": "high",
        "confidenceScore": 0.850,
        "avgSimilarity": 0.820,
        "chunksUsed": 3,
        "fallbackUsed": false,
        "totalMs": 1200,
        "providerMs": 850,
        "vectorSearchMs": 120,
        "tokens": {
          "prompt": 450,
          "completion": 120,
          "total": 570
        },
        "costUsd": 0.0095,
        "correlationId": "corr-abc123-001"
      }
    }
  ]
}
```

---

## 📝 Relatório Markdown (exemplo completo)

Ver arquivo: `tests/ai/reports/rag-regression.example-report.md`

---

## 🔍 Comparação com Baseline

```markdown
# 🔍 RAG Regression Comparison

**Baseline Timestamp:** 2025-01-10T10:00:00.000Z
**Current Timestamp:** 2025-01-15T14:30:00.000Z

## Status: ✅ **PASSED**

## 📊 Metrics Comparison

| Metric | Baseline | Current | Delta | Threshold | Status |
|--------|----------|---------|-------|-----------|--------|
| fallbackRate | 18.0% | 20.0% | +2.0% | 3.0% | ✅ |
| lowConfidenceRate | 18.0% | 20.0% | +2.0% | 3.0% | ✅ |
| p95TotalMs | 2000ms | 2100ms | +100ms | 300ms | ✅ |
| avgSimilarity | 0.750 | 0.742 | +0.008 | 0.030 | ✅ |
```

---

## 💡 Interpretação

### ✅ **PASSOU - Sem Regressão**

**Análise:**
- Fallback rate aumentou 2% (dentro do limite de 3%)
- Low confidence rate aumentou 2% (dentro do limite de 3%)
- P95 latency aumentou 100ms (dentro do limite de 300ms)
- Avg similarity caiu apenas 0.008 (dentro do limite de 0.030)

**Conclusão:** Sistema mantém qualidade estável. Pequenas variações são aceitáveis.

---

### ❌ **Exemplo de FALHA - Com Regressão**

```
## Status: ❌ **FAILED**

## ⚠️ Failed Regressions

### fallbackRate

- **Baseline:** 0.18
- **Current:** 0.25
- **Delta:** 0.07
- **Threshold:** 0.03
- **Status:** ❌ FAILED (delta excede threshold)

**Ação Necessária:**
1. Investigar por que fallback rate aumentou 7%
2. Verificar se conteúdo foi removido ou degradado
3. Revisar mudanças recentes no sistema RAG
4. Considerar rollback ou correções
```

---

## 🎯 Casos de Uso

### **1. CI/CD Pipeline**

```yaml
- name: RAG Quality Gate
  run: npm run test:rag-regression:run
  
  # Se falhar, bloqueia o deploy
  # Se passar, permite o deploy
```

### **2. Monitoramento Diário**

```bash
# Cron job diário
0 9 * * * cd /path/to/app && npm run test:rag-regression:run && ./notify-slack.sh
```

### **3. Validação Pré-Deploy**

```bash
# Antes de fazer deploy
npm run test:rag-regression:run

# Se passou, prosseguir com deploy
# Se falhou, revisar e corrigir
```

---

## 📚 Recursos

- **Dataset:** `tests/ai/datasets/rag-regression.example.json`
- **Runner:** `tests/ai/rag-regression.runner.ts`
- **Validator:** `tests/ai/rag-regression.validator.ts`
- **Baseline Manager:** `tests/ai/rag-regression.baseline.ts`
- **Guia Rápido:** `tests/ai/GUIA-RAPIDO-REGRESSAO.md`

---

**Gerado por:** Framework de Regressão RAG - FASE 7 ETAPA 8










