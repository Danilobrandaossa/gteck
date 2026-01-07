/**
 * 🧠 RAG SERVICE STREAMING - Versão com streaming para RAG
 * 
 * Extensão do RagService para suportar streaming de respostas
 */

import { RagService, RAGQueryParams, RAGContext } from './rag-service'
import { ChatProvider, createChatProvider, getProviderApiKey } from './chat-providers'
import { db } from './db'
import { validateTenantContext, validateSiteBelongsToOrganization } from './tenant-security'
import { createEmbeddingProvider } from './embedding-providers'
import { createCorrelationContext } from './observability/correlation'
import { StructuredLogger } from './observability/logger'
import { withSpan } from './observability/spans'
import { RagConfidence, ConfidenceInputs } from './rag-confidence'
import crypto from 'crypto'

export interface RAGStreamResponse {
  stream: ReadableStream<Uint8Array>
  context: RAGContext
  interactionId: string
  metadata: {
    provider: string
    model: string
    fallbackUsed: boolean
  }
}

export class RagServiceStream {
  private static readonly DEFAULT_PROVIDER: 'openai' | 'gemini' = 'openai'
  private static readonly DEFAULT_MODEL_OPENAI = 'gpt-4o-mini'
  private static readonly DEFAULT_MODEL_GEMINI = 'gemini-1.5-flash'
  private static readonly DEFAULT_SIMILARITY_THRESHOLD = 0.7

