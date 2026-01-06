/**
 * FASE H.4 - Gerador de Relatório Final
 * 
 * Coleta métricas de todos os testes e gera relatório JSON + Markdown
 */

import { TestMetricsCollector, TestReport } from './helpers/test-metrics'
import { writeFileSync } from 'fs'
import { join } from 'path'

export class ReportGenerator {
  /**
   * Gerar relatório final (JSON + Markdown)
   */
  static generateFinalReport(
    metricsCollector: TestMetricsCollector,
    outputDir: string = './reports'
  ): void {
    const report = metricsCollector.generateReport()

    // Gerar JSON
    const jsonPath = join(outputDir, 'e2e-report.json')
    writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8')

    // Gerar Markdown
    const markdownPath = join(outputDir, 'e2e-report.md')
    const markdown = this.generateMarkdownReport(report)
    writeFileSync(markdownPath, markdown, 'utf-8')

    console.log(`✅ Relatório gerado:`)
    console.log(`   - JSON: ${jsonPath}`)
    console.log(`   - Markdown: ${markdownPath}`)
  }

  /**
   * Gerar relatório Markdown formatado
   */
  private static generateMarkdownReport(report: TestReport): string {
    const timestamp = new Date(report.timestamp).toLocaleString('pt-BR')
    const successRate = report.successRate.toFixed(2)
    const passCount = report.passedScenarios
    const failCount = report.failedScenarios
    const totalCount = report.totalScenarios

    let markdown = `# 🧪 Relatório E2E - WordPress Sync + IA\n\n`
    markdown += `**Data:** ${timestamp}\n\n`
    markdown += `---\n\n`

    // Resumo Executivo
    markdown += `## 📊 Resumo Executivo\n\n`
    markdown += `| Métrica | Valor |\n`
    markdown += `|---------|-------|\n`
    markdown += `| **Total de Cenários** | ${totalCount} |\n`
    markdown += `| **Cenários Passados** | ${passCount} ✅ |\n`
    markdown += `| **Cenários Falhados** | ${failCount} ❌ |\n`
    markdown += `| **Taxa de Sucesso** | ${successRate}% |\n\n`

    // Métricas de Latência
    markdown += `## ⏱️ Métricas de Latência\n\n`
    markdown += `| Métrica | P50 | P95 |\n`
    markdown += `|---------|-----|-----|\n`
    markdown += `| Sync | ${report.metrics.latency.syncP50}ms | ${report.metrics.latency.syncP95}ms |\n`
    markdown += `| Indexação | ${report.metrics.latency.indexingP50}ms | ${report.metrics.latency.indexingP95}ms |\n`
    markdown += `| RAG | ${report.metrics.latency.ragP50}ms | ${report.metrics.latency.ragP95}ms |\n`
    markdown += `| Total E2E | ${report.metrics.latency.totalE2EP50}ms | ${report.metrics.latency.totalE2EP95}ms |\n\n`

    // Métricas de Qualidade
    markdown += `## 🎯 Métricas de Qualidade\n\n`
    markdown += `| Métrica | Valor |\n`
    markdown += `|---------|-------|\n`
    markdown += `| **Fallback Rate** | ${(report.metrics.quality.fallbackRate * 100).toFixed(2)}% |\n`
    markdown += `| **Low Confidence Rate** | ${(report.metrics.quality.lowConfidenceRate * 100).toFixed(2)}% |\n`
    markdown += `| **Avg Similarity** | ${report.metrics.quality.avgSimilarity.toFixed(3)} |\n\n`

    // Métricas de Custo
    markdown += `## 💰 Métricas de Custo\n\n`
    markdown += `| Métrica | Valor |\n`
    markdown += `|---------|-------|\n`
    markdown += `| **Custo Total (USD)** | $${report.metrics.cost.totalCostUSD.toFixed(4)} |\n`
    markdown += `| **Custo por Query** | $${report.metrics.cost.costPerQuery.toFixed(4)} |\n`
    markdown += `| **Custo por Embedding** | $${report.metrics.cost.costPerEmbedding.toFixed(4)} |\n\n`

    // Métricas de Confiabilidade
    markdown += `## 🔒 Métricas de Confiabilidade\n\n`
    markdown += `| Métrica | Valor |\n`
    markdown += `|---------|-------|\n`
    markdown += `| **Success Rate** | ${report.metrics.reliability.successRate.toFixed(2)}% |\n`
    markdown += `| **Error Rate** | ${report.metrics.reliability.errorRate.toFixed(2)}% |\n`
    markdown += `| **Queue Stuck Count** | ${report.metrics.reliability.queueStuckCount} |\n\n`

    // Checklist Go-Live
    markdown += `## ✅ Checklist Go-Live\n\n`
    const checklist = report.goLiveChecklist
    markdown += `| Item | Status |\n`
    markdown += `|------|--------|\n`
    markdown += `| **Sync Funcionando** | ${checklist.syncWorking ? '✅ Sim' : '❌ Não'} |\n`
    markdown += `| **Indexação Funcionando** | ${checklist.indexingWorking ? '✅ Sim' : '❌ Não'} |\n`
    markdown += `| **RAG Funcionando** | ${checklist.ragWorking ? '✅ Sim' : '❌ Não'} |\n`
    markdown += `| **FinOps Funcionando** | ${checklist.finopsWorking ? '✅ Sim' : '❌ Não'} |\n`
    markdown += `| **Observabilidade Funcionando** | ${checklist.observabilityWorking ? '✅ Sim' : '❌ Não'} |\n`
    markdown += `| **Queue Funcionando** | ${checklist.queueWorking ? '✅ Sim' : '❌ Não'} |\n`
    markdown += `| **Multi-tenant Isolado** | ${checklist.multiTenantIsolated ? '✅ Sim' : '❌ Não'} |\n`
    markdown += `| **Health/Alerts Funcionando** | ${checklist.healthAlertsWorking ? '✅ Sim' : '❌ Não'} |\n\n`

    const allPassed = Object.values(checklist).every(v => v)
    markdown += `**Status Geral:** ${allPassed ? '✅ **PRONTO PARA GO-LIVE**' : '❌ **NÃO PRONTO**'}\n\n`

    // CorrelationIds
    if (report.correlationIds.length > 0) {
      markdown += `## 🔗 CorrelationIds Principais\n\n`
      report.correlationIds.slice(0, 10).forEach((id, index) => {
        markdown += `${index + 1}. \`${id}\`\n`
      })
      if (report.correlationIds.length > 10) {
        markdown += `\n*... e mais ${report.correlationIds.length - 10} correlationIds*\n\n`
      }
    }

    // Detalhes por Cenário
    markdown += `## 📋 Detalhes por Cenário\n\n`
    report.scenarios.forEach((scenario, index) => {
      const status = scenario.passed ? '✅' : '❌'
      markdown += `### ${index + 1}. ${scenario.scenarioId} - ${scenario.scenarioName} ${status}\n\n`
      markdown += `- **Duração:** ${scenario.durationMs}ms\n`
      if (scenario.error) {
        markdown += `- **Erro:** ${scenario.error}\n`
      }
      if (scenario.correlationId) {
        markdown += `- **CorrelationId:** \`${scenario.correlationId}\`\n`
      }
      if (scenario.metadata && Object.keys(scenario.metadata).length > 0) {
        markdown += `- **Metadados:**\n`
        Object.entries(scenario.metadata).forEach(([key, value]) => {
          markdown += `  - ${key}: ${JSON.stringify(value)}\n`
        })
      }
      markdown += `\n`
    })

    return markdown
  }
}






