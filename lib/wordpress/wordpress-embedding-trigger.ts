/**
 * WordPress Embedding Trigger
 * FASE G.3 - Trigger de Embeddings Após Upsert (Full e Incremental)
 * 
 * Enfileira embeddings após sincronização WordPress
 */

import { db } from '@/lib/db'
import { EmbeddingService } from '@/lib/embedding-service'
import { WordPressContentNormalizer } from './wordpress-content-normalizer'
import { TenantCostPolicyService } from '@/lib/finops/tenant-cost-policy'
import { StructuredLogger } from '@/lib/observability/logger'
import crypto from 'crypto'

export interface WordPressEmbeddingTriggerOptions {
  organizationId: string
  siteId: string
  sourceType: 'wp_post' | 'wp_page'
  sourceId: string // localId (Page.id)
  wpId: number
  title: string
  content: string
  excerpt?: string
  categories?: string[]
  tags?: string[]
  acfFields?: Record<string, any>
  correlationId?: string
}

export interface TriggerResult {
  enqueued: boolean
  skipped: boolean
  skipReason?: string
  jobId?: string
  tenantCostState?: string
}

export class WordPressEmbeddingTrigger {
  /**
   * Enfileira embedding após upsert WordPress
   */
  static async triggerEmbedding(
    options: WordPressEmbeddingTriggerOptions
  ): Promise<TriggerResult> {
    const correlationId = options.correlationId || crypto.randomUUID()
    const logger = StructuredLogger.withCorrelation({ correlationId }, 'worker')

    logger.info('Triggering WordPress embedding', {
      action: 'wp_embedding_trigger',
      sourceType: options.sourceType,
      sourceId: options.sourceId,
      wpId: options.wpId
    })

    // 1. Verificar FinOps
    const costInfo = await TenantCostPolicyService.getTenantCostInfo(
      options.organizationId,
      options.siteId
    )

    const canGenerateEmbeddings = costInfo.state === 'NORMAL' || costInfo.state === 'CAUTION'

    if (!canGenerateEmbeddings) {
      logger.warn('Embedding skipped due to FinOps', {
        action: 'wp_embedding_skipped',
        tenantCostState: costInfo.state,
        sourceId: options.sourceId
      })

      return {
        enqueued: false,
        skipped: true,
        skipReason: `Tenant cost state: ${costInfo.state}`,
        tenantCostState: costInfo.state
      }
    }

    // 2. Normalizar conteúdo WordPress
    const normalized = WordPressContentNormalizer.normalize({
      title: options.title,
      slug: undefined, // Não necessário para embedding
      content: options.content || '',
      excerpt: options.excerpt,
      categories: options.categories,
      tags: options.tags,
      acfFields: options.acfFields
    })

    if (!normalized.text || normalized.text.trim().length === 0) {
      logger.warn('No content to index', {
        action: 'wp_embedding_no_content',
        sourceId: options.sourceId
      })

      return {
        enqueued: false,
        skipped: true,
        skipReason: 'No content to index'
      }
    }

    // 3. Verificar se conteúdo mudou (hash)
    // Usar método público se disponível, senão calcular diretamente
    const contentHash = crypto.createHash('sha256').update(normalized.text.trim()).digest('hex')

    // Buscar embedding existente ativo
    const existingEmbedding = await db.embeddingChunk.findFirst({
      where: {
        siteId: options.siteId,
        sourceType: options.sourceType,
        sourceId: options.sourceId,
        isActive: true
      },
      select: {
        chunkHash: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Se hash igual, não reindexar
    if (existingEmbedding && existingEmbedding.chunkHash === contentHash) {
      logger.info('Content unchanged, skipping reindex', {
        action: 'wp_embedding_unchanged',
        sourceId: options.sourceId,
        contentHash
      })

      return {
        enqueued: false,
        skipped: true,
        skipReason: 'Content unchanged (hash match)'
      }
    }

    // 4. Desativar chunks antigos (versionamento)
    await this.deactivateOldChunks(
      options.organizationId,
      options.siteId,
      options.sourceType,
      options.sourceId,
      logger
    )

    // 5. Enfileirar embedding job
    try {
      const jobId = await EmbeddingService.enqueueEmbeddingJob({
        organizationId: options.organizationId,
        siteId: options.siteId,
        sourceType: options.sourceType,
        sourceId: options.sourceId,
        content: normalized.text,
        language: 'pt-BR',
        correlationId
      })

      logger.info('WordPress embedding enqueued', {
        action: 'wp_embedding_enqueued',
        jobId,
        sourceId: options.sourceId,
        wpId: options.wpId,
        contentLength: normalized.text.length
      })

      return {
        enqueued: true,
        skipped: false,
        jobId,
        tenantCostState: costInfo.state
      }
    } catch (error) {
      logger.error('Error enqueueing WordPress embedding', {
        action: 'wp_embedding_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        sourceId: options.sourceId
      })

      return {
        enqueued: false,
        skipped: true,
        skipReason: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Desativa chunks antigos (versionamento)
   */
  private static async deactivateOldChunks(
    organizationId: string,
    siteId: string,
    sourceType: string,
    sourceId: string,
    logger: StructuredLogger
  ): Promise<number> {
    try {
      const result = await db.embeddingChunk.updateMany({
        where: {
          organizationId,
          siteId,
          sourceType,
          sourceId,
          isActive: true
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })

      if (result.count > 0) {
        logger.info('Deactivated old chunks', {
          action: 'wp_chunks_deactivated',
          count: result.count,
          sourceId
        })
      }

      return result.count
    } catch (error) {
      logger.warn('Error deactivating old chunks', {
        action: 'wp_chunks_deactivate_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return 0
    }
  }
}

