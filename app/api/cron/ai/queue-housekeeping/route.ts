/**
 * 🧹 CRON: QUEUE HOUSEKEEPING - FASE 8 ETAPA 3
 * 
 * Manutenção de QueueJob:
 * - Arquivar jobs antigos completados/falhados
 * - Recuperar jobs stuck
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { QueueClaim } from '@/lib/queue-claim'
import { createCorrelationContext } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'
import crypto from 'crypto'

const CRON_SECRET = process.env.CRON_SECRET
const QUEUE_KEEP_COMPLETED_DAYS = parseInt(process.env.QUEUE_KEEP_COMPLETED_DAYS || '30', 10)
const QUEUE_KEEP_FAILED_DAYS = parseInt(process.env.QUEUE_KEEP_FAILED_DAYS || '14', 10)

function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !CRON_SECRET) {
    return false
  }

  const token = authHeader.replace('Bearer ', '')
  return token === CRON_SECRET
}

export async function GET(request: NextRequest) {
  // 1. Validar autenticação
  if (!validateCronAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const startTime = Date.now()
  const correlationId = crypto.randomUUID()
  const correlationContext = createCorrelationContext(correlationId, '', '', '')
  const logger = StructuredLogger.withCorrelation(correlationContext, 'maintenance')

  logger.info('Queue housekeeping started', {
    action: 'queue_housekeeping_start',
    component: 'cron'
  })

  try {
    const now = new Date()
    
    // 2. Calcular datas de retenção
    const completedRetentionDate = new Date(now.getTime() - QUEUE_KEEP_COMPLETED_DAYS * 24 * 60 * 60 * 1000)
    const failedRetentionDate = new Date(now.getTime() - QUEUE_KEEP_FAILED_DAYS * 24 * 60 * 60 * 1000)

    // 3. Arquivar jobs completados antigos
    const completedResult = await db.queueJob.deleteMany({
      where: {
        status: 'completed',
        processedAt: {
          lt: completedRetentionDate
        }
      }
    })

    logger.info('Archived old completed jobs', {
      action: 'archive_completed_jobs',
      component: 'cron',
      archivedCount: completedResult.count,
      retentionDays: QUEUE_KEEP_COMPLETED_DAYS
    })

    // 4. Arquivar jobs falhados antigos
    const failedResult = await db.queueJob.deleteMany({
      where: {
        status: 'failed',
        updatedAt: {
          lt: failedRetentionDate
        }
      }
    })

    logger.info('Archived old failed jobs', {
      action: 'archive_failed_jobs',
      component: 'cron',
      archivedCount: failedResult.count,
      retentionDays: QUEUE_KEEP_FAILED_DAYS
    })

    // 5. Recuperar jobs stuck
    const recoveredJobs = await QueueClaim.recoverStuckJobs()

    logger.info('Recovered stuck jobs', {
      action: 'recover_stuck_jobs',
      component: 'cron',
      recoveredCount: recoveredJobs.length
    })

    // 6. Estatísticas de jobs
    const stats = await db.queueJob.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const durationMs = Date.now() - startTime

    logger.info('Queue housekeeping completed', {
      action: 'queue_housekeeping_complete',
      component: 'cron',
      durationMs
    })

    // 7. Retornar relatório
    return NextResponse.json({
      success: true,
      correlationId,
      type: 'queue_housekeeping',
      timestamp: new Date().toISOString(),
      result: {
        archivedCompleted: completedResult.count,
        archivedFailed: failedResult.count,
        recoveredStuck: recoveredJobs.length,
        currentStats: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id
          return acc
        }, {} as Record<string, number>),
        durationMs
      },
      config: {
        keepCompletedDays: QUEUE_KEEP_COMPLETED_DAYS,
        keepFailedDays: QUEUE_KEEP_FAILED_DAYS
      }
    })
  } catch (error) {
    const durationMs = Date.now() - startTime

    logger.error('Queue housekeeping failed', {
      action: 'queue_housekeeping_error',
      component: 'cron',
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs
    })

    return NextResponse.json({
      success: false,
      correlationId,
      type: 'queue_housekeeping',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      result: {
        archivedCompleted: 0,
        archivedFailed: 0,
        recoveredStuck: 0,
        durationMs
      }
    }, { status: 500 })
  }
}








