/**
 * WordPress Incremental Sync
 * FASE F.2 - Jobs Incrementais (por item)
 * 
 * Processa jobs individuais de sincronização incremental
 */

import { db } from '@/lib/db'
import { validateTenantContext } from '@/lib/tenant-security'
import {
  findPageByWpPostId,
  findCategoryByWpTermId,
  findMediaByWpMediaId
} from './wordpress-sync-map'
import { getWordPressCredentials } from './wordpress-credentials-service'
import { EmbeddingService } from '@/lib/embedding-service'
import { TenantCostPolicyService } from '@/lib/finops/tenant-cost-policy'
import { WordPressEmbeddingTrigger } from './wordpress-embedding-trigger'
import { StructuredLogger } from '@/lib/observability/logger'
import { createCorrelationContext } from '@/lib/observability/correlation'
import { WordPressConflictDetector } from './wordpress-conflict-detector'

export interface IncrementalSyncJobData {
  organizationId: string
  siteId: string
  correlationId: string
  wpEntityType: 'term' | 'media' | 'page' | 'post'
  wpId: number
  action: 'created' | 'updated' | 'deleted'
  wpType?: string
  modifiedGmt?: string
  siteUrl: string
  receivedAt: string
  source: 'webhook' | 'cron' | 'manual'
}

export interface IncrementalSyncResult {
  success: boolean
  action: 'created' | 'updated' | 'deleted' | 'skipped' | 'failed'
  localId?: string
  embeddingQueued?: boolean
  embeddingSkipped?: boolean
  skipReason?: string
  error?: string
}

