/**
 * 🎯 API ADMIN: TUNING INSIGHTS - FASE 8 ETAPA 5
 * 
 * Endpoint para análise de qualidade e recomendações de tuning
 */

import { NextRequest, NextResponse } from 'next/server'
import { TuningInsightsService } from '@/lib/tuning/tuning-insights'
import { RecommendationEngine } from '@/lib/tuning/recommendations'

const ADMIN_SECRET = process.env.ADMIN_HEALTH_SECRET

function validateAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !ADMIN_SECRET) {
    return false
  }

  const token = authHeader.replace('Bearer ', '')
  return token === ADMIN_SECRET
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // 1. Validar autenticação
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)

    // 2. Parâmetros
    const windowDays = parseInt(searchParams.get('windowDays') || '7', 10)
    const organizationId = searchParams.get('organizationId') || undefined
    const siteId = searchParams.get('siteId') || undefined
    const minSeverity = (searchParams.get('minSeverity') || 'low') as any
    const includeRecommendations = searchParams.get('recommendations') !== 'false'

    // 3. Obter insights
    const summary = await TuningInsightsService.getFeedbackSummary({
      windowDays,
      organizationId,
      siteId
    })

    const drivers = await TuningInsightsService.getNegativeDrivers({
      windowDays,
      organizationId,
      siteId
    })

    const correlation = await TuningInsightsService.getQualityCorrelation({
      windowDays,
      organizationId,
      siteId
    })

    // 4. Gerar recomendações
    let recommendations: any[] = []
    if (includeRecommendations) {
      const allRecommendations = RecommendationEngine.generateRecommendations(summary, drivers, correlation)
      recommendations = RecommendationEngine.filterBySeverity(allRecommendations, minSeverity)
    }

    const durationMs = Date.now() - startTime

    // 5. Retornar resposta
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      scope: {
        windowDays,
        organizationId: organizationId || 'all',
        siteId: siteId || 'all'
      },
      summary: {
        totals: summary.totals,
        byReason: summary.byReason,
        byConfidence: summary.byConfidence,
        byModel: summary.byModel,
        byProvider: summary.byProvider,
        byTenantState: summary.byTenantState,
        similarityDistribution: summary.similarityDistribution,
        performanceMetrics: summary.performanceMetrics,
        fallbackRate: summary.fallbackRate,
        lowConfidenceRate: summary.lowConfidenceRate
      },
      drivers: {
        topReasons: drivers.topReasons,
        topModels: drivers.topModels,
        topProviders: drivers.topProviders,
        topTenantStates: drivers.topTenantStates
      },
      correlation: {
        negativeRateByConfidence: correlation.negativeRateByConfidence,
        negativeRateBySimilarity: correlation.negativeRateBySimilarity,
        negativeRateByChunks: correlation.negativeRateByChunks,
        negativeRateByTenantState: correlation.negativeRateByTenantState,
        negativeRateByFallback: correlation.negativeRateByFallback
      },
      recommendations: recommendations.map(r => ({
        id: r.id,
        severity: r.severity,
        category: r.category,
        title: r.title,
        description: r.description,
        primaryReason: r.primaryReason,
        changes: r.changes,
        expectedImpact: r.expectedImpact,
        risk: r.risk,
        howToValidate: r.howToValidate,
        estimatedEffort: r.estimatedEffort
      })),
      metadata: {
        recommendationsCount: recommendations.length,
        criticalCount: recommendations.filter(r => r.severity === 'critical').length,
        highCount: recommendations.filter(r => r.severity === 'high').length,
        mediumCount: recommendations.filter(r => r.severity === 'medium').length
      }
    })
  } catch (error) {
    console.error('[TuningInsightsAPI] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}










