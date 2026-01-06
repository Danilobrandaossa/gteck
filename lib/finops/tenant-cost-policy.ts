/**
 * 💰 TENANT COST POLICY - FASE 8 ETAPA 2
 * 
 * Gestão de custo por tenant com degradação graciosa
 */

import { db } from '@/lib/db'

// Níveis de custo/saúde do tenant
export type TenantCostState = 'NORMAL' | 'CAUTION' | 'THROTTLED' | 'BLOCKED'

// Configuração de thresholds
const TENANT_BUDGET_WARN_PCT = parseFloat(process.env.TENANT_BUDGET_WARN_PCT || '0.7')
const TENANT_BUDGET_THROTTLE_PCT = parseFloat(process.env.TENANT_BUDGET_THROTTLE_PCT || '0.9')
const TENANT_BUDGET_BLOCK_PCT = parseFloat(process.env.TENANT_BUDGET_BLOCK_PCT || '1.0')

export interface TenantSpend {
  organizationId: string
  siteId: string
  daySpendUsd: number
  monthSpendUsd: number
  budgetDayUsd: number | null
  budgetMonthUsd: number | null
}

export interface TenantCostInfo {
  state: TenantCostState
  spend: TenantSpend
  degradationActions: string[]
}

export interface PolicyAdjustment {
  model?: string
  provider?: string
  maxTokens?: number
  topK?: number
  topN?: number
  efSearch?: number
  hardThreshold?: number
  degradationLevel?: TenantCostState
  degradationActions: string[]
}

