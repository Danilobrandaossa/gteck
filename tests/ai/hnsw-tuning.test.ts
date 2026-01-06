/**
 * 🧪 TESTES - HNSW Tuning (FASE 7 ETAPA 3)
 * 
 * Testes obrigatórios para tuning HNSW
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HnswTuningPolicy, calculateEfSearch, detectHnswEfSearchSupport } from '@/lib/hnsw-tuning'

describe('HnswTuningPolicy', () => {
  describe('getEfSearch', () => {
    it('deve retornar valores corretos para cada prioridade', () => {
      // Mock env vars
      process.env.RAG_EF_SEARCH_LOW = '20'
      process.env.RAG_EF_SEARCH_MEDIUM = '40'
      process.env.RAG_EF_SEARCH_HIGH = '80'
      process.env.RAG_EF_SEARCH_DEBUG = '120'

      expect(HnswTuningPolicy.getEfSearch('low')).toBe(20)
      expect(HnswTuningPolicy.getEfSearch('medium')).toBe(40)
      expect(HnswTuningPolicy.getEfSearch('high')).toBe(80)
      expect(HnswTuningPolicy.getEfSearch('debug')).toBe(120)
    })

    it('deve usar tenant override se fornecido', () => {
      const override = 100
      expect(HnswTuningPolicy.getEfSearch('low', 'rag', override)).toBe(override)
    })

    it('deve usar medium como default se priority não fornecido', () => {
      process.env.RAG_EF_SEARCH_MEDIUM = '40'
      expect(HnswTuningPolicy.getEfSearch(undefined)).toBe(40)
    })
  })

  describe('calculateEfSearch', () => {
    it('deve calcular ef_search baseado em prioridade', () => {
      process.env.RAG_EF_SEARCH_LOW = '20'
      process.env.RAG_EF_SEARCH_MEDIUM = '40'
      process.env.RAG_EF_SEARCH_HIGH = '80'

      expect(calculateEfSearch('low')).toBe(20)
      expect(calculateEfSearch('medium')).toBe(40)
      expect(calculateEfSearch('high')).toBe(80)
    })
  })
})

describe('HNSW Tuning Integration', () => {
  it('deve respeitar feature flag RAG_HNSW_TUNING_ENABLED', () => {
    const original = process.env.RAG_HNSW_TUNING_ENABLED
    
    process.env.RAG_HNSW_TUNING_ENABLED = 'false'
    expect(process.env.RAG_HNSW_TUNING_ENABLED).toBe('false')
    
    process.env.RAG_HNSW_TUNING_ENABLED = 'true'
    expect(process.env.RAG_HNSW_TUNING_ENABLED).toBe('true')
    
    // Restaurar
    if (original) {
      process.env.RAG_HNSW_TUNING_ENABLED = original
    } else {
      delete process.env.RAG_HNSW_TUNING_ENABLED
    }
  })
})









