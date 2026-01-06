/**
 * WordPress Sync Worker
 * FASE E.3 - Worker de Sync (Core)
 * 
 * Processa jobs de sincronização WordPress → CMS
 */

import { db } from '@/lib/db'
import { validateTenantContext } from '@/lib/tenant-security'
import {
  findPageByWpPostId,
  findCategoryByWpTermId,
  findMediaByWpMediaId
} from './wordpress-sync-map'
import { EmbeddingService } from '@/lib/embedding-service'
import { TenantCostPolicyService } from '@/lib/finops/tenant-cost-policy'
import { WordPressEmbeddingTrigger } from './wordpress-embedding-trigger'
import { StructuredLogger } from '@/lib/observability/logger'
import { createCorrelationContext } from '@/lib/observability/correlation'

export interface WordPressSyncJobData {
  syncId: string
  siteId: string
  organizationId: string
  correlationId: string
  wpBaseUrl: string
  wpAuthType: string
  wpUsername: string
  wpPassword: string
  batchSize: number
  priority: number
  entityType: 'terms' | 'media' | 'pages' | 'posts'
}

export interface SyncResult {
  created: number
  updated: number
  skipped: number
  failed: number
  embeddingsQueued: number
  embeddingsSkipped: number
  errors: Array<{ wpId: number; error: string }>
}

export class WordPressSyncWorker {
  /**
   * Processa um job de sincronização WordPress
   */
  static async processSyncJob(jobId: string): Promise<SyncResult> {
    const job = await db.queueJob.findUnique({
      where: { id: jobId }
    })

    if (!job || job.status !== 'pending') {
      throw new Error(`Job ${jobId} not found or not pending`)
    }

    const jobData: WordPressSyncJobData = JSON.parse(job.data)
    const logger = StructuredLogger.withCorrelation(
      { correlationId: jobData.correlationId },
      'worker'
    )

    logger.info('Processing WordPress sync job', {
      action: 'wp_sync_process',
      jobId,
      entityType: jobData.entityType,
      syncId: jobData.syncId
    })

    const result: SyncResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      embeddingsQueued: 0,
      embeddingsSkipped: 0,
      errors: []
    }

