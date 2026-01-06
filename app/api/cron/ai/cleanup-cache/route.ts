/**
 * 🧹 CRON: CLEANUP CACHE - FASE 8 ETAPA 3
 * 
 * Remove cache expirado do AIResponseCache
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createCorrelationContext } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'
import crypto from 'crypto'

const CRON_SECRET = process.env.CRON_SECRET

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

  logger.info('Cache cleanup started', {
    action: 'cleanup_cache_start',
    component: 'cron'
  })

  try {
    // 2. Remover cache expirado
    const now = new Date()
    
    const result = await db.aIResponseCache.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    })

    const durationMs = Date.now() - startTime

    logger.info('Cache cleanup completed', {
      action: 'cleanup_cache_complete',
      component: 'cron',
      removedCount: result.count,
      durationMs
    })

    // 3. Retornar relatório
    return NextResponse.json({
      success: true,
      correlationId,
      type: 'cache_cleanup',
      timestamp: new Date().toISOString(),
      result: {
        removedCount: result.count,
        durationMs
      }
    })
  } catch (error) {
    const durationMs = Date.now() - startTime

    logger.error('Cache cleanup failed', {
      action: 'cleanup_cache_error',
      component: 'cron',
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs
    })

    return NextResponse.json({
      success: false,
      correlationId,
      type: 'cache_cleanup',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      result: {
        removedCount: 0,
        durationMs
      }
    }, { status: 500 })
  }
}








