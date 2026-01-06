/**
 * Testes mínimos para Feature Flags
 * 
 * Testa prioridade: request > tenant > env > default
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { resolveFeatureFlags, getFeatureFlags } from '@/lib/feature-flags'

describe('Feature Flags', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Limpar env antes de cada teste
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('deve usar defaults quando nenhum override fornecido', () => {
    const flags = getFeatureFlags()
    
    expect(flags.qualityTier).toBe('draft')
    expect(flags.includeTextInImage).toBe(false)
    expect(flags.enableRefinePass).toBe(false)
    expect(flags.enableScoring).toBe(false)
    expect(flags.enableOverlay).toBe(true)
  })

  it('deve priorizar request sobre env', () => {
    process.env.DEFAULT_QUALITY_TIER = 'production'
    process.env.DEFAULT_INCLUDE_TEXT_IN_IMAGE = 'true'
    
    const flags = resolveFeatureFlags({
      qualityTier: 'draft',
      includeTextInImage: false
    })
    
    expect(flags.qualityTier.value).toBe('draft')
    expect(flags.qualityTier.source).toBe('request')
    expect(flags.includeTextInImage.value).toBe(false)
    expect(flags.includeTextInImage.source).toBe('request')
  })

  it('deve priorizar env sobre default', () => {
    process.env.DEFAULT_QUALITY_TIER = 'production'
    process.env.FEATURE_REFINE_PASS = 'true'
    
    const flags = resolveFeatureFlags()
    
    expect(flags.qualityTier.value).toBe('production')
    expect(flags.qualityTier.source).toBe('env')
    expect(flags.enableRefinePass.value).toBe(true)
    expect(flags.enableRefinePass.source).toBe('env')
  })

  it('deve priorizar tenant sobre env', () => {
    process.env.DEFAULT_QUALITY_TIER = 'production'
    
    const flags = resolveFeatureFlags(undefined, {
      qualityTier: 'draft'
    })
    
    expect(flags.qualityTier.value).toBe('draft')
    expect(flags.qualityTier.source).toBe('tenant')
  })

  it('deve priorizar request sobre tenant', () => {
    process.env.DEFAULT_QUALITY_TIER = 'production'
    
    const flags = resolveFeatureFlags({
      qualityTier: 'production'
    }, {
      qualityTier: 'draft'
    })
    
    expect(flags.qualityTier.value).toBe('production')
    expect(flags.qualityTier.source).toBe('request')
  })
})

