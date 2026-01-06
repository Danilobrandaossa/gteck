/**
 * 🔌 API ENDPOINT - RAG Query
 * 
 * Endpoint para executar queries RAG (Retrieval Augmented Generation).
 * 
 * POST /api/rag/query
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
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { RagService } from '@/lib/rag-service'
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
      temperature
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

    logger.info('RAG query request received', {
      action: 'rag_query',
      provider,
      model,
      inputSizeChars: question.length
    })

    // Executar query RAG com span
    const spanResult = await withSpan(
      'rag_query',
      correlationContext,
      'api',
      'rag_query',
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
        maxChunks,
        similarityThreshold
      }
    )

    const result = spanResult.result

    logger.info('RAG query completed', {
      action: 'rag_query',
      durationMs: spanResult.durationMs,
      provider: result.metadata.provider,
      model: result.metadata.model,
      chunksUsed: result.context.totalChunks
    })

    const response = NextResponse.json({
      success: true,
      data: result
    })

    return addCorrelationIdToResponse(response, correlationId)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('RAG query failed', {
      action: 'rag_query',
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

