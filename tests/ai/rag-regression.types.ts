/**
 * 📊 TIPOS - RAG Regression Testing
 * 
 * Tipos para dataset, validações e relatórios
 */

export interface RegressionTestCase {
  id: string
  organizationId: string
  siteId: string
  question: string
  expected: {
    mustIncludeAny?: string[] // Qualquer um desses termos deve aparecer
    mustNotInclude?: string[] // Nenhum desses termos deve aparecer
    minConfidenceLevel?: 'low' | 'medium' | 'high' // Nível mínimo de confiança
    maxFallbackAllowed?: boolean // Se false, não deve usar fallback
    minAvgSimilarity?: number // Similaridade média mínima
    maxTotalMs?: number // Latência máxima total (ms)
    maxCostUsd?: number // Custo máximo (USD)
    minChunks?: number // Número mínimo de chunks usados
  }
}

export interface RegressionTestResult {
  caseId: string
  passed: boolean
  reasons: string[]
  metrics: {
    confidenceLevel: 'low' | 'medium' | 'high'
    confidenceScore: number
    avgSimilarity: number
    chunksUsed: number
    fallbackUsed: boolean
    totalMs: number
    providerMs?: number
    vectorSearchMs?: number
    tokens: {
      prompt: number
      completion: number
      total: number
    }
    costUsd: number
    correlationId?: string
  }
}

export interface RegressionReport {
  timestamp: string
  totalCases: number
  passedCases: number
  failedCases: number
  summary: {
    fallbackRate: number
    lowConfidenceRate: number
    avgSimilarity: number
    p50TotalMs: number
    p95TotalMs: number
    totalCostUsd: number
  }
  results: RegressionTestResult[]
}

export interface RegressionBaseline {
  timestamp: string
  totalCases: number
  summary: {
    fallbackRate: number
    lowConfidenceRate: number
    avgSimilarity: number
    p50TotalMs: number
    p95TotalMs: number
    totalCostUsd: number
  }
}

export interface RegressionComparison {
  current: RegressionReport
  baseline: RegressionBaseline
  regressions: Array<{
    metric: string
    baseline: number
    current: number
    delta: number
    threshold: number
    passed: boolean
  }>
  overallPassed: boolean
}









