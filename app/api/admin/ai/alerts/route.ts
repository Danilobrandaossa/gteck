/**
 * 🚨 ADMIN API - Alerts
 * 
 * Endpoint interno para verificar alertas do sistema RAG/IA
 * 
 * GET /api/admin/ai/alerts
 * 
 * Headers:
 * - Authorization: Bearer {ADMIN_HEALTH_SECRET}
 * 
 * Response:
 * {
 *   alerts: [
 *     {
 *       id: string
 *       severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
 *       message: string
 *       metrics: { ... }
 *       suggestedAction: string
 *       threshold: { expected, actual }
 *     }
 *   ],
 *   snapshot: { ... } // Opcional, resumido
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { HealthSnapshotService } from '@/lib/observability/health-snapshot'
import { AlertService } from '@/lib/observability/alerts'
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
    logger.info('Alerts check requested', { action: 'alerts_check' })

    // Gerar snapshot
    const windowHours = parseInt(request.nextUrl.searchParams.get('windowHours') || '24', 10)
    const snapshot = await HealthSnapshotService.generateSnapshot(windowHours)

    // Avaliar alertas
    const alerts = AlertService.evaluateAlerts(snapshot)

    // Ordenar por severidade (CRITICAL > HIGH > MEDIUM > LOW)
    const severityOrder: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    }
    alerts.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0))

    logger.info('Alerts check completed', {
      action: 'alerts_check',
      windowHours,
      alertsCount: alerts.length,
      criticalCount: alerts.filter(a => a.severity === 'CRITICAL').length,
      highCount: alerts.filter(a => a.severity === 'HIGH').length
    })

    // Snapshot resumido (opcional, via query param)
    const includeSnapshot = request.nextUrl.searchParams.get('includeSnapshot') === 'true'
    const snapshotResumed = includeSnapshot ? {
      timestamp: snapshot.timestamp,
      windowHours: snapshot.windowHours,
      rag: {
        availability24h: snapshot.rag.availability24h,
        p95TotalMs24h: snapshot.rag.p95TotalMs24h,
        fallbackRate24h: snapshot.rag.fallbackRate24h
      },
      db: snapshot.db,
      queue: {
        stuckCount: snapshot.queue.stuckCount,
        pendingCount: snapshot.queue.pendingCount
      }
    } : undefined

    const response = NextResponse.json({
      success: true,
      data: {
        alerts,
        ...(snapshotResumed && { snapshot: snapshotResumed })
      }
    })

    return addCorrelationIdToResponse(response, correlationId)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Alerts check failed', {
      action: 'alerts_check',
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









