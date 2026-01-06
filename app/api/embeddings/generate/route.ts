/**
 * 🔌 API ENDPOINT - Gerar Embedding
 * 
 * Endpoint para enfileirar geração de embedding de forma assíncrona.
 * 
 * POST /api/embeddings/generate
 * Body: {
 *   organizationId: string
 *   siteId: string
 *   sourceType: 'page' | 'ai_content' | 'template'
 *   sourceId: string
 *   content: string
 *   language?: string
 *   provider?: 'openai' | 'gemini'
 *   model?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { EmbeddingService } from '@/lib/embedding-service'
import { requireTenantContext } from '@/lib/tenant-security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      siteId,
      sourceType,
      sourceId,
      content,
      language,
      provider,
      model,
      userId
    } = body

    // Validar contexto de tenant
    requireTenantContext(organizationId, siteId)

    // Validar campos obrigatórios
    if (!sourceType || !sourceId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceType, sourceId, content' },
        { status: 400 }
      )
    }

    if (!['page', 'ai_content', 'template'].includes(sourceType)) {
      return NextResponse.json(
        { error: 'Invalid sourceType. Must be: page, ai_content, or template' },
        { status: 400 }
      )
    }

    // Enfileirar job
    const jobId = await EmbeddingService.enqueueEmbeddingJob({
      organizationId,
      siteId,
      sourceType,
      sourceId,
      content,
      language,
      provider,
      model,
      userId
    })

    // ✅ CORREÇÃO: Retornar 202 Accepted para operação assíncrona
    return NextResponse.json({
      success: true,
      jobId,
      message: 'Embedding generation job enqueued',
      status: 'queued'
    }, { status: 202 })

  } catch (error) {
    console.error('[API] Error enqueueing embedding job:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}






