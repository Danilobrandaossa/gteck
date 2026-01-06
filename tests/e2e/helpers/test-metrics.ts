/**
 * Test Metrics Collector
 * FASE H.4 - Coleta métricas para relatório final
 */

export interface TestMetrics {
  scenarioId: string
  scenarioName: string
  passed: boolean
  durationMs: number
  error?: string
  correlationId?: string
  metadata?: Record<string, any>
}

export interface TestReport {
  timestamp: string
  totalScenarios: number
  passedScenarios: number
  failedScenarios: number
  successRate: number
  metrics: {
    latency: {
      syncP50: number
      syncP95: number
      indexingP50: number
      indexingP95: number
      ragP50: number
      ragP95: number
      totalE2EP50: number
      totalE2EP95: number
    }
    quality: {
      fallbackRate: number
      lowConfidenceRate: number
      avgSimilarity: number
    }
    cost: {
      totalCostUSD: number
      costPerQuery: number
      costPerEmbedding: number
    }
    reliability: {
      successRate: number
      errorRate: number
      queueStuckCount: number
    }
  }
  scenarios: TestMetrics[]
  correlationIds: string[]
  goLiveChecklist: {
    syncWorking: boolean
    indexingWorking: boolean
    ragWorking: boolean
    finopsWorking: boolean
    observabilityWorking: boolean
    queueWorking: boolean
    multiTenantIsolated: boolean
    healthAlertsWorking: boolean
  }
}

export class TestMetricsCollector {
  private metrics: TestMetrics[] = []
  private correlationIds: string[] = []

  /**
   * Registrar resultado de cenário
   */
  recordScenario(
    scenarioId: string,
    scenarioName: string,
    passed: boolean,
    durationMs: number,
    error?: string,
    correlationId?: string,
    metadata?: Record<string, any>
  ): void {
    this.metrics.push({
      scenarioId,
      scenarioName,
      passed,
      durationMs,
      error,
      correlationId,
      metadata
    })

    if (correlationId) {
      this.correlationIds.push(correlationId)
    }
  }

  /**
   * Gerar relatório final
   */
  generateReport(): TestReport {
    const passedScenarios = this.metrics.filter(m => m.passed).length
    const failedScenarios = this.metrics.filter(m => !m.passed).length
    const successRate = this.metrics.length > 0 
      ? (passedScenarios / this.metrics.length) * 100 
      : 0

    // Calcular latências (p50, p95)
    const durations = this.metrics.map(m => m.durationMs).sort((a, b) => a - b)
    const p50Index = Math.floor(durations.length * 0.5)
    const p95Index = Math.floor(durations.length * 0.95)
    const p50 = durations[p50Index] || 0
    const p95 = durations[p95Index] || 0

    // Extrair métricas de qualidade dos metadados
    const fallbackRates = this.metrics
      .map(m => m.metadata?.fallbackRate)
      .filter(r => r !== undefined) as number[]
    const avgFallbackRate = fallbackRates.length > 0
      ? fallbackRates.reduce((a, b) => a + b, 0) / fallbackRates.length
      : 0

    const lowConfidenceRates = this.metrics
      .map(m => m.metadata?.lowConfidenceRate)
      .filter(r => r !== undefined) as number[]
    const avgLowConfidenceRate = lowConfidenceRates.length > 0
      ? lowConfidenceRates.reduce((a, b) => a + b, 0) / lowConfidenceRates.length
      : 0

    const similarities = this.metrics
      .map(m => m.metadata?.avgSimilarity)
      .filter(s => s !== undefined) as number[]
    const avgSimilarity = similarities.length > 0
      ? similarities.reduce((a, b) => a + b, 0) / similarities.length
      : 0

    // Calcular custo aproximado (mock - em produção seria real)
    const totalCostUSD = this.metrics.reduce((sum, m) => {
      return sum + (m.metadata?.costUSD || 0)
    }, 0)

    const queryCount = this.metrics.filter(m => m.scenarioId.startsWith('H3')).length
    const costPerQuery = queryCount > 0 ? totalCostUSD / queryCount : 0

    const embeddingCount = this.metrics.filter(m => m.scenarioId.startsWith('H2')).length
    const costPerEmbedding = embeddingCount > 0 ? totalCostUSD / embeddingCount : 0

    // Calcular reliability
    const successRate = this.metrics.length > 0
      ? (passedScenarios / this.metrics.length) * 100
      : 0
    const errorRate = 100 - successRate

    const queueStuckCount = this.metrics
      .filter(m => m.metadata?.queueStuckCount)
      .reduce((sum, m) => sum + (m.metadata?.queueStuckCount || 0), 0)

    // Go-live checklist
    const syncScenarios = this.metrics.filter(m => m.scenarioId.startsWith('H1'))
    const indexingScenarios = this.metrics.filter(m => m.scenarioId.startsWith('H2'))
    const ragScenarios = this.metrics.filter(m => m.scenarioId.startsWith('H3'))
    const finopsScenarios = this.metrics.filter(m => m.scenarioId.startsWith('H4'))
    const opsScenarios = this.metrics.filter(m => m.scenarioId.startsWith('H5'))
    const queueScenarios = this.metrics.filter(m => m.scenarioId.startsWith('H6'))

    const goLiveChecklist = {
      syncWorking: syncScenarios.every(m => m.passed),
      indexingWorking: indexingScenarios.every(m => m.passed),
      ragWorking: ragScenarios.every(m => m.passed),
      finopsWorking: finopsScenarios.every(m => m.passed),
      observabilityWorking: opsScenarios.every(m => m.passed),
      queueWorking: queueScenarios.every(m => m.passed),
      multiTenantIsolated: this.metrics
        .filter(m => m.metadata?.multiTenantTest)
        .every(m => m.passed),
      healthAlertsWorking: opsScenarios
        .filter(m => m.scenarioId.includes('H5.3') || m.scenarioId.includes('H5.4'))
        .every(m => m.passed)
    }

    return {
      timestamp: new Date().toISOString(),
      totalScenarios: this.metrics.length,
      passedScenarios,
      failedScenarios,
      successRate,
      metrics: {
        latency: {
          syncP50: p50,
          syncP95: p95,
          indexingP50: p50,
          indexingP95: p95,
          ragP50: p50,
          ragP95: p95,
          totalE2EP50: p50,
          totalE2EP95: p95
        },
        quality: {
          fallbackRate: avgFallbackRate,
          lowConfidenceRate: avgLowConfidenceRate,
          avgSimilarity
        },
        cost: {
          totalCostUSD,
          costPerQuery,
          costPerEmbedding
        },
        reliability: {
          successRate,
          errorRate,
          queueStuckCount
        }
      },
      scenarios: this.metrics,
      correlationIds: [...new Set(this.correlationIds)],
      goLiveChecklist
    }
  }

  /**
   * Limpar métricas
   */
  reset(): void {
    this.metrics = []
    this.correlationIds = []
  }
}






