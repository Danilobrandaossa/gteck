import { NextRequest, NextResponse } from 'next/server'
import { VeoVideoService, VeoVideoRequest } from '@/lib/veo-video-service'
import { resolveFeatureFlags } from '@/lib/feature-flags'
import { requireTenantContext } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

/**
 * POST /api/creative/generate-video
 * 
 * Inicia geração de vídeo (assíncrono)
 * 
 * Body:
 * {
 *   mainPrompt: string (obrigatório)
 *   videoModel?: 'veo3'|'veo31'
 *   aspectRatio?: '9:16'|'16:9'
 *   durationSeconds?: 4|6|8
 *   variations?: 1|2
 *   seed?: number
 *   imageReference?: { url, role }
 * }
 * 
 * Response:
 * {
 *   jobId: string,
 *   status: 'queued'|'running'|'failed'|'done',
 *   failureReason?: string
 * }
 */
export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('creative.generate-video', correlationId)

  try {
    const body = await request.json()
    
    // ✅ CORREÇÃO CRÍTICA: Validar contexto de tenant
    // Permitir siteId opcional (para admins)
    const { organizationId, siteId } = body
    const allowSiteIdOptional = !siteId // Se siteId não foi fornecido, permitir (admin)
    let tenantContext
    try {
      tenantContext = requireTenantContext(organizationId, siteId, allowSiteIdOptional)
    } catch (error) {
      logger.warn('Tenant validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return addCorrelationIdToResponse(
        NextResponse.json({
          status: 'failed',
          failureReason: allowSiteIdOptional
            ? 'organizationId é obrigatório e deve ser um CUID válido'
            : 'organizationId e siteId são obrigatórios e devem ser CUIDs válidos',
          error: 'INVALID_TENANT_CONTEXT'
        }, { status: 400 }),
        correlationId
      )
    }
    
    logger.info('Video generation request', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      hasMainPrompt: !!body.mainPrompt
    })
    
    if (!body.mainPrompt || typeof body.mainPrompt !== 'string' || !body.mainPrompt.trim()) {
      return addCorrelationIdToResponse(
        NextResponse.json({
          status: 'failed',
          failureReason: 'mainPrompt é obrigatório e deve ser uma string não vazia'
        }, { status: 400 }),
        correlationId
      )
    }

    // Verificar feature flag
    if (process.env.FEATURE_VIDEO_VEO3 !== 'true') {
      return NextResponse.json({
        status: 'failed',
        failureReason: 'Geração de vídeo não está habilitada (FEATURE_VIDEO_VEO3=false)'
      }, { status: 403 })
    }

    // Resolver flags
    const flags = resolveFeatureFlags({
      videoModel: body.videoModel
    })

    const requestId = correlationId
    logger.info('Starting video generation job', { requestId })

    // Obter API key
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || process.env.VEO_API_KEY
    if (!apiKey || apiKey.startsWith('mock')) {
      return NextResponse.json({
        status: 'failed',
        failureReason: 'Google AI Studio API key não configurada para geração de vídeo'
      }, { status: 500 })
    }

    // Criar serviço
    const videoService = new VeoVideoService({ apiKey })

    // Construir request
    const videoRequest: VeoVideoRequest = {
      prompt: body.mainPrompt.trim(),
      videoModel: flags.videoModel?.value || body.videoModel || 'veo3',
      aspectRatio: body.aspectRatio || (process.env.VIDEO_DEFAULT_ASPECT_RATIO as '9:16' | '16:9') || '9:16',
      durationSeconds: body.durationSeconds || (parseInt(process.env.VIDEO_DEFAULT_DURATION_SECONDS || '6', 10) as 4 | 6 | 8),
      variations: Math.min(Math.max(body.variations || 1, 1), parseInt(process.env.VIDEO_MAX_VARIATIONS || '1', 10)) as 1 | 2,
      seed: body.seed,
      imageReference: body.imageReference
    }

    // Iniciar job
    const result = await videoService.startVideoJob(videoRequest)

    logger.info('Video job created', { jobId: result.jobId, status: result.status })

    // ✅ CORREÇÃO: Retornar 202 Accepted para operação assíncrona
    return addCorrelationIdToResponse(
      NextResponse.json({
        jobId: result.jobId,
        status: result.status,
        message: 'Video generation job queued'
      }, { status: 202 }),
      correlationId
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('Tenant context required')) {
      logger.warn('Tenant validation failed in catch', { error: error.message })
      return addCorrelationIdToResponse(
        NextResponse.json({
          status: 'failed',
          failureReason: 'organizationId e siteId são obrigatórios',
          error: 'INVALID_TENANT_CONTEXT'
        }, { status: 400 }),
        correlationId
      )
    }

    logger.error('Error generating video', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return addCorrelationIdToResponse(
      NextResponse.json({
        status: 'failed',
        failureReason: 'Erro interno ao iniciar geração de vídeo',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 }),
      correlationId
    )
  }
}


