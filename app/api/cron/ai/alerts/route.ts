/**
 * ⏰ CRON API - Alerts Check (Opcional)
 * 
 * Endpoint tipo cron para verificar alertas periodicamente
 * 
 * GET /api/cron/ai/alerts
 * 
 * Headers:
 * - Authorization: Bearer {CRON_SECRET}
 * 
 * Função:
 * - Roda snapshot + rules
 * - Grava no log (StructuredLogger)
 * - (Opcional) Grava em ai_alert_events para histórico
 */

import { NextRequest, NextResponse } from 'next/server'
import { HealthSnapshotService } from '@/lib/observability/health-snapshot'
import { AlertService } from '@/lib/observability/alerts'
import { StructuredLogger } from '@/lib/observability/logger'
import crypto from 'crypto'

/**
 * Verifica autorização (cron secret)
 */
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

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

  const correlationId = crypto.randomUUID()
  const logger = StructuredLogger.withCorrelation({ correlationId }, 'cron')

  try {
    logger.info('Cron alerts check started', { action: 'cron_alerts_check' })

    // Gerar snapshot
    const windowHours = parseInt(process.env.ALERT_WINDOW_HOURS || '24', 10)
    const snapshot = await HealthSnapshotService.generateSnapshot(windowHours)

    // Avaliar alertas
    const alerts = AlertService.evaluateAlerts(snapshot)

    // Log alertas
    if (alerts.length > 0) {
      logger.warn('Alerts detected', {
        action: 'cron_alerts_check',
        alertsCount: alerts.length,
        alerts: alerts.map(a => ({
          id: a.id,
          severity: a.severity,
          message: a.message
        }))
      })

      // Gravar eventos de alerta (opcional, se tabela existir)
      // Por enquanto, apenas logar
    } else {
      logger.info('No alerts detected', {
        action: 'cron_alerts_check',
        windowHours
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        alertsCount: alerts.length,
        alerts: alerts.map(a => ({
          id: a.id,
          severity: a.severity,
          message: a.message
        }))
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Cron alerts check failed', {
      action: 'cron_alerts_check',
      error: errorMessage,
      errorCode: error instanceof Error ? error.name : 'UnknownError'
    })

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}









