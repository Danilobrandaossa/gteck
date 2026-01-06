/**
 * 🧪 TESTES - Tenant Cost Policy (FASE 8 ETAPA 2)
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { TenantCostPolicyService, TenantCostState } from '@/lib/finops/tenant-cost-policy'

describe('TenantCostPolicyService', () => {
  describe('getCostState', () => {
    it('deve retornar NORMAL quando não há budget definido', () => {
      const spend = {
        organizationId: 'org-1',
        siteId: 'site-1',
        daySpendUsd: 10,
        monthSpendUsd: 100,
        budgetDayUsd: null,
        budgetMonthUsd: null
      }

      const state = TenantCostPolicyService.getCostState(spend)
      expect(state).toBe('NORMAL')
    })

    it('deve retornar NORMAL quando spend < 70% do budget', () => {
      const spend = {
        organizationId: 'org-1',
        siteId: 'site-1',
        daySpendUsd: 5,
        monthSpendUsd: 50,
        budgetDayUsd: 10,
        budgetMonthUsd: 100
      }

      const state = TenantCostPolicyService.getCostState(spend)
      expect(state).toBe('NORMAL')
    })

    it('deve retornar CAUTION quando spend >= 70% e < 90%', () => {
      const spend = {
        organizationId: 'org-1',
        siteId: 'site-1',
        daySpendUsd: 8,
        monthSpendUsd: 80,
        budgetDayUsd: 10,
        budgetMonthUsd: 100
      }

      const state = TenantCostPolicyService.getCostState(spend)
      expect(state).toBe('CAUTION')
    })

    it('deve retornar THROTTLED quando spend >= 90% e < 100%', () => {
      const spend = {
        organizationId: 'org-1',
        siteId: 'site-1',
        daySpendUsd: 9.5,
        monthSpendUsd: 95,
        budgetDayUsd: 10,
        budgetMonthUsd: 100
      }

      const state = TenantCostPolicyService.getCostState(spend)
      expect(state).toBe('THROTTLED')
    })

    it('deve retornar BLOCKED quando spend >= 100%', () => {
      const spend = {
        organizationId: 'org-1',
        siteId: 'site-1',
        daySpendUsd: 10,
        monthSpendUsd: 100,
        budgetDayUsd: 10,
        budgetMonthUsd: 100
      }

      const state = TenantCostPolicyService.getCostState(spend)
      expect(state).toBe('BLOCKED')
    })

    it('deve usar o budget mais restritivo (dia vs mês)', () => {
      // Dia está em CAUTION (75%), mês está em NORMAL (50%)
      const spend1 = {
        organizationId: 'org-1',
        siteId: 'site-1',
        daySpendUsd: 7.5,
        monthSpendUsd: 50,
        budgetDayUsd: 10,
        budgetMonthUsd: 100
      }

      expect(TenantCostPolicyService.getCostState(spend1)).toBe('CAUTION')

      // Dia está em NORMAL (50%), mês está em THROTTLED (95%)
      const spend2 = {
        organizationId: 'org-1',
        siteId: 'site-1',
        daySpendUsd: 5,
        monthSpendUsd: 95,
        budgetDayUsd: 10,
        budgetMonthUsd: 100
      }

      expect(TenantCostPolicyService.getCostState(spend2)).toBe('THROTTLED')
    })
  })

  describe('applyDegradation', () => {
    it('não deve aplicar degradação em NORMAL', () => {
      const originalPolicy = {
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 1000,
        topK: 5,
        topN: 20,
        efSearch: 80,
        hardThreshold: 0.68
      }

      const degradation = TenantCostPolicyService.applyDegradation('NORMAL', originalPolicy)

      expect(degradation.degradationActions).toEqual([])
      expect(degradation.model).toBeUndefined()
      expect(degradation.maxTokens).toBeUndefined()
    })

    it('deve aplicar degradação leve em CAUTION', () => {
      const originalPolicy = {
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 1000,
        topK: 5,
        topN: 20,
        efSearch: 80,
        hardThreshold: 0.68
      }

      const degradation = TenantCostPolicyService.applyDegradation('CAUTION', originalPolicy)

      expect(degradation.degradationActions.length).toBeGreaterThan(0)
      expect(degradation.maxTokens).toBe(700) // -30%
      expect(degradation.topK).toBeLessThanOrEqual(4) // Reduzido
      expect(degradation.model).toBe('gpt-4o-mini') // Modelo mais barato
      expect(degradation.efSearch).toBe(40) // Reduzido
    })

    it('deve aplicar degradação significativa em THROTTLED', () => {
      const originalPolicy = {
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 1000,
        topK: 5,
        topN: 20,
        efSearch: 80,
        hardThreshold: 0.68
      }

      const degradation = TenantCostPolicyService.applyDegradation('THROTTLED', originalPolicy)

      expect(degradation.degradationActions.length).toBeGreaterThan(3)
      expect(degradation.maxTokens).toBe(500) // -50%
      expect(degradation.topK).toBe(2) // Mínimo
      expect(degradation.topN).toBe(12) // Reduzido
      expect(degradation.model).toBe('gpt-4o-mini') // Modelo econômico obrigatório
      expect(degradation.efSearch).toBe(20) // Mínimo
      expect(degradation.hardThreshold).toBeGreaterThan(0.68) // Threshold aumentado
    })

    it('deve marcar bloqueio em BLOCKED', () => {
      const originalPolicy = {
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 1000
      }

      const degradation = TenantCostPolicyService.applyDegradation('BLOCKED', originalPolicy)

      expect(degradation.degradationActions).toContain('blocked_no_provider_call')
    })

    it('deve registrar todas as ações de degradação', () => {
      const originalPolicy = {
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 1000,
        topK: 5,
        topN: 20,
        efSearch: 80,
        hardThreshold: 0.68
      }

      const degradation = TenantCostPolicyService.applyDegradation('THROTTLED', originalPolicy)

      expect(degradation.degradationActions).toContain('reduced_max_tokens_50pct')
      expect(degradation.degradationActions).toContain('cheapest_model_enforced')
      expect(degradation.degradationActions).toContain('reduced_topk_minimal')
      expect(degradation.degradationActions).toContain('reduced_topn')
      expect(degradation.degradationActions).toContain('reduced_ef_search_minimal')
      expect(degradation.degradationActions).toContain('increased_hard_threshold')
    })
  })

  describe('getBlockedMessage', () => {
    it('deve retornar mensagem para limite diário', () => {
      const spend = {
        organizationId: 'org-1',
        siteId: 'site-1',
        daySpendUsd: 10,
        monthSpendUsd: 50,
        budgetDayUsd: 10,
        budgetMonthUsd: 200
      }

      const message = TenantCostPolicyService.getBlockedMessage(spend)
      expect(message).toContain('diário')
      expect(message).toContain('amanhã')
    })

    it('deve retornar mensagem para limite mensal', () => {
      const spend = {
        organizationId: 'org-1',
        siteId: 'site-1',
        daySpendUsd: 5,
        monthSpendUsd: 100,
        budgetDayUsd: null,
        budgetMonthUsd: 100
      }

      const message = TenantCostPolicyService.getBlockedMessage(spend)
      expect(message).toContain('mensal')
      expect(message).toContain('próximo mês')
    })
  })
})