export class TenantCostPolicyService {
  /**
   * Obtém o gasto do tenant em uma janela de tempo
   */
  static async getSpend(
    organizationId: string,
    siteId: string,
    window: 'day' | 'month' = 'day'
  ): Promise<number> {
    const now = new Date()
    let startDate: Date

    if (window === 'day') {
      // Últimas 24h
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    } else {
      // Início do mês atual
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const result = await db.aIInteraction.aggregate({
      where: {
        organizationId,
        siteId,
        createdAt: {
          gte: startDate
        },
        // Apenas interações que geraram custo
        type: {
          in: ['rag_query', 'chat_message']
        }
      },
      _sum: {
        costUSD: true
      }
    })

    return result._sum.costUSD || 0
  }

  /**
   * Obtém informações completas de spend do tenant
   */
  static async getTenantSpend(
    organizationId: string,
    siteId: string
  ): Promise<TenantSpend> {
    const [daySpend, monthSpend] = await Promise.all([
      this.getSpend(organizationId, siteId, 'day'),
      this.getSpend(organizationId, siteId, 'month')
    ])

    // Buscar limites do tenant (se existirem)
    const site = await db.site.findUnique({
      where: { id: siteId },
      select: {
        settings: true
      }
    })

    const settings = (site?.settings as any) || {}
    const budgetDayUsd = settings.budgetDayUsd || null
    const budgetMonthUsd = settings.budgetMonthUsd || null

    return {
      organizationId,
      siteId,
      daySpendUsd: daySpend,
      monthSpendUsd: monthSpend,
      budgetDayUsd,
      budgetMonthUsd
    }
  }

  /**
   * Calcula o estado de custo do tenant
   */
  static getCostState(spend: TenantSpend): TenantCostState {
    // Se não há budget definido, sempre NORMAL
    if (!spend.budgetDayUsd && !spend.budgetMonthUsd) {
      return 'NORMAL'
    }

    // Verificar ambos os budgets (dia e mês) e usar o mais restritivo
    const budgets: Array<{ budget: number; spent: number }> = []

    if (spend.budgetDayUsd) {
      budgets.push({ budget: spend.budgetDayUsd, spent: spend.daySpendUsd })
    }

    if (spend.budgetMonthUsd) {
      budgets.push({ budget: spend.budgetMonthUsd, spent: spend.monthSpendUsd })
    }

    // Calcular percentuais
    const percentages = budgets.map(b => b.spent / b.budget)
    const maxPercentage = Math.max(...percentages, 0)

    // Determinar estado baseado no threshold
    if (maxPercentage >= TENANT_BUDGET_BLOCK_PCT) {
      return 'BLOCKED'
    } else if (maxPercentage >= TENANT_BUDGET_THROTTLE_PCT) {
      return 'THROTTLED'
    } else if (maxPercentage >= TENANT_BUDGET_WARN_PCT) {
      return 'CAUTION'
    }

    return 'NORMAL'
  }

  /**
   * Aplica degradação graciosa baseada no estado de custo
   */
  static applyDegradation(
    state: TenantCostState,
    originalPolicy: {
      provider?: string
      model?: string
      maxTokens?: number
      topK?: number
      topN?: number
      efSearch?: number
      hardThreshold?: number
    }
  ): PolicyAdjustment {
    const adjustment: PolicyAdjustment = {
      degradationLevel: state,
      degradationActions: []
    }

    switch (state) {
      case 'NORMAL':
        // Nenhuma degradação
        return adjustment

      case 'CAUTION':
        // Degradação leve
        if (originalPolicy.maxTokens) {
          adjustment.maxTokens = Math.floor(originalPolicy.maxTokens * 0.7) // -30%
          adjustment.degradationActions.push('reduced_max_tokens_30pct')
        }

        if (originalPolicy.topK && originalPolicy.topK > 3) {
          adjustment.topK = Math.max(3, Math.floor(originalPolicy.topK * 0.8))
          adjustment.degradationActions.push('reduced_topk')
        }

        // Preferir modelo mais barato
        if (originalPolicy.model === 'gpt-4' || originalPolicy.model === 'gpt-4-turbo') {
          adjustment.model = 'gpt-4o-mini'
          adjustment.degradationActions.push('cheaper_model')
        }

        // Reduzir ef_search se alto
        if (originalPolicy.efSearch && originalPolicy.efSearch > 40) {
          adjustment.efSearch = 40 // medium
          adjustment.degradationActions.push('reduced_ef_search')
        }

        break

      case 'THROTTLED':
        // Degradação significativa
        if (originalPolicy.maxTokens) {
          adjustment.maxTokens = Math.floor(originalPolicy.maxTokens * 0.5) // -50%
          adjustment.degradationActions.push('reduced_max_tokens_50pct')
        }

        if (originalPolicy.topN && originalPolicy.topN > 12) {
          adjustment.topN = 12
          adjustment.degradationActions.push('reduced_topn')
        }

        if (originalPolicy.topK && originalPolicy.topK > 2) {
          adjustment.topK = 2
          adjustment.degradationActions.push('reduced_topk_minimal')
        }

        // Modelo mais barato obrigatório
        adjustment.model = 'gpt-4o-mini'
        adjustment.degradationActions.push('cheapest_model_enforced')

        // ef_search baixo
        if (originalPolicy.efSearch && originalPolicy.efSearch > 20) {
          adjustment.efSearch = 20 // low
          adjustment.degradationActions.push('reduced_ef_search_minimal')
        }

        // Aumentar threshold levemente (mais fallback, menos custo)
        if (originalPolicy.hardThreshold) {
          adjustment.hardThreshold = Math.min(
            originalPolicy.hardThreshold + 0.05,
            0.80
          )
          adjustment.degradationActions.push('increased_hard_threshold')
        }

        break

      case 'BLOCKED':
        // Bloqueio total
        adjustment.degradationActions.push('blocked_no_provider_call')
        break
    }

    return adjustment
  }

  /**
   * Obtém informações completas de custo do tenant
   */
  static async getTenantCostInfo(
    organizationId: string,
    siteId: string
  ): Promise<TenantCostInfo> {
    const spend = await this.getTenantSpend(organizationId, siteId)
    const state = this.getCostState(spend)
    
    // Degradation actions serão aplicadas pelo caller
    const degradationActions: string[] = []

    return {
      state,
      spend,
      degradationActions
    }
  }

  /**
   * Verifica se tenant está bloqueado
   */
  static async isTenantBlocked(
    organizationId: string,
    siteId: string
  ): Promise<boolean> {
    const costInfo = await this.getTenantCostInfo(organizationId, siteId)
    return costInfo.state === 'BLOCKED'
  }

  /**
   * Gera mensagem amigável para tenant bloqueado
   */
  static getBlockedMessage(spend: TenantSpend): string {
    if (spend.budgetDayUsd && spend.daySpendUsd >= spend.budgetDayUsd) {
      return 'Limite de uso diário atingido. Por favor, tente novamente amanhã ou entre em contato com o suporte para aumentar seu limite.'
    }

    if (spend.budgetMonthUsd && spend.monthSpendUsd >= spend.budgetMonthUsd) {
      return 'Limite de uso mensal atingido. Por favor, tente novamente no próximo mês ou entre em contato com o suporte para aumentar seu limite.'
    }

    return 'Limite de uso atingido. Por favor, entre em contato com o suporte.'
  }
}