    try {
      // Verificar FinOps antes de processar
      const costInfo = await TenantCostPolicyService.getTenantCostInfo(
        jobData.organizationId,
        jobData.siteId
      )

      const canGenerateEmbeddings = costInfo.state === 'NORMAL' || costInfo.state === 'CAUTION'

      // Fetch dados do WordPress
      const wpItems = await this.fetchWordPressItems(
        jobData.wpBaseUrl,
        jobData.wpAuthType,
        jobData.wpUsername,
        jobData.wpPassword,
        jobData.entityType,
        jobData.batchSize
      )

      logger.info('Fetched WordPress items', {
        action: 'wp_sync_fetch',
        entityType: jobData.entityType,
        count: wpItems.length
      })

      // Processar cada item
      for (const wpItem of wpItems) {
        try {
          const itemResult = await this.processWordPressItem(
            jobData,
            wpItem,
            canGenerateEmbeddings,
            costInfo.state
          )

          result.created += itemResult.created ? 1 : 0
          result.updated += itemResult.updated ? 1 : 0
          result.skipped += itemResult.skipped ? 1 : 0
          result.embeddingsQueued += itemResult.embeddingQueued ? 1 : 0
          result.embeddingsSkipped += itemResult.embeddingSkipped ? 1 : 0
        } catch (error) {
          result.failed++
          result.errors.push({
            wpId: wpItem.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })

          logger.warn('Failed to process WordPress item', {
            action: 'wp_sync_item',
            wpId: wpItem.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
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

      logger.info('WordPress sync job completed', {
        action: 'wp_sync_complete',
        jobId,
        result
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      logger.error('WordPress sync job failed', {
        action: 'wp_sync_failed',
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

      throw error
    }
  }

  /**
   * Helper: Criar auth header
   */
  private static getAuthHeader(jobData: WordPressSyncJobData): string {
    if (jobData.wpAuthType === 'basic' || jobData.wpAuthType === 'application_password') {
      return `Basic ${Buffer.from(`${jobData.wpUsername}:${jobData.wpPassword}`).toString('base64')}`
    } else if (jobData.wpAuthType === 'jwt' || jobData.wpAuthType === 'oauth') {
      return `Bearer ${jobData.wpPassword}`
    } else {
      throw new Error(`Unsupported auth type: ${jobData.wpAuthType}`)
    }
  }

  /**
   * Fetch itens do WordPress REST API
   */
  private static async fetchWordPressItems(
    wpBaseUrl: string,
    wpAuthType: string,
    wpUsername: string,
    wpPassword: string,
    entityType: string,
    batchSize: number
  ): Promise<any[]> {
    const endpointMap: Record<string, string> = {
      terms: '/wp-json/wp/v2/categories',
      media: '/wp-json/wp/v2/media',
      pages: '/wp-json/wp/v2/pages',
      posts: '/wp-json/wp/v2/posts'
    }

    const endpoint = endpointMap[entityType]
    if (!endpoint) {
      throw new Error(`Unknown entity type: ${entityType}`)
    }

    const url = `${wpBaseUrl.replace(/\/$/, '')}${endpoint}?per_page=${batchSize}&page=1`

    // Criar auth header
    const authHeader = this.getAuthHeader({
      wpBaseUrl,
      wpAuthType,
      wpUsername,
      wpPassword,
      siteId: '',
      organizationId: '',
      syncId: '',
      correlationId: '',
      batchSize: 0,
      priority: 0,
      entityType: 'terms'
    })

    const response = await fetch(url, {
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

  /**
   * Processa um item WordPress individual
   */
  private static async processWordPressItem(
    jobData: WordPressSyncJobData,
    wpItem: any,
    canGenerateEmbeddings: boolean,
    costState: string
  ): Promise<{
    created: boolean
    updated: boolean
    skipped: boolean
    embeddingQueued: boolean
    embeddingSkipped: boolean
  }> {
    const result = {
      created: false,
      updated: false,
      skipped: false,
      embeddingQueued: false,
      embeddingSkipped: false
    }

    // Processar baseado no tipo de entidade
    switch (jobData.entityType) {
      case 'terms':
        await this.upsertCategory(wpItem, jobData)
        result.created = true
        break

      case 'media':
        await this.upsertMedia(wpItem, jobData)
        result.created = true
        break

      case 'pages':
        const pageResult = await this.upsertPage(wpItem, jobData, canGenerateEmbeddings, costState)
        result.created = pageResult.created
        result.updated = pageResult.updated
        result.embeddingQueued = pageResult.embeddingQueued
        result.embeddingSkipped = pageResult.embeddingSkipped
        break

      case 'posts':
        const postResult = await this.upsertPost(wpItem, jobData, canGenerateEmbeddings, costState)
        result.created = postResult.created
        result.updated = postResult.updated
        result.embeddingQueued = postResult.embeddingQueued
        result.embeddingSkipped = postResult.embeddingSkipped
        break
    }

    return result
  }

  /**
   * Upsert Category (Term)
   */
  private static async upsertCategory(wpCategory: any, jobData: WordPressSyncJobData) {
    // Verificar se já existe
    const existing = await findCategoryByWpTermId(jobData.siteId, wpCategory.id)

    // Buscar parent category se houver
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
      wpSiteUrl: jobData.wpBaseUrl
    }

    if (existing) {
      // Atualizar
      await db.category.update({
        where: { id: existing.id },
        data: categoryData
      })
    } else {
      // Criar
      await db.category.create({
        data: {
          ...categoryData,
          siteId: jobData.siteId
        }
      })
    }
  }

  /**
   * Upsert Media
   */
  private static async upsertMedia(wpMedia: any, jobData: WordPressSyncJobData) {
    const existing = await findMediaByWpMediaId(jobData.siteId, wpMedia.id)

    const mediaData = {
      filename: wpMedia.source_url.split('/').pop() || wpMedia.title.rendered,
      originalName: wpMedia.title.rendered,
      mimeType: wpMedia.mime_type,
      size: 0, // WordPress não retorna size diretamente
      url: wpMedia.source_url,
      alt: wpMedia.alt_text || null,
      caption: null,
      wpMediaId: wpMedia.id,
      wpSiteUrl: jobData.wpBaseUrl
    }

    if (existing) {
      await db.media.update({
        where: { id: existing.id },
        data: mediaData
      })
    } else {
      await db.media.create({
        data: {
          ...mediaData,
          siteId: jobData.siteId
        }
      })
    }
  }

  /**
   * Upsert Page
   */
  private static async upsertPage(
    wpPage: any,
    jobData: WordPressSyncJobData,
    canGenerateEmbeddings: boolean,
    costState: string
  ): Promise<{
    created: boolean
    updated: boolean
    embeddingQueued: boolean
    embeddingSkipped: boolean
  }> {
    const existing = await findPageByWpPostId(jobData.siteId, wpPage.id)

    // Buscar author (criar stub se não existir)
    const authorId = await this.findOrCreateAuthor(jobData.siteId, jobData.organizationId, wpPage.author)

    // Buscar categoria (se houver)
    let categoryId: string | null = null
    if (wpPage.categories && wpPage.categories.length > 0) {
      const category = await findCategoryByWpTermId(jobData.siteId, wpPage.categories[0])
      categoryId = category?.id || null
    }

    // Extrair ACF fields (pode vir em wpPage.acf ou precisar buscar via API ACF)
    let acfFields: Record<string, any> = wpPage.acf || {}
    
    // Se não houver ACF no objeto, tentar buscar via API ACF
    if (Object.keys(acfFields).length === 0) {
      try {
        const acfUrl = `${jobData.wpBaseUrl.replace(/\/$/, '')}/wp-json/acf/v3/pages/${wpPage.id}`
        const authHeader = this.getAuthHeader(jobData)
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
        // Ignorar erro de ACF (não é crítico)
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
      wpSiteUrl: jobData.wpBaseUrl,
      wpSyncedAt: new Date(),
      acfFields: JSON.stringify(acfFields),
      authorId,
      categoryId,
      siteId: jobData.siteId
    }

    let pageId: string
    let wasCreated = false

    if (existing) {
      // Atualizar apenas se WP é mais recente (Last Write Wins)
      const wpModified = new Date(wpPage.modified)
      const localUpdated = existing.wpSyncedAt ? new Date(existing.wpSyncedAt) : new Date(0)

      if (wpModified > localUpdated) {
        await db.page.update({
          where: { id: existing.id },
          data: pageData
        })
        pageId = existing.id
      } else {
        // Skip (local é mais recente)
        return { created: false, updated: false, embeddingQueued: false, embeddingSkipped: false }
      }
    } else {
      // Criar
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
      created: wasCreated,
      updated: !wasCreated,
      embeddingQueued,
      embeddingSkipped,
      skipReason
    }
  }

  /**
   * Upsert Post (similar a Page, mas com sourceType wp_post)
   */
  private static async upsertPost(
    wpPost: any,
    jobData: WordPressSyncJobData,
    canGenerateEmbeddings: boolean,
    costState: string
  ): Promise<{
    created: boolean
    updated: boolean
    embeddingQueued: boolean
    embeddingSkipped: boolean
    skipReason?: string
  }> {
    // Posts são tratados como Pages no CMS, mas com sourceType diferente
    const existing = await findPageByWpPostId(jobData.siteId, wpPost.id)

    // Buscar author (criar stub se não existir)
    const authorId = await this.findOrCreateAuthor(jobData.siteId, jobData.organizationId, wpPost.author)

    // Buscar categoria (se houver)
    let categoryId: string | null = null
    if (wpPost.categories && wpPost.categories.length > 0) {
      const category = await findCategoryByWpTermId(jobData.siteId, wpPost.categories[0])
      categoryId = category?.id || null
    }

    // Extrair ACF fields
    let acfFields: Record<string, any> = wpPost.acf || {}
    
    if (Object.keys(acfFields).length === 0) {
      try {
        const acfUrl = `${jobData.wpBaseUrl.replace(/\/$/, '')}/wp-json/acf/v3/posts/${wpPost.id}`
        const authHeader = await this.getAuthHeader(jobData)
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
      wpSiteUrl: jobData.wpBaseUrl,
      wpSyncedAt: new Date(),
      acfFields: JSON.stringify(acfFields),
      authorId,
      categoryId,
      siteId: jobData.siteId
    }

    let pageId: string
    let wasCreated = false

    if (existing) {
      // Atualizar apenas se WP é mais recente (Last Write Wins)
      const wpModified = new Date(wpPost.modified)
      const localUpdated = existing.wpSyncedAt ? new Date(existing.wpSyncedAt) : new Date(0)

      if (wpModified > localUpdated) {
        await db.page.update({
          where: { id: existing.id },
          data: pageData
        })
        pageId = existing.id
      } else {
        // Skip (local é mais recente)
        return { created: false, updated: false, embeddingQueued: false, embeddingSkipped: false }
      }
    } else {
      // Criar
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
        // Extrair ACF fields
        let acfFieldsParsed: Record<string, any> = {}
        try {
          acfFieldsParsed = JSON.parse(pageData.acfFields || '{}')
        } catch (error) {
          // Ignorar erro de parse
        }

        // Usar WordPressEmbeddingTrigger (normaliza conteúdo e verifica hash)
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
      created: wasCreated,
      updated: !wasCreated,
      embeddingQueued,
      embeddingSkipped,
      skipReason
    }
  }

  /**
   * Helper: Encontrar ou criar author
   */
  private static async findOrCreateAuthor(
    siteId: string,
    organizationId: string,
    wpAuthorId: number
  ): Promise<string> {
    // Por enquanto, retornar um author padrão
    // TODO: Implementar busca/criação de author baseado em wpAuthorId
    const site = await db.site.findUnique({
      where: { id: siteId },
      select: { organizationId: true }
    })

    if (!site) {
      throw new Error(`Site ${siteId} not found`)
    }

    // Buscar primeiro user da organização
    const user = await db.user.findFirst({
      where: { organizationId: site.organizationId },
      select: { id: true }
    })

    if (!user) {
      throw new Error(`No user found for organization ${site.organizationId}`)
    }

    return user.id
  }

}

