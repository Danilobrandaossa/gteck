import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/ai-services'
import { requireTenantContext } from '@/lib/tenant-security'
import { StructuredLogger } from '@/lib/observability/logger'
import { getOrCreateCorrelationId, addCorrelationIdToResponse } from '@/lib/observability/correlation'

// Necessário para processar FormData e Buffer
export const runtime = 'nodejs'

/**
 * POST /api/creative/analyze-image
 * 
 * Analisa uma imagem usando GPT-4 Vision para extrair características visuais
 * 
 * Body (FormData):
 * - image: File (imagem para analisar)
 * - role: 'style' | 'produto' | 'inspiração' (tipo de referência)
 * 
 * Response (JSON):
 * {
 *   success: boolean
 *   characteristics?: {
 *     style?: string
 *     product?: string
 *     composition?: string
 *     colors?: string
 *     lighting?: string
 *     mood?: string
 *   }
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request.headers)
  const logger = new StructuredLogger('creative.analyze-image', correlationId)

  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const role = formData.get('role') as string || 'inspiração'
    
    // ✅ CORREÇÃO CRÍTICA: Validar contexto de tenant (FormData)
    const organizationId = formData.get('organizationId') as string | null
    const siteId = formData.get('siteId') as string | null
    
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
    
    logger.info('Image analysis request', {
      organizationId: tenantContext.organizationId,
      siteId: tenantContext.siteId,
      role,
      hasImage: !!imageFile
    })

    if (!imageFile) {
      return addCorrelationIdToResponse(
        NextResponse.json({
          success: false,
          error: 'Imagem não fornecida'
        }, { status: 400 }),
        correlationId
      )
    }

    // Validar tipo de arquivo
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo deve ser uma imagem'
      }, { status: 400 })
    }

    // Converter imagem para base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString('base64')
    const mimeType = imageFile.type

    // Configurar Gemini API
    const rawApiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GOOGLE_API_KEY || ''
    const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, '') // Remove aspas se houver
    
    if (!apiKey) {
      console.error('[Analyze Image] API key não encontrada')
      return NextResponse.json({
        success: false,
        error: 'Google Gemini API key não configurada (GOOGLE_AI_STUDIO_API_KEY ou GOOGLE_API_KEY)'
      }, { status: 500 })
    }
    
    console.log('[Analyze Image] Iniciando análise com Gemini Vision...')

    // Construir prompt baseado no role
    let analysisPrompt = ''
    switch (role) {
      case 'style':
        analysisPrompt = 'Analise esta imagem e extraia características de ESTILO VISUAL: paleta de cores, iluminação, textura, vibe geral, estética. Seja específico e detalhado.'
        break
      case 'produto':
        analysisPrompt = 'Analise esta imagem e descreva o PRODUTO/SERVIÇO principal: o que é, como aparece, características visuais, elementos em destaque. Seja específico.'
        break
      case 'inspiração':
        analysisPrompt = 'Analise esta imagem e extraia características de COMPOSIÇÃO E LAYOUT: como os elementos estão organizados, posicionamento, estrutura visual, elementos de design. Seja específico.'
        break
      default:
        analysisPrompt = 'Analise esta imagem e descreva suas características visuais principais: cores, composição, estilo, elementos principais.'
    }

    // Chamar Gemini Vision API
    // Usar gemini-2.5-flash conforme documentação oficial
    let model = 'gemini-2.5-flash' // Gemini 2.5 Flash com suporte a visão
    let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    
    console.log('[Analyze Image] Chamando Gemini Vision API...', { model, role, imageSize: base64Image.length })
    
    try {
      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: analysisPrompt
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7
          }
        })
      })

      // Se der 404, tentar fallbacks
      if (!response.ok && response.status === 404) {
        console.log('[Analyze Image] Modelo não encontrado, tentando fallbacks...')
        const fallbacks = [
          ['gemini-2.5-flash-lite', 'https://generativelanguage.googleapis.com/v1beta'],
          ['gemini-1.5-flash', 'https://generativelanguage.googleapis.com/v1beta'],
          ['gemini-1.5-pro', 'https://generativelanguage.googleapis.com/v1beta'],
        ]
        
        for (const [fallbackModel, fallbackEndpoint] of fallbacks) {
          console.log(`[Analyze Image] Tentando ${fallbackModel}...`)
          url = `${fallbackEndpoint}/models/${fallbackModel}:generateContent`
          
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: analysisPrompt
                    },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: base64Image
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                maxOutputTokens: 300,
                temperature: 0.7
              }
            })
          })
          
          if (response.ok) {
            console.log(`[Analyze Image] ✅ Sucesso com ${fallbackModel}`)
            model = fallbackModel
            break
          }
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        
        console.error('[Analyze Image] Erro na API Gemini:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        
        return NextResponse.json({
          success: false,
          error: `Erro na análise: ${response.status} ${response.statusText}`,
          details: process.env.NODE_ENV === 'development' ? errorData : undefined
        }, { status: 500 })
      }

      const data = await response.json()
      console.log('[Analyze Image] Resposta recebida:', { hasCandidates: !!data.candidates })
      
      const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      if (!analysis) {
        console.error('[Analyze Image] Resposta sem texto:', JSON.stringify(data, null, 2))
        return NextResponse.json({
          success: false,
          error: 'Resposta da API não contém análise de texto'
        }, { status: 500 })
      }

      // Extrair características estruturadas
      const characteristics = extractCharacteristics(analysis, role)

      console.log('[Analyze Image] Análise concluída com sucesso')
      
      return addCorrelationIdToResponse(
        NextResponse.json({
          success: true,
          characteristics,
          rawAnalysis: analysis
        }),
        correlationId
      )
    } catch (fetchError) {
      console.error('[Analyze Image] Erro ao chamar Gemini API:', fetchError)
      throw fetchError
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

    logger.error('Error analyzing image', { 
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

/**
 * Extrai características estruturadas do texto de análise
 */
