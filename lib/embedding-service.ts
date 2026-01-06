/**
 * 🧠 EMBEDDING SERVICE - Orquestra todo o ciclo de vida dos embeddings
 * 
 * Responsabilidades:
 * - Geração de embeddings (assíncrona via QueueJob)
 * - Deduplicação (contentHash)
 * - Versionamento
 * - Reindexação segura
 * - Auditoria completa
 * 
 * REGRAS DE SEGURANÇA:
 * - NUNCA acessa banco diretamente (usa helpers seguros)
 * - SEMPRE valida organizationId + siteId
 * - SEMPRE usa safeQueryRaw / safeExecuteRaw
 */

import { Prisma } from '@prisma/client'
import { db } from './db'
import { 
  safeQueryRaw, 
  safeExecuteRaw, 
  validateTenantContext,
  validateSiteBelongsToOrganization 
} from './tenant-security'
import { 
  EmbeddingProvider, 
  createEmbeddingProvider,
  EmbeddingResult 
} from './embedding-providers'
import { TextChunking, TextChunk } from './text-chunking'
import crypto from 'crypto'

// FASE G.1: Source types incluem WordPress
export type SourceType = 'page' | 'ai_content' | 'template' | 'wp_post' | 'wp_page' | 'wp_media' | 'wp_term'
export type EmbeddingStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface GenerateEmbeddingParams {
  organizationId: string
  siteId: string
  sourceType: SourceType
  sourceId: string
  content: string
  language?: string
  provider?: 'openai' | 'gemini'
  model?: string
  userId?: string
}

export interface EmbeddingJobData {
  organizationId: string
  siteId: string
  sourceType: SourceType
  sourceId: string
  content: string
  contentHash: string
  language: string
  provider: 'openai' | 'gemini'
  model: string
  userId?: string
}

export interface ReindexParams {
  organizationId: string
  siteId: string
  sourceType?: SourceType
  sourceId?: string
  provider?: 'openai' | 'gemini'
  model?: string
  userId?: string
}

export class EmbeddingService {
  private static readonly DEFAULT_PROVIDER: 'openai' | 'gemini' = 'openai'
  private static readonly DEFAULT_MODEL = 'text-embedding-ada-002'
  private static readonly DEFAULT_DIMENSIONS = 1536
  private static readonly MAX_RETRIES = 3
  
  // FASE 7: Feature flag para chunks (backward compatibility)
  private static readonly USE_CHUNKS = process.env.USE_EMBEDDING_CHUNKS === 'true'
  private static readonly CHUNK_SIZE = parseInt(process.env.EMBEDDING_CHUNK_SIZE || '1000', 10)
  private static readonly CHUNK_OVERLAP = parseInt(process.env.EMBEDDING_CHUNK_OVERLAP || '200', 10)

  /**
   * Enfileira geração de embedding (assíncrono)
   * Retorna imediatamente sem bloquear
   */
  static async enqueueEmbeddingJob(params: GenerateEmbeddingParams): Promise<string> {
    // 1. Validar contexto de tenant
    const validation = validateTenantContext(params.organizationId, params.siteId)
    if (!validation.valid) {
      throw new Error(`Invalid tenant context: ${validation.error}`)
    }

    // 2. Validar relacionamento site-organization
    const isValid = await validateSiteBelongsToOrganization(params.siteId, params.organizationId)
    if (!isValid) {
      throw new Error('Site does not belong to the specified organization')
    }

    // 3. Validar conteúdo
    if (!params.content || params.content.trim().length === 0) {
      throw new Error('Content cannot be empty')
    }

    // 4. Calcular contentHash
    const contentHash = this.calculateContentHash(params.content)

    // 5. Verificar se já existe embedding ativo (deduplicação)
    const existingEmbedding = await this.findExistingEmbedding(
      params.organizationId,
      params.siteId,
      contentHash,
      params.provider || this.DEFAULT_PROVIDER,
      params.model || this.DEFAULT_MODEL
    )

    if (existingEmbedding) {
      // Embedding já existe e está ativo
      return existingEmbedding.id
    }

    // 6. Criar QueueJob
    const jobData: EmbeddingJobData = {
      organizationId: params.organizationId,
      siteId: params.siteId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      content: params.content,
      contentHash,
      language: params.language || 'pt-BR',
      provider: params.provider || this.DEFAULT_PROVIDER,
      model: params.model || this.DEFAULT_MODEL,
      userId: params.userId
    }

    const job = await db.queueJob.create({
      data: {
        type: 'generate_embedding',
        status: 'pending',
        data: JSON.stringify(jobData),
        maxAttempts: this.MAX_RETRIES
      }
    })

    // 7. Log estruturado
    console.log('[EmbeddingService] Job enqueued', {
      jobId: job.id,
      organizationId: params.organizationId,
      siteId: params.siteId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      contentHash,
      provider: jobData.provider,
      model: jobData.model
    })

    return job.id
  }

