# 📊 Exemplo de Saída: Tuning Insights API

## Endpoint

```
GET /api/admin/ai/tuning/insights?windowDays=7&organizationId=org-1&siteId=site-1
Authorization: Bearer $ADMIN_SECRET
```

---

## Resposta Completa (Exemplo Real)

```json
{
  "success": true,
  "timestamp": "2025-01-20T14:30:00.000Z",
  "durationMs": 156,
  "scope": {
    "windowDays": 7,
    "organizationId": "org-1",
    "siteId": "site-1"
  },
  "summary": {
    "totals": {
      "totalFeedback": 150,
      "positive": 120,
      "negative": 30,
      "negativeRate": 0.2,
      "positiveRate": 0.8
    },
    "byReason": [
      {
        "reason": "HELPFUL",
        "count": 100,
        "percentage": 0.667
      },
      {
        "reason": "INCORRECT",
        "count": 15,
        "percentage": 0.1
      },
      {
        "reason": "INCOMPLETE",
        "count": 10,
        "percentage": 0.067
      },
      {
        "reason": "CLEAR",
        "count": 20,
        "percentage": 0.133
      },
      {
        "reason": "TOO_SLOW",
        "count": 5,
        "percentage": 0.033
      }
    ],
    "byConfidence": {
      "high": {
        "total": 50,
        "positive": 45,
        "negative": 5,
        "negativeRate": 0.1
      },
      "medium": {
        "total": 60,
        "positive": 50,
        "negative": 10,
        "negativeRate": 0.167
      },
      "low": {
        "total": 40,
        "positive": 25,
        "negative": 15,
        "negativeRate": 0.375
      }
    },
    "byModel": {
      "gpt-4": {
        "total": 80,
        "positive": 70,
        "negative": 10,
        "negativeRate": 0.125
      },
      "gpt-4o-mini": {
        "total": 70,
        "positive": 50,
        "negative": 20,
        "negativeRate": 0.286
      }
    },
    "byProvider": {
      "openai": {
        "total": 150,
        "positive": 120,
        "negative": 30,
        "negativeRate": 0.2
      }
    },
    "byTenantState": {
      "NORMAL": {
        "total": 100,
        "positive": 85,
        "negative": 15,
        "negativeRate": 0.15
      },
      "THROTTLED": {
        "total": 50,
        "positive": 35,
        "negative": 15,
        "negativeRate": 0.3
      }
    },
    "similarityDistribution": {
      "veryHigh": 30,
      "high": 50,
      "medium": 40,
      "low": 30
    },
    "performanceMetrics": {
      "p50TotalMs": 1450,
      "p95TotalMs": 2680,
      "p99TotalMs": 3850,
      "p95ProviderMs": 2100,
      "p95VectorSearchMs": 320
    },
    "fallbackRate": 0.08,
    "lowConfidenceRate": 0.267
  },
  "drivers": {
    "topReasons": [
      {
        "reason": "INCORRECT",
        "count": 15,
        "percentage": 0.1,
        "avgSimilarity": 0,
        "avgConfidenceScore": 0,
        "mostCommonModel": "",
        "mostCommonTenantState": ""
      },
      {
        "reason": "INCOMPLETE",
        "count": 10,
        "percentage": 0.067,
        "avgSimilarity": 0,
        "avgConfidenceScore": 0,
        "mostCommonModel": "",
        "mostCommonTenantState": ""
      },
      {
        "reason": "TOO_SLOW",
        "count": 5,
        "percentage": 0.033,
        "avgSimilarity": 0,
        "avgConfidenceScore": 0,
        "mostCommonModel": "",
        "mostCommonTenantState": ""
      }
    ],
    "topModels": [
      {
        "model": "gpt-4o-mini",
        "negativeCount": 20,
        "negativeRate": 0.286
      },
      {
        "model": "gpt-4",
        "negativeCount": 10,
        "negativeRate": 0.125
      }
    ],
    "topProviders": [
      {
        "provider": "openai",
        "negativeCount": 30,
        "negativeRate": 0.2
      }
    ],
    "topTenantStates": [
      {
        "state": "THROTTLED",
        "negativeCount": 15,
        "negativeRate": 0.3
      },
      {
        "state": "NORMAL",
        "negativeCount": 15,
        "negativeRate": 0.15
      }
    ]
  },
  "correlation": {
    "negativeRateByConfidence": {
      "high": 0.1,
      "medium": 0.167,
      "low": 0.375
    },
    "negativeRateBySimilarity": {
      "veryHigh": 0,
      "high": 0,
      "medium": 0,
      "low": 0
    },
    "negativeRateByChunks": {
      "few": 0,
      "normal": 0,
      "many": 0
    },
    "negativeRateByTenantState": {
      "NORMAL": 0.15,
      "THROTTLED": 0.3
    },
    "negativeRateByFallback": {
      "used": 0,
      "notUsed": 0
    }
  },
  "recommendations": [
    {
      "id": "high-negative-rate",
      "severity": "critical",
      "category": "quality",
      "title": "Taxa de feedback negativo crítica",
      "description": "20.0% de feedback negativo nos últimos 7 dias. Requer ação imediata.",
      "primaryReason": "OVERALL",
      "changes": [],
      "expectedImpact": {
        "quality": "Crítico: sistema degradado"
      },
      "risk": "high",
      "howToValidate": [
        "Investigar deploy recente",
        "Verificar se é global ou específico de tenant",
        "Analisar logs de erro",
        "Considerar rollback se regressão recente"
      ],
      "estimatedEffort": "high"
    },
    {
      "id": "incorrect-low-confidence",
      "severity": "high",
      "category": "retrieval",
      "title": "Threshold de confiança muito permissivo",
      "description": "Respostas com LOW confidence têm 37.5% de feedback negativo.",
      "primaryReason": "INCORRECT",
      "changes": [
        {
          "parameter": "RAG_CONF_HARD_THRESHOLD",
          "currentValue": "0.68",
          "suggestedValue": "0.72",
          "reason": "Reduzir uso de LOW confidence"
        },
        {
          "parameter": "RAG_CONF_SOFT_THRESHOLD",
          "currentValue": "0.75",
          "suggestedValue": "0.78",
          "reason": "Aumentar barreira para MEDIUM"
        }
      ],
      "expectedImpact": {
        "quality": "+10-15% precisão",
        "cost": "Neutro (mais fallback, menos LLM)",
        "latency": "Neutro"
      },
      "risk": "low",
      "howToValidate": [
        "Rodar regressão",
        "Monitorar lowConfidenceRate (esperar redução)",
        "Monitorar fallbackRate (pode aumentar)"
      ],
      "estimatedEffort": "low"
    },
    {
      "id": "incomplete-throttled",
      "severity": "medium",
      "category": "cost",
      "title": "Degradação FinOps muito agressiva",
      "description": "6.7% de feedback \"INCOMPLETE\", correlacionado com estado THROTTLED.",
      "primaryReason": "INCOMPLETE",
      "changes": [
        {
          "parameter": "THROTTLED_MAX_TOKENS_FACTOR",
          "currentValue": "0.5",
          "suggestedValue": "0.7",
          "reason": "Reduzir corte de tokens em THROTTLED"
        },
        {
          "parameter": "THROTTLED_TOP_K_FACTOR",
          "currentValue": "0.6",
          "suggestedValue": "0.8",
          "reason": "Manter mais contexto"
        }
      ],
      "expectedImpact": {
        "quality": "+15-20% completude",
        "cost": "+25-35% em tenants THROTTLED",
        "latency": "+50-100ms"
      },
      "risk": "medium",
      "howToValidate": [
        "Filtrar regressão apenas por tenants THROTTLED",
        "Monitorar custo por tenant",
        "Validar com 2-3 tenants piloto primeiro"
      ],
      "estimatedEffort": "low"
    },
    {
      "id": "high-low-confidence",
      "severity": "medium",
      "category": "quality",
      "title": "Muitas respostas com LOW confidence",
      "description": "26.7% das interações com LOW confidence. Revisar qualidade dos embeddings.",
      "primaryReason": "OVERALL",
      "changes": [
        {
          "parameter": "REINDEX_PRIORITY",
          "currentValue": "normal",
          "suggestedValue": "high",
          "reason": "Executar reindex incremental"
        }
      ],
      "expectedImpact": {
        "quality": "+10-20% confiança",
        "cost": "Custo one-time de reindex",
        "latency": "Neutro após reindex"
      },
      "risk": "low",
      "howToValidate": [
        "Executar reindex incremental",
        "Monitorar lowConfidenceRate por 7 dias",
        "Verificar avgSimilarity aumentou"
      ],
      "estimatedEffort": "high"
    }
  ],
  "metadata": {
    "recommendationsCount": 4,
    "criticalCount": 1,
    "highCount": 1,
    "mediumCount": 2
  }
}
```

