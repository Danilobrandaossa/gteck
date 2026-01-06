/**
 * 🏥 ADMIN API - Health Check
 * 
 * Endpoint interno para verificar saúde do sistema RAG/IA
 * 
 * GET /api/admin/ai/health
 * 
 * Headers:
 * - Authorization: Bearer {ADMIN_HEALTH_SECRET}
 * 
 * Response:
 * {
 *   timestamp: string
 *   windowHours: number
 *   rag: { ... }
 *   providers: { ... }
 *   queue: { ... }
 *   db: { ... }
 *   cost: { ... }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { HealthSnapshotService } from '@/lib/observability/health-snapshot'
import { getCorrelationIdFromRequest, addCorrelationIdToResponse } from '@/lib/observability/middleware'
import { StructuredLogger } from '@/lib/observability/logger'

/**
 * Verifica autorização (admin secret)
 */
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.ADMIN_HEALTH_SECRET

  if (!secret) {
    // Se não configurado, permitir apenas em desenvolvimento
    return process.env.NODE_ENV === 'development'
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.substring(7)
  return token === secret
}

export async function GET(request: NextRequest) {
  // Verificar autorização
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Extrair correlationId
  const correlationId = getCorrelationIdFromRequest(request)
  const logger = StructuredLogger.withCorrelation({ correlationId }, 'api')

  try {
    logger.info('Health check requested', { action: 'health_check' })

    // Gerar snapshot
    const windowHours = parseInt(request.nextUrl.searchParams.get('windowHours') || '24', 10)
    const snapshot = await HealthSnapshotService.generateSnapshot(windowHours)

    logger.info('Health check completed', {
      action: 'health_check',
      windowHours,
      ragAvailability: snapshot.rag.availability24h,
      dbStatus: snapshot.db.status
    })

    const response = NextResponse.json({
      success: true,
      data: snapshot
    })

    return addCorrelationIdToResponse(response, correlationId)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Health check failed', {
      action: 'health_check',
      error: errorMessage,
      errorCode: error instanceof Error ? error.name : 'UnknownError'
    })

    const response = NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )

    return addCorrelationIdToResponse(response, correlationId)
  }
}









