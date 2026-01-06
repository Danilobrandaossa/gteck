import { NextRequest, NextResponse } from 'next/server'
import { CreativeGenerator, CreativeBrief } from '@/lib/creative-generator'
import { AIService } from '@/lib/ai-services'
import { resolveFeatureFlags } from '@/lib/feature-flags'
import { requireTenantContext } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

/**
 * POST /api/creative/generate
 * 
 * Gera criativo de anúncio (copy + direção de imagem) baseado em briefing
 * 
 * Body:
 * {
 *   productName: string (obrigatório)
 *   productDescription?: string
 *   targetAudience?: string
 *   keyBenefits?: string[]
 *   callToAction?: string
 *   tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'inspiring'
 *   maxLength?: number
 *   platform?: 'facebook' | 'instagram' | 'google' | 'linkedin' | 'twitter'
 *   imageReferences?: Array<{ url: string, role: 'style' | 'produto' | 'inspiração', description?: string }>
 *   avoidWords?: string[]
 *   mustInclude?: string[]
 *   brandGuidelines?: string
 * }
 * 
 * Response (JSON):
 * {
 *   status: 'success' | 'failed'
 *   copy?: string
 *   imagePrompt?: string
 *   imageUrl?: string (se generateImage = true)
 *   revisedPrompt?: string (prompt revisado pelo DALL-E)
 *   failureReason?: string
 *   metadata?: { characterCount, tone, platform }
 * }
 */
export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('creative.generate', correlationId)

  try {
    const body = await request.json()
    
    // ✅ CORREÇÃO CRÍTICA: Validar contexto de tenant
    const { organizationId, siteId } = body
    let tenantContext
    try {
      tenantContext = requireTenantContext(organizationId, siteId)
    } catch (error) {
      logger.warn('Tenant validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        hasOrganizationId: !!organizationId,
        hasSiteId: !!siteId
      })
      return addCorrelationIdToResponse(
        NextResponse.json({
          status: 'failed',
          failureReason: 'organizationId e siteId são obrigatórios e devem ser CUIDs válidos',
          error: 'INVALID_TENANT_CONTEXT'
        }, { status: 400 }),
        correlationId
      )
    }
    
    logger.info('Creative generation request', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      hasMainPrompt: !!body.mainPrompt
    })
    
    // Validar campos obrigatórios - agora apenas mainPrompt é obrigatório
    if (!body.mainPrompt || typeof body.mainPrompt !== 'string' || !body.mainPrompt.trim()) {
      return addCorrelationIdToResponse(
        NextResponse.json({
          status: 'failed',
          failureReason: 'mainPrompt é obrigatório e deve ser uma string não vazia'
        }, { status: 400 }),
        correlationId
      )
    }

    // Usar correlationId como requestId
    const requestId = correlationId
    
    // Resolver feature flags (request > tenant > env > default)
    const flagsWithSource = resolveFeatureFlags({
      qualityTier: body.qualityTier,
      includeTextInImage: body.includeTextInImage,
      enableRefinePass: body.enableRefinePass,
      enableScoring: body.enableScoring,
      enableOverlay: body.enableOverlay
    })
    
    // Log flags resolvidas (sem segredos)
    console.log(`[Creative API] Request ${requestId} - Flags:`, {
      qualityTier: flagsWithSource.qualityTier,
      includeTextInImage: flagsWithSource.includeTextInImage,
      enableRefinePass: flagsWithSource.enableRefinePass,
      enableScoring: flagsWithSource.enableScoring,
      enableOverlay: flagsWithSource.enableOverlay
    })

    // Construir briefing
    const brief: CreativeBrief = {
      mainPrompt: body.mainPrompt.trim(), // PROMPT PRINCIPAL (fonte da verdade)
      productName: body.productName || 'Produto', // Opcional, usar valor padrão se não fornecido
      productDescription: body.productDescription,
      targetAudience: body.targetAudience,
      keyBenefits: body.keyBenefits,
      callToAction: body.callToAction,
      tone: body.tone,
      maxLength: body.maxLength,
      platform: body.platform,
      // Campos estruturados
      objective: body.objective,
      imageRatio: body.imageRatio,
      language: body.language,
      variations: body.variations,
      imageReferences: body.imageReferences,
      avoidWords: body.avoidWords,
      mustInclude: body.mustInclude,
      brandGuidelines: body.brandGuidelines,
      competitorExamples: body.competitorExamples,
      // Novos campos V2.2 (opcionais, compat mode)
      qualityTier: flagsWithSource.qualityTier.value,
      includeTextInImage: flagsWithSource.includeTextInImage.value,
      enableRefinePass: flagsWithSource.enableRefinePass.value,
      enableScoring: flagsWithSource.enableScoring.value,
      enableOverlay: flagsWithSource.enableOverlay.value
    }

    // Configurar AIService
    const apiKey = process.env.OPENAI_API_KEY || ''
    if (!apiKey || apiKey.startsWith('sk-mock')) {
      return NextResponse.json({
        status: 'failed',
        failureReason: 'OpenAI API key não configurada'
      }, { status: 500 })
    }

    const aiService = new AIService({
      id: 'creative-generation',
      name: 'Creative Generation Service',
      type: 'openai',
      status: 'active',
      credentials: {
        apiKey: apiKey,
        endpoint: 'https://api.openai.com/v1'
      },
      settings: {
        model: 'gpt-3.5-turbo', // Modelo mais compatível
        maxTokens: 300,
        temperature: 0.8
      },
      usage: { requests: 0, tokens: 0, cost: 0 },
      lastUsed: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Gerar criativo
    // generateImage: true para gerar imagem automaticamente (aumenta custo)
    const generateImage = body.generateImage === true
    
    console.log(`[Creative API] Request ${requestId} - Iniciando geração...`, { 
      generateImage,
      qualityTier: brief.qualityTier,
      variations: brief.variations
    })
    const result = await CreativeGenerator.generateCreative(brief, aiService, generateImage)
    console.log(`[Creative API] Request ${requestId} - Resultado:`, {
      status: result.status,
      imagesGenerated: (result.conceptualImages?.length || 0) + (result.commercialImages?.length || 0),
      bestImage: result.bestImage ? `index ${result.bestImage.index}` : 'none',
      timing: result.metadata?.timing
    })

    // Retornar JSON válido (sem Markdown, sem texto adicional)
    const response = NextResponse.json(result, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    return addCorrelationIdToResponse(response, correlationId)

  } catch (error) {
    // Se erro for de validação de tenant, já foi tratado acima
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

    logger.error('Error generating creative', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return addCorrelationIdToResponse(
      NextResponse.json({
        status: 'failed',
        failureReason: 'Erro interno ao gerar criativo',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 }),
      correlationId
    )
  }
}

