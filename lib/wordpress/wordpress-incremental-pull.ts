/**
 * WordPress Incremental Pull Service
 * FASE F.3 - Pull Incremental (Cron) como Backup
 * 
 * Busca itens modificados desde lastIncrementalSyncAt
 */

import { db } from '@/lib/db'
import { validateTenantContext } from '@/lib/tenant-security'
import { getWordPressCredentials } from './wordpress-credentials-service'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId } from '@/lib/observability/correlation'

export interface IncrementalPullOptions {
  siteId: string
  organizationId: string
  limit?: number
  correlationId?: string
}

export interface IncrementalPullResult {
  queuedCount: number
  durationMs: number
  windowUsed: {
    from: Date
    to: Date
  }
  entityCounts: {
    terms: number
    media: number
    pages: number
    posts: number
  }
}

export class WordPressIncrementalPullService {
  private static readonly DEFAULT_LIMIT = parseInt(process.env.WP_PULL_MAX_PER_RUN || '100', 10)
  private static readonly MAX_PER_TENANT = parseInt(process.env.REINDEX_MAX_PER_TENANT || '50', 10)

  /**
   * Executa pull incremental para um site
   */
  static async pullIncremental(
    options: IncrementalPullOptions
  ): Promise<IncrementalPullResult> {
    const startTime = Date.now()
    const correlationId = options.correlationId || getOrCreateCorrelationId({})
    const logger = StructuredLogger.withCorrelation({ correlationId }, 'cron')

    logger.info('Starting incremental pull', {
      action: 'wp_incremental_pull',
      siteId: options.siteId,
      organizationId: options.organizationId
    })

    // Validar tenant context
    const validation = validateTenantContext(
      options.organizationId,
      options.siteId
    )

    if (!validation.valid) {
      throw new Error(`Invalid tenant context: ${validation.error}`)
    }

    // Obter credenciais WordPress
    const { credentials, decryptedPassword } = await getWordPressCredentials(
      options.siteId,
      options.organizationId
    )

    if (!credentials?.wpConfigured || !decryptedPassword) {
      throw new Error('WordPress credentials not configured')
    }

    // Obter lastIncrementalSyncAt do site
    const site = await db.site.findUnique({
      where: { id: options.siteId },
      select: {
        wpLastSyncAt: true
      }
    })

    const lastSyncAt = site?.wpLastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h se não houver sync
    const now = new Date()

    // Limitar quantidade por tenant
    const limit = Math.min(options.limit || this.DEFAULT_LIMIT, this.MAX_PER_TENANT)

    const entityCounts = {
      terms: 0,
      media: 0,
      pages: 0,
      posts: 0
    }

    let queuedCount = 0

    // Buscar itens modificados por tipo
    const entityTypes = [
      { type: 'term', endpoint: '/wp-json/wp/v2/categories', jobType: 'wp_sync_item_term' },
      { type: 'media', endpoint: '/wp-json/wp/v2/media', jobType: 'wp_sync_item_media' },
      { type: 'page', endpoint: '/wp-json/wp/v2/pages', jobType: 'wp_sync_item_page' },
      { type: 'post', endpoint: '/wp-json/wp/v2/posts', jobType: 'wp_sync_item_post' }
    ]

    for (const { type, endpoint, jobType } of entityTypes) {
      try {
        const items = await this.fetchModifiedItems(
          credentials.wpBaseUrl!,
          credentials.wpAuthType!,
          credentials.wpUsername!,
          decryptedPassword,
          endpoint,
          lastSyncAt,
          limit
        )

        // Enfileirar jobs para cada item
        for (const item of items) {
          const jobData = {
            organizationId: options.organizationId,
            siteId: options.siteId,
            correlationId,
            wpEntityType: type as 'term' | 'media' | 'page' | 'post',
            wpId: item.id,
            action: 'updated' as const,
            modifiedGmt: item.modified_gmt || item.modified,
            siteUrl: credentials.wpBaseUrl!,
            receivedAt: new Date().toISOString(),
            source: 'cron' as const
          }

          await db.queueJob.create({
            data: {
              type: jobType,
              status: 'pending',
              data: JSON.stringify(jobData),
              maxAttempts: 3
            }
          })

          queuedCount++
          entityCounts[type as keyof typeof entityCounts]++
        }
      } catch (error) {
        logger.warn('Error fetching modified items', {
          action: 'wp_incremental_pull_fetch',
          entityType: type,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Atualizar lastIncrementalSyncAt
    await db.site.update({
      where: { id: options.siteId },
      data: {
        wpLastSyncAt: now
      }
    })

    const durationMs = Date.now() - startTime

    logger.info('Incremental pull completed', {
      action: 'wp_incremental_pull_complete',
      siteId: options.siteId,
      queuedCount,
      durationMs,
      entityCounts
    })

    return {
      queuedCount,
      durationMs,
      windowUsed: {
        from: lastSyncAt,
        to: now
      },
      entityCounts
    }
  }

  /**
   * Fetch itens modificados desde uma data
   */
  private static async fetchModifiedItems(
    wpBaseUrl: string,
    wpAuthType: string,
    wpUsername: string,
    wpPassword: string,
    endpoint: string,
    modifiedAfter: Date,
    limit: number
  ): Promise<any[]> {
    const url = new URL(`${wpBaseUrl.replace(/\/$/, '')}${endpoint}`)
    url.searchParams.set('per_page', limit.toString())
    url.searchParams.set('after', modifiedAfter.toISOString())
    url.searchParams.set('orderby', 'modified')
    url.searchParams.set('order', 'asc')

    // Criar auth header
    let authHeader: string
    if (wpAuthType === 'basic' || wpAuthType === 'application_password') {
      authHeader = `Basic ${Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64')}`
    } else if (wpAuthType === 'jwt' || wpAuthType === 'oauth') {
      authHeader = `Bearer ${wpPassword}`
    } else {
      throw new Error(`Unsupported auth type: ${wpAuthType}`)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  }
}






