import { NextRequest, NextResponse } from 'next/server'
import { requireTenantContext } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('ai.simple-test', correlationId)

  try {
    const body = await request.json()
    const { prompt, model = 'openai', organizationId, siteId } = body

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
    
    logger.info('Simple AI test request', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      model,
      hasPrompt: !!prompt
    })

    // Verificar chaves
    const openaiKey = process.env.OPENAI_API_KEY
    const geminiKey = process.env.GOOGLE_API_KEY
    const koalaKey = process.env.KOALA_API_KEY

    console.log('🔑 Chaves carregadas:', {
      openai: openaiKey ? `${openaiKey.substring(0, 10)}...` : 'NÃO DEFINIDA',
      gemini: geminiKey ? `${geminiKey.substring(0, 10)}...` : 'NÃO DEFINIDA',
      koala: koalaKey ? `${koalaKey.substring(0, 10)}...` : 'NÃO DEFINIDA'
    })

    // Teste simples do OpenAI
    if (model === 'openai' && openaiKey && openaiKey.startsWith('sk-')) {
      try {
        console.log('🚀 Testando OpenAI...')
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 50,
            temperature: 0.7
          })
        })

        console.log('📡 Status OpenAI:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('✅ OpenAI sucesso!')
          
          logger.info('OpenAI test successful')
          
          return addCorrelationIdToResponse(
            NextResponse.json({
              success: true,
              data: {
                content: data.choices[0].message.content,
                model: 'gpt-4o-mini',
                finishReason: data.choices[0].finish_reason
              },
              isRealAPI: true,
              message: 'OpenAI funcionando com chave real!'
            }),
            correlationId
          )
        } else {
          const errorData = await response.text()
          logger.error('OpenAI API error', { status: response.status, error: errorData })
          
          return addCorrelationIdToResponse(
            NextResponse.json({
              success: false,
              error: `OpenAI API error: ${response.status}`,
              details: errorData
            }, { status: 500 }),
            correlationId
          )
        }
      } catch (error) {
        logger.error('Error calling OpenAI API', { 
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        return addCorrelationIdToResponse(
          NextResponse.json({
            success: false,
            error: 'Erro na API OpenAI',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
          }, { status: 500 }),
          correlationId
        )
      }
    }

    // ✅ CORREÇÃO: Retornar erro em vez de simulação (remover erro silencioso)
    logger.warn('API keys not configured - returning error instead of simulation')
    
    return addCorrelationIdToResponse(
      NextResponse.json({
        success: false,
        error: 'API keys não configuradas. Configure OPENAI_API_KEY ou GOOGLE_API_KEY.',
        errorCode: 'API_KEYS_NOT_CONFIGURED'
      }, { status: 500 }),
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

    logger.error('Error in simple AI test', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return addCorrelationIdToResponse(
      NextResponse.json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 }),
      correlationId
    )
  }
}








