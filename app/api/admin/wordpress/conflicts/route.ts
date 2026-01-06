/**
 * WordPress Conflicts Admin Endpoint
 * FASE F.4 - Conflitos (Regras + Registro)
 * 
 * GET /api/admin/wordpress/conflicts
 */

import { NextRequest, NextResponse } from 'next/server'
import { WordPressConflictDetector } from '@/lib/wordpress/wordpress-conflict-detector'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'

export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = StructuredLogger.withCorrelation({ correlationId }, 'api')

  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const siteId = searchParams.get('siteId')
    // const status = searchParams.get('status') || 'open' // Not used yet

    if (!organizationId) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'organizationId is required' },
          { status: 400 }
        ),
        correlationId
      )
    }

    const conflicts = await WordPressConflictDetector.getOpenConflicts(
      organizationId,
      siteId || undefined
    )

    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        conflicts,
        count: conflicts.length
      }),
      correlationId
    )
  } catch (error) {
    logger.error('Error fetching conflicts', {
      action: 'wp_conflicts_fetch',
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






