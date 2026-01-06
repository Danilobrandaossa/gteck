/**
 * 🧪 TESTES - RAG Rerank (FASE 7 ETAPA 2)
 * 
 * Testes obrigatórios para rerank e diversidade
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RagRerank, RerankChunk } from '@/lib/rag-rerank'

describe('RagRerank', () => {
  const baseChunk: RerankChunk = {
    id: 'chunk-1',
    sourceType: 'page',
    sourceId: 'page-1',
    content: 'Test content',
    similarity: 0.8
  }

  describe('rerankAndSelect', () => {
    it('deve filtrar por similarity threshold', () => {
      const candidates: RerankChunk[] = [
        { ...baseChunk, similarity: 0.9 },
        { ...baseChunk, id: 'chunk-2', similarity: 0.5 }, // Abaixo do threshold
        { ...baseChunk, id: 'chunk-3', similarity: 0.8 }
      ]

      const result = RagRerank.rerankAndSelect(candidates, {
        similarityThreshold: 0.7
      })

      expect(result.chunks.length).toBeLessThanOrEqual(2) // Apenas chunks >= 0.7
      expect(result.metrics.chunksConsidered).toBe(3)
    })

    it('deve respeitar maxPerSource', () => {
      const candidates: RerankChunk[] = [
        { ...baseChunk, id: 'chunk-1', similarity: 0.9 },
        { ...baseChunk, id: 'chunk-2', similarity: 0.85 },
        { ...baseChunk, id: 'chunk-3', similarity: 0.8 },
        { ...baseChunk, id: 'chunk-4', sourceId: 'page-2', similarity: 0.75 }
      ]

      const result = RagRerank.rerankAndSelect(candidates, {
        topK: 5,
        maxPerSource: 2
      })

      // Máximo 2 chunks do mesmo sourceId
      const page1Chunks = result.chunks.filter(c => c.sourceId === 'page-1')
      expect(page1Chunks.length).toBeLessThanOrEqual(2)
    })

    it('deve aplicar diversidade (anti-redundância)', () => {
      const candidates: RerankChunk[] = [
        { ...baseChunk, id: 'chunk-1', content: 'Este é um texto sobre produtos', similarity: 0.9 },
        { ...baseChunk, id: 'chunk-2', content: 'Este é um texto sobre produtos', similarity: 0.88 }, // Muito similar
        { ...baseChunk, id: 'chunk-3', content: 'Informações sobre política de devolução', similarity: 0.85 }
      ]

      const result = RagRerank.rerankAndSelect(candidates, {
        topK: 3,
        diversityThreshold: 0.92
      })

      // Chunks muito similares não devem entrar juntos
      expect(result.chunks.length).toBeLessThanOrEqual(2)
    })

    it('deve aplicar rerank (reordenar por score)', () => {
      const candidates: RerankChunk[] = [
        { ...baseChunk, id: 'chunk-1', similarity: 0.8, title: 'Produtos' },
        { ...baseChunk, id: 'chunk-2', similarity: 0.85, title: 'Outro título' }
      ]

      const result = RagRerank.rerankAndSelect(candidates, {
        question: 'produtos',
        topK: 2
      })

      // Chunk com título matching deve ter boost
      expect(result.metrics.rerankApplied).toBe(true)
    })

    it('deve retornar métricas corretas', () => {
      const candidates: RerankChunk[] = [
        { ...baseChunk, similarity: 0.9 },
        { ...baseChunk, id: 'chunk-2', similarity: 0.8 }
      ]

      const result = RagRerank.rerankAndSelect(candidates, {
        topN: 20,
        topK: 5,
        maxPerSource: 2,
        diversityThreshold: 0.92
      })

      expect(result.metrics.chunksConsidered).toBe(2)
      expect(result.metrics.chunksSelected).toBeLessThanOrEqual(2)
      expect(result.metrics.rerankApplied).toBe(true)
      expect(result.metrics.diversityApplied).toBe(true)
      expect(result.metrics.topN).toBe(20)
      expect(result.metrics.topK).toBe(5)
    })
  })
})









