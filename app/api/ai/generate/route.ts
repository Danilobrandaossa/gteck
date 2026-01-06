import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/ai-services'
import { requireTenantContext } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('ai.generate', correlationId)

  try {
    const body = await request.json()
    const { prompt, model = 'openai', maxTokens = 100, temperature = 0.7, organizationId, siteId } = body

    // ✅ CORREÇÃO CRÍTICA: Validar contexto de tenant
    let tenantContext
    try {
      tenantContext = requireTenantContext(organizationId, siteId)
    } catch (error) {
      logger.warn('Tenant validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return addCorrelationIdToResponse(
        NextResponse.json({ 
          success: false, 
          error: 'organizationId e siteId são obrigatórios e devem ser CUIDs válidos',
          errorCode: 'INVALID_TENANT_CONTEXT'
        }, { status: 400 }),
        correlationId
      )
    }
    
    logger.info('AI generation request', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      model,
      hasPrompt: !!prompt
    })

    if (!prompt) {
      return addCorrelationIdToResponse(
        NextResponse.json({ 
          success: false, 
          error: 'Prompt é obrigatório' 
        }, { status: 400 }),
        correlationId
      )
    }

    let response
    const startTime = Date.now()

    try {
      switch (model) {
        case 'openai':
          response = await AIService.generateWithOpenAI({
            prompt,
            maxTokens,
            temperature,
            type: 'text'
          })
          break

        case 'gemini':
          response = await AIService.generateWithGemini({
            prompt,
            maxTokens,
            temperature,
            type: 'text'
          })
          break

        default:
          return addCorrelationIdToResponse(
            NextResponse.json({ 
              success: false, 
              error: `Modelo '${model}' não suportado` 
            }, { status: 400 }),
            correlationId
          )
      }

      const duration = Date.now() - startTime

      logger.info('AI generation completed', { model, duration })

      return addCorrelationIdToResponse(
        NextResponse.json({
          success: true,
          data: {
            content: response.data?.content || 'Resposta vazia',
            model: model,
            duration,
            usage: response.usage
          },
          usage: response.usage
        }),
        correlationId
      )

    } catch (apiError) {
      logger.error(`Error in ${model} API`, { 
        error: apiError instanceof Error ? apiError.message : 'Unknown error',
        model
      })
      
      return addCorrelationIdToResponse(
        NextResponse.json({ 
          success: false, 
          error: `Erro na API ${model}: ${apiError instanceof Error ? apiError.message : 'Erro desconhecido'}` 
        }, { status: 500 }),
        correlationId
      )
    }

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

    logger.error('Error in AI generate', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return addCorrelationIdToResponse(
      NextResponse.json({
        success: false,
        error: 'Erro interno ao gerar conteúdo',
        errorDetails: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 }),
      correlationId
    )
  }
}
      
      return NextResponse.json({
        success: false,
        error: `Erro na API ${model}: ${apiError instanceof Error ? apiError.message : 'Erro desconhecido'}`,
        model,
        duration: Date.now() - startTime
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro no endpoint de teste de IA:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}