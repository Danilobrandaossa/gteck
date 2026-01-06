/**
 * 🔄 CRON: REINDEX INCREMENTAL - FASE 8 ETAPA 3
 * 
 * Reindexação incremental de conteúdo alterado
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReindexIncrementalService } from '@/lib/maintenance/reindex-incremental'
import { createCorrelationContext } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'
import crypto from 'crypto'

const CRON_SECRET = process.env.CRON_SECRET
const REINDEX_BATCH_LIMIT = parseInt(process.env.REINDEX_BATCH_LIMIT || '100', 10)

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

  // 2. Obter limit do query param (opcional)
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || String(REINDEX_BATCH_LIMIT), 10)

  logger.info('Reindex incremental started', {
    action: 'reindex_start',
    component: 'cron',
    limit
  })

  try {
    // 3. Executar reindex incremental
    const result = await ReindexIncrementalService.reindexIncremental(
      limit,
      correlationId,
      logger
    )

    const durationMs = Date.now() - startTime

    logger.info('Reindex incremental completed', {
      action: 'reindex_complete',
      component: 'cron',
      queued: result.queued,
      skippedThrottled: result.skippedThrottled,
      skippedBlocked: result.skippedBlocked,
      errors: result.errors.length,
      durationMs
    })

    // 4. Retornar relatório
    return NextResponse.json({
      success: true,
      correlationId,
      type: 'reindex_incremental',
      timestamp: new Date().toISOString(),
      result: {
        queued: result.queued,
        skippedThrottled: result.skippedThrottled,
        skippedBlocked: result.skippedBlocked,
        byType: result.byType,
        byTenant: result.byTenant,
        errors: result.errors,
        durationMs
      },
      config: {
        limit,
        maxPerTenant: parseInt(process.env.REINDEX_MAX_PER_TENANT || '50', 10)
      }
    })
  } catch (error) {
    const durationMs = Date.now() - startTime

    logger.error('Reindex incremental failed', {
      action: 'reindex_error',
      component: 'cron',
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs
    })

    return NextResponse.json({
      success: false,
      correlationId,
      type: 'reindex_incremental',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      result: {
        queued: 0,
        skippedThrottled: 0,
        skippedBlocked: 0,
        durationMs
      }
    }, { status: 500 })
  }
}








