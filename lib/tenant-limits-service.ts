/**
 * 🚦 TENANT LIMITS SERVICE - Rate limit e Budget por tenant
 * 
 * Responsabilidades:
 * - Rate limiting por organizationId + siteId
 * - Budget diário/mensal
 * - Bloqueio amigável quando limites atingidos
 */

import { db } from './db'
import { safeQueryRaw } from './tenant-security'
import { Prisma } from '@prisma/client'

export interface TenantLimitsConfig {
  organizationId: string
  siteId: string
  userId?: string
  
  // Rate limits
  rateLimitPerMinute?: number // Default: 60
  
  // Budgets
  dailyBudgetUSD?: number // Default: 10
  monthlyBudgetUSD?: number // Default: 300
}

export interface LimitCheckResult {
  allowed: boolean
  reason?: 'rate_limit' | 'daily_budget' | 'monthly_budget'
  message: string
  retryAfter?: number // Segundos até próxima tentativa
}

export class TenantLimitsService {
  private static readonly DEFAULT_RATE_LIMIT_PER_MINUTE = 60
  private static readonly DEFAULT_DAILY_BUDGET_USD = 10
  private static readonly DEFAULT_MONTHLY_BUDGET_USD = 300

  /**
   * Verifica se requisição está dentro dos limites
   */
  static async checkLimits(config: TenantLimitsConfig): Promise<LimitCheckResult> {
    // 1. Verificar rate limit
    const rateLimitCheck = await this.checkRateLimit(config)
    if (!rateLimitCheck.allowed) {
      return rateLimitCheck
    }

    // 2. Verificar budget diário
    const dailyBudgetCheck = await this.checkDailyBudget(config)
    if (!dailyBudgetCheck.allowed) {
      return dailyBudgetCheck
    }

    // 3. Verificar budget mensal
    const monthlyBudgetCheck = await this.checkMonthlyBudget(config)
    if (!monthlyBudgetCheck.allowed) {
      return monthlyBudgetCheck
    }

    return {
      allowed: true,
      message: 'Limits OK'
    }
  }

  /**
   * Verifica rate limit
   */
  private static async checkRateLimit(
    config: TenantLimitsConfig
  ): Promise<LimitCheckResult> {
    const limit = config.rateLimitPerMinute || this.DEFAULT_RATE_LIMIT_PER_MINUTE
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)

