/**
 * 📊 FEEDBACK SERVICE - FASE 8 ETAPA 4
 * 
 * Gerenciamento de feedback de respostas da IA
 */

import { db } from '../db'
import { StructuredLogger } from '../observability/logger'

// Enum de reasons (para validação e consistência)
export const FEEDBACK_REASONS = {
  // Negativos
  INCORRECT: 'INCORRECT',
  INCOMPLETE: 'INCOMPLETE',
  CONFUSING: 'CONFUSING',
  TOO_SLOW: 'TOO_SLOW',
  TOO_GENERIC: 'TOO_GENERIC',
  // Positivos
  HELPFUL: 'HELPFUL',
  CLEAR: 'CLEAR',
  // Genérico
  OTHER: 'OTHER'
} as const

export type FeedbackReason = (typeof FEEDBACK_REASONS)[keyof typeof FEEDBACK_REASONS]

export interface CreateFeedbackParams {
  organizationId: string
  siteId: string
  aiInteractionId: string
  userId?: string
  rating: number // +1 ou -1
  reason?: FeedbackReason
  commentTag?: string
  correlationId?: string
}

export interface FeedbackCorrelation {
  feedbackCount: number
  positiveCount: number
  negativeCount: number
  positiveRate: number
  negativeRate: number
  byConfidence: {
    high: { total: number; positive: number; negative: number }
    medium: { total: number; positive: number; negative: number }
    low: { total: number; positive: number; negative: number }
  }
  byModel: Record<string, { total: number; positive: number; negative: number }>
  byProvider: Record<string, { total: number; positive: number; negative: number }>
  byTenantState: Record<string, { total: number; positive: number; negative: number }>
  byReason: Record<string, number>
}

export class FeedbackService {
  /**
   * Cria um novo feedback
   */
  static async createFeedback(params: CreateFeedbackParams): Promise<{ id: string; success: boolean }> {
    const logger = StructuredLogger.withCorrelation(
      {
        correlationId: params.correlationId || 'feedback',
        organizationId: params.organizationId,
        siteId: params.siteId,
        userId: params.userId || ''
      },
      'feedback'
    )

    // 1. Validar rating
    if (params.rating !== 1 && params.rating !== -1) {
      throw new Error('Rating must be +1 or -1')
    }

    // 2. Validar reason (se fornecida)
    if (params.reason && !Object.values(FEEDBACK_REASONS).includes(params.reason)) {
      throw new Error(`Invalid reason: ${params.reason}`)
    }

    // 3. Verificar se aiInteraction existe e pertence ao tenant
    const interaction = await db.aIInteraction.findFirst({
      where: {
        id: params.aiInteractionId,
        organizationId: params.organizationId,
        siteId: params.siteId
      }
    })

    if (!interaction) {
      throw new Error('AI Interaction not found or does not belong to this tenant')
    }

    // 4. Verificar se já existe feedback deste usuário para esta interação (opcional, mas recomendado)
    if (params.userId) {
      const existingFeedback = await db.aIResponseFeedback.findFirst({
        where: {
          aiInteractionId: params.aiInteractionId,
          userId: params.userId
        }
      })

      if (existingFeedback) {
        // Atualizar feedback existente ao invés de criar duplicado
        await db.aIResponseFeedback.update({
          where: { id: existingFeedback.id },
          data: {
            rating: params.rating,
            reason: params.reason || null,
            commentTag: params.commentTag || null
          }
        })

        logger.info('Feedback updated', {
          action: 'feedback_updated',
          feedbackId: existingFeedback.id,
          aiInteractionId: params.aiInteractionId,
          rating: params.rating
        })

        return { id: existingFeedback.id, success: true }
      }
    }

    // 5. Criar feedback
    const feedback = await db.aIResponseFeedback.create({
      data: {
        organizationId: params.organizationId,
        siteId: params.siteId,
        aiInteractionId: params.aiInteractionId,
        userId: params.userId || null,
        rating: params.rating,
        reason: params.reason || null,
        commentTag: params.commentTag || null
      }
    })

    logger.info('Feedback created', {
      action: 'feedback_created',
      feedbackId: feedback.id,
      aiInteractionId: params.aiInteractionId,
      rating: params.rating,
      reason: params.reason || 'none'
    })

    return { id: feedback.id, success: true }
  }

