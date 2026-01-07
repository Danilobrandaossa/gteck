/**
 * 📊 BASELINE - RAG Regression Testing
 * 
 * Gerencia baseline e comparação de regressões
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'

import { RegressionReport, RegressionBaseline, RegressionComparison } from './rag-regression.types'

export class RegressionBaselineManager {
  private static readonly DEFAULT_MAX_FALLBACK_DELTA = parseFloat(process.env.REGRESS_MAX_FALLBACK_DELTA || '0.03')
  private static readonly DEFAULT_MAX_LOWCONF_DELTA = parseFloat(process.env.REGRESS_MAX_LOWCONF_DELTA || '0.03')
  private static readonly DEFAULT_MAX_P95_DELTA_MS = parseInt(process.env.REGRESS_MAX_P95_DELTA_MS || '300', 10)
  private static readonly DEFAULT_MAX_AVGSIM_DROP = parseFloat(process.env.REGRESS_MAX_AVGSIM_DROP || '0.03')

  /**
   * Carrega baseline de um arquivo JSON
   */
  static loadBaseline(filePath: string): RegressionBaseline | null {
    try {
      if (!existsSync(filePath)) {
        return null
      }

      const content = readFileSync(filePath, 'utf-8')
      return JSON.parse(content) as RegressionBaseline
    } catch (error) {
      console.warn(`[BaselineManager] Erro ao carregar baseline: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null
    }
  }

  /**
   * Salva baseline de um relatório
   */
  static saveBaseline(report: RegressionReport, outputPath: string): void {
    const baseline: RegressionBaseline = {
      timestamp: report.timestamp,
      totalCases: report.totalCases,
      summary: {
        fallbackRate: report.summary.fallbackRate,
        lowConfidenceRate: report.summary.lowConfidenceRate,
        avgSimilarity: report.summary.avgSimilarity,
        p50TotalMs: report.summary.p50TotalMs,
        p95TotalMs: report.summary.p95TotalMs,
        totalCostUsd: report.summary.totalCostUsd
      }
    }

    writeFileSync(outputPath, JSON.stringify(baseline, null, 2), 'utf-8')
    console.log(`[BaselineManager] Baseline salvo em: ${outputPath}`)
  }

  /**
   * Compara relatório atual com baseline
   */
  static compare(
    current: RegressionReport,
    baseline: RegressionBaseline
  ): RegressionComparison {
    const regressions: RegressionComparison['regressions'] = []

    // 1. Fallback Rate
    const fallbackDelta = current.summary.fallbackRate - baseline.summary.fallbackRate
    regressions.push({
      metric: 'fallbackRate',
      baseline: baseline.summary.fallbackRate,
      current: current.summary.fallbackRate,
      delta: fallbackDelta,
      threshold: this.DEFAULT_MAX_FALLBACK_DELTA,
      passed: fallbackDelta <= this.DEFAULT_MAX_FALLBACK_DELTA
    })

    // 2. Low Confidence Rate
    const lowConfDelta = current.summary.lowConfidenceRate - baseline.summary.lowConfidenceRate
    regressions.push({
      metric: 'lowConfidenceRate',
      baseline: baseline.summary.lowConfidenceRate,
      current: current.summary.lowConfidenceRate,
      delta: lowConfDelta,
      threshold: this.DEFAULT_MAX_LOWCONF_DELTA,
      passed: lowConfDelta <= this.DEFAULT_MAX_LOWCONF_DELTA
    })

    // 3. P95 Latency
    const p95Delta = current.summary.p95TotalMs - baseline.summary.p95TotalMs
    regressions.push({
      metric: 'p95TotalMs',
      baseline: baseline.summary.p95TotalMs,
      current: current.summary.p95TotalMs,
      delta: p95Delta,
      threshold: this.DEFAULT_MAX_P95_DELTA_MS,
      passed: p95Delta <= this.DEFAULT_MAX_P95_DELTA_MS
    })

    // 4. Avg Similarity (deve ser >= baseline - threshold)
    const avgSimDelta = baseline.summary.avgSimilarity - current.summary.avgSimilarity
    regressions.push({
      metric: 'avgSimilarity',
      baseline: baseline.summary.avgSimilarity,
      current: current.summary.avgSimilarity,
      delta: avgSimDelta,
      threshold: this.DEFAULT_MAX_AVGSIM_DROP,
      passed: avgSimDelta <= this.DEFAULT_MAX_AVGSIM_DROP
    })

    const overallPassed = regressions.every(r => r.passed)

    return {
      current,
      baseline,
      regressions,
      overallPassed
    }
  }

  /**
   * Gera relatório de comparação em Markdown
   */
  static generateComparisonMarkdown(comparison: RegressionComparison): string {
    let md = `# 🔍 RAG Regression Comparison\n\n`
    md += `**Baseline Timestamp:** ${comparison.baseline.timestamp}\n`
    md += `**Current Timestamp:** ${comparison.current.timestamp}\n\n`

    const status = comparison.overallPassed ? '✅ **PASSED**' : '❌ **FAILED**'
    md += `## Status: ${status}\n\n`

    md += `## 📊 Metrics Comparison\n\n`
    md += `| Metric | Baseline | Current | Delta | Threshold | Status |\n`
    md += `|--------|----------|---------|-------|-----------|--------|\n`

    for (const reg of comparison.regressions) {
      const statusIcon = reg.passed ? '✅' : '❌'
      const deltaStr = reg.metric === 'p95TotalMs'
        ? `${reg.delta > 0 ? '+' : ''}${reg.delta}ms`
        : reg.metric === 'avgSimilarity'
        ? `${reg.delta > 0 ? '+' : ''}${reg.delta.toFixed(3)}`
        : `${reg.delta > 0 ? '+' : ''}${(reg.delta * 100).toFixed(1)}%`

      const baselineStr = reg.metric === 'p95TotalMs'
        ? `${reg.baseline}ms`
        : reg.metric === 'avgSimilarity'
        ? reg.baseline.toFixed(3)
        : `${(reg.baseline * 100).toFixed(1)}%`

      const currentStr = reg.metric === 'p95TotalMs'
        ? `${reg.current}ms`
        : reg.metric === 'avgSimilarity'
        ? reg.current.toFixed(3)
        : `${(reg.current * 100).toFixed(1)}%`

      const thresholdStr = reg.metric === 'p95TotalMs'
        ? `${reg.threshold}ms`
        : reg.metric === 'avgSimilarity'
        ? reg.threshold.toFixed(3)
        : `${(reg.threshold * 100).toFixed(1)}%`

      md += `| ${reg.metric} | ${baselineStr} | ${currentStr} | ${deltaStr} | ${thresholdStr} | ${statusIcon} |\n`
    }

    md += `\n`

    // Detalhes das regressões
    const failedRegressions = comparison.regressions.filter(r => !r.passed)
    if (failedRegressions.length > 0) {
      md += `## ⚠️ Failed Regressions\n\n`
      for (const reg of failedRegressions) {
        md += `### ${reg.metric}\n\n`
        md += `- **Baseline:** ${reg.baseline}\n`
        md += `- **Current:** ${reg.current}\n`
        md += `- **Delta:** ${reg.delta}\n`
        md += `- **Threshold:** ${reg.threshold}\n`
        md += `- **Status:** ❌ FAILED (delta excede threshold)\n\n`
      }
    }

    return md
  }
}