---

## Interpretação

### **Situação Geral**
- ✅ **positiveRate**: 80% (bom)
- ⚠️ **negativeRate**: 20% (crítico - target < 10%)
- ⚠️ **lowConfidenceRate**: 26.7% (alto - target < 15%)
- ✅ **fallbackRate**: 8% (ok - target < 10%)
- ✅ **p95TotalMs**: 2680ms (ok - target < 3500ms)

### **Problemas Identificados**

#### **1. HIGH: Feedback negativo crítico (20%)**
- **Causa:** Sistema degradado
- **Ação:** Investigar deploy recente, verificar logs, considerar rollback

#### **2. HIGH: LOW confidence com 37.5% negativos**
- **Causa:** Threshold muito permissivo
- **Ação:**
  - Aumentar `RAG_CONF_HARD_THRESHOLD`: 0.68 → 0.72
  - Aumentar `RAG_CONF_SOFT_THRESHOLD`: 0.75 → 0.78
- **Impacto:** +10-15% precisão, custo neutro, latência neutra
- **Risco:** Baixo

#### **3. MEDIUM: THROTTLED com 30% negativos (vs 15% NORMAL)**
- **Causa:** Degradação FinOps muito agressiva
- **Ação:**
  - Aumentar `THROTTLED_MAX_TOKENS_FACTOR`: 0.5 → 0.7
  - Aumentar `THROTTLED_TOP_K_FACTOR`: 0.6 → 0.8