export class WordPressIncrementalSync {
  /**
   * Processa um job incremental individual
   */
  static async processIncrementalJob(jobId: string): Promise<IncrementalSyncResult> {
    const job = await db.queueJob.findUnique({
      where: { id: jobId }
    })

    if (!job || job.status !== 'pending') {
      throw new Error(`Job ${jobId} not found or not pending`)
    }

    const jobData: IncrementalSyncJobData = JSON.parse(job.data)
    const logger = StructuredLogger.withCorrelation(
      { correlationId: jobData.correlationId },
      'worker'
    )

    logger.info('Processing incremental sync job', {
      action: 'wp_incremental_sync',
      jobId,
      wpEntityType: jobData.wpEntityType,
      wpId: jobData.wpId,
      action: jobData.action
    })

    try {
      // Validar tenant context
      const validation = validateTenantContext(
        jobData.organizationId,
        jobData.siteId
      )

      if (!validation.valid) {
        throw new Error(`Invalid tenant context: ${validation.error}`)
      }

      // Obter credenciais WordPress
      const { credentials, decryptedPassword } = await getWordPressCredentials(
        jobData.siteId,
        jobData.organizationId
      )

      if (!credentials?.wpConfigured || !decryptedPassword) {
        throw new Error('WordPress credentials not configured')
      }

      // Processar baseado no tipo de entidade e ação
      let result: IncrementalSyncResult

      if (jobData.action === 'deleted') {
        result = await this.handleDelete(jobData, logger)
      } else {
        // Fetch item do WordPress
        const wpItem = await this.fetchWordPressItem(
          credentials.wpBaseUrl!,
          credentials.wpAuthType!,
          credentials.wpUsername!,
          decryptedPassword,
          jobData.wpEntityType,
          jobData.wpId
        )

        if (!wpItem) {
          throw new Error(`WordPress item ${jobData.wpId} not found`)
        }

        // Verificar FinOps
        const costInfo = await TenantCostPolicyService.getTenantCostInfo(
          jobData.organizationId,
          jobData.siteId
        )

        const canGenerateEmbeddings = costInfo.state === 'NORMAL' || costInfo.state === 'CAUTION'

        // Processar upsert
        switch (jobData.wpEntityType) {
          case 'term':
            result = await this.upsertCategoryIncremental(
              wpItem,
              jobData,
              credentials.wpBaseUrl!,
              logger
            )
            break

          case 'media':
            result = await this.upsertMediaIncremental(
              wpItem,
              jobData,
              credentials.wpBaseUrl!,
              logger
            )
            break

          case 'page':
            result = await this.upsertPageIncremental(
              wpItem,
              jobData,
              credentials.wpBaseUrl!,
              canGenerateEmbeddings,
              costInfo.state,
              logger
            )
            break

          case 'post':
            result = await this.upsertPostIncremental(
              wpItem,
              jobData,
              credentials.wpBaseUrl!,
              canGenerateEmbeddings,
              costInfo.state,
              logger
            )
            break

          default:
            throw new Error(`Unknown entity type: ${jobData.wpEntityType}`)
        }
      }

      // Atualizar job como completo
      await db.queueJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          result: JSON.stringify(result),
          processedAt: new Date()
        }
      })

      logger.info('Incremental sync job completed', {
        action: 'wp_incremental_sync_complete',
        jobId,
        result
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      logger.error('Incremental sync job failed', {
        action: 'wp_incremental_sync_failed',
        jobId,
        error: errorMessage
      })

      // Marcar job como falha
      await db.queueJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: errorMessage,
          attempts: job.attempts + 1
        }
      })

      return {
        success: false,
        action: 'failed',
        error: errorMessage
      }
    }
  }

  /**
   * Fetch item individual do WordPress
   */
  private static async fetchWordPressItem(
    wpBaseUrl: string,
    wpAuthType: string,
    wpUsername: string,
    wpPassword: string,
    entityType: string,
    wpId: number
  ): Promise<any> {
    const endpointMap: Record<string, string> = {
      term: '/wp-json/wp/v2/categories',
      media: '/wp-json/wp/v2/media',
      page: '/wp-json/wp/v2/pages',
      post: '/wp-json/wp/v2/posts'
    }

    const endpoint = endpointMap[entityType]
    if (!endpoint) {
      throw new Error(`Unknown entity type: ${entityType}`)
    }

    const url = `${wpBaseUrl.replace(/\/$/, '')}${endpoint}/${wpId}`

    // Criar auth header
    let authHeader: string
    if (wpAuthType === 'basic' || wpAuthType === 'application_password') {
      authHeader = `Basic ${Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64')}`
    } else if (wpAuthType === 'jwt' || wpAuthType === 'oauth') {
      authHeader = `Bearer ${wpPassword}`
    } else {
      throw new Error(`Unsupported auth type: ${wpAuthType}`)
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null // Item não existe mais
      }
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Upsert Category incremental
   */
  private static async upsertCategoryIncremental(
    wpCategory: any,
    jobData: IncrementalSyncJobData,
    wpBaseUrl: string,
    logger: StructuredLogger
  ): Promise<IncrementalSyncResult> {
    const existing = await findCategoryByWpTermId(jobData.siteId, wpCategory.id)

    let parentId: string | null = null
    if (wpCategory.parent && wpCategory.parent > 0) {
      const parentCategory = await findCategoryByWpTermId(jobData.siteId, wpCategory.parent)
      parentId = parentCategory?.id || null
    }

    const categoryData = {
      name: wpCategory.name,
      slug: wpCategory.slug,
      description: wpCategory.description || null,
      parentId,
      wpTermId: wpCategory.id,
      wpSiteUrl: wpBaseUrl
    }

    if (existing) {
      await db.category.update({
        where: { id: existing.id },
        data: categoryData
      })

      return {
        success: true,
        action: 'updated',
        localId: existing.id
      }
    } else {
      const category = await db.category.create({
        data: {
          ...categoryData,
          siteId: jobData.siteId
        }
      })

      return {
        success: true,
        action: 'created',
        localId: category.id
      }
    }
  }

  /**
   * Upsert Media incremental
   */
  private static async upsertMediaIncremental(
    wpMedia: any,
    jobData: IncrementalSyncJobData,
    wpBaseUrl: string,
    logger: StructuredLogger
  ): Promise<IncrementalSyncResult> {
    const existing = await findMediaByWpMediaId(jobData.siteId, wpMedia.id)

    const mediaData = {
      filename: wpMedia.source_url.split('/').pop() || wpMedia.title.rendered,
      originalName: wpMedia.title.rendered,
      mimeType: wpMedia.mime_type,
      size: 0,
      url: wpMedia.source_url,
      alt: wpMedia.alt_text || null,
      caption: null,
      wpMediaId: wpMedia.id,
      wpSiteUrl: wpBaseUrl
    }

    if (existing) {
      await db.media.update({
        where: { id: existing.id },
        data: mediaData
      })

      return {
        success: true,
        action: 'updated',
        localId: existing.id
      }
    } else {
      const media = await db.media.create({
        data: {
          ...mediaData,
          siteId: jobData.siteId
        }
      })

      return {
        success: true,
        action: 'created',
        localId: media.id
      }
    }
  }

  /**
   * Upsert Page incremental (com LWW e conflitos)
   */
  private static async upsertPageIncremental(
    wpPage: any,
    jobData: IncrementalSyncJobData,
    wpBaseUrl: string,
    canGenerateEmbeddings: boolean,
    costState: string,
    logger: StructuredLogger
  ): Promise<IncrementalSyncResult> {
    const existing = await findPageByWpPostId(jobData.siteId, wpPage.id)

    // Verificar conflito (LWW)
    if (existing) {
      const wpModified = new Date(wpPage.modified)
      const localUpdated = existing.wpSyncedAt ? new Date(existing.wpSyncedAt) : new Date(0)

      // Se local é mais recente, pode ser conflito
      if (localUpdated > wpModified) {
        // Detectar conflito
        const conflict = WordPressConflictDetector.detectConflict(wpModified, localUpdated)

        if (conflict.hasConflict) {
          // Registrar conflito
          const localSnapshot = JSON.stringify({
            title: existing.title,
            content: existing.content,
            updatedAt: existing.updatedAt
          })

          const wpSnapshot = JSON.stringify({
            title: wpPage.title.rendered,
            content: wpPage.content.rendered,
            modified: wpPage.modified
          })

          await WordPressConflictDetector.recordConflict({
            organizationId: jobData.organizationId,
            siteId: jobData.siteId,
            entityType: 'page',
            wpId: wpPage.id,
            localId: existing.id,
            conflictType: conflict.conflictType!,
            localSnapshotJson: localSnapshot,
            wpSnapshotJson: wpSnapshot
          }, logger)

          // Aplicar LWW: WP vence em webhook (política atual)
          // Conflito foi registrado para resolução manual posterior
        }
      }
    }

    // Buscar author
    const authorId = await this.findOrCreateAuthor(jobData.siteId, jobData.organizationId, wpPage.author)

    // Buscar categoria
    let categoryId: string | null = null
    if (wpPage.categories && wpPage.categories.length > 0) {
      const category = await findCategoryByWpTermId(jobData.siteId, wpPage.categories[0])
      categoryId = category?.id || null
    }

    // Extrair ACF
    let acfFields: Record<string, any> = wpPage.acf || {}
    if (Object.keys(acfFields).length === 0) {
      try {
        const acfUrl = `${wpBaseUrl.replace(/\/$/, '')}/wp-json/acf/v3/pages/${wpPage.id}`
        const authHeader = await this.getAuthHeader(wpBaseUrl, jobData.organizationId, jobData.siteId)
        const acfResponse = await fetch(acfUrl, {
          method: 'GET',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          }
        })

        if (acfResponse.ok) {
          const acfData = await acfResponse.json()
          acfFields = acfData.acf || {}
        }
      } catch (error) {
        // Ignorar erro de ACF
      }
    }

    const pageData = {
      title: wpPage.title.rendered,
      slug: wpPage.slug,
      content: wpPage.content.rendered || null,
      excerpt: wpPage.excerpt?.rendered || null,
      status: wpPage.status === 'publish' ? 'published' : 'draft',
      featuredImage: wpPage.featured_media ? wpPage.featured_media.toString() : null,
      publishedAt: wpPage.date ? new Date(wpPage.date) : null,
      wpPostId: wpPage.id,
      wpSiteUrl: wpBaseUrl,
      wpSyncedAt: new Date(),
      acfFields: JSON.stringify(acfFields),
      authorId,
      categoryId,
      siteId: jobData.siteId
    }

    let pageId: string
    let wasCreated = false

    if (existing) {
      await db.page.update({
        where: { id: existing.id },
        data: pageData
      })
      pageId = existing.id
    } else {
      const page = await db.page.create({ data: pageData })
      pageId = page.id
      wasCreated = true
    }

    // Gerar embedding se permitido (FASE G.3)
    let embeddingQueued = false
    let embeddingSkipped = false
    let skipReason: string | undefined

    if (canGenerateEmbeddings && pageData.content) {
      try {
        // Extrair ACF fields
        let acfFields: Record<string, any> = {}
        try {
          acfFields = JSON.parse(pageData.acfFields || '{}')
        } catch (error) {
          // Ignorar erro de parse
        }

        // Usar WordPressEmbeddingTrigger (normaliza conteúdo e verifica hash)
        const triggerResult = await WordPressEmbeddingTrigger.triggerEmbedding({
          organizationId: jobData.organizationId,
          siteId: jobData.siteId,
          sourceType: 'wp_page',
          sourceId: pageId,
          wpId: wpPage.id,
          title: pageData.title,
          content: pageData.content,
          excerpt: pageData.excerpt || undefined,
          categories: wpPage.categories ? wpPage.categories.map(String) : undefined,
          tags: wpPage.tags ? wpPage.tags.map(String) : undefined,
          acfFields: Object.keys(acfFields).length > 0 ? acfFields : undefined,
          correlationId: jobData.correlationId
        })

        embeddingQueued = triggerResult.enqueued
        embeddingSkipped = triggerResult.skipped
        skipReason = triggerResult.skipReason
      } catch (error) {
        embeddingSkipped = true
        skipReason = error instanceof Error ? error.message : 'Unknown error'
      }
    } else {
      embeddingSkipped = true
      skipReason = `Tenant cost state: ${costState}`
    }

    return {
      success: true,
      action: wasCreated ? 'created' : 'updated',
      localId: pageId,
      embeddingQueued,
      embeddingSkipped,
      skipReason
    }
  }

  /**
   * Upsert Post incremental (similar a Page)
   */
  private static async upsertPostIncremental(
    wpPost: any,
    jobData: IncrementalSyncJobData,
    wpBaseUrl: string,
    canGenerateEmbeddings: boolean,
    costState: string,
    logger: StructuredLogger
  ): Promise<IncrementalSyncResult> {
    // Posts são tratados como Pages no CMS, mas com sourceType wp_post
    // Reutilizar lógica de upsertPageIncremental, mas passar sourceType correto
    const existing = await findPageByWpPostId(jobData.siteId, wpPost.id)

    // Verificar conflito (LWW)
    if (existing) {
      const wpModified = new Date(wpPost.modified)
      const localUpdated = existing.wpSyncedAt ? new Date(existing.wpSyncedAt) : new Date(0)

      if (localUpdated > wpModified) {
        const conflict = WordPressConflictDetector.detectConflict(wpModified, localUpdated)

        if (conflict.hasConflict) {
          const localSnapshot = JSON.stringify({
            title: existing.title,
            content: existing.content,
            updatedAt: existing.updatedAt
          })

          const wpSnapshot = JSON.stringify({
            title: wpPost.title.rendered,
            content: wpPost.content.rendered,
            modified: wpPost.modified
          })

          await WordPressConflictDetector.recordConflict({
            organizationId: jobData.organizationId,
            siteId: jobData.siteId,
            entityType: 'post',
            wpId: wpPost.id,
            localId: existing.id,
            conflictType: conflict.conflictType!,
            localSnapshotJson: localSnapshot,
            wpSnapshotJson: wpSnapshot
          }, logger)
        }
      }
    }

    // Buscar author
    const authorId = await this.findOrCreateAuthor(jobData.siteId, jobData.organizationId, wpPost.author)

    // Buscar categoria
    let categoryId: string | null = null
    if (wpPost.categories && wpPost.categories.length > 0) {
      const category = await findCategoryByWpTermId(jobData.siteId, wpPost.categories[0])
      categoryId = category?.id || null
    }

    // Extrair ACF
    let acfFields: Record<string, any> = wpPost.acf || {}
    if (Object.keys(acfFields).length === 0) {
      try {
        const acfUrl = `${wpBaseUrl.replace(/\/$/, '')}/wp-json/acf/v3/posts/${wpPost.id}`
        const authHeader = await this.getAuthHeader(wpBaseUrl, jobData.organizationId, jobData.siteId)
        const acfResponse = await fetch(acfUrl, {
          method: 'GET',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          }
        })

        if (acfResponse.ok) {
          const acfData = await acfResponse.json()
          acfFields = acfData.acf || {}
        }
      } catch (error) {
        // Ignorar erro de ACF
      }
    }

    const pageData = {
      title: wpPost.title.rendered,
      slug: wpPost.slug,
      content: wpPost.content.rendered || null,
      excerpt: wpPost.excerpt?.rendered || null,
      status: wpPost.status === 'publish' ? 'published' : 'draft',
      featuredImage: wpPost.featured_media ? wpPost.featured_media.toString() : null,
      publishedAt: wpPost.date ? new Date(wpPost.date) : null,
      wpPostId: wpPost.id,
      wpSiteUrl: wpBaseUrl,
      wpSyncedAt: new Date(),
      acfFields: JSON.stringify(acfFields),
      authorId,
      categoryId,
      siteId: jobData.siteId
    }

    let pageId: string
    let wasCreated = false

    if (existing) {
      const wpModified = new Date(wpPost.modified)
      const localUpdated = existing.wpSyncedAt ? new Date(existing.wpSyncedAt) : new Date(0)

      if (wpModified > localUpdated) {
        await db.page.update({
          where: { id: existing.id },
          data: pageData
        })
        pageId = existing.id
      } else {
        return { success: true, action: 'skipped', skipReason: 'Local is newer' }
      }
    } else {
      const page = await db.page.create({ data: pageData })
      pageId = page.id
      wasCreated = true
    }

    // Gerar embedding se permitido (FASE G.3) - usar sourceType wp_post
    let embeddingQueued = false
    let embeddingSkipped = false
    let skipReason: string | undefined

    if (canGenerateEmbeddings && pageData.content) {
      try {
        let acfFieldsParsed: Record<string, any> = {}
        try {
          acfFieldsParsed = JSON.parse(pageData.acfFields || '{}')
        } catch (error) {
          // Ignorar erro de parse
        }

        const triggerResult = await WordPressEmbeddingTrigger.triggerEmbedding({
          organizationId: jobData.organizationId,
          siteId: jobData.siteId,
          sourceType: 'wp_post', // FASE G.1: sourceType específico para posts
          sourceId: pageId,
          wpId: wpPost.id,
          title: pageData.title,
          content: pageData.content,
          excerpt: pageData.excerpt || undefined,
          categories: wpPost.categories ? wpPost.categories.map(String) : undefined,
          tags: wpPost.tags ? wpPost.tags.map(String) : undefined,
          acfFields: Object.keys(acfFieldsParsed).length > 0 ? acfFieldsParsed : undefined,
          correlationId: jobData.correlationId
        })

        embeddingQueued = triggerResult.enqueued
        embeddingSkipped = triggerResult.skipped
        skipReason = triggerResult.skipReason
      } catch (error) {
        embeddingSkipped = true
        skipReason = error instanceof Error ? error.message : 'Unknown error'
      }
    } else {
      embeddingSkipped = true
      skipReason = `Tenant cost state: ${costState}`
    }

    return {
      success: true,
      action: wasCreated ? 'created' : 'updated',
      localId: pageId,
      embeddingQueued,
      embeddingSkipped,
      skipReason
    }
  }

  /**
   * Handle delete
   */
  private static async handleDelete(
    jobData: IncrementalSyncJobData,
    logger: StructuredLogger
  ): Promise<IncrementalSyncResult> {
    // Por enquanto, apenas marcar como arquivado (soft delete)
    // TODO: Implementar delete real se necessário

    switch (jobData.wpEntityType) {
      case 'page':
      case 'post':
        const page = await findPageByWpPostId(jobData.siteId, jobData.wpId)
        if (page) {
          await db.page.update({
            where: { id: page.id },
            data: { status: 'archived' }
          })
          return { success: true, action: 'deleted', localId: page.id }
        }
        break

      case 'term':
        const category = await findCategoryByWpTermId(jobData.siteId, jobData.wpId)
        if (category) {
          // Não deletar categoria (pode ter dependências)
          return { success: true, action: 'skipped', skipReason: 'Category has dependencies' }
        }
        break

      case 'media':
        const media = await findMediaByWpMediaId(jobData.siteId, jobData.wpId)
        if (media) {
          // Não deletar media (pode estar em uso)
          return { success: true, action: 'skipped', skipReason: 'Media may be in use' }
        }
        break
    }

    return { success: true, action: 'skipped', skipReason: 'Item not found' }
  }

  /**
   * Helper: Encontrar ou criar author
   */
  private static async findOrCreateAuthor(
    siteId: string,
    organizationId: string,
    wpAuthorId: number
  ): Promise<string> {
    const site = await db.site.findUnique({
      where: { id: siteId },
      select: { organizationId: true }
    })

    if (!site) {
      throw new Error(`Site ${siteId} not found`)
    }

    const user = await db.user.findFirst({
      where: { organizationId: site.organizationId },
      select: { id: true }
    })

    if (!user) {
      throw new Error(`No user found for organization ${site.organizationId}`)
    }

    return user.id
  }

  /**
   * Helper: Obter auth header
   */
  private static async getAuthHeader(
    wpBaseUrl: string,
    organizationId: string,
    siteId: string
  ): Promise<string> {
    const { credentials, decryptedPassword } = await getWordPressCredentials(siteId, organizationId)

    if (!credentials?.wpConfigured || !decryptedPassword) {
      throw new Error('WordPress credentials not configured')
    }

    if (credentials.wpAuthType === 'basic' || credentials.wpAuthType === 'application_password') {
      return `Basic ${Buffer.from(`${credentials.wpUsername}:${decryptedPassword}`).toString('base64')}`
    } else if (credentials.wpAuthType === 'jwt' || credentials.wpAuthType === 'oauth') {
      return `Bearer ${decryptedPassword}`
    } else {
      throw new Error(`Unsupported auth type: ${credentials.wpAuthType}`)
    }
  }
}

