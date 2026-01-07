/**
 * WordPress Sync Health Endpoint
 * FASE F.7 - Observabilidade + SLOs do Sync
 * 
 * GET /api/admin/wordpress/sync-health
 */

import { NextRequest, NextResponse } from 'next/server'
import { WordPressSyncHealthService } from '@/lib/wordpress/wordpress-sync-health'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'

export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = StructuredLogger.withCorrelation({ correlationId }, 'api')

  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const siteId = searchParams.get('siteId')

    if (!organizationId) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'organizationId is required' },
          { status: 400 }
        ),
        correlationId
      )
    }

    if (siteId) {
      // Health de um site específico
      const health = await WordPressSyncHealthService.getSyncHealth(
        organizationId,
        siteId
      )

      return addCorrelationIdToResponse(
        NextResponse.json({
          success: true,
          health
        }),
        correlationId
      )
    } else {
      // Health de todos os sites da organização
      const healths = await WordPressSyncHealthService.getOrganizationSyncHealth(
        organizationId
      )

      return addCorrelationIdToResponse(
        NextResponse.json({
          success: true,
          healths,
          count: healths.length
        }),
        correlationId
      )
    }
  } catch (error) {
    logger.error('Error fetching sync health', {
      action: 'wp_sync_health',
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








