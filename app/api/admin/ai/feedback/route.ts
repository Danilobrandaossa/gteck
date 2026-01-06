/**
 * 📊 API ADMIN: FEEDBACK - FASE 8 ETAPA 4
 * 
 * Dashboard de feedback para análise e correlação
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { FeedbackService } from '@/lib/feedback/feedback-service'

const ADMIN_SECRET = process.env.ADMIN_HEALTH_SECRET

function validateAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !ADMIN_SECRET) {
    return false
  }

  const token = authHeader.replace('Bearer ', '')
  return token === ADMIN_SECRET
}

export async function GET(request: NextRequest) {
  // 1. Validar autenticação
  if (!validateAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)

    // 2. Parâmetros de filtro
    const organizationId = searchParams.get('organizationId') || undefined
    const siteId = searchParams.get('siteId') || undefined
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!, 10) : undefined
    const window = (searchParams.get('window') || 'day') as 'day' | 'week' | 'month'
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // 3. Buscar feedbacks recentes
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

    const where: any = {
      createdAt: {
        gte: startDate
      }
    }

    if (organizationId) where.organizationId = organizationId
    if (siteId) where.siteId = siteId
    if (rating !== undefined) where.rating = rating

    const feedbacks = await db.aIResponseFeedback.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        organizationId: true,
        siteId: true,
        aiInteractionId: true,
        rating: true,
        reason: true,
        commentTag: true,
        createdAt: true
        // userId não incluído (PII)
      }
    })

    // 4. Métricas agregadas globais
    const globalMetrics = await FeedbackService.getFeedbackMetrics(window)

    // 5. Correlações (se filtrado por tenant)
    let correlation = null
    if (organizationId && siteId) {
      correlation = await FeedbackService.getFeedbackCorrelation(organizationId, siteId, window)
    }

    // 6. Buscar informações das interações (sample)
    const interactionIds = feedbacks.slice(0, 10).map(f => f.aiInteractionId)
    const interactions = await db.aIInteraction.findMany({
      where: {
        id: {
          in: interactionIds
        }
      },
      select: {
        id: true,
        type: true,
        provider: true,
        model: true,
        context: true,
        createdAt: true
      }
    })

    // 7. Enriquecer feedbacks com dados da interação
    const enrichedFeedbacks = feedbacks.map(feedback => {
      const interaction = interactions.find(i => i.id === feedback.aiInteractionId)
      if (!interaction) return feedback

      const context = interaction.context ? (typeof interaction.context === 'string' ? JSON.parse(interaction.context) : interaction.context) : {}

      return {
        ...feedback,
        interaction: {
          type: interaction.type,
          provider: interaction.provider,
          model: interaction.model,
          confidence: context.confidence?.level || 'unknown',
          avgSimilarity: context.averageSimilarity || 0,
          chunksUsed: context.chunksCount || 0,
          tenantState: context.tenantCost?.state || 'NORMAL',
          fallbackUsed: context.fallbackUsed || false
        }
      }
    })

    // 8. Retornar dashboard
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      window,
      filters: {
        organizationId: organizationId || 'all',
        siteId: siteId || 'all',
        rating: rating !== undefined ? rating : 'all'
      },
      summary: globalMetrics,
      correlation,
      feedbacks: enrichedFeedbacks,
      total: feedbacks.length
    })
  } catch (error) {
    console.error('[FeedbackAdminAPI] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}








