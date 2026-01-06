/**
 * API Route: Performance Creative Generation
 * 
 * Endpoint para geração de criativos de alta performance
 * baseado na especificação Creative Performance AI
 */

import { NextRequest, NextResponse } from 'next/server'
import { PerformanceCreativeEngine, PerformanceCreativeRequest } from '@/lib/performance-creative-engine'
import { AIService } from '@/lib/ai-services'
import { requireTenantContext } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

// Validação de valores permitidos
const ALLOWED_LANGUAGES = ['pt-BR', 'en-US', 'es-ES'] as const
const ALLOWED_NICHES = [
  'e-commerce', 'infoprodutos', 'saúde', 'beleza', 'fitness',
  'finanças', 'educação', 'tecnologia', 'serviços', 'imobiliário', 'dorama'
] as const
const ALLOWED_STYLES = [
  'direto e agressivo', 'emocional', 'educacional', 'minimalista',
  'premium', 'UGC', 'storytelling curto', 'comparativo', 'prova social'
] as const

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('creative.performance', correlationId)

  try {
    const body = await request.json() as PerformanceCreativeRequest

    // Log do body recebido para debug
    console.log('[Performance Creative API] Body recebido:', {
      hasOrganizationId: !!body.organizationId,
      hasSiteId: !!body.siteId,
      language: body.language,
      niche: body.niche,
      platform: body.platform,
      creative_type: body.creative_type,
      objective: body.objective,
      hasMainPrompt: !!body.mainPrompt,
      mainPromptLength: body.mainPrompt?.length || 0,
      generateImages: body.generateImages
    })

    // ✅ CORREÇÃO CRÍTICA: Validar contexto de tenant
    const { organizationId, siteId } = body
    let tenantContext
    try {
      tenantContext = requireTenantContext(organizationId, siteId)
    } catch (error) {
      logger.warn('Tenant validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId: organizationId || 'missing',
        siteId: siteId || 'missing'
      })
      return addCorrelationIdToResponse(
        NextResponse.json({
          status: 'failed',
          failureReason: 'organizationId e siteId são obrigatórios e devem ser CUIDs válidos',
          error: 'INVALID_TENANT_CONTEXT',
          details: {
            hasOrganizationId: !!organizationId,
            hasSiteId: !!siteId
          }
        }, { status: 400 }),
        correlationId
      )
    }

    // Validar campos obrigatórios
    const missingFields = []
    if (!body.language) missingFields.push('language')
    if (!body.niche) missingFields.push('niche')
    if (!body.platform) missingFields.push('platform')
    if (!body.creative_type) missingFields.push('creative_type')
    if (!body.objective) missingFields.push('objective')

    if (missingFields.length > 0) {
      return addCorrelationIdToResponse(
        NextResponse.json({
          status: 'failed',
          failureReason: `Campos obrigatórios faltando: ${missingFields.join(', ')}`,
          missingFields
        }, { status: 400 }),
        correlationId
      )
    }

    // ✅ CORREÇÃO: Validar valores de language, niche e style
    if (!ALLOWED_LANGUAGES.includes(body.language as any)) {
      return addCorrelationIdToResponse(
        NextResponse.json({
          status: 'failed',
          failureReason: `language deve ser um dos valores: ${ALLOWED_LANGUAGES.join(', ')}`,
          error: 'INVALID_LANGUAGE'
        }, { status: 400 }),
        correlationId
      )
    }

    if (!ALLOWED_NICHES.includes(body.niche as any)) {
      return addCorrelationIdToResponse(
        NextResponse.json({
          status: 'failed',
          failureReason: `niche deve ser um dos valores: ${ALLOWED_NICHES.join(', ')}`,
          error: 'INVALID_NICHE'
        }, { status: 400 }),
        correlationId
      )
    }

    if (body.style && !ALLOWED_STYLES.includes(body.style as any)) {
      return addCorrelationIdToResponse(
        NextResponse.json({
          status: 'failed',
          failureReason: `style deve ser um dos valores: ${ALLOWED_STYLES.join(', ')}`,
          error: 'INVALID_STYLE'
        }, { status: 400 }),
        correlationId
      )
    }

    const requestId = correlationId
    
    logger.info('Performance creative generation request', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      language: body.language,
      niche: body.niche,
      platform: body.platform
    })
    console.log('[Performance Creative API] Request', requestId, '- Input:', {
      language: body.language,
      niche: body.niche,
      platform: body.platform,
      objective: body.objective,
      creative_type: body.creative_type
    })

    // Configurar AIService com Gemini
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GOOGLE_API_KEY || ''
    if (!apiKey) {
      return NextResponse.json({
        status: 'failed',
        failureReason: 'Google Gemini API key não configurada (GOOGLE_AI_STUDIO_API_KEY ou GOOGLE_API_KEY)'
      }, { status: 500 })
    }

    const aiService = new AIService({
      id: 'performance-creative-generation',
      name: 'Performance Creative Generation Service',
      type: 'gemini',
      status: 'active',
      credentials: {
        apiKey: apiKey,
        endpoint: 'https://generativelanguage.googleapis.com/v1beta'
      },
      settings: {
        model: 'gemini-2.5-flash',
        maxTokens: 300,
        temperature: 0.8
      },
      usage: { requests: 0, tokens: 0, cost: 0 },
      lastUsed: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Gerar criativos
    console.log('[Performance Creative API] Request', requestId, '- Iniciando geração...')
    const engine = new PerformanceCreativeEngine()
    
    try {
      const result = await engine.generateCreatives(body, aiService)

      console.log('[Performance Creative API] Request', requestId, '- Success:', {
        variations: result.creative_versions.length,
        language: result.language,
        niche: result.niche
      })

      // ✅ CORREÇÃO CRÍTICA: SEMPRE gerar imagens quando creative_type for 'imagem' OU 'variações A/B'
      // Se for 'variações A/B', SEMPRE gerar imagens (não precisa de mainPrompt)
      // O usuário quer IMAGENS, não apenas prompts de texto!
      const shouldGenerateImages = body.creative_type === 'imagem' || 
                                   body.creative_type === 'variações A/B' ||
                                   body.generateImages === true
      
      console.log('[Performance Creative API] 🔍 Verificando geração de imagens:', {
        creative_type: body.creative_type,
        hasMainPrompt: !!body.mainPrompt,
        generateImages: body.generateImages,
        shouldGenerateImages,
        variationsCount: result.creative_versions.length
      })
      
      if (shouldGenerateImages) {
        logger.info('Generating images automatically for performance creatives', {
          variations: result.creative_versions.length,
          creative_type: body.creative_type,
          hasMainPrompt: !!body.mainPrompt
        })
        
        console.log('[Performance Creative API] ✅ INICIANDO GERAÇÃO DE IMAGENS para', result.creative_versions.length, 'variações')

        const { CreativeGenerator } = await import('@/lib/creative-generator')
        const imageResults = await Promise.allSettled(
          result.creative_versions.map(async (version) => {
            if (!version.image_prompt) {
              return { version_number: version.version_number, error: 'No image prompt', success: false }
            }

            try {
              // Criar brief para geração de imagem
              const brief = {
                mainPrompt: version.image_prompt,
                imageRatio: body.imageRatio || '1:1',
                variations: 1,
                qualityTier: (body.imageModel === 'pro' ? 'production' : 'draft') as 'draft' | 'production',
                includeTextInImage: body.includeTextInImage || false,
                platform: body.platform === 'meta-ads' ? 'instagram' : 'facebook'
              }

              // Gerar imagem usando CreativeGenerator
              // ✅ CORREÇÃO: Usar GeminiImageService diretamente para evitar gerar copy desnecessária
              const { GeminiImageServiceV2 } = await import('@/lib/gemini-image-service-v2')
              const { selectImageModel } = await import('@/lib/image-model-selector')
              
              const geminiApiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GOOGLE_API_KEY || ''
              if (!geminiApiKey) {
                throw new Error('Google AI Studio API key não configurada')
              }

              const selectedModel = selectImageModel({
                imageModel: body.imageModel === 'pro' ? 'pro' : 'nano',
                qualityTier: body.imageModel === 'pro' ? 'production' : 'draft'
              })

              const geminiService = new GeminiImageServiceV2({ 
                apiKey: geminiApiKey,
                primaryModel: selectedModel
              })

              logger.info(`Generating image for variation ${version.version_number}`, {
                prompt: version.image_prompt?.substring(0, 100) + '...' || 'No prompt',
                model: selectedModel,
                aspectRatio: body.imageRatio || '1:1',
                qualityTier: body.imageModel === 'pro' ? 'production' : 'draft'
              })

              if (!version.image_prompt || !version.image_prompt.trim()) {
                logger.warn(`No image prompt for variation ${version.version_number}`)
                return {
                  version_number: version.version_number,
                  error: 'No image prompt available',
                  success: false
                }
              }

              const geminiResult = await geminiService.generateImage({
                prompt: version.image_prompt,
                aspectRatio: body.imageRatio || '1:1',
                qualityTier: body.imageModel === 'pro' ? 'production' : 'draft',
                enableRefinePass: body.imageModel === 'pro'
              })

              if (geminiResult.success && geminiResult.imageUrl) {
                logger.info(`Image generated successfully for variation ${version.version_number}`, {
                  imageUrl: geminiResult.imageUrl.substring(0, 50) + '...',
                  model: geminiResult.model
                })
                return {
                  version_number: version.version_number,
                  image_url: geminiResult.imageUrl,
                  image_prompt: version.image_prompt,
                  success: true
                }
              } else {
                logger.error(`Failed to generate image for variation ${version.version_number}`, {
                  error: geminiResult.error || 'Unknown error',
                  success: geminiResult.success,
                  hasImageUrl: !!geminiResult.imageUrl
                })
                return {
                  version_number: version.version_number,
                  error: geminiResult.error || 'Failed to generate image',
                  success: false
                }
              }
            } catch (error) {
              logger.error(`Error generating image for variation ${version.version_number}`, {
                error: error instanceof Error ? error.message : 'Unknown error'
              })
              return {
                version_number: version.version_number,
                error: error instanceof Error ? error.message : 'Unknown error',
                success: false
              }
            }
          })
        )

        // Adicionar URLs de imagens às versões
        let successfulImages = 0
        imageResults.forEach((imageResult, index) => {
          if (imageResult.status === 'fulfilled' && imageResult.value.success) {
            // Adicionar image_url à versão correspondente
            const version = result.creative_versions.find(v => v.version_number === imageResult.value.version_number)
            if (version) {
              (version as any).image_url = imageResult.value.image_url
              successfulImages++
              console.log(`[Performance Creative API] ✅ Imagem ${version.version_number} gerada:`, imageResult.value.image_url?.substring(0, 50))
            }
          } else {
            const error = imageResult.status === 'rejected' 
              ? imageResult.reason 
              : (imageResult.status === 'fulfilled' ? imageResult.value.error : 'Unknown error')
            console.error(`[Performance Creative API] ❌ Falha ao gerar imagem ${index + 1}:`, error)
          }
        })

        logger.info('Images generated for performance creatives', {
          successful: successfulImages,
          total: imageResults.length,
          failed: imageResults.length - successfulImages
        })
        
        console.log(`[Performance Creative API] 📊 Resumo: ${successfulImages}/${imageResults.length} imagens geradas com sucesso`)
      } else {
        console.log('[Performance Creative API] ⚠️ Geração de imagens NÃO acionada:', {
          creative_type: body.creative_type,
          hasMainPrompt: !!body.mainPrompt,
          generateImages: body.generateImages
        })
      }

      return addCorrelationIdToResponse(
        NextResponse.json({
          status: 'success',
          ...result
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        correlationId
      )
    } catch (engineError) {
      console.error('[Performance Creative API] Erro no engine:', engineError)
      throw engineError
    }

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

    logger.error('Error generating performance creative', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    })
    
    return addCorrelationIdToResponse(
      NextResponse.json({
        status: 'failed',
        failureReason: 'Erro interno ao gerar criativo de performance',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        errorDetails: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : String(error))
          : undefined
      }, { status: 500 }),
      correlationId
    )
  }
}