- **Impacto:** +15-20% completude, +25-35% custo (apenas THROTTLED), +50-100ms
- **Risco:** Médio

#### **4. MEDIUM: 26.7% LOW confidence**
- **Causa:** Embeddings fracos ou desatualizados
- **Ação:** Executar reindex incremental
- **Impacto:** +10-20% confiança, custo one-time
- **Risco:** Baixo

### **Próximas Ações Recomendadas**

1. **Imediato:** Investigar regressão (deploy recente?)
2. **Curto prazo:** Ajustar thresholds (0.68→0.72)
3. **Médio prazo:** Revisar degradação FinOps
4. **Longo prazo:** Executar reindex incremental

---

## Como Usar

```bash
# 1. Obter insights
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  "http://localhost:4000/api/admin/ai/tuning/insights?windowDays=7&organizationId=org-1" \
  | jq > insights.json

# 2. Analisar recomendações
jq '.recommendations[] | select(.severity == "high" or .severity == "critical")' insights.json

# 3. Aplicar mudanças sugeridas
# Editar .env com valores sugeridos

# 4. Validar
npm run test:rag-regression:run

# 5. Deploy canary
# (via feature flag ou routing)

# 6. Monitorar
curl "http://localhost:4000/api/admin/ai/tuning/insights?windowDays=1"
```

---

**Ver também:**
- `TUNING-PLAYBOOK.md` — Processo completo
- `TUNING-DIAGNOSTICO-TAXONOMIA.md` — Diagnóstico detalhado










