/**
 * 🧪 TESTES - Tuning Insights (FASE 8 ETAPA 5)
 */

import { describe, it, expect } from 'vitest'
import { RecommendationEngine } from '@/lib/tuning/recommendations'
import type { FeedbackSummary, NegativeDrivers, QualityCorrelation } from '@/lib/tuning/tuning-insights'

describe('Tuning Insights', () => {
  describe('Recommendation Engine', () => {
    it('deve gerar recomendação quando negativeRate alto', () => {
      const summary: FeedbackSummary = {
        windowDays: 7,
        scope: {},
        totals: {
          totalFeedback: 100,
          positive: 70,
          negative: 30,
          negativeRate: 0.3, // 30% - crítico!
          positiveRate: 0.7
        },
        byReason: [
          { reason: 'INCORRECT', count: 20, percentage: 0.2 },
          { reason: 'INCOMPLETE', count: 10, percentage: 0.1 }
        ],
        byConfidence: {
          high: { total: 40, positive: 35, negative: 5, negativeRate: 0.125 },
          medium: { total: 40, positive: 30, negative: 10, negativeRate: 0.25 },
          low: { total: 20, positive: 5, negative: 15, negativeRate: 0.75 }
        },
        byModel: {},
        byProvider: {},
        byTenantState: {},
        similarityDistribution: {
          veryHigh: 20,
          high: 30,
          medium: 30,
          low: 20
        },
        performanceMetrics: {
          p50TotalMs: 1500,
          p95TotalMs: 2500,
          p99TotalMs: 3500,
          p95ProviderMs: 2000,
          p95VectorSearchMs: 300
        },
        fallbackRate: 0.05,
        lowConfidenceRate: 0.2
      }

      const drivers: NegativeDrivers = {
        topReasons: [],
        topModels: [],
        topProviders: [],
        topTenantStates: []
      }

      const correlation: QualityCorrelation = {
        negativeRateByConfidence: {
          high: 0.125,
          medium: 0.25,
          low: 0.75
        },
        negativeRateBySimilarity: {
          veryHigh: 0.1,
          high: 0.15,
          medium: 0.25,
          low: 0.4
        },
        negativeRateByChunks: {
          few: 0.3,
          normal: 0.2,
          many: 0.15
        },
        negativeRateByTenantState: {},
        negativeRateByFallback: {
          used: 0.5,
          notUsed: 0.2
        }
      }

      const recommendations = RecommendationEngine.generateRecommendations(
        summary,
        drivers,
        correlation
      )

      expect(recommendations.length).toBeGreaterThan(0)
      
      // Deve ter recomendação crítica
      const criticalRec = recommendations.find(r => r.severity === 'critical')
      expect(criticalRec).toBeDefined()
      expect(criticalRec?.id).toBe('high-negative-rate')
    })

    it('deve gerar recomendação para INCORRECT com baixa similarity', () => {
      const summary: FeedbackSummary = {
        windowDays: 7,
        scope: {},
        totals: {
          totalFeedback: 100,
          positive: 80,
          negative: 20,
          negativeRate: 0.2,
          positiveRate: 0.8
        },
        byReason: [
          { reason: 'INCORRECT', count: 18, percentage: 0.18 } // Alto!
        ],
        byConfidence: {
          high: { total: 50, positive: 45, negative: 5, negativeRate: 0.1 },
          medium: { total: 30, positive: 25, negative: 5, negativeRate: 0.167 },
          low: { total: 20, positive: 10, negative: 10, negativeRate: 0.5 }
        },
        byModel: {},
        byProvider: {},
        byTenantState: {},
        similarityDistribution: {
          veryHigh: 10,
          high: 20,
          medium: 30, // 60% low+medium
          low: 40
        },
        performanceMetrics: {
          p50TotalMs: 1500,
          p95TotalMs: 2500,
          p99TotalMs: 3500,
          p95ProviderMs: 2000,
          p95VectorSearchMs: 300
        },
        fallbackRate: 0.05,
        lowConfidenceRate: 0.2
      }

      const drivers: NegativeDrivers = {
        topReasons: [],
        topModels: [],
        topProviders: [],
        topTenantStates: []
      }

      const correlation: QualityCorrelation = {
        negativeRateByConfidence: {
          high: 0.1,
          medium: 0.167,
          low: 0.5
        },
        negativeRateBySimilarity: {
          veryHigh: 0.05,
          high: 0.1,
          medium: 0.25,
          low: 0.4
        },
        negativeRateByChunks: {
          few: 0.3,
          normal: 0.2,
          many: 0.15
        },
        negativeRateByTenantState: {},
        negativeRateByFallback: {
          used: 0.5,
          notUsed: 0.2
        }
      }

      const recommendations = RecommendationEngine.generateRecommendations(
        summary,
        drivers,
        correlation
      )

      // Deve sugerir aumentar threshold ou topN
      const retrievalRec = recommendations.find(r => r.id === 'incorrect-low-similarity')
      expect(retrievalRec).toBeDefined()
      expect(retrievalRec?.severity).toBe('high')
      expect(retrievalRec?.changes.length).toBeGreaterThan(0)

      // Verificar mudanças sugeridas
      const thresholdChange = retrievalRec?.changes.find(
        c => c.parameter === 'RAG_CONF_HARD_THRESHOLD'
      )
      expect(thresholdChange).toBeDefined()
      expect(thresholdChange?.suggestedValue).toBeGreaterThan(thresholdChange?.currentValue as number)
    })

    it('deve gerar recomendação para INCOMPLETE com THROTTLED', () => {
      const summary: FeedbackSummary = {
        windowDays: 7,
        scope: {},
        totals: {
          totalFeedback: 100,
          positive: 80,
          negative: 20,
          negativeRate: 0.2,
          positiveRate: 0.8
        },
        byReason: [
          { reason: 'INCOMPLETE', count: 16, percentage: 0.16 }
        ],
        byConfidence: {
          high: { total: 50, positive: 45, negative: 5, negativeRate: 0.1 },
          medium: { total: 30, positive: 25, negative: 5, negativeRate: 0.167 },
          low: { total: 20, positive: 10, negative: 10, negativeRate: 0.5 }
        },
        byModel: {},
        byProvider: {},
        byTenantState: {
          NORMAL: { total: 50, positive: 45, negative: 5, negativeRate: 0.1 },
          THROTTLED: { total: 50, positive: 35, negative: 15, negativeRate: 0.3 } // Alto!
        },
        similarityDistribution: {
          veryHigh: 30,
          high: 40,
          medium: 20,
          low: 10
        },
        performanceMetrics: {
          p50TotalMs: 1500,
          p95TotalMs: 2500,
          p99TotalMs: 3500,
          p95ProviderMs: 2000,
          p95VectorSearchMs: 300
        },
        fallbackRate: 0.05,
        lowConfidenceRate: 0.2
      }

      const drivers: NegativeDrivers = {
        topReasons: [],
        topModels: [],
        topProviders: [],
        topTenantStates: []
      }

      const correlation: QualityCorrelation = {
        negativeRateByConfidence: {
          high: 0.1,
          medium: 0.167,
          low: 0.5
        },
        negativeRateBySimilarity: {
          veryHigh: 0.05,
          high: 0.1,
          medium: 0.25,
          low: 0.4
        },
        negativeRateByChunks: {
          few: 0.3,
          normal: 0.2,
          many: 0.15
        },
        negativeRateByTenantState: {
          NORMAL: 0.1,
          THROTTLED: 0.3
        },
        negativeRateByFallback: {
          used: 0.5,
          notUsed: 0.2
        }
      }

      const recommendations = RecommendationEngine.generateRecommendations(
        summary,
        drivers,
        correlation
      )

      // Deve sugerir revisar degradação FinOps
      const finopsRec = recommendations.find(r => r.id === 'incomplete-throttled')
      expect(finopsRec).toBeDefined()
      expect(finopsRec?.category).toBe('cost')

      // Verificar mudanças
      const tokenChange = finopsRec?.changes.find(
        c => c.parameter === 'THROTTLED_MAX_TOKENS_FACTOR'
      )
      expect(tokenChange).toBeDefined()
    })

    it('deve gerar recomendação para TOO_SLOW', () => {
      const summary: FeedbackSummary = {
        windowDays: 7,
        scope: {},
        totals: {
          totalFeedback: 100,
          positive: 85,
          negative: 15,
          negativeRate: 0.15,
          positiveRate: 0.85
        },
        byReason: [
          { reason: 'TOO_SLOW', count: 12, percentage: 0.12 }
        ],
        byConfidence: {
          high: { total: 50, positive: 45, negative: 5, negativeRate: 0.1 },
          medium: { total: 30, positive: 25, negative: 5, negativeRate: 0.167 },
          low: { total: 20, positive: 15, negative: 5, negativeRate: 0.25 }
        },
        byModel: {},
        byProvider: {},
        byTenantState: {},
        similarityDistribution: {
          veryHigh: 30,
          high: 40,
          medium: 20,
          low: 10
        },
        performanceMetrics: {
          p50TotalMs: 2000,
          p95TotalMs: 4500,
          p99TotalMs: 6000,
          p95ProviderMs: 4000, // Muito alto!
          p95VectorSearchMs: 300
        },
        fallbackRate: 0.05,
        lowConfidenceRate: 0.2
      }

      const drivers: NegativeDrivers = {
        topReasons: [],
        topModels: [],
        topProviders: [],
        topTenantStates: []
      }

      const correlation: QualityCorrelation = {
        negativeRateByConfidence: {
          high: 0.1,
          medium: 0.167,
          low: 0.25
        },
        negativeRateBySimilarity: {
          veryHigh: 0.05,
          high: 0.1,
          medium: 0.15,
          low: 0.2
        },
        negativeRateByChunks: {
          few: 0.15,
          normal: 0.15,
          many: 0.15
        },
        negativeRateByTenantState: {},
        negativeRateByFallback: {
          used: 0.3,
          notUsed: 0.15
        }
      }

      const recommendations = RecommendationEngine.generateRecommendations(
        summary,
        drivers,
        correlation
      )

      // Deve sugerir trocar provider ou modelo
      const perfRec = recommendations.find(r => r.id === 'too-slow-provider')
      expect(perfRec).toBeDefined()
      expect(perfRec?.category).toBe('performance')
      expect(perfRec?.severity).toBe('high')
    })

    it('deve filtrar por severity corretamente', () => {
      const allRecommendations = [
        { id: '1', severity: 'critical' as const, category: 'quality' as const, title: '', description: '', primaryReason: '', changes: [], expectedImpact: {}, risk: 'high' as const, howToValidate: [], estimatedEffort: 'low' as const },
        { id: '2', severity: 'high' as const, category: 'quality' as const, title: '', description: '', primaryReason: '', changes: [], expectedImpact: {}, risk: 'medium' as const, howToValidate: [], estimatedEffort: 'low' as const },
        { id: '3', severity: 'medium' as const, category: 'quality' as const, title: '', description: '', primaryReason: '', changes: [], expectedImpact: {}, risk: 'low' as const, howToValidate: [], estimatedEffort: 'low' as const },
        { id: '4', severity: 'low' as const, category: 'quality' as const, title: '', description: '', primaryReason: '', changes: [], expectedImpact: {}, risk: 'low' as const, howToValidate: [], estimatedEffort: 'low' as const }
      ]

      const filtered = RecommendationEngine.filterBySeverity(allRecommendations, 'high')
      
      expect(filtered.length).toBe(2)
      expect(filtered[0].severity).toBe('critical')
      expect(filtered[1].severity).toBe('high')
    })

    it('deve filtrar por categoria corretamente', () => {
      const allRecommendations = [
        { id: '1', severity: 'high' as const, category: 'retrieval' as const, title: '', description: '', primaryReason: '', changes: [], expectedImpact: {}, risk: 'medium' as const, howToValidate: [], estimatedEffort: 'low' as const },
        { id: '2', severity: 'high' as const, category: 'performance' as const, title: '', description: '', primaryReason: '', changes: [], expectedImpact: {}, risk: 'medium' as const, howToValidate: [], estimatedEffort: 'low' as const },
        { id: '3', severity: 'high' as const, category: 'cost' as const, title: '', description: '', primaryReason: '', changes: [], expectedImpact: {}, risk: 'medium' as const, howToValidate: [], estimatedEffort: 'low' as const }
      ]

      const filtered = RecommendationEngine.filterByCategory(allRecommendations, ['retrieval', 'performance'])
      
      expect(filtered.length).toBe(2)
      expect(filtered.some(r => r.category === 'retrieval')).toBe(true)
      expect(filtered.some(r => r.category === 'performance')).toBe(true)
      expect(filtered.some(r => r.category === 'cost')).toBe(false)
    })
  })
})








