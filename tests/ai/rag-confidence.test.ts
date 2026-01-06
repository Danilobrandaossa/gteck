/**
 * 🧪 TESTES - RAG Confidence (FASE 7 ETAPA 7)
 * 
 * Testes obrigatórios para cálculo de confiança do RAG
 */

import { describe, it, expect } from 'vitest'
import { RagConfidence, ConfidenceInputs } from '@/lib/rag-confidence'

describe('RagConfidence', () => {
  describe('computeConfidence', () => {
    it('deve retornar LOW quando chunksSelected === 0', () => {
      const inputs: ConfidenceInputs = {
        chunksSelected: 0,
        averageSimilarity: 0.8,
        topSimilarity: 0.9
      }

      const result = RagConfidence.computeConfidence(inputs)

      expect(result.level).toBe('low')
      expect(result.score).toBe(0)
      expect(result.reasons).toContain('No chunks selected')
    })

    it('deve retornar LOW quando averageSimilarity < hard threshold', () => {
      const inputs: ConfidenceInputs = {
        chunksSelected: 5,
        averageSimilarity: 0.60, // < 0.68 (hard threshold default)
        topSimilarity: 0.70
      }

      const result = RagConfidence.computeConfidence(inputs)

      expect(result.level).toBe('low')
      expect(result.score).toBeLessThan(1)
      expect(result.reasons.some(r => r.includes('below hard threshold'))).toBe(true)
    })

    it('deve retornar LOW quando topSimilarity < hard top threshold', () => {
      const inputs: ConfidenceInputs = {
        chunksSelected: 5,
        averageSimilarity: 0.75,
        topSimilarity: 0.65 // < 0.70 (hard top threshold default)
      }

      const result = RagConfidence.computeConfidence(inputs)

      expect(result.level).toBe('low')
      expect(result.reasons.some(r => r.includes('below hard top threshold'))).toBe(true)
    })

    it('deve retornar HIGH quando averageSimilarity >= soft threshold e chunksSelected >= minChunks', () => {
      const inputs: ConfidenceInputs = {
        chunksSelected: 3, // >= 2 (minChunks default)
        averageSimilarity: 0.80, // >= 0.75 (soft threshold default)
        topSimilarity: 0.85,
        rerankApplied: true,
        diversityApplied: true
      }

      const result = RagConfidence.computeConfidence(inputs)

      expect(result.level).toBe('high')
      expect(result.score).toBeGreaterThan(0.7)
      expect(result.reasons.some(r => r.includes('High confidence'))).toBe(true)
    })

    it('deve retornar MEDIUM quando está entre hard e soft threshold', () => {
      const inputs: ConfidenceInputs = {
        chunksSelected: 2,
        averageSimilarity: 0.72, // Entre 0.68 (hard) e 0.75 (soft)
        topSimilarity: 0.75
      }

      const result = RagConfidence.computeConfidence(inputs)

      expect(result.level).toBe('medium')
      expect(result.score).toBeGreaterThanOrEqual(0.3)
      expect(result.score).toBeLessThanOrEqual(0.7)
      expect(result.reasons.some(r => r.includes('Medium confidence'))).toBe(true)
    })

    it('deve retornar estrutura completa com thresholds', () => {
      const inputs: ConfidenceInputs = {
        chunksSelected: 3,
        averageSimilarity: 0.80,
        topSimilarity: 0.85
      }

      const result = RagConfidence.computeConfidence(inputs)

      expect(result).toHaveProperty('level')
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('reasons')
      expect(result).toHaveProperty('thresholds')
      expect(result.thresholds).toHaveProperty('soft')
      expect(result.thresholds).toHaveProperty('hard')
      expect(result.thresholds).toHaveProperty('hardTop')
      expect(result.thresholds).toHaveProperty('minChunks')
    })
  })

  describe('shouldCallProvider', () => {
    it('deve retornar false para LOW', () => {
      const confidence = RagConfidence.computeConfidence({
        chunksSelected: 0,
        averageSimilarity: 0.5
      })

      expect(RagConfidence.shouldCallProvider(confidence)).toBe(false)
    })

    it('deve retornar true para MEDIUM', () => {
      const confidence = RagConfidence.computeConfidence({
        chunksSelected: 2,
        averageSimilarity: 0.72
      })

      expect(RagConfidence.shouldCallProvider(confidence)).toBe(true)
    })

    it('deve retornar true para HIGH', () => {
      const confidence = RagConfidence.computeConfidence({
        chunksSelected: 3,
        averageSimilarity: 0.80
      })

      expect(RagConfidence.shouldCallProvider(confidence)).toBe(true)
    })
  })

  describe('shouldUseFallback', () => {
    it('deve retornar true para LOW', () => {
      const confidence = RagConfidence.computeConfidence({
        chunksSelected: 0,
        averageSimilarity: 0.5
      })

      expect(RagConfidence.shouldUseFallback(confidence)).toBe(true)
    })

    it('deve retornar false para MEDIUM', () => {
      const confidence = RagConfidence.computeConfidence({
        chunksSelected: 2,
        averageSimilarity: 0.72
      })

      expect(RagConfidence.shouldUseFallback(confidence)).toBe(false)
    })

    it('deve retornar false para HIGH', () => {
      const confidence = RagConfidence.computeConfidence({
        chunksSelected: 3,
        averageSimilarity: 0.80
      })

      expect(RagConfidence.shouldUseFallback(confidence)).toBe(false)
    })
  })
})