  /**
   * Processa um job de embedding (chamado pelo worker)
   */
  static async processEmbeddingJob(jobId: string, correlationId?: string): Promise<void> {
    const startTime = Date.now()

    // 1. Buscar job
    const job = await db.queueJob.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      throw new Error(`Job not found: ${jobId}`)
    }

    if (job.status !== 'pending' && job.status !== 'processing') {
      throw new Error(`Job already processed: ${job.status}`)
    }

    // 2. Atualizar status para processing
    await db.queueJob.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        attempts: { increment: 1 }
      }
    })

    try {
      // 3. Parse job data
      const jobData: EmbeddingJobData = JSON.parse(job.data)

      // 4. Validar contexto
      const validation = validateTenantContext(jobData.organizationId, jobData.siteId)
      if (!validation.valid) {
        throw new Error(`Invalid tenant context: ${validation.error}`)
      }

      // 5. Verificar duplicata novamente (race condition)
      const existingEmbedding = await this.findExistingEmbedding(
        jobData.organizationId,
        jobData.siteId,
        jobData.contentHash,
        jobData.provider,
        jobData.model
      )

      if (existingEmbedding) {
        // Embedding já foi criado por outro job
        await db.queueJob.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            result: JSON.stringify({ embeddingId: existingEmbedding.id, skipped: true })
          }
        })
        return
      }

      // 6. Criar provider
      const apiKey = this.getProviderApiKey(jobData.provider)
      const provider = createEmbeddingProvider(
        jobData.provider,
        apiKey,
        jobData.model
      )

      // 7. Processar com chunks ou embedding único (FASE 7)
      if (this.USE_CHUNKS) {
        // Processar em chunks
        await this.processEmbeddingChunks(
          jobData,
          provider
        )
      } else {
        // Processar embedding único (compatibilidade)
        const embeddingResult = await provider.generateEmbedding(jobData.content)

        // 8. Desativar embeddings antigos (versionamento)
        await this.disableOldEmbeddings(
          jobData.organizationId,
          jobData.siteId,
          jobData.sourceType,
          jobData.sourceId
        )

        // 9. Salvar embedding no banco (usando SQL raw para pgvector)
        const embeddingId = await this.saveEmbedding(
          jobData,
          embeddingResult
        )

        // 10. Atualizar source (Page/AIContent/Template)
        await this.updateSourceEmbeddingMetadata(
          jobData.sourceType,
          jobData.sourceId,
          embeddingId,
          jobData.model,
          jobData.provider
        )

        // 11. Registrar auditoria
        await this.recordAudit(
          jobData,
          embeddingResult,
          Date.now() - startTime,
          'success'
        )

        // 12. Marcar job como completed
        await db.queueJob.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            result: JSON.stringify({ embeddingId }),
            processedAt: new Date()
          }
        })

        console.log('[EmbeddingService] Job completed', {
          jobId,
          embeddingId,
          organizationId: jobData.organizationId,
          siteId: jobData.siteId,
          duration: Date.now() - startTime
        })
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Registrar erro na auditoria
      try {
        const jobData: EmbeddingJobData = JSON.parse(job.data)
        await this.recordAudit(
          jobData,
          null,
          Date.now() - startTime,
          'error',
          errorMessage
        )
      } catch (auditError) {
        console.error('[EmbeddingService] Failed to record audit:', auditError)
      }

      // Atualizar job com erro
      await db.queueJob.update({
        where: { id: jobId },
        data: {
          status: job.attempts >= job.maxAttempts ? 'failed' : 'pending',
          error: errorMessage
        }
      })

      throw error
    }
  }

  /**
   * Reindexa conteúdo (incremental, assíncrono)
   */
  static async reindexContent(params: ReindexParams): Promise<string[]> {
    // Validar contexto
    const validation = validateTenantContext(params.organizationId, params.siteId)
    if (!validation.valid) {
      throw new Error(`Invalid tenant context: ${validation.error}`)
    }

    // Buscar conteúdos para reindexar
    const contents = await this.findContentToReindex(params)

    // Enfileirar jobs para cada conteúdo
    const jobIds: string[] = []
    for (const content of contents) {
      const jobId = await this.enqueueEmbeddingJob({
        organizationId: params.organizationId,
        siteId: params.siteId,
        sourceType: content.sourceType,
        sourceId: content.sourceId,
        content: content.content,
        language: content.language,
        provider: params.provider,
        model: params.model,
        userId: params.userId
      })
      jobIds.push(jobId)
    }

    return jobIds
  }

  /**
   * Desativa embeddings antigos (versionamento)
   */
  static async disableOldEmbeddings(
    organizationId: string,
    siteId: string,
    sourceType: SourceType,
    sourceId: string
  ): Promise<number> {
    // FASE G.4: Desativar chunks antigos (usar embedding_chunks)
    // Por enquanto, desativar apenas chunks (embeddings antigos são mantidos para compatibilidade)
    const chunksQuery = Prisma.sql`
      UPDATE embedding_chunks
      SET is_active = false, updated_at = NOW()
      WHERE organization_id = ${organizationId}
        AND site_id = ${siteId}
        AND source_type = ${sourceType}
        AND source_id = ${sourceId}
        AND is_active = true
    `

    const chunksCount = await safeExecuteRaw(organizationId, siteId, chunksQuery, {
      validateSite: true
    })

    // Também desativar embeddings antigos (compatibilidade)
    const embeddingsQuery = Prisma.sql`
      UPDATE embeddings
      SET is_active = false, updated_at = NOW()
      WHERE organization_id = ${organizationId}
        AND site_id = ${siteId}
        AND source_type = ${sourceType}
        AND (
          (source_type IN ('page', 'wp_page', 'wp_post') AND page_id = ${sourceId})
          OR (source_type = 'ai_content' AND ai_content_id = ${sourceId})
          OR (source_type = 'template' AND template_id = ${sourceId})
        )
        AND is_active = true
    `

    const embeddingsCount = await safeExecuteRaw(organizationId, siteId, embeddingsQuery, {
      validateSite: true
    })

    return chunksCount + embeddingsCount
  }

  /**
   * Calcula hash SHA-256 do conteúdo
   */
  static calculateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content.trim()).digest('hex')
  }

  /**
   * Busca embedding existente (deduplicação)
   */
  private static async findExistingEmbedding(
    organizationId: string,
    siteId: string,
    contentHash: string,
    provider: string,
    model: string
  ): Promise<{ id: string } | null> {
    const query = Prisma.sql`
      SELECT id
      FROM embeddings
      WHERE organization_id = ${organizationId}
        AND site_id = ${siteId}
        AND content_hash = ${contentHash}
        AND model = ${model}
        AND is_active = true
      LIMIT 1
    `

    const results = await safeQueryRaw<{ id: string }>(
      organizationId,
      siteId,
      query,
      { validateSite: true }
    )

    return results.length > 0 ? results[0] : null
  }

  /**
   * Salva embedding no banco (SQL raw para pgvector)
   */
  private static async saveEmbedding(
    jobData: EmbeddingJobData,
    result: EmbeddingResult
  ): Promise<string> {
    const embeddingId = crypto.randomUUID().replace(/-/g, '').substring(0, 25) // CUID-like

    // Construir campos de source
    let sourceFields = ''
    let sourceValues = ''
    
    if (jobData.sourceType === 'page') {
      sourceFields = 'page_id'
      sourceValues = `${jobData.sourceId}::uuid`
    } else if (jobData.sourceType === 'ai_content') {
      sourceFields = 'ai_content_id'
      sourceValues = `${jobData.sourceId}::uuid`
    } else if (jobData.sourceType === 'template') {
      sourceFields = 'template_id'
      sourceValues = `${jobData.sourceId}::uuid`
    }

    // Converter array para formato pgvector
    // pgvector espera formato: ARRAY[1,2,3]::vector ou '[1,2,3]'::vector
    const vectorArray = result.embedding
    const vectorString = `[${vectorArray.join(',')}]`

    // Construir query dinâmica baseada no sourceType
    // Usar Prisma.raw para inserir o vetor diretamente
    let query: Prisma.Sql
    
    if (jobData.sourceType === 'page') {
      query = Prisma.sql`
        INSERT INTO embeddings (
          id, page_id, site_id, organization_id, embedding, model, dimensions,
          source_type, content_hash, language, version, is_active, created_at, updated_at
        )
        VALUES (
          ${embeddingId},
          ${jobData.sourceId},
          ${jobData.siteId},
          ${jobData.organizationId},
          ${Prisma.raw(`${vectorString}::vector(${result.dimensions})`)},
          ${jobData.model},
          ${result.dimensions},
          ${jobData.sourceType},
          ${jobData.contentHash},
          ${jobData.language},
          1,
          true,
          NOW(),
          NOW()
        )
        RETURNING id
      `
    } else if (jobData.sourceType === 'ai_content') {
      query = Prisma.sql`
        INSERT INTO embeddings (
          id, ai_content_id, site_id, organization_id, embedding, model, dimensions,
          source_type, content_hash, language, version, is_active, created_at, updated_at
        )
        VALUES (
          ${embeddingId},
          ${jobData.sourceId},
          ${jobData.siteId},
          ${jobData.organizationId},
          ${Prisma.raw(`${vectorString}::vector(${result.dimensions})`)},
          ${jobData.model},
          ${result.dimensions},
          ${jobData.sourceType},
          ${jobData.contentHash},
          ${jobData.language},
          1,
          true,
          NOW(),
          NOW()
        )
        RETURNING id
      `
    } else {
      query = Prisma.sql`
        INSERT INTO embeddings (
          id, template_id, site_id, organization_id, embedding, model, dimensions,
          source_type, content_hash, language, version, is_active, created_at, updated_at
        )
        VALUES (
          ${embeddingId},
          ${jobData.sourceId},
          ${jobData.siteId},
          ${jobData.organizationId},
          ${Prisma.raw(`${vectorString}::vector(${result.dimensions})`)},
          ${jobData.model},
          ${result.dimensions},
          ${jobData.sourceType},
          ${jobData.contentHash},
          ${jobData.language},
          1,
          true,
          NOW(),
          NOW()
        )
        RETURNING id
      `
    }

    const results = await safeQueryRaw<{ id: string }>(
      jobData.organizationId,
      jobData.siteId,
      query,
      { validateSite: true }
    )

    if (results.length === 0) {
      throw new Error('Failed to save embedding')
    }

    return results[0].id
  }

  /**
   * Atualiza metadados de embedding no source
   */
  private static async updateSourceEmbeddingMetadata(
    sourceType: SourceType,
    sourceId: string,
    embeddingId: string,
    model: string,
    provider: string
  ): Promise<void> {
    // Atualizar via Prisma (campos aditivos)
    // FASE G.1: Suportar wp_page e wp_post (ambos usam Page)
    if (sourceType === 'page' || sourceType === 'wp_page' || sourceType === 'wp_post') {
      await db.page.update({
        where: { id: sourceId },
        data: {
          embeddingGeneratedAt: new Date(),
          embeddingModel: model,
          embeddingVersion: { increment: 1 }
        }
      })
    } else if (sourceType === 'ai_content') {
      await db.aiContent.update({
        where: { id: sourceId },
        data: {
          embeddingGeneratedAt: new Date(),
          embeddingModel: model,
          embeddingVersion: { increment: 1 }
        }
      })
    } else if (sourceType === 'template') {
      await db.template.update({
        where: { id: sourceId },
        data: {
          embeddingGeneratedAt: new Date(),
          embeddingModel: model,
          embeddingVersion: { increment: 1 }
        }
      })
    }
    // wp_media e wp_term não têm campos de embedding metadata (opcional)
  }

  /**
   * Registra auditoria completa
   */
  private static async recordAudit(
    jobData: EmbeddingJobData,
    result: EmbeddingResult | null,
    durationMs: number,
    status: 'success' | 'error',
    errorMessage?: string
  ): Promise<void> {
    try {
      await db.aiInteraction.create({
        data: {
          organizationId: jobData.organizationId,
          siteId: jobData.siteId,
          userId: jobData.userId,
          type: 'embedding_generation',
          status: status === 'success' ? 'completed' : 'failed',
          prompt: `Generate embedding for ${jobData.sourceType}:${jobData.sourceId}`,
          provider: jobData.provider,
          model: jobData.model,
          response: status === 'success' ? 'Embedding generated successfully' : null,
          promptTokens: result?.tokensUsed,
          totalTokens: result?.tokensUsed,
          costUSD: result?.costUSD,
          durationMs,
          errorMessage: status === 'error' ? errorMessage : null,
          ragUsed: false
        }
      })
    } catch (error) {
      console.error('[EmbeddingService] Failed to record audit:', error)
      // Não falhar o job por erro de auditoria
    }
  }

  /**
   * Busca conteúdos para reindexar
   */
  private static async findContentToReindex(
    params: ReindexParams
  ): Promise<Array<{ sourceType: SourceType; sourceId: string; content: string; language: string }>> {
    const contents: Array<{ sourceType: SourceType; sourceId: string; content: string; language: string }> = []

    // Buscar Pages
    if (!params.sourceType || params.sourceType === 'page') {
      const pages = await db.page.findMany({
        where: {
          siteId: params.siteId,
          ...(params.sourceId ? { id: params.sourceId } : {}),
          content: { not: null }
        },
        select: {
          id: true,
          content: true
        }
      })

      for (const page of pages) {
        if (page.content) {
          contents.push({
            sourceType: 'page',
            sourceId: page.id,
            content: page.content,
            language: 'pt-BR' // TODO: detectar idioma
          })
        }
      }
    }

    // Buscar AIContent
    if (!params.sourceType || params.sourceType === 'ai_content') {
      const aiContents = await db.aiContent.findMany({
        where: {
          siteId: params.siteId,
          ...(params.sourceId ? { id: params.sourceId } : {}),
          content: { not: null }
        },
        select: {
          id: true,
          content: true,
          language: true
        }
      })

      for (const aiContent of aiContents) {
        if (aiContent.content) {
          contents.push({
            sourceType: 'ai_content',
            sourceId: aiContent.id,
            content: aiContent.content,
            language: aiContent.language || 'pt-BR'
          })
        }
      }
    }

    // Buscar Templates
    if (!params.sourceType || params.sourceType === 'template') {
      const templates = await db.template.findMany({
        where: {
          ...(params.sourceId ? { id: params.sourceId } : {}),
          content: { not: null },
          isActive: true
        },
        select: {
          id: true,
          content: true
        }
      })

      for (const template of templates) {
        if (template.content) {
          contents.push({
            sourceType: 'template',
            sourceId: template.id,
            content: template.content,
            language: 'pt-BR'
          })
        }
      }
    }

    return contents
  }

  /**
   * Obtém API key do provider
   */
  private static getProviderApiKey(provider: 'openai' | 'gemini'): string {
    switch (provider) {
      case 'openai':
        return process.env.OPENAI_API_KEY || ''
      case 'gemini':
        return process.env.GOOGLE_API_KEY || ''
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }
}

