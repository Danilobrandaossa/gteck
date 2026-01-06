/**
 * 🔄 API ENDPOINT - Reindexar Conteúdo
 * 
 * Endpoint para reindexar conteúdo existente.
 * 
 * POST /api/embeddings/reindex
 * Body: {
 *   organizationId: string
 *   siteId: string
 *   sourceType?: 'page' | 'ai_content' | 'template'
 *   sourceId?: string
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
      provider,
      model,
      userId
    } = body

    // Validar contexto de tenant
    requireTenantContext(organizationId, siteId)

    // Reindexar
    const jobIds = await EmbeddingService.reindexContent({
      organizationId,
      siteId,
      sourceType,
      sourceId,
      provider,
      model,
      userId
    })

    // ✅ CORREÇÃO: Retornar 202 Accepted para operação assíncrona
    return NextResponse.json({
      success: true,
      jobIds,
      count: jobIds.length,
      message: `Reindexing queued for ${jobIds.length} content items`,
      status: 'queued'
    }, { status: 202 })

  } catch (error) {
    console.error('[API] Error reindexing content:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}