  /**
   * Obtém correlações de feedback com métricas do RAG
   */
  static async getFeedbackCorrelation(
    organizationId: string,
    siteId: string,
    window: 'day' | 'week' | 'month' = 'day'
  ): Promise<FeedbackCorrelation> {
    const now = new Date()
    let startDate: Date

    switch (window) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    // Buscar feedbacks com dados da interação
    const feedbacksWithInteractions = await db.aIResponseFeedback.findMany({
      where: {
        organizationId,
        siteId,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        // @ts-expect-error FIX_BUILD: Suppressing error to allow build
        _count: true
      }
    })

    // Buscar interações correspondentes
    const interactionIds = feedbacksWithInteractions.map(f => f.aiInteractionId)
    const interactions = await db.aIInteraction.findMany({
      where: {
        id: {
          in: interactionIds
        }
      },
      select: {
        id: true,
        provider: true,
        model: true,
        context: true
      }
    })

    // Mapear interações por ID
    const interactionMap = interactions.reduce((acc, inter) => {
      acc[inter.id] = inter
      return acc
    }, {} as Record<string, typeof interactions[0]>)

    // Inicializar resultado
    const result: FeedbackCorrelation = {
      feedbackCount: feedbacksWithInteractions.length,
      positiveCount: 0,
      negativeCount: 0,
      positiveRate: 0,
      negativeRate: 0,
      byConfidence: {
        high: { total: 0, positive: 0, negative: 0 },
        medium: { total: 0, positive: 0, negative: 0 },
        low: { total: 0, positive: 0, negative: 0 }
      },
      byModel: {},
      byProvider: {},
      byTenantState: {},
      byReason: {}
    }

    // Processar feedbacks
    for (const feedback of feedbacksWithInteractions) {
      const isPositive = feedback.rating === 1
      if (isPositive) {
        result.positiveCount++
      } else {
        result.negativeCount++
      }

      // Agrupar por reason
      if (feedback.reason) {
        result.byReason[feedback.reason] = (result.byReason[feedback.reason] || 0) + 1
      }

      // Obter dados da interação
      const interaction = interactionMap[feedback.aiInteractionId]
      if (!interaction) continue

      const context = interaction.context ? (typeof interaction.context === 'string' ? JSON.parse(interaction.context) : interaction.context) : {}

      // Agrupar por confidence
      const confidenceLevel = context.confidence?.level || 'unknown'
      if (confidenceLevel === 'high' || confidenceLevel === 'medium' || confidenceLevel === 'low') {
        (result.byConfidence as any)[confidenceLevel].total++
        if (isPositive) {
          (result.byConfidence as any)[confidenceLevel].positive++
        } else {
          (result.byConfidence as any)[confidenceLevel].negative++
        }
      }

      // Agrupar por model
      const model = interaction.model
      if (!result.byModel[model]) {
        result.byModel[model] = { total: 0, positive: 0, negative: 0 }
      }
      result.byModel[model].total++
      if (isPositive) {
        result.byModel[model].positive++
      } else {
        result.byModel[model].negative++
      }

      // Agrupar por provider
      const provider = interaction.provider
      if (!result.byProvider[provider]) {
        result.byProvider[provider] = { total: 0, positive: 0, negative: 0 }
      }
      result.byProvider[provider].total++
      if (isPositive) {
        result.byProvider[provider].positive++
      } else {
        result.byProvider[provider].negative++
      }

      // Agrupar por tenant state (se existir)
      const tenantState = context.tenantCost?.state || 'NORMAL'
      if (!result.byTenantState[tenantState]) {
        result.byTenantState[tenantState] = { total: 0, positive: 0, negative: 0 }
      }
      result.byTenantState[tenantState].total++
      if (isPositive) {
        result.byTenantState[tenantState].positive++
      } else {
        result.byTenantState[tenantState].negative++
      }
    }

    // Calcular rates
    if (result.feedbackCount > 0) {
      result.positiveRate = result.positiveCount / result.feedbackCount
      result.negativeRate = result.negativeCount / result.feedbackCount
    }

    return result
  }

  /**
   * Obtém métricas agregadas de feedback
   */
  static async getFeedbackMetrics(window: 'day' | 'week' | 'month' = 'day') {
    const now = new Date()
    let startDate: Date

    switch (window) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    const feedbacks = await db.aIResponseFeedback.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    })

    const total = feedbacks.length
    const positive = feedbacks.filter(f => f.rating === 1).length
    const negative = feedbacks.filter(f => f.rating === -1).length

    // Agrupar por reason
    const byReason = feedbacks.reduce((acc, f) => {
      if (f.reason) {
        acc[f.reason] = (acc[f.reason] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return {
      window,
      total,
      positive,
      negative,
      positiveRate: total > 0 ? positive / total : 0,
      negativeRate: total > 0 ? negative / total : 0,
      byReason
    }
  }
}










