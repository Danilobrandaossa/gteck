import { NextRequest, NextResponse } from 'next/server'
import { generateFidelityImage, FidelityImageRequest } from '@/lib/fidelity-image-generator'
import { requireTenantContext } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

/**
 * POST /api/creative/fidelity-image
 * 
 * Gera imagem com alta fidelidade ao prompt do usuário
 * 
 * Body (JSON):
 * {
 *   prompt: string (obrigatório) - Prompt de Geração
 *   quality?: 'low' | 'medium' | 'high' | 'auto' (padrão: 'auto')
 *   style?: 'natural' | 'vivid' (padrão: 'natural')
 *   model?: 'default' | 'dalle3' (padrão: 'default')
 *   aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9' (padrão: '1:1')
 *   includeTextInImage?: boolean (padrão: false)
 *   organizationId?: string (obrigatório)
 *   siteId?: string (opcional para admins)
 * }
 */
export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('creative.fidelity-image', correlationId)

  try {
    const body = await request.json()
    
    // Validar contexto de tenant
    const organizationId = body.organizationId
    const siteId = body.siteId
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
          success: false,
          error: allowSiteIdOptional 
            ? 'organizationId é obrigatório e deve ser um CUID válido'
            : 'organizationId e siteId são obrigatórios e devem ser CUIDs válidos',
          errorCode: 'INVALID_TENANT_CONTEXT'
        }, { status: 400 }),
        correlationId
      )
    }
    
    // Validar prompt
    if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
      return addCorrelationIdToResponse(
        NextResponse.json({
          success: false,
          error: 'Campo "prompt" é obrigatório e não pode estar vazio'
        }, { status: 400 }),
        correlationId
      )
    }
    
    logger.info('Fidelity image generation request', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      promptLength: body.prompt.length,
      quality: body.quality || 'auto',
      style: body.style || 'natural',
      model: body.model || 'default'
    })
    
    // Construir requisição
    const imageRequest: FidelityImageRequest = {
      prompt: body.prompt.trim(),
      quality: body.quality || 'auto',
      style: body.style || 'natural',
      model: body.model || 'default',
      aspectRatio: body.aspectRatio || '1:1',
      includeTextInImage: body.includeTextInImage || false
    }
    
    // Gerar imagem
    const result = await generateFidelityImage(imageRequest)
    
    if (!result.success) {
      logger.error('Fidelity image generation failed', {
        error: result.error
      })
      
      return addCorrelationIdToResponse(
        NextResponse.json({
          success: false,
          error: result.error || 'Erro ao gerar imagem'
        }, { status: 500 }),
        correlationId
      )
    }
    
    logger.info('Fidelity image generated successfully', {
      model: result.metadata?.model,
      quality: result.metadata?.quality,
      promptLength: result.metadata?.promptLength
    })
    
    return addCorrelationIdToResponse(
      NextResponse.json(result),
      correlationId
    )
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Tenant context required')) {
      logger.warn('Tenant validation failed in catch', { error: error.message })
      return addCorrelationIdToResponse(
        NextResponse.json({
          success: false,
          error: 'organizationId e siteId são obrigatórios',
          errorCode: 'INVALID_TENANT_CONTEXT'
        }, { status: 400 }),
        correlationId
      )
    }

    logger.error('Error generating fidelity image', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return addCorrelationIdToResponse(
      NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : String(error))
          : undefined
      }, { status: 500 }),
      correlationId
    )
  }
}

export async function GET() {
  // Endpoint de documentação
  return NextResponse.json({
    name: 'Fidelity Image Generation API',
    version: '1.0.0',
    description: 'Gera imagens com alta fidelidade ao prompt do usuário',
    endpoint: '/api/creative/fidelity-image',
    method: 'POST',
    required_fields: [
      'prompt',
      'organizationId'
    ],
    optional_fields: [
      'quality',
      'style',
      'model',
      'aspectRatio',
      'includeTextInImage',
      'siteId'
    ],
    example_request: {
      prompt: 'Uma fotografia profissional de um produto em destaque, com fundo limpo e iluminação suave',
      quality: 'auto',
      style: 'natural',
      model: 'default',
      aspectRatio: '1:1',
      includeTextInImage: false,
      organizationId: 'org-123',
      siteId: 'site-456'
    },
    supported_values: {
      quality: ['low', 'medium', 'high', 'auto'],
      style: ['natural', 'vivid'],
      model: ['default', 'dalle3'],
      aspectRatio: ['1:1', '4:5', '9:16', '16:9']
    }
  })
}

