import { NextRequest, NextResponse } from 'next/server'
import { requireTenantContext } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('ai.test', correlationId)

  try {
    const body = await request.json()
    const { prompt, model = 'openai', type, organizationId, siteId } = body

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
    
    logger.info('AI test request', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      model,
      type,
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

    const startTime = Date.now()

    // Verificar se as chaves estão disponíveis
    const openaiKey = process.env.OPENAI_API_KEY
    const geminiKey = process.env.GOOGLE_API_KEY
    // const koalaKey = process.env.KOALA_API_KEY // Not used yet

    let response
    let isRealAPI = false

    switch (model) {
      case 'openai':
        if (openaiKey && openaiKey.startsWith('sk-')) {
          // Usar API real do OpenAI
          try {
            console.log('🔑 Usando chave real do OpenAI:', openaiKey.substring(0, 10) + '...')
            
            // Se for um diagnóstico WordPress, usar prompt especializado
            let openaiPrompt = prompt
            if (type === 'wordpress_diagnostic') {
              openaiPrompt = `Analise o site WordPress: ${prompt}

              Forneça um relatório JSON estruturado com as seguintes seções:
              {
                "seo": {
                  "meta_tags": true,
                  "titles": true,
                  "headings": true,
                  "performance": 2500,
                  "indexacao": true,
                  "score": 85
                },
                "compliance": {
                  "termos": true,
                  "politica_privacidade": true,
                  "contato": true,
                  "sobre": true,
                  "score": 90
                },
                "seguranca": {
                  "ssl": true,
                  "headers": true,
                  "plugins_vulneraveis": [],
                  "score": 95
                },
                "links_quebrados": [],
                "anuncios_sensiveis": {
                  "termos_com_anuncios": false,
                  "politica_com_anuncios": false,
                  "contato_com_anuncios": false,
                  "score": 100
                },
                "usabilidade": {
                  "acessibilidade": true,
                  "design_responsivo": true,
                  "ux_score": 88
                }
              }

              IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`
            }

            const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: openaiPrompt }],
                max_tokens: type === 'wordpress_diagnostic' ? 2000 : 100,
                temperature: 0.7
              })
            })

            console.log('📡 Resposta OpenAI:', openaiResponse.status)

            if (openaiResponse.ok) {
              const data = await openaiResponse.json()
              const responseText = data.choices[0].message.content
              console.log('✅ OpenAI funcionando:', responseText.substring(0, 50) + '...')
              
              // Se for diagnóstico WordPress, tentar extrair JSON da resposta
              if (type === 'wordpress_diagnostic') {
                try {
                  // Tentar extrair JSON da resposta
                  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
                  if (jsonMatch) {
                    const jsonContent = JSON.parse(jsonMatch[0])
                    response = {
                      content: jsonContent,
                      model: 'gpt-4o-mini',
                      finishReason: data.choices[0].finish_reason
                    }
                  } else {
                    // Se não conseguir extrair JSON, usar resposta completa
                    response = {
                      content: responseText,
                      model: 'gpt-4o-mini',
                      finishReason: data.choices[0].finish_reason
                    }
                  }
                } catch (jsonError) {
                  console.log('⚠️ Erro ao extrair JSON, retornando resposta completa')
                  response = {
                    content: responseText,
                    model: 'gpt-4o-mini',
                    finishReason: data.choices[0].finish_reason
                  }
                }
              } else {
                response = {
                  content: responseText,
                  model: 'gpt-4o-mini',
                  finishReason: data.choices[0].finish_reason
                }
              }
              isRealAPI = true
            } else {
              const errorData = await openaiResponse.text()
              console.error('❌ Erro OpenAI:', openaiResponse.status, errorData)
              throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorData}`)
            }
          } catch (error) {
            console.error('💥 Erro na API OpenAI:', error)
            throw error // Não usar fallback, deixar o erro aparecer
          }
        } else {
          console.log('⚠️ Chave OpenAI não encontrada ou inválida')
          throw new Error('Chave OpenAI não configurada ou inválida')
        }
        break

      case 'gemini':
        if (geminiKey && geminiKey.startsWith('AIza')) {
          // Usar API real do Gemini
          try {
            console.log('🔑 Usando chave real do Gemini:', geminiKey.substring(0, 10) + '...')
            
            // Se for um diagnóstico WordPress, usar GPT em vez de Gemini
            if (type === 'wordpress_diagnostic') {
              // Redirecionar para OpenAI para diagnósticos
              throw new Error('REDIRECT_TO_OPENAI')
            } else {
              // Para outros tipos, usar prompt normal
              const geminiPrompt = prompt

              const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: geminiPrompt
                    }]
                  }],
                  generationConfig: {
                    maxOutputTokens: 100,
                    temperature: 0.7
                  }
                })
              })

              console.log('📡 Resposta Gemini:', geminiResponse.status)

              if (geminiResponse.ok) {
                const data = await geminiResponse.json()
                const responseText = data.candidates[0].content.parts[0].text
                console.log('✅ Gemini funcionando:', responseText.substring(0, 50) + '...')
                
                response = {
                  content: responseText,
                  model: 'gemini-2.0-flash',
                  finishReason: data.candidates[0].finishReason
                }
                isRealAPI = true
              } else {
                const errorData = await geminiResponse.text()
                console.error('❌ Erro Gemini:', geminiResponse.status, errorData)
                throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorData}`)
              }
            }
          } catch (error) {
            console.error('💥 Erro na API Gemini:', error)
            throw error // Não usar fallback, deixar o erro aparecer
          }
        } else {
          console.log('⚠️ Chave Gemini não encontrada ou inválida')
          throw new Error('Chave Gemini não configurada ou inválida')
        }
        break

      case 'koala':
        // Koala.sh removido - não está funcionando
        throw new Error('Koala.sh foi removido do sistema')
        break

      default:
        return NextResponse.json({ 
          success: false, 
          error: `Modelo '${model}' não suportado` 
        }, { status: 400 })
    }

    const duration = Date.now() - startTime

    logger.info('AI test completed', { model, duration, isRealAPI })

    return addCorrelationIdToResponse(
      NextResponse.json({
        success: true,
        data: response,
        usage: {
          promptTokens: prompt.length,
          completionTokens: response.content.length,
          totalTokens: prompt.length + response.content.length,
          cost: isRealAPI ? 0.001 : 0.0001
        },
        duration,
        isRealAPI
      }),
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

    logger.error('Error in AI test', { 
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
