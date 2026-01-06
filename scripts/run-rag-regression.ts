#!/usr/bin/env tsx
/**
 * 🏃 SCRIPT - RAG Regression Testing
 * 
 * Script para executar testes de regressão e gerar relatórios
 */

import { join } from 'path'
import { writeFileSync } from 'fs'
import { RegressionRunner } from '../tests/ai/rag-regression.runner'
import { RegressionBaselineManager } from '../tests/ai/rag-regression.baseline'

const DATASET_PATH = process.env.REGRESSION_DATASET_PATH || join(__dirname, '..', 'tests', 'ai', 'datasets', 'rag-regression.example.json')
const REPORTS_DIR = join(__dirname, '..', 'tests', 'ai', 'reports')
const LATEST_JSON = join(REPORTS_DIR, 'rag-regression.latest.json')
const LATEST_MD = join(REPORTS_DIR, 'rag-regression.latest.md')
const BASELINE_JSON = join(REPORTS_DIR, 'rag-regression.baseline.json')
const COMPARISON_MD = join(REPORTS_DIR, 'rag-regression.comparison.md')

async function main() {
  console.log('[RAG Regression] Iniciando testes de regressão...')
  console.log(`[RAG Regression] Dataset: ${DATASET_PATH}`)

  try {
    // 1. Carregar dataset
    const dataset = RegressionRunner.loadDataset(DATASET_PATH)
    console.log(`[RAG Regression] Carregados ${dataset.length} casos de teste`)

    // 2. Executar todos os casos
    const report = await RegressionRunner.runAll(dataset)

    // 3. Salvar relatórios
    RegressionRunner.saveReportJson(report, LATEST_JSON)
    RegressionRunner.saveReportMarkdown(report, LATEST_MD)

    console.log(`[RAG Regression] Relatórios salvos:`)
    console.log(`  - JSON: ${LATEST_JSON}`)
    console.log(`  - Markdown: ${LATEST_MD}`)

    // 4. Comparar com baseline (se existir)
    const baseline = RegressionBaselineManager.loadBaseline(BASELINE_JSON)
    if (baseline) {
      console.log(`[RAG Regression] Comparando com baseline...`)
      const comparison = RegressionBaselineManager.compare(report, baseline)

      const comparisonMd = RegressionBaselineManager.generateComparisonMarkdown(comparison)
      writeFileSync(COMPARISON_MD, comparisonMd, 'utf-8')
      console.log(`[RAG Regression] Comparação salva em: ${COMPARISON_MD}`)

      if (!comparison.overallPassed) {
        console.error(`[RAG Regression] ❌ REGRESSÃO DETECTADA!`)
        console.error(`[RAG Regression] Métricas que falharam:`)
        for (const reg of comparison.regressions.filter(r => !r.passed)) {
          console.error(`  - ${reg.metric}: delta=${reg.delta}, threshold=${reg.threshold}`)
        }
        process.exit(1)
      } else {
        console.log(`[RAG Regression] ✅ Nenhuma regressão detectada`)
      }
    } else {
      console.log(`[RAG Regression] Baseline não encontrado. Criando baseline...`)
      RegressionBaselineManager.saveBaseline(report, BASELINE_JSON)
      console.log(`[RAG Regression] Baseline salvo em: ${BASELINE_JSON}`)
    }

    // 5. Resumo final
    console.log(`\n[RAG Regression] Resumo:`)
    console.log(`  - Total: ${report.totalCases}`)
    console.log(`  - Passed: ${report.passedCases} (${((report.passedCases / report.totalCases) * 100).toFixed(1)}%)`)
    console.log(`  - Failed: ${report.failedCases} (${((report.failedCases / report.totalCases) * 100).toFixed(1)}%)`)
    console.log(`  - Fallback Rate: ${(report.summary.fallbackRate * 100).toFixed(1)}%`)
    console.log(`  - Low Confidence Rate: ${(report.summary.lowConfidenceRate * 100).toFixed(1)}%`)
    console.log(`  - Avg Similarity: ${report.summary.avgSimilarity.toFixed(3)}`)
    console.log(`  - P95 Latency: ${report.summary.p95TotalMs}ms`)
    console.log(`  - Total Cost: $${report.summary.totalCostUsd.toFixed(4)}`)

    // 6. Exit code baseado em resultados
    if (report.failedCases > 0) {
      console.error(`[RAG Regression] ⚠️ ${report.failedCases} casos falharam`)
      process.exit(1)
    }

    process.exit(0)
  } catch (error) {
    console.error(`[RAG Regression] ❌ Erro: ${error instanceof Error ? error.message : 'Unknown error'}`)
    process.exit(1)
  }
}

main()

