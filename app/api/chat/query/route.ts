/**
 * 💬 API ENDPOINT - Chat Query
 * 
 * Endpoint para queries de chat (wrapper sobre RAG).
 * Suporta streaming quando stream: true
 * 
 * POST /api/chat/query
 * Body: {
 *   organizationId: string
 *   siteId: string
 *   question: string
 *   userId?: string
 *   provider?: 'openai' | 'gemini'
 *   model?: string
 *   maxChunks?: number
 *   similarityThreshold?: number
 *   contentType?: 'page' | 'ai_content' | 'template' | 'all'
 *   maxTokens?: number
 *   temperature?: number
 *   stream?: boolean
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { RagService } from '@/lib/rag-service'
import { RagServiceStream } from '@/lib/rag-service-stream'
import { requireTenantContext } from '@/lib/tenant-security'
import { getCorrelationIdFromRequest, addCorrelationIdToResponse } from '@/lib/observability/middleware'
import { createCorrelationContext } from '@/lib/observability/correlation'
import { StructuredLogger } from '@/lib/observability/logger'
import { withSpan } from '@/lib/observability/spans'

export async function POST(request: NextRequest) {
  // FASE 7 ETAPA 5: Extrair correlationId
  const correlationId = getCorrelationIdFromRequest(request)
  const logger = StructuredLogger.withCorrelation(
    { correlationId },
    'api'
  )

  try {
    const body = await request.json()
    const {
      organizationId,
      siteId,
      question,
      userId,
      provider,
      model,
      maxChunks,
      similarityThreshold,
      contentType,
      maxTokens,
      temperature,
      stream = false
    } = body

    // Validar contexto de tenant
    requireTenantContext(organizationId, siteId)

    // Criar contexto de correlação completo
    const correlationContext = createCorrelationContext(
      correlationId,
      organizationId,
      siteId,
      userId
    )

    // Validar campos obrigatórios
    if (!question || question.trim().length === 0) {
      logger.warn('Missing required field: question', { action: 'validate_request' })
      const response = NextResponse.json(
        { error: 'Missing required field: question' },
        { status: 400 }
      )
      return addCorrelationIdToResponse(response, correlationId)
    }

    logger.info('Chat query request received', {
      action: 'chat_query',
      stream,
      provider,
      model,
      inputSizeChars: question.length
    })

    // Streaming
    if (stream) {
      try {
        const result = await RagServiceStream.ragQueryStream({
          organizationId,
          siteId,
          question: question.trim(),
          userId,
          provider,
          model,
          maxChunks,
          similarityThreshold,
          contentType,
          maxTokens,
          temperature,
          correlationId // FASE 7 ETAPA 5: Passar correlationId
        })

        logger.info('Chat query streaming started', {
          action: 'chat_query_stream',
          interactionId: result.interactionId,
          provider: result.metadata.provider,
          model: result.metadata.model
        })

        // Retornar stream com correlationId no header
        const streamResponse = new NextResponse(result.stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Interaction-Id': result.interactionId,
            'X-Provider': result.metadata.provider,
            'X-Model': result.metadata.model
          }
        })

        return addCorrelationIdToResponse(streamResponse, correlationId)
      } catch (error) {
        // Se streaming falhar, tentar sem streaming
        logger.warn('Streaming failed, falling back to non-streaming', {
          action: 'chat_query_stream',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        // Continuar para resposta não-streaming abaixo
      }
    }

    // Executar query RAG (não-streaming) com span
    const spanResult = await withSpan(
      'chat_query',
      correlationContext,
      'api',
      'chat_query',
      async () => {
        return await RagService.ragQuery({
          organizationId,
          siteId,
          question: question.trim(),
          userId,
          provider,
          model,
          maxChunks,
          similarityThreshold,
          contentType,
          maxTokens,
          temperature,
          correlationId // FASE 7 ETAPA 5: Passar correlationId
        })
      },
      {
        provider,
        model,
        stream: false
      }
    )

    const result = spanResult.result

    logger.info('Chat query completed', {
      action: 'chat_query',
      durationMs: spanResult.durationMs,
      provider: result.metadata.provider,
      model: result.metadata.model,
      chunksUsed: result.context.totalChunks
    })

    // Formatar resposta para chat
    const response = NextResponse.json({
      success: true,
      message: result.answer,
      metadata: {
        interactionId: result.interactionId,
        provider: result.metadata.provider,
        model: result.metadata.model,
        fallbackUsed: result.metadata.fallbackUsed,
        contextChunks: result.context.totalChunks,
        averageSimilarity: result.context.averageSimilarity,
        sources: result.sources || [],
        ragMeta: result.ragMeta
      },
      usage: result.usage
    })

    return addCorrelationIdToResponse(response, correlationId)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Chat query failed', {
      action: 'chat_query',
      error: errorMessage,
      errorCode: error instanceof Error ? error.name : 'UnknownError'
    })
    
    const response = NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )

    return addCorrelationIdToResponse(response, correlationId)
  }
}

