/**
 * WordPress Configuration Endpoint
 * FASE D - Credenciais + Conexão (Secure Connect)
 * 
 * POST /api/sites/[siteId]/wordpress/configure
 * 
 * Configura credenciais WordPress para um site específico
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  saveWordPressCredentials,
  getWordPressCredentials
} from '@/lib/wordpress/wordpress-credentials-service'
import { getCorrelationIdFromRequest, addCorrelationIdToResponse } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const correlationId = getCorrelationIdFromRequest(request)
  const logger = StructuredLogger.withCorrelation({ correlationId }, 'api')

  try {
    const { siteId } = params
    const body = await request.json()
    const {
      organizationId,
      wpBaseUrl,
      wpAuthType = 'basic',
      wpUsername,
      wpPassword,
      wpToken
    } = body

    // Validar campos obrigatórios
    if (!organizationId) {
      logger.warn('Missing organizationId', { action: 'validate_request' })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'organizationId is required' },
          { status: 400 }
        ),
        correlationId
      )
    }

    if (!wpBaseUrl || !wpUsername || !wpPassword) {
      logger.warn('Missing WordPress credentials', { action: 'validate_request' })
      return addCorrelationIdToResponse(
        NextResponse.json(
          {
            success: false,
            error: 'wpBaseUrl, wpUsername, and wpPassword are required'
          },
          { status: 400 }
        ),
        correlationId
      )
    }

    // Validar authType
    const validAuthTypes = ['basic', 'application_password', 'jwt', 'oauth']
    if (!validAuthTypes.includes(wpAuthType)) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          {
            success: false,
            error: `wpAuthType must be one of: ${validAuthTypes.join(', ')}`
          },
          { status: 400 }
        ),
        correlationId
      )
    }

    logger.info('Configuring WordPress credentials', {
      action: 'wp_configure',
      siteId,
      organizationId,
      wpBaseUrl,
      wpAuthType
    })

    // Salvar credenciais (valida ownership e credenciais)
    const result = await saveWordPressCredentials(siteId, organizationId, {
      wpBaseUrl,
      wpAuthType: wpAuthType as 'basic' | 'application_password' | 'jwt' | 'oauth',
      wpUsername,
      wpPassword,
      wpToken
    })

    if (!result.success) {
      logger.error('Failed to save WordPress credentials', {
        action: 'wp_configure',
        error: result.error,
        validationResult: result.validationResult
      })

      return addCorrelationIdToResponse(
        NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to save credentials',
            validationResult: result.validationResult
          },
          { status: 400 }
        ),
        correlationId
      )
    }

    // Retornar credenciais salvas (sem senha)
    const { credentials } = await getWordPressCredentials(siteId, organizationId)

    logger.info('WordPress credentials configured successfully', {
      action: 'wp_configure',
      siteId,
      organizationId
    })

    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        message: 'WordPress credentials configured successfully',
        credentials: {
          wpBaseUrl: credentials?.wpBaseUrl,
          wpAuthType: credentials?.wpAuthType,
          wpUsername: credentials?.wpUsername,
          wpConfigured: credentials?.wpConfigured,
          wpLastSyncAt: credentials?.wpLastSyncAt
        },
        validationResult: result.validationResult
      }),
      correlationId
    )
  } catch (error) {
    logger.error('Error configuring WordPress credentials', {
      action: 'wp_configure',
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

/**
 * GET /api/sites/[siteId]/wordpress/configure
 * 
 * Obter credenciais WordPress configuradas (sem senha)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const correlationId = getCorrelationIdFromRequest(request)
  const logger = StructuredLogger.withCorrelation({ correlationId }, 'api')

  try {
    const { siteId } = params
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'organizationId is required' },
          { status: 400 }
        ),
        correlationId
      )
    }

    const { credentials } = await getWordPressCredentials(siteId, organizationId)

    if (!credentials || !credentials.wpConfigured) {
      return addCorrelationIdToResponse(
        NextResponse.json({
          success: true,
          configured: false,
          message: 'WordPress credentials not configured'
        }),
        correlationId
      )
    }

    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        configured: true,
        credentials: {
          wpBaseUrl: credentials.wpBaseUrl,
          wpAuthType: credentials.wpAuthType,
          wpUsername: credentials.wpUsername,
          wpConfigured: credentials.wpConfigured,
          wpLastSyncAt: credentials.wpLastSyncAt
        }
      }),
      correlationId
    )
  } catch (error) {
    logger.error('Error getting WordPress credentials', {
      action: 'wp_get_credentials',
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

/**
 * DELETE /api/sites/[siteId]/wordpress/configure
 * 
 * Remover credenciais WordPress
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const correlationId = getCorrelationIdFromRequest(request)
  const logger = StructuredLogger.withCorrelation({ correlationId }, 'api')

  try {
    const { siteId } = params
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'organizationId is required' },
          { status: 400 }
        ),
        correlationId
      )
    }

    const { removeWordPressCredentials } = await import(
      '@/lib/wordpress/wordpress-credentials-service'
    )

    const result = await removeWordPressCredentials(siteId, organizationId)

    if (!result.success) {
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        ),
        correlationId
      )
    }

    logger.info('WordPress credentials removed', {
      action: 'wp_remove_credentials',
      siteId,
      organizationId
    })

    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        message: 'WordPress credentials removed successfully'
      }),
      correlationId
    )
  } catch (error) {
    logger.error('Error removing WordPress credentials', {
      action: 'wp_remove_credentials',
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






