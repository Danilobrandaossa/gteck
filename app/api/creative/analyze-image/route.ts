import { NextRequest, NextResponse } from 'next/server'
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
    // Permitir siteId opcional (para admins)
    const organizationId = formData.get('organizationId') as string | null
    const siteId = formData.get('siteId') as string | null
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
    const rawApiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || ''
    const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, '') // Remove aspas se houver
    
    if (!apiKey) {
      console.error('[Analyze Image] API key não encontrada')
      return addCorrelationIdToResponse(
        NextResponse.json({
          success: false,
          error: 'Google Gemini API key não configurada. Configure GOOGLE_AI_STUDIO_API_KEY, GOOGLE_API_KEY ou GEMINI_API_KEY no arquivo .env'
        }, { status: 500 }),
        correlationId
      )
    }
    
    // Validar formato da API key (deve começar com "AIza")
    if (!apiKey.startsWith('AIza')) {
      console.warn('[Analyze Image] API key com formato suspeito (não começa com "AIza")')
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
    // Tentar modelos em ordem de estabilidade: gemini-pro (v1) primeiro, depois v1beta
    const modelsToTry = [
      { model: 'gemini-pro', endpoint: 'https://generativelanguage.googleapis.com/v1', version: 'v1' },
      { model: 'gemini-1.5-flash', endpoint: 'https://generativelanguage.googleapis.com/v1beta', version: 'v1beta' },
      { model: 'gemini-1.5-pro', endpoint: 'https://generativelanguage.googleapis.com/v1beta', version: 'v1beta' },
      { model: 'gemini-2.5-flash', endpoint: 'https://generativelanguage.googleapis.com/v1beta', version: 'v1beta' },
    ]
    
    console.log('[Analyze Image] Chamando Gemini Vision API...', { role, imageSize: base64Image.length })
    
    let response: Response | null = null
    let lastError: any = null
    
    try {
      // Tentar cada modelo até encontrar um que funcione
      for (const { model: tryModel, endpoint } of modelsToTry) {
        console.log(`[Analyze Image] Tentando modelo ${tryModel}...`)
        const url = `${endpoint}/models/${tryModel}:generateContent?key=${apiKey}`
        
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
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
            console.log(`[Analyze Image] ✅ Sucesso com ${tryModel}`)
            break
          } else {
            const errorText = await response.text()
            console.warn(`[Analyze Image] Modelo ${tryModel} falhou: ${response.status} ${response.statusText}`, errorText.substring(0, 200))
            lastError = { status: response.status, statusText: response.statusText, error: errorText }
            // Continuar para o próximo modelo
            continue
          }
        } catch (fetchError) {
          console.warn(`[Analyze Image] Erro ao chamar ${tryModel}:`, fetchError instanceof Error ? fetchError.message : 'Erro desconhecido')
          lastError = fetchError
          continue
        }
      }
      
      // Se nenhum modelo funcionou
      if (!response || !response.ok) {
        const errorText = lastError?.error || await response?.text().catch(() => 'Erro desconhecido') || 'Erro desconhecido'
        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        
        console.error('[Analyze Image] Erro na API Gemini:', {
          status: lastError?.status || response?.status || 500,
          statusText: lastError?.statusText || response?.statusText || 'Internal Server Error',
          error: errorData,
          modelsTried: modelsToTry.map(m => m.model).join(', ')
        })
        
        // Mensagem mais amigável para 403
        let errorMessage = `Erro na análise: ${lastError?.status || response?.status || 500} ${lastError?.statusText || response?.statusText || 'Internal Server Error'}`
        if (lastError?.status === 403 || response?.status === 403) {
          errorMessage = 'Erro de autenticação (403). Verifique se a API key do Google Gemini está configurada corretamente e tem permissão para usar os modelos de visão.'
        }
        
        return addCorrelationIdToResponse(
          NextResponse.json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? {
              ...errorData,
              modelsTried: modelsToTry.map(m => m.model)
            } : undefined
          }, { status: 500 }),
          correlationId
        )
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