    try {
      // Contar requisições no último minuto
      const query = Prisma.sql`
        SELECT COUNT(*) as count
        FROM ai_interactions
        WHERE organization_id = ${config.organizationId}
          AND site_id = ${config.siteId}
          ${config.userId ? Prisma.sql`AND user_id = ${config.userId}` : Prisma.sql``}
          AND created_at >= ${oneMinuteAgo}
      `

      const results = await safeQueryRaw<{ count: bigint }>(
        config.organizationId,
        config.siteId,
        query
      )

      const count = Number(results[0]?.count || 0)

      if (count >= limit) {
        // Registrar bloqueio
        await this.recordLimitBlock(config, 'rate_limit')

        return {
          allowed: false,
          reason: 'rate_limit',
          message: `Rate limit exceeded. Maximum ${limit} requests per minute. Please try again in a moment.`,
          retryAfter: 60
        }
      }

      return { allowed: true, message: 'Rate limit OK' }
    } catch (error) {
      console.error('[TenantLimitsService] Error checking rate limit:', error)
      // Em caso de erro, permitir (fail-open)
      return { allowed: true, message: 'Rate limit check failed, allowing' }
    }
  }

  /**
   * Verifica budget diário
   */
  private static async checkDailyBudget(
    config: TenantLimitsConfig
  ): Promise<LimitCheckResult> {
    const budget = config.dailyBudgetUSD || this.DEFAULT_DAILY_BUDGET_USD
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    try {
      // Somar custos do dia
      const query = Prisma.sql`
        SELECT COALESCE(SUM(cost_usd), 0) as total_cost
        FROM ai_interactions
        WHERE organization_id = ${config.organizationId}
          AND site_id = ${config.siteId}
          ${config.userId ? Prisma.sql`AND user_id = ${config.userId}` : Prisma.sql``}
          AND created_at >= ${todayStart}
          AND cost_usd IS NOT NULL
      `

      const results = await safeQueryRaw<{ total_cost: number }>(
        config.organizationId,
        config.siteId,
        query
      )

      const totalCost = parseFloat(results[0]?.total_cost?.toString() || '0')

      if (totalCost >= budget) {
        // Registrar bloqueio
        await this.recordLimitBlock(config, 'daily_budget')

        const tomorrow = new Date(todayStart)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const retryAfter = Math.ceil((tomorrow.getTime() - Date.now()) / 1000)

        return {
          allowed: false,
          reason: 'daily_budget',
          message: `Daily budget exceeded. Budget: $${budget.toFixed(2)}, Used: $${totalCost.toFixed(2)}. Budget resets tomorrow.`,
          retryAfter
        }
      }

      return { allowed: true, message: 'Daily budget OK' }
    } catch (error) {
      console.error('[TenantLimitsService] Error checking daily budget:', error)
      // Em caso de erro, permitir (fail-open)
      return { allowed: true, message: 'Daily budget check failed, allowing' }
    }
  }

  /**
   * Verifica budget mensal
   */
  private static async checkMonthlyBudget(
    config: TenantLimitsConfig
  ): Promise<LimitCheckResult> {
    const budget = config.monthlyBudgetUSD || this.DEFAULT_MONTHLY_BUDGET_USD
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    try {
      // Somar custos do mês
      const query = Prisma.sql`
        SELECT COALESCE(SUM(cost_usd), 0) as total_cost
        FROM ai_interactions
        WHERE organization_id = ${config.organizationId}
          AND site_id = ${config.siteId}
          ${config.userId ? Prisma.sql`AND user_id = ${config.userId}` : Prisma.sql``}
          AND created_at >= ${monthStart}
          AND cost_usd IS NOT NULL
      `

      const results = await safeQueryRaw<{ total_cost: number }>(
        config.organizationId,
        config.siteId,
        query
      )

      const totalCost = parseFloat(results[0]?.total_cost?.toString() || '0')

      if (totalCost >= budget) {
        // Registrar bloqueio
        await this.recordLimitBlock(config, 'monthly_budget')

        const nextMonth = new Date(monthStart)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        const retryAfter = Math.ceil((nextMonth.getTime() - Date.now()) / 1000)

        return {
          allowed: false,
          reason: 'monthly_budget',
          message: `Monthly budget exceeded. Budget: $${budget.toFixed(2)}, Used: $${totalCost.toFixed(2)}. Budget resets next month.`,
          retryAfter
        }
      }

      return { allowed: true, message: 'Monthly budget OK' }
    } catch (error) {
      console.error('[TenantLimitsService] Error checking monthly budget:', error)
      // Em caso de erro, permitir (fail-open)
      return { allowed: true, message: 'Monthly budget check failed, allowing' }
    }
  }

  /**
   * Registra bloqueio de limite (sem gastar IA)
   */
  private static async recordLimitBlock(
    config: TenantLimitsConfig,
    reason: 'rate_limit' | 'daily_budget' | 'monthly_budget'
  ): Promise<void> {
    try {
      await db.aIInteraction.create({
        data: {
          organizationId: config.organizationId,
          siteId: config.siteId,
          userId: config.userId,
          type: 'limit_blocked',
          status: 'failed',
          prompt: `Limit blocked: ${reason}`,
          provider: 'system',
          model: 'limit',
          response: null,
          errorMessage: reason,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          costUSD: 0,
          durationMs: 0,
          ragUsed: false
        }
      })
    } catch (error) {
      console.error('[TenantLimitsService] Error recording limit block:', error)
      // Não falhar se não conseguir registrar
    }
  }
}











