/**
 * WordPress Incremental Pull Cron Endpoint
 * FASE F.3 - Pull Incremental (Cron) como Backup
 * 
 * GET /api/cron/wordpress/pull-incremental?siteId=...&limit=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { WordPressIncrementalPullService } from '@/lib/wordpress/wordpress-incremental-pull'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'

/**
 * Validar autenticação do cron
 */
function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || process.env.WEBHOOK_SECRET

  if (!cronSecret) {
    return false
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.substring(7)
  return token === cronSecret
}

export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = StructuredLogger.withCorrelation({ correlationId }, 'cron')

  // Validar autenticação
  if (!validateCronAuth(request)) {
    logger.warn('Cron authentication failed', {
      action: 'wp_cron_auth_failed'
    })

    return addCorrelationIdToResponse(
      NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
      correlationId
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('siteId')
    const organizationId = searchParams.get('organizationId')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined

    if (!siteId || !organizationId) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'siteId and organizationId are required' },
          { status: 400 }
        ),
        correlationId
      )
    }

    logger.info('Cron incremental pull started', {
      action: 'wp_cron_pull',
      siteId,
      organizationId,
      limit
    })

    const result = await WordPressIncrementalPullService.pullIncremental({
      siteId,
      organizationId,
      limit,
      correlationId
    })

    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        message: 'Incremental pull completed',
        result
      }),
      correlationId
    )
  } catch (error) {
    logger.error('Error in cron incremental pull', {
      action: 'wp_cron_pull_error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return addCorrelationIdToResponse(
      NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      ),
      correlationId
    )
  }
}








