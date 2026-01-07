/**
 * 🎯 RECOMMENDATIONS ENGINE - FASE 8 ETAPA 5
 * 
 * Gera recomendações acionáveis baseadas em feedback e métricas
 */

import { FeedbackSummary, NegativeDrivers, QualityCorrelation } from './tuning-insights'

export type RecommendationSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface ParameterChange {
  parameter: string
  currentValue: string | number
  suggestedValue: string | number
  reason: string
}

export interface Recommendation {
  id: string
  severity: RecommendationSeverity
  category: 'retrieval' | 'performance' | 'cost' | 'quality' | 'config'
  title: string
  description: string
  primaryReason: string // INCORRECT, INCOMPLETE, etc.
  changes: ParameterChange[]
  expectedImpact: {
    quality?: string
    cost?: string
    latency?: string
  }
  risk: 'low' | 'medium' | 'high'
  howToValidate: string[]
  estimatedEffort: 'low' | 'medium' | 'high'
}

export class RecommendationEngine {
  /**
   * Gera recomendações baseadas em feedback summary
   */
  static generateRecommendations(
    summary: FeedbackSummary,
    _drivers: NegativeDrivers,
    correlation: QualityCorrelation
  ): Recommendation[] {
    const recommendations: Recommendation[] = []

    // 1. Feedback negativo global alto
    if (summary.totals.negativeRate > 0.2) {
      recommendations.push({
        id: 'high-negative-rate',
        severity: 'critical',
        category: 'quality',
        title: 'Taxa de feedback negativo crítica',
        description: `${(summary.totals.negativeRate * 100).toFixed(1)}% de feedback negativo nos últimos ${summary.windowDays} dias. Requer ação imediata.`,
        primaryReason: 'OVERALL',
        changes: [],
        expectedImpact: {
          quality: 'Crítico: sistema degradado'
        },
        risk: 'high',
        howToValidate: [
          'Investigar deploy recente',
          'Verificar se é global ou específico de tenant',
          'Analisar logs de erro',
          'Considerar rollback se regressão recente'
        ],
        estimatedEffort: 'high'
      })
    }

    // 2. INCORRECT alto → Retrieval fraco
    const incorrectReason = summary.byReason.find(r => r.reason === 'INCORRECT')
    if (incorrectReason && incorrectReason.percentage > 0.15) {
      // Se avgSimilarity está baixo, é problema de retrieval
      const lowSimilarityPercentage =
        (summary.similarityDistribution.low + summary.similarityDistribution.medium) /
        (summary.similarityDistribution.veryHigh +
          summary.similarityDistribution.high +
          summary.similarityDistribution.medium +
          summary.similarityDistribution.low || 1)

      if (lowSimilarityPercentage > 0.4) {
        recommendations.push({
          id: 'incorrect-low-similarity',
          severity: 'high',
          category: 'retrieval',
          title: 'Retrieval fraco detectado',
          description: `${(incorrectReason.percentage * 100).toFixed(1)}% de feedback "INCORRECT" com baixa similaridade média.`,
          primaryReason: 'INCORRECT',
          changes: [
            {
              parameter: 'RAG_CONF_HARD_THRESHOLD',
              currentValue: '0.68',
              suggestedValue: '0.72',
              reason: 'Aumentar threshold para evitar respostas com baixa similaridade'
            },
            {
              parameter: 'RAG_TOP_N',
              currentValue: '20',
              suggestedValue: '30',
              reason: 'Buscar mais chunks para melhorar rerank'
            },
            {
              parameter: 'RAG_TOP_K',
              currentValue: '3',
              suggestedValue: '5',
              reason: 'Incluir mais contexto na resposta'
            }
          ],
          expectedImpact: {
            quality: '+15-20% precisão esperada',
            cost: '+10-15% (mais tokens)',
            latency: '+100-200ms (mais chunks)'
          },
          risk: 'medium',
          howToValidate: [
            'Rodar regressão com novos valores',
            'Monitorar avgSimilarity (esperar > 0.72)',
            'Monitorar fallbackRate (pode aumentar 5-10%)',
            'Deploy canary 5% por 24h'
          ],
          estimatedEffort: 'low'
        })
      }

      // Se confidence LOW está sendo usado demais
      if (correlation.negativeRateByConfidence.low > 0.35) {
        recommendations.push({
          id: 'incorrect-low-confidence',
          severity: 'high',
          category: 'retrieval',
          title: 'Threshold de confiança muito permissivo',
          description: `Respostas com LOW confidence têm ${(correlation.negativeRateByConfidence.low * 100).toFixed(1)}% de feedback negativo.`,
          primaryReason: 'INCORRECT',
          changes: [
            {
              parameter: 'RAG_CONF_HARD_THRESHOLD',
              currentValue: '0.68',
              suggestedValue: '0.72',
              reason: 'Reduzir uso de LOW confidence'
            },
            {
              parameter: 'RAG_CONF_SOFT_THRESHOLD',
              currentValue: '0.75',
              suggestedValue: '0.78',
              reason: 'Aumentar barreira para MEDIUM'
            }
          ],
          expectedImpact: {
            quality: '+10-15% precisão',
            cost: 'Neutro (mais fallback, menos LLM)',
            latency: 'Neutro'
          },
          risk: 'low',
          howToValidate: [
            'Rodar regressão',
            'Monitorar lowConfidenceRate (esperar redução)',
            'Monitorar fallbackRate (pode aumentar)'
          ],
          estimatedEffort: 'low'
        })
      }
    }

    // 3. INCOMPLETE alto → maxTokens ou topK baixo
    const incompleteReason = summary.byReason.find(r => r.reason === 'INCOMPLETE')
    if (incompleteReason && incompleteReason.percentage > 0.15) {
      // Se é correlacionado com THROTTLED
      const throttledState = summary.byTenantState['THROTTLED']
      if (throttledState && throttledState.negativeRate > 0.25) {
        recommendations.push({
          id: 'incomplete-throttled',
          severity: 'medium',
          category: 'cost',
          title: 'Degradação FinOps muito agressiva',
          description: `${(incompleteReason.percentage * 100).toFixed(1)}% de feedback "INCOMPLETE", correlacionado com estado THROTTLED.`,
          primaryReason: 'INCOMPLETE',
          changes: [
            {
              parameter: 'THROTTLED_MAX_TOKENS_FACTOR',
              currentValue: '0.5',
              suggestedValue: '0.7',
              reason: 'Reduzir corte de tokens em THROTTLED'
            },
            {
              parameter: 'THROTTLED_TOP_K_FACTOR',
              currentValue: '0.6',
              suggestedValue: '0.8',
              reason: 'Manter mais contexto'
            }
          ],
          expectedImpact: {
            quality: '+15-20% completude',
            cost: '+25-35% em tenants THROTTLED',
            latency: '+50-100ms'
          },
          risk: 'medium',
          howToValidate: [
            'Filtrar regressão apenas por tenants THROTTLED',
            'Monitorar custo por tenant',
            'Validar com 2-3 tenants piloto primeiro'
          ],
          estimatedEffort: 'low'
        })
      } else {
        // INCOMPLETE global
        recommendations.push({
          id: 'incomplete-global',
          severity: 'medium',
          category: 'quality',
          title: 'Respostas incompletas detectadas',
          description: `${(incompleteReason.percentage * 100).toFixed(1)}% de feedback "INCOMPLETE".`,
          primaryReason: 'INCOMPLETE',
          changes: [
            {
              parameter: 'DEFAULT_MAX_TOKENS',
              currentValue: '1500',
              suggestedValue: '2000',
              reason: 'Permitir respostas mais completas'
            },
            {
              parameter: 'RAG_TOP_K',
              currentValue: '3',
              suggestedValue: '5',
              reason: 'Incluir mais contexto'
            }
          ],
          expectedImpact: {
            quality: '+10-15% completude',
            cost: '+20-30%',
            latency: '+100-150ms'
          },
          risk: 'medium',
          howToValidate: [
            'Rodar regressão',
            'Monitorar custo total',
            'Deploy gradual (canary 10% → 50% → 100%)'
          ],
          estimatedEffort: 'low'
        })
      }
    }

    // 4. TOO_SLOW alto → performance
    const slowReason = summary.byReason.find(r => r.reason === 'TOO_SLOW')
    if (slowReason && slowReason.percentage > 0.1) {
      if (summary.performanceMetrics.p95ProviderMs > 3000) {
        recommendations.push({
          id: 'too-slow-provider',
          severity: 'high',
          category: 'performance',
          title: 'Provider lento detectado',
          description: `p95 do provider: ${summary.performanceMetrics.p95ProviderMs.toFixed(0)}ms. ${(slowReason.percentage * 100).toFixed(1)}% de feedback "TOO_SLOW".`,
          primaryReason: 'TOO_SLOW',
          changes: [
            {
              parameter: 'PREFERRED_PROVIDER',
              currentValue: 'openai',
              suggestedValue: 'gemini',
              reason: 'Gemini 1.5 Flash é mais rápido'
            },
            {
              parameter: 'FALLBACK_MODEL',
              currentValue: 'gpt-4',
              suggestedValue: 'gemini-1.5-flash',
              reason: 'Modelo mais rápido para médio priority'
            }
          ],
          expectedImpact: {
            quality: 'Neutro a -5% (validar)',
            cost: 'Neutro',
            latency: '-40-50% (p95 esperado ~1800ms)'
          },
          risk: 'medium',
          howToValidate: [
            'Rodar regressão com Gemini',
            'A/B test 10% tráfego',
            'Monitorar p95/p99 por 48h',
            'Validar qualidade não degrada'
          ],
          estimatedEffort: 'medium'
        })
      }

      if (summary.performanceMetrics.p95VectorSearchMs > 500) {
        recommendations.push({
          id: 'too-slow-vector',
          severity: 'medium',
          category: 'performance',
          title: 'Vector search lento',
          description: `p95 vector search: ${summary.performanceMetrics.p95VectorSearchMs.toFixed(0)}ms.`,
          primaryReason: 'TOO_SLOW',
          changes: [
            {
              parameter: 'RAG_EF_SEARCH_MEDIUM',
              currentValue: '40',
              suggestedValue: '30',
              reason: 'Reduzir ef_search para prioridade média'
            },
            {
              parameter: 'RAG_EF_SEARCH_LOW',
              currentValue: '20',
              suggestedValue: '15',
              reason: 'Reduzir ef_search para prioridade baixa'
            },
            {
              parameter: 'RAG_TOP_N',
              currentValue: '30',
              suggestedValue: '20',
              reason: 'Buscar menos chunks inicialmente'
            }
          ],
          expectedImpact: {
            quality: '-5-8% recall (aceitável)',
            cost: 'Neutro',
            latency: '-200-300ms'
          },
          risk: 'low',
          howToValidate: [
            'Rodar regressão',
            'Monitorar vectorSearchMs',
            'Deploy gradual'
          ],
          estimatedEffort: 'low'
        })
      }
    }

    // 5. TOO_GENERIC alto → diversityThreshold ou topK
    const genericReason = summary.byReason.find(r => r.reason === 'TOO_GENERIC')
    if (genericReason && genericReason.percentage > 0.1) {
      recommendations.push({
        id: 'too-generic',
        severity: 'medium',
        category: 'quality',
        title: 'Respostas muito genéricas',
        description: `${(genericReason.percentage * 100).toFixed(1)}% de feedback "TOO_GENERIC". Provável contexto redundante.`,
        primaryReason: 'TOO_GENERIC',
        changes: [
          {
            parameter: 'RAG_DIVERSITY_THRESHOLD',
            currentValue: '0.92',
            suggestedValue: '0.95',
            reason: 'Aumentar filtro de redundância'
          },
          {
            parameter: 'RAG_TOP_K',
            currentValue: '5',
            suggestedValue: '3',
            reason: 'Focar em chunks mais específicos'
          }
        ],
        expectedImpact: {
          quality: '+10-15% especificidade',
          cost: '-10-15% (menos tokens)',
          latency: '-50-100ms'
        },
        risk: 'low',
        howToValidate: [
          'Rodar regressão',
          'Verificar diversity score aumentou',
          'Validar respostas não ficaram incompletas'
        ],
        estimatedEffort: 'low'
      })
    }

    // 6. Fallback rate alto
    if (summary.fallbackRate > 0.1) {
      recommendations.push({
        id: 'high-fallback',
        severity: 'medium',
        category: 'retrieval',
        title: 'Taxa de fallback elevada',
        description: `${(summary.fallbackRate * 100).toFixed(1)}% de fallback. Conteúdo insuficiente ou thresholds muito altos.`,
        primaryReason: 'OVERALL',
        changes: [
          {
            parameter: 'RAG_CONF_HARD_THRESHOLD',
            currentValue: '0.72',
            suggestedValue: '0.68',
            reason: 'Reduzir threshold (mais permissivo)'
          }
        ],
        expectedImpact: {
          quality: '+5-10% cobertura, mas -5-8% precisão',
          cost: '+10-15%',
          latency: 'Neutro'
        },
        risk: 'medium',
        howToValidate: [
          'Verificar se conteúdo está indexado',
          'Rodar reindex incremental',
          'Se conteúdo OK, considerar ajustar threshold',
          'Monitorar INCORRECT não aumenta'
        ],
        estimatedEffort: 'medium'
      })
    }

    // 7. LOW confidence rate alto
    if (summary.lowConfidenceRate > 0.25) {
      recommendations.push({
        id: 'high-low-confidence',
        severity: 'medium',
        category: 'quality',
        title: 'Muitas respostas com LOW confidence',
        description: `${(summary.lowConfidenceRate * 100).toFixed(1)}% das interações com LOW confidence. Revisar qualidade dos embeddings.`,
        primaryReason: 'OVERALL',
        changes: [
          {
            parameter: 'REINDEX_PRIORITY',
            currentValue: 'normal',
            suggestedValue: 'high',
            reason: 'Executar reindex incremental'
          }
        ],
        expectedImpact: {
          quality: '+10-20% confiança',
          cost: 'Custo one-time de reindex',
          latency: 'Neutro após reindex'
        },
        risk: 'low',
        howToValidate: [
          'Executar reindex incremental',
          'Monitorar lowConfidenceRate por 7 dias',
          'Verificar avgSimilarity aumentou'
        ],
        estimatedEffort: 'high'
      })
    }

    // Ordenar por severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
    recommendations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return recommendations
  }

  /**
   * Filtra recomendações por severity
   */
  static filterBySeverity(
    recommendations: Recommendation[],
    minSeverity: RecommendationSeverity = 'low'
  ): Recommendation[] {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
    const minLevel = severityOrder[minSeverity]

    return recommendations.filter(r => severityOrder[r.severity] <= minLevel)
  }

  /**
   * Filtra recomendações por categoria
   */
  static filterByCategory(
    recommendations: Recommendation[],
    categories: Recommendation['category'][]
  ): Recommendation[] {
    return recommendations.filter(r => categories.includes(r.category))
  }
}










