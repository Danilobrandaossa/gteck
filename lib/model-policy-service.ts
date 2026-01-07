/**
 * 🎯 MODEL POLICY SERVICE - Política de seleção de modelos
 * 
 * Responsabilidades:
 * - Selecionar modelo baseado em use case e prioridade
 * - Fallback automático auditável
 * - Otimização custo x qualidade
 */


import { safeQueryRaw } from './tenant-security'
import { Prisma } from '@prisma/client'

export type UseCase = 'chat' | 'rag' | 'generation' | 'editing' | 'diagnostic'
export type Priority = 'low' | 'medium' | 'high'

export interface ModelPolicyRequest {
  organizationId: string
  siteId: string
  useCase: UseCase
  priority?: Priority
  preferredProvider?: 'openai' | 'gemini'
  preferredModel?: string
}

export interface ModelPolicyResponse {
  provider: 'openai' | 'gemini'
  model: string
  reason: string
  temperature: number
  maxTokens: number
  fallbackProvider?: 'openai' | 'gemini'
  fallbackModel?: string
}

export class ModelPolicyService {
  private static readonly DEFAULT_TEMPERATURE = 0.7
  private static readonly DEFAULT_MAX_TOKENS = 2000

  /**
   * Seleciona modelo baseado em política
   */
  static async selectModel(request: ModelPolicyRequest): Promise<ModelPolicyResponse> {
    // 1. Verificar preferência do usuário
    if (request.preferredProvider && request.preferredModel) {
      return {
        provider: request.preferredProvider,
        model: request.preferredModel,
        reason: 'user_preference',
        temperature: this.DEFAULT_TEMPERATURE,
        maxTokens: this.DEFAULT_MAX_TOKENS,
        fallbackProvider: request.preferredProvider === 'openai' ? 'gemini' : 'openai',
        fallbackModel: request.preferredProvider === 'openai' ? 'gemini-1.5-flash' : 'gpt-4o-mini'
      }
    }

    // 2. Verificar histórico de sucesso (últimos 7 dias)
    const successRates = await this.getProviderSuccessRates(
      request.organizationId,
      request.siteId,
      request.useCase
    )

    // 3. Selecionar baseado em use case e prioridade
    const selection = this.selectByUseCaseAndPriority(
      request.useCase,
      request.priority || 'medium',
      successRates
    )

    return {
      ...selection,
      temperature: this.DEFAULT_TEMPERATURE,
      maxTokens: this.getMaxTokensForUseCase(request.useCase)
    }
  }

  /**
   * Seleciona modelo baseado em use case e prioridade
   */
  private static selectByUseCaseAndPriority(
    useCase: UseCase,
    priority: Priority,
    successRates: { openai: number; gemini: number }
  ): Omit<ModelPolicyResponse, 'temperature' | 'maxTokens'> {
    // Chat e RAG: modelo econômico padrão
    if (useCase === 'chat' || useCase === 'rag') {
      if (priority === 'low' || priority === 'medium') {
        return {
          provider: 'openai',
          model: 'gpt-4o-mini',
          reason: 'cost_optimization_chat',
          fallbackProvider: 'gemini',
          fallbackModel: 'gemini-1.5-flash'
        }
      } else {
        // Alta prioridade: melhor qualidade
        return {
          provider: successRates.gemini > successRates.openai ? 'gemini' : 'openai',
          model: successRates.gemini > successRates.openai ? 'gemini-1.5-pro' : 'gpt-4o',
          reason: 'quality_priority',
          fallbackProvider: successRates.gemini > successRates.openai ? 'openai' : 'gemini',
          fallbackModel: successRates.gemini > successRates.openai ? 'gpt-4o' : 'gemini-1.5-pro'
        }
      }
    }

    // Generation: modelo balanceado
    if (useCase === 'generation') {
      return {
        provider: 'openai',
        model: priority === 'high' ? 'gpt-4o' : 'gpt-4o-mini',
        reason: 'generation_optimized',
        fallbackProvider: 'gemini',
        fallbackModel: 'gemini-1.5-flash'
      }
    }

    // Diagnostic: Gemini (melhor para análise)
    if (useCase === 'diagnostic') {
      return {
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        reason: 'diagnostic_optimized',
        fallbackProvider: 'openai',
        fallbackModel: 'gpt-4o'
      }
    }

    // Default: econômico
    return {
      provider: 'openai',
      model: 'gpt-4o-mini',
      reason: 'default_economical',
      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-1.5-flash'
    }
  }

  /**
   * Obtém taxa de sucesso por provider (últimos 7 dias)
   */
  private static async getProviderSuccessRates(
    organizationId: string,
    siteId: string,
    useCase: UseCase
  ): Promise<{ openai: number; gemini: number }> {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const query = Prisma.sql`
        SELECT 
          provider,
          COUNT(*) FILTER (WHERE status = 'completed')::float / NULLIF(COUNT(*), 0) as success_rate
        FROM ai_interactions
        WHERE organization_id = ${organizationId}
          AND site_id = ${siteId}
          AND type = ${useCase}
          AND created_at >= ${sevenDaysAgo}
        GROUP BY provider
      `

      const results = await safeQueryRaw<{ provider: string; success_rate: number }>(
        organizationId,
        siteId,
        query
      )

      const rates = {
        openai: 0.95, // Default
        gemini: 0.95
      }

      for (const row of results) {
        if (row.provider === 'openai') {
          rates.openai = parseFloat(row.success_rate.toString())
        } else if (row.provider === 'gemini') {
          rates.gemini = parseFloat(row.success_rate.toString())
        }
      }

      return rates
    } catch (error) {
      console.error('[ModelPolicyService] Error getting success rates:', error)
      // Retornar defaults em caso de erro
      return { openai: 0.95, gemini: 0.95 }
    }
  }

  /**
   * Obtém maxTokens baseado em use case
   */
  private static getMaxTokensForUseCase(useCase: UseCase): number {
    const tokensMap: Record<UseCase, number> = {
      chat: 2000,
      rag: 2000,
      generation: 4000,
      editing: 2000,
      diagnostic: 4000
    }

    return tokensMap[useCase] || this.DEFAULT_MAX_TOKENS
  }
}











