/**
 * WordPress Push Item Endpoint
 * FASE F.5 - Bidirecional (CMS → WP) Controlado
 * 
 * POST /api/wordpress/push-item
 */

import { NextRequest, NextResponse } from 'next/server'
import { WordPressPushService } from '@/lib/wordpress/wordpress-push'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = StructuredLogger.withCorrelation({ correlationId }, 'api')

  try {
    const body = await request.json()
    const {
      organizationId,
      siteId,
      pageId,
      action = 'update'
    } = body

    if (!organizationId || !siteId || !pageId) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'organizationId, siteId, and pageId are required' },
          { status: 400 }
        ),
        correlationId
      )
    }

    if (!['create', 'update', 'publish'].includes(action)) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'action must be: create, update, or publish' },
          { status: 400 }
        ),
        correlationId
      )
    }

    logger.info('Pushing page to WordPress', {
      action: 'wp_push_item',
      pageId,
      siteId,
      organizationId
    })

    const result = await WordPressPushService.pushPage({
      organizationId,
      siteId,
      pageId,
      action: action as 'create' | 'update' | 'publish',
      correlationId
    })

    if (!result.success) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        ),
        correlationId
      )
    }

    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        message: 'Page pushed to WordPress successfully',
        result
      }),
      correlationId
    )
  } catch (error) {
    logger.error('Error pushing item to WordPress', {
      action: 'wp_push_item_error',
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








