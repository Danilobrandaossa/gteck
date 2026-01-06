import { NextRequest, NextResponse } from 'next/server'
import { CreativeGenerator, CreativeBrief } from '@/lib/creative-generator'
import { AIService } from '@/lib/ai-services'
import { resolveFeatureFlags } from '@/lib/feature-flags'
import { requireTenantContext } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

/**
 * POST /api/creative/generate-image
 * 
 * Gera imagens publicitárias baseado em briefing
 * 
 * Body:
 * {
 *   mainPrompt: string (obrigatório)
 *   imageRatio?: '1:1'|'4:5'|'9:16'|'16:9'
 *   variations?: number (1-4)
 *   qualityTier?: 'draft'|'production'
 *   imageModel?: 'nano'|'pro'
 *   includeTextInImage?: boolean
 *   imageReferences?: [{ url, role, description? }]
 *   ... outros campos opcionais
 * }
 * 
 * Response:
 * {
 *   status: 'success'|'failed',
 *   copy?: string,
 *   images?: [{ url, prompt, variation, model }],
 *   bestImage?: ...,
 *   metadata?: ...
 * }
 */
export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('creative.generate-image', correlationId)

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
    
    logger.info('Creative image generation request', {
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

    const requestId = correlationId

    // Resolver feature flags
    const flagsWithSource = resolveFeatureFlags({
      qualityTier: body.qualityTier,
      includeTextInImage: body.includeTextInImage,
      enableRefinePass: body.enableRefinePass,
      enableScoring: body.enableScoring,
      enableOverlay: body.enableOverlay,
      imageModel: body.imageModel
    })

    console.log('[Creative Image API] Request', requestId, '- Flags:', flagsWithSource)

    // Construir briefing
    const brief: CreativeBrief = {
      mainPrompt: body.mainPrompt.trim(),
      productName: body.productName,
      productDescription: body.productDescription,
      targetAudience: body.targetAudience,
      keyBenefits: body.keyBenefits,
      callToAction: body.callToAction,
      tone: body.tone,
      maxLength: body.maxLength,
      platform: body.platform,
      objective: body.objective,
      imageRatio: body.imageRatio,
      language: body.language,
      variations: Math.min(Math.max(body.variations || 2, 1), 4),
      imageReferences: body.imageReferences,
      avoidWords: body.avoidWords,
      mustInclude: body.mustInclude,
      brandGuidelines: body.brandGuidelines,
      competitorExamples: body.competitorExamples,
      qualityTier: flagsWithSource.qualityTier.value,
      includeTextInImage: flagsWithSource.includeTextInImage.value,
      enableRefinePass: flagsWithSource.enableRefinePass.value,
      enableScoring: flagsWithSource.enableScoring.value,
      enableOverlay: flagsWithSource.enableOverlay.value,
      imageModel: flagsWithSource.imageModel?.value || body.imageModel,
      aiProvider: body.aiProvider || 'gemini' // IA selecionada pelo usuário
    }

    // Configurar AIService baseado na seleção do usuário
    const aiProvider = body.aiProvider || 'gemini' // Padrão: Gemini
    
    let aiService: AIService
    
    if (aiProvider === 'openai') {
      // Usar OpenAI para geração de copy/texto
      const openaiApiKey = process.env.OPENAI_API_KEY || ''
      if (!openaiApiKey || openaiApiKey.trim() === '') {
        return addCorrelationIdToResponse(
          NextResponse.json({
            status: 'failed',
            failureReason: 'OpenAI API key não configurada (OPENAI_API_KEY)'
          }, { status: 500 }),
          correlationId
        )
      }

      aiService = new AIService({
        id: 'creative-image-generation-openai',
        name: 'Creative Image Generation Service (OpenAI)',
        type: 'openai',
        status: 'active',
        credentials: {
          apiKey: openaiApiKey.trim().replace(/^["']|["']$/g, ''),
          endpoint: 'https://api.openai.com/v1'
        },
        settings: {
          model: 'gpt-4o' // Usar GPT-4o para melhor qualidade
        },
        usage: { requests: 0, tokens: 0, cost: 0 },
        lastUsed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } else {
      // Usar Gemini para geração de imagens (padrão)
      const geminiApiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GOOGLE_API_KEY || ''
      if (!geminiApiKey || geminiApiKey.trim() === '') {
        return addCorrelationIdToResponse(
          NextResponse.json({
            status: 'failed',
            failureReason: 'Google AI Studio API key não configurada (GOOGLE_AI_STUDIO_API_KEY ou GOOGLE_API_KEY)'
          }, { status: 500 }),
          correlationId
        )
      }

      aiService = new AIService({
        id: 'creative-image-generation-gemini',
        name: 'Creative Image Generation Service (Gemini)',
        type: 'gemini',
        status: 'active',
        credentials: {
          apiKey: geminiApiKey.trim().replace(/^["']|["']$/g, ''),
          endpoint: 'https://generativelanguage.googleapis.com/v1beta'
        },
        settings: {
          model: 'gemini-2.5-flash'
        },
        usage: { requests: 0, tokens: 0, cost: 0 },
        lastUsed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    
    logger.info('AI Service configured', {
      provider: aiProvider,
      model: aiService.settings?.model || 'unknown'
    })

    console.log('[Creative Image API] Request', requestId, '- Iniciando geração...', {
      generateImage: true,
      qualityTier: brief.qualityTier,
      variations: brief.variations,
      imageModel: flagsWithSource.imageModel?.value || 'nano',
      aiProvider: aiProvider
    })

    // Gerar criativo com imagens
    const result = await CreativeGenerator.generateCreative(
      brief,
      aiService,
      true // generateImage = true
    )

    console.log('[Creative Image API] Request', requestId, '- Resultado:', {
      status: result.status,
      imagesGenerated: (result.conceptualImages?.length || 0) + (result.commercialImages?.length || 0),
      bestImage: result.bestImage ? 'yes' : 'none',
      timing: result.metadata?.timing
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
          status: 'failed',
          failureReason: 'organizationId e siteId são obrigatórios',
          error: 'INVALID_TENANT_CONTEXT'
        }, { status: 400 }),
        correlationId
      )
    }

    logger.error('Error generating creative image', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return addCorrelationIdToResponse(
      NextResponse.json({
        status: 'failed',
        failureReason: 'Erro interno ao gerar imagem criativa',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 }),
      correlationId
    )
  }
}