function extractCharacteristics(analysis: string, role: string): {
  style?: string
  product?: string
  composition?: string
  colors?: string
  lighting?: string
  mood?: string
} {
  const lowerAnalysis = analysis.toLowerCase()
  const characteristics: any = {}

  // Extrair cores
  const colorMatches = analysis.match(/(?:cor|color|paleta|palette|tons?|hue)[\s:]+([^.,;]+)/gi)
  if (colorMatches) {
    characteristics.colors = colorMatches[0].replace(/^(?:cor|color|paleta|palette|tons?|hue)[\s:]+/i, '').trim()
  }

  // Extrair iluminação
  if (lowerAnalysis.includes('claro') || lowerAnalysis.includes('bright') || lowerAnalysis.includes('luminoso')) {
    characteristics.lighting = 'iluminação clara'
  } else if (lowerAnalysis.includes('escuro') || lowerAnalysis.includes('dark') || lowerAnalysis.includes('sombrio')) {
    characteristics.lighting = 'iluminação escura'
  }

  // Extrair mood/vibe
  if (lowerAnalysis.includes('minimalista') || lowerAnalysis.includes('minimal')) {
    characteristics.mood = 'estilo minimalista'
  } else if (lowerAnalysis.includes('moderno') || lowerAnalysis.includes('modern')) {
    characteristics.mood = 'estilo moderno'
  } else if (lowerAnalysis.includes('vintage') || lowerAnalysis.includes('retro')) {
    characteristics.mood = 'estilo vintage'
  }

  // Organizar por role
  if (role === 'style') {
    characteristics.style = [
      characteristics.colors,
      characteristics.lighting,
      characteristics.mood
    ].filter(Boolean).join(', ') || analysis.substring(0, 200)
  } else if (role === 'produto') {
    characteristics.product = analysis.substring(0, 200)
  } else if (role === 'inspiração') {
    characteristics.composition = analysis.substring(0, 200)
  }

  return characteristics
}