export async function GET(request: NextRequest) {
  // Endpoint de documentação
  return NextResponse.json({
    name: 'Performance Creative Generation API',
    version: '1.0.0',
    description: 'Gera criativos de alta performance para tráfego direto',
    endpoint: '/api/creative/performance',
    method: 'POST',
    required_fields: [
      'language',
      'niche',
      'platform',
      'creative_type',
      'objective'
    ],
    optional_fields: [
      'product_name',
      'offer',
      'target_audience',
      'tone',
      'style',
      'pain_point',
      'desired_action',
      'quantity_of_variations',
      'mainPrompt',
      'imageRatio'
    ],
    example_request: {
      language: 'pt-BR',
      niche: 'e-commerce',
      platform: 'meta-ads',
      creative_type: 'variações A/B',
      objective: 'conversão',
      product_name: 'Curso de Marketing Digital',
      offer: '50% de desconto',
      target_audience: 'Empreendedores iniciantes',
      quantity_of_variations: 3
    },
    supported_values: {
      language: ['pt-BR', 'en-US', 'es-ES'],
      niche: [
        'e-commerce',
        'infoprodutos',
        'saúde',
        'beleza',
        'fitness',
        'finanças',
        'educação',
        'tecnologia',
        'serviços',
        'imobiliário',
        'dorama'
      ],
      platform: ['meta-ads', 'google-ads', 'tiktok-ads', 'youtube-ads', 'display'],
      creative_type: ['imagem', 'vídeo', 'copy', 'headline', 'variações A/B'],
      objective: ['conversão', 'CTR', 'retenção visual', 'clareza da oferta'],
      style: [
        'direto e agressivo',
        'emocional',
        'educacional',
        'minimalista',
        'premium',
        'UGC',
        'storytelling curto',
        'comparativo',
        'prova social'
      ]
    }
  })
}

