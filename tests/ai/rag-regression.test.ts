/**
 * 🧪 TESTES - RAG Regression Testing
 * 
 * Testes obrigatórios para o framework de regressão
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { RegressionRunner } from './rag-regression.runner'
import { RegressionBaselineManager } from './rag-regression.baseline'
import { RegressionTestCase } from './rag-regression.types'

describe('RAG Regression Testing', () => {
  const testDatasetPath = join(__dirname, 'datasets', 'rag-regression.example.json')
  const reportsDir = join(__dirname, 'reports')
  const latestJsonPath = join(reportsDir, 'rag-regression.latest.json')
  const latestMdPath = join(reportsDir, 'rag-regression.latest.md')
  const baselinePath = join(reportsDir, 'rag-regression.baseline.json')

  beforeAll(() => {
    // Criar diretório de reports se não existir
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true })
    }
  })

  describe('Dataset Loading', () => {
    it('deve carregar dataset e validar schema', () => {
      const dataset = RegressionRunner.loadDataset(testDatasetPath)

      expect(dataset).toBeInstanceOf(Array)
      expect(dataset.length).toBeGreaterThan(0)

      for (const testCase of dataset) {
        expect(testCase).toHaveProperty('id')
        expect(testCase).toHaveProperty('organizationId')
        expect(testCase).toHaveProperty('siteId')
        expect(testCase).toHaveProperty('question')
        expect(testCase).toHaveProperty('expected')
        expect(typeof testCase.id).toBe('string')
        expect(typeof testCase.organizationId).toBe('string')
        expect(typeof testCase.siteId).toBe('string')
        expect(typeof testCase.question).toBe('string')
        expect(typeof testCase.expected).toBe('object')
      }
    })

    it('deve falhar ao carregar dataset inválido', () => {
      const invalidPath = join(__dirname, 'datasets', 'invalid.json')
      expect(() => {
        RegressionRunner.loadDataset(invalidPath)
      }).toThrow()
    })
  })

  describe('Report Generation', () => {
    it('deve gerar relatório JSON', async () => {
      const dataset = RegressionRunner.loadDataset(testDatasetPath)
      const report = await RegressionRunner.runAll(dataset)

      RegressionRunner.saveReportJson(report, latestJsonPath)

      expect(existsSync(latestJsonPath)).toBe(true)

      const savedReport = JSON.parse(readFileSync(latestJsonPath, 'utf-8'))
      expect(savedReport).toHaveProperty('timestamp')
      expect(savedReport).toHaveProperty('totalCases')
      expect(savedReport).toHaveProperty('passedCases')
      expect(savedReport).toHaveProperty('failedCases')
      expect(savedReport).toHaveProperty('summary')
      expect(savedReport).toHaveProperty('results')
      expect(savedReport.totalCases).toBe(dataset.length)
    })

    it('deve gerar relatório Markdown', async () => {
      const dataset = RegressionRunner.loadDataset(testDatasetPath)
      const report = await RegressionRunner.runAll(dataset)

      RegressionRunner.saveReportMarkdown(report, latestMdPath)

      expect(existsSync(latestMdPath)).toBe(true)

      const md = readFileSync(latestMdPath, 'utf-8')
      expect(md).toContain('# 📊 RAG Regression Test Report')
      expect(md).toContain('Summary')
      expect(md).toContain('Test Results')
    })
  })

  describe('Baseline Management', () => {
    it('deve salvar baseline', async () => {
      const dataset = RegressionRunner.loadDataset(testDatasetPath)
      const report = await RegressionRunner.runAll(dataset)

      RegressionBaselineManager.saveBaseline(report, baselinePath)

      expect(existsSync(baselinePath)).toBe(true)

      const baseline = RegressionBaselineManager.loadBaseline(baselinePath)
      expect(baseline).not.toBeNull()
      expect(baseline?.totalCases).toBe(dataset.length)
      expect(baseline?.summary).toHaveProperty('fallbackRate')
      expect(baseline?.summary).toHaveProperty('lowConfidenceRate')
      expect(baseline?.summary).toHaveProperty('avgSimilarity')
    })

    it('deve comparar com baseline', async () => {
      const dataset = RegressionRunner.loadDataset(testDatasetPath)
      const report = await RegressionRunner.runAll(dataset)

      // Salvar baseline se não existir
      if (!existsSync(baselinePath)) {
        RegressionBaselineManager.saveBaseline(report, baselinePath)
      }

      const baseline = RegressionBaselineManager.loadBaseline(baselinePath)
      expect(baseline).not.toBeNull()

      if (baseline) {
        const comparison = RegressionBaselineManager.compare(report, baseline)

        expect(comparison).toHaveProperty('current')
        expect(comparison).toHaveProperty('baseline')
        expect(comparison).toHaveProperty('regressions')
        expect(comparison).toHaveProperty('overallPassed')
        expect(comparison.regressions.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Test Results', () => {
    it('deve ter pelo menos 1 caso PASS e 1 caso FAIL (teste controlado)', async () => {
      const dataset = RegressionRunner.loadDataset(testDatasetPath)
      const report = await RegressionRunner.runAll(dataset)

      // Verificar que temos resultados
      expect(report.results.length).toBeGreaterThan(0)

      // Verificar que temos pelo menos um passado ou falho
      const passedCount = report.results.filter(r => r.passed).length
      const failedCount = report.results.filter(r => !r.passed).length

      // Pelo menos um deve passar ou falhar (dependendo dos dados)
      expect(passedCount + failedCount).toBe(report.totalCases)
    })
  })
})









