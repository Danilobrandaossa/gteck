/**
 * 📊 API: FEEDBACK - FASE 8 ETAPA 4
 * 
 * Endpoint para receber feedback de usuários sobre respostas da IA
 */

import { NextRequest, NextResponse } from 'next/server'
import { FeedbackService, FEEDBACK_REASONS } from '@/lib/feedback/feedback-service'
import { StructuredLogger } from '@/lib/observability/logger'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const correlationId = crypto.randomUUID()

  try {
    const body = await request.json()

    // 1. Validar payload
    const { organizationId, siteId, aiInteractionId, userId, rating, reason, commentTag } = body

    if (!organizationId || !siteId || !aiInteractionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: organizationId, siteId, aiInteractionId' },
        { status: 400 }
      )
    }

    if (rating !== 1 && rating !== -1) {
      return NextResponse.json(
        { success: false, error: 'Rating must be +1 (positive) or -1 (negative)' },
        { status: 400 }
      )
    }

    // 2. Validar reason (se fornecida)
    if (reason && !Object.values(FEEDBACK_REASONS).includes(reason)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid reason. Must be one of: ${Object.keys(FEEDBACK_REASONS).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // 3. Criar feedback
    const result = await FeedbackService.createFeedback({
      organizationId,
      siteId,
      aiInteractionId,
      userId,
      rating,
      reason,
      commentTag,
      correlationId
    })

    const durationMs = Date.now() - startTime

    // 4. Retornar sucesso
    return NextResponse.json({
      success: true,
      feedbackId: result.id,
      correlationId,
      durationMs
    })
  } catch (error) {
    const durationMs = Date.now() - startTime

    const logger = StructuredLogger.withCorrelation(
      {
        correlationId,
        organizationId: '',
        siteId: '',
        userId: ''
      },
      'feedback'
    )

    logger.error('Feedback creation failed', {
      action: 'feedback_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      },
      { status: 500 }
    )
  }
}