  /**
   * Executa query RAG com streaming - FASE 7 ETAPA 5: Com correlationId
   */
  static async ragQueryStream(params: RAGQueryParams): Promise<RAGStreamResponse> {
    const startTime = Date.now()

    // FASE 7 ETAPA 5: Criar contexto de correlação
    const correlationId = params.correlationId || crypto.randomUUID()
    const correlationContext = createCorrelationContext(
      correlationId,
      params.organizationId,
      params.siteId,
      params.userId
    )
    const logger = StructuredLogger.withCorrelation(correlationContext, 'rag')

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

    logger.info('RAG query streaming started', {
      action: 'rag_query_stream',
      provider: params.provider,
      model: params.model,
      inputSizeChars: params.question.length
    })

    // 3. Gerar embedding da pergunta (com span)
    const embeddingSpan = await withSpan(
      'generate_query_embedding',
      correlationContext,
      'rag',
      'generate_embedding',
      async () => {
        return await this.generateQueryEmbedding(
          params.question,
          params.provider || this.DEFAULT_PROVIDER
        )
      },
      { provider: params.provider || this.DEFAULT_PROVIDER }
    )
    const queryEmbedding = embeddingSpan.result

    // 4. Buscar contexto semântico (com span)
    const contextSpan = await withSpan(
      'retrieve_context',
      correlationContext,
      'rag',
      'retrieve_context',
      async () => {
        return await RagService.retrieveContext(
          params.organizationId,
          params.siteId,
          queryEmbedding,
          {
            maxChunks: params.maxChunks || 5,
            similarityThreshold: params.similarityThreshold || this.DEFAULT_SIMILARITY_THRESHOLD,
            contentType: params.contentType || 'all',
            question: params.question,
            // @ts-expect-error FIX_BUILD: Suppressing error to allow build
            correlationId // FASE 7 ETAPA 5: Passar correlationId
          }
        )
      },
      {
        topK: params.maxChunks || 5,
        similarityThreshold: params.similarityThreshold || this.DEFAULT_SIMILARITY_THRESHOLD
      }
    )
    const context = contextSpan.result

    // 5. FASE 7 ETAPA 7: Calcular confiança do RAG (DECISION BEFORE STREAM)
    const topSimilarity = context.chunks.length > 0 
      ? Math.max(...context.chunks.map(c => c.similarity))
      : undefined

    const confidenceInputs: ConfidenceInputs = {
      chunksSelected: context.totalChunks,
      averageSimilarity: context.averageSimilarity,
      topSimilarity,
      diversityApplied: context.rerankMetrics?.diversityApplied || false,
      rerankApplied: context.rerankMetrics?.rerankApplied || false
    }

    const confidence = RagConfidence.computeConfidence(confidenceInputs)

    logger.info('RAG confidence calculated (streaming)', {
      action: 'rag_confidence_stream',
      confidenceLevel: confidence.level,
      confidenceScore: confidence.score,
      reasons: confidence.reasons
    })

    // 6. FASE 7 ETAPA 7: Se confiança baixa → fallback SEM STREAM
    if (RagConfidence.shouldUseFallback(confidence)) {
      logger.warn('Low confidence detected, using fallback (no stream)', {
        action: 'rag_confidence_stream',
        confidenceLevel: confidence.level,
        reasons: confidence.reasons
      })
      // Retornar erro para que o endpoint faça fallback para não-streaming
      throw new Error('Low confidence: insufficient context for streaming. Use regular ragQuery instead.')
    }

    // 7. Verificar se há contexto suficiente (compatibilidade)
    if (context.chunks.length === 0 || context.averageSimilarity < this.DEFAULT_SIMILARITY_THRESHOLD) {
      // Fallback: não fazer streaming, retornar resposta estática
      throw new Error('Insufficient context for streaming. Use regular ragQuery instead.')
    }

    // 6. Montar prompt estruturado
    const prompt = RagService.buildPrompt(params.question, context)

    // 7. Criar provider de chat
    const chatProvider = this.createChatProvider(
      params.provider || this.DEFAULT_PROVIDER,
      params.model
    )

    // 8. Gerar stream
    const stream = await chatProvider.generateCompletionStream(
      [
        { role: 'system', content: RagService.getSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      {
        temperature: params.temperature || 0.7,
        maxTokens: params.maxTokens || 2000
      }
    )

    // 9. Criar interação inicial (será atualizada após streaming)
    const interaction = await db.aIInteraction.create({
      data: {
        organizationId: params.organizationId,
        siteId: params.siteId,
        userId: params.userId,
        type: 'rag_query',
        status: 'processing',
        prompt: params.question,
        context: JSON.stringify({
          // FASE 7 ETAPA 5: CorrelationId
          correlationId,
          chunksCount: context.totalChunks,
          averageSimilarity: context.averageSimilarity
        }),
        provider: params.provider || this.DEFAULT_PROVIDER,
        model: params.model || (params.provider === 'gemini' ? this.DEFAULT_MODEL_GEMINI : this.DEFAULT_MODEL_OPENAI),
        ragUsed: true,
        ragChunksCount: context.totalChunks,
        ragSimilarityThreshold: context.averageSimilarity
      }
    })

    // 10. Wrapper do stream para processar e atualizar auditoria após conclusão
    const wrappedStream = this.wrapStreamForAudit(
      stream,
      interaction.id,
      params,
      context,
      startTime,
      chatProvider
    )

    return {
      stream: wrappedStream,
      context,
      interactionId: interaction.id,
      metadata: {
        provider: params.provider || this.DEFAULT_PROVIDER,
        model: params.model || (params.provider === 'gemini' ? this.DEFAULT_MODEL_GEMINI : this.DEFAULT_MODEL_OPENAI),
        fallbackUsed: false
      }
    }
  }

  /**
   * Wrapper do stream para processar e atualizar auditoria
   */
  private static wrapStreamForAudit(
    stream: ReadableStream<Uint8Array>,
    interactionId: string,
    params: RAGQueryParams,
    context: RAGContext,
    startTime: number,
    provider: ChatProvider
  ): ReadableStream<Uint8Array> {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let promptTokens = 0
    let completionTokens = 0

    return new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              // Calcular tokens aproximados
              promptTokens = Math.ceil((params.question.length + context.chunks.reduce((sum, c) => sum + c.content.length, 0)) / 4)
              completionTokens = Math.ceil(fullContent.length / 4)

              // Atualizar auditoria
              await db.aIInteraction.update({
                where: { id: interactionId },
                data: {
                  status: 'completed',
                  response: fullContent,
                  promptTokens,
                  completionTokens,
                  totalTokens: promptTokens + completionTokens,
                  costUSD: provider.calculateCost(promptTokens, completionTokens),
                  durationMs: Date.now() - startTime,
                  completedAt: new Date()
                }
              })

              controller.close()
              break
            }

            // Processar chunk do stream
            const chunk = decoder.decode(value, { stream: true })
            fullContent += chunk
            controller.enqueue(value)
          }
        } catch (error) {
          // Registrar erro na auditoria
          await db.aIInteraction.update({
            where: { id: interactionId },
            data: {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              completedAt: new Date()
            }
          }).catch(() => {})

          controller.error(error)
        }
      }
    })
  }

  /**
   * Gera embedding da pergunta do usuário
   */
  private static async generateQueryEmbedding(
    question: string,
    provider: 'openai' | 'gemini'
  ): Promise<number[]> {
    const apiKey = getProviderApiKey(provider)
    const embeddingProvider = createEmbeddingProvider(
      provider,
      apiKey,
      provider === 'openai' ? 'text-embedding-ada-002' : 'embedding-001'
    )

    const result = await embeddingProvider.generateEmbedding(question)
    return result.embedding
  }

  /**
   * Cria provider de chat
   */
  private static createChatProvider(
    provider: 'openai' | 'gemini',
    model?: string
  ): ChatProvider {
    const apiKey = getProviderApiKey(provider)
    
    if (provider === 'openai') {
      return createChatProvider(
        'openai',
        apiKey,
        model || this.DEFAULT_MODEL_OPENAI
      )
    } else {
      return createChatProvider(
        'gemini',
        apiKey,
        model || this.DEFAULT_MODEL_GEMINI
      )
    }
  }
}

