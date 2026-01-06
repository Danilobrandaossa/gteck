/**
 * WordPress Full Sync Endpoint
 * FASE E.1 - Endpoint de Start
 * 
 * POST /api/wordpress/sync-all
 * 
 * Inicia sincronização completa WordPress → CMS
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSiteBelongsToOrganization } from '@/lib/tenant-security'
import { getWordPressCredentials } from '@/lib/wordpress/wordpress-credentials-service'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'
import crypto from 'crypto'

export interface SyncAllRequest {
  siteId: string
  organizationId: string
  batchSize?: number // Tamanho do lote por job (default: 50)
}

export interface SyncAllResponse {
  syncId: string
  status: 'queued'
  queuedJobsCount: number
  message: string
}

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = StructuredLogger.withCorrelation({ correlationId }, 'api')

  try {
    const body: SyncAllRequest = await request.json()
    const { siteId, organizationId, batchSize = 50 } = body

    // Validar campos obrigatórios
    if (!siteId || !organizationId) {
      logger.warn('Missing required fields', { action: 'wp_sync_all' })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'siteId and organizationId are required' },
          { status: 400 }
        ),
        correlationId
      )
    }

    // Validar ownership
    const belongs = await validateSiteBelongsToOrganization(siteId, organizationId)
    if (!belongs) {
      logger.warn('Site ownership validation failed', {
        action: 'wp_sync_all',
        siteId,
        organizationId
      })
      return addCorrelationIdToResponse(
        NextResponse.json(
          { success: false, error: 'Site does not belong to organization' },
          { status: 403 }
        ),
        correlationId
      )
    }

    // Validar credenciais WordPress configuradas
    const { credentials, decryptedPassword } = await getWordPressCredentials(
      siteId,
      organizationId
    )

    if (!credentials?.wpConfigured || !decryptedPassword) {
      logger.warn('WordPress credentials not configured', {
        action: 'wp_sync_all',
        siteId
      })
      return addCorrelationIdToResponse(
        NextResponse.json(
          {
            success: false,
            error: 'WordPress credentials not configured for this site'
          },
          { status: 400 }
        ),
        correlationId
      )
    }

    // Gerar syncId único
    const syncId = crypto.randomUUID()

    logger.info('Starting WordPress full sync', {
      action: 'wp_sync_all',
      syncId,
      siteId,
      organizationId,
      batchSize
    })

    // Criar jobs por tipo e lote
    // Ordem: 1) Terms, 2) Media, 3) Pages, 4) Posts
    const jobTypes = [
      { type: 'wordpress_sync_terms', priority: 1 },
      { type: 'wordpress_sync_media', priority: 2 },
      { type: 'wordpress_sync_pages', priority: 3 },
      { type: 'wordpress_sync_posts', priority: 4 }
    ]

    const jobs = []

    for (const { type, priority } of jobTypes) {
      const jobData = {
        syncId,
        siteId,
        organizationId,
        correlationId,
        wpBaseUrl: credentials.wpBaseUrl!,
        wpAuthType: credentials.wpAuthType!,
        wpUsername: credentials.wpUsername!,
        wpPassword: decryptedPassword, // Será usado apenas durante processamento
        batchSize,
        priority,
        entityType: type.replace('wordpress_sync_', '') // 'terms', 'media', 'pages', 'posts'
      }

      const job = await db.queueJob.create({
        data: {
          type,
          status: 'pending',
          data: JSON.stringify(jobData),
          maxAttempts: 3
        }
      })

      jobs.push(job.id)
    }

    // Atualizar lastFullSyncAt do site (será atualizado novamente ao finalizar)
    await db.site.update({
      where: { id: siteId },
      data: {
        wpLastSyncAt: new Date()
      }
    })

    logger.info('WordPress sync jobs enqueued', {
      action: 'wp_sync_all',
      syncId,
      siteId,
      queuedJobsCount: jobs.length
    })

    const response: SyncAllResponse = {
      syncId,
      status: 'queued',
      queuedJobsCount: jobs.length,
      message: 'WordPress sync started successfully'
    }

    return addCorrelationIdToResponse(NextResponse.json(response), correlationId)
  } catch (error) {
    logger.error('Error starting WordPress sync', {
      action: 'wp_sync_all',
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
