/**
 * Fidelity Image Generator
 * 
 * Sistema de geração de imagens focado em:
 * - Alta fidelidade ao prompt do usuário
 * - Coerência visual e qualidade estética
 * - Enriquecimento técnico inteligente (sem alterar conceito)
 * - Fallback inteligente para prompts curtos
 */

export interface FidelityImageRequest {
  /** Prompt de Geração - descrição completa da imagem desejada */
  prompt: string
  
  /** Parâmetros do Sistema */
  quality?: 'low' | 'medium' | 'high' | 'auto'
  style?: 'natural' | 'vivid'
  model?: 'default' | 'dalle3'
  
  /** Parâmetros técnicos opcionais */
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9'
  includeTextInImage?: boolean
}

export interface FidelityImageResponse {
  success: boolean
  imageUrl?: string
  revisedPrompt?: string
  error?: string
  metadata?: {
    model: string
    quality: string
    style: string
    promptLength: number
    technicalEnhancements?: string[]
  }
}

/**
 * Analisa o prompt do usuário para determinar se precisa de enriquecimento técnico
 */
function analyzePrompt(prompt: string): {
  needsEnhancement: boolean
  missingElements: string[]
  isShort: boolean
} {
  const trimmed = prompt.trim()
  const isShort = trimmed.length < 50
  const words = trimmed.split(/\s+/).length
  
  const missingElements: string[] = []
  
  // Verificar elementos técnicos comuns
  const technicalKeywords = {
    lighting: ['iluminação', 'luz', 'lighting', 'light', 'brilho', 'bright'],
    composition: ['composição', 'composition', 'enquadramento', 'framing', 'ângulo', 'angle'],
    style: ['estilo', 'style', 'estética', 'aesthetic', 'visual'],
    quality: ['qualidade', 'quality', 'resolução', 'resolution', 'detalhes', 'details'],
    camera: ['câmera', 'camera', 'lente', 'lens', 'fotografia', 'photography']
  }
  
  const promptLower = prompt.toLowerCase()
  
  // Verificar se menciona iluminação
  if (!technicalKeywords.lighting.some(kw => promptLower.includes(kw))) {
    missingElements.push('iluminação')
  }
  
  // Verificar se menciona composição/enquadramento
  if (!technicalKeywords.composition.some(kw => promptLower.includes(kw))) {
    missingElements.push('composição')
  }
  
  // Verificar se menciona estilo visual
  if (!technicalKeywords.style.some(kw => promptLower.includes(kw))) {
    missingElements.push('estilo visual')
  }
  
  const needsEnhancement = isShort || missingElements.length >= 2
  
  return {
    needsEnhancement,
    missingElements,
    isShort
  }
}

/**
 * Enriquece o prompt tecnicamente sem alterar o conceito original
 */
function enhancePromptTechnically(
  originalPrompt: string,
  analysis: ReturnType<typeof analyzePrompt>,
  config: {
    style: 'natural' | 'vivid'
    aspectRatio?: string
    includeTextInImage?: boolean
  }
): string {
  // Se o prompt já é detalhado e completo, usar como está
  if (!analysis.needsEnhancement) {
    return originalPrompt
  }
  
  const enhancements: string[] = []
  
  // Adicionar iluminação se não mencionada
  if (analysis.missingElements.includes('iluminação')) {
    if (config.style === 'natural') {
      enhancements.push('iluminação natural suave e equilibrada')
    } else {
      enhancements.push('iluminação dramática e contrastante')
    }
  }
  
  // Adicionar composição se não mencionada
  if (analysis.missingElements.includes('composição')) {
    enhancements.push('composição profissional e equilibrada')
  }
  
  // Adicionar estilo visual se não mencionado
  if (analysis.missingElements.includes('estilo visual')) {
    if (config.style === 'natural') {
      enhancements.push('estilo visual realista e natural')
    } else {
      enhancements.push('estilo visual vibrante e impactante')
    }
  }
  
  // Adicionar qualidade técnica
  enhancements.push('alta qualidade fotográfica, detalhes nítidos, cores precisas')
  
  // Adicionar proporção se especificada
  if (config.aspectRatio) {
    enhancements.push(`proporção ${config.aspectRatio}`)
  }
  
  // Adicionar instrução sobre texto se necessário
  if (!config.includeTextInImage) {
    enhancements.push('sem texto sobreposto, sem logos, sem marca d\'água')
  }
  
  // Construir prompt final: original + enhancements
  // O prompt original sempre vem primeiro (prioridade)
  const enhancedPrompt = `${originalPrompt}. ${enhancements.join(', ')}`
  
  return enhancedPrompt
}

/**
 * Gera imagem com alta fidelidade ao prompt do usuário
 */
export async function generateFidelityImage(
  request: FidelityImageRequest
): Promise<FidelityImageResponse> {
  try {
    // Validar prompt
    if (!request.prompt || request.prompt.trim().length === 0) {
      return {
        success: false,
        error: 'Prompt de Geração é obrigatório'
      }
    }
    
    const originalPrompt = request.prompt.trim()
    
    // Analisar prompt
    const analysis = analyzePrompt(originalPrompt)
    
    // Determinar qualidade (auto = high por padrão)
    const quality = request.quality === 'auto' ? 'high' : (request.quality || 'high')
    
    // Determinar estilo (natural por padrão)
    const style = request.style || 'natural'
    
    // Determinar modelo
    const useDalle3 = request.model === 'dalle3'
    
    // Enriquecer prompt tecnicamente (se necessário)
    const finalPrompt = enhancePromptTechnically(originalPrompt, analysis, {
      style,
      aspectRatio: request.aspectRatio,
      includeTextInImage: request.includeTextInImage
    })
    
    console.log('[FidelityImageGenerator] Prompt original:', originalPrompt.substring(0, 100))
    console.log('[FidelityImageGenerator] Análise:', analysis)
    console.log('[FidelityImageGenerator] Prompt final:', finalPrompt.substring(0, 150))
    
    // Gerar imagem usando o modelo selecionado
    if (useDalle3) {
      return await generateWithDalle3(finalPrompt, originalPrompt, {
        quality,
        style,
        aspectRatio: request.aspectRatio
      })
    } else {
      return await generateWithGemini(finalPrompt, originalPrompt, {
        quality,
        style,
        aspectRatio: request.aspectRatio
      })
    }
    
  } catch (error) {
    console.error('[FidelityImageGenerator] Erro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Gera imagem usando DALL-E 3
 */
async function generateWithDalle3(
  prompt: string,
  originalPrompt: string,
  config: {
    quality: string
    style: 'natural' | 'vivid'
    aspectRatio?: string
  }
): Promise<FidelityImageResponse> {
  const apiKey = process.env.OPENAI_API_KEY || ''
  
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      error: 'OpenAI API key não configurada'
    }
  }
  
  // Determinar tamanho baseado em aspectRatio
  let size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024'
  if (config.aspectRatio === '9:16') {
    size = '1024x1792'
  } else if (config.aspectRatio === '16:9') {
    size = '1792x1024'
  }
  
  // Determinar qualidade DALL-E
  const dalleQuality = config.quality === 'high' ? 'hd' : 'standard'
  const dalleStyle = config.style === 'vivid' ? 'vivid' : 'natural'
  
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: dalleQuality,
        style: dalleStyle
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DALL-E API error: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    const data = await response.json()
    const imageUrl = data.data[0]?.url
    const revisedPrompt = data.data[0]?.revised_prompt || prompt
    
    if (!imageUrl) {
      throw new Error('Nenhuma imagem retornada pela API DALL-E')
    }
    
    return {
      success: true,
      imageUrl,
      revisedPrompt,
      metadata: {
        model: 'dall-e-3',
        quality: config.quality,
        style: config.style,
        promptLength: originalPrompt.length,
        technicalEnhancements: prompt !== originalPrompt ? ['iluminação', 'composição', 'qualidade'] : undefined
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao gerar imagem com DALL-E 3'
    }
  }
}

/**
 * Gera imagem usando Gemini
 */
async function generateWithGemini(
  prompt: string,
  originalPrompt: string,
  config: {
    quality: string
    style: 'natural' | 'vivid'
    aspectRatio?: string
  }
): Promise<FidelityImageResponse> {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GOOGLE_API_KEY || ''
  
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      error: 'Google Gemini API key não configurada'
    }
  }
  
  // Selecionar modelo Gemini baseado em qualidade
  const model = config.quality === 'high' 
    ? 'gemini-2.5-flash-image' 
    : 'gemini-2.5-flash-image'
  
  try {
    const { GeminiImageServiceV2 } = await import('@/lib/gemini-image-service-v2')
    
    const geminiService = new GeminiImageServiceV2({
      apiKey,
      primaryModel: model
    })
    
    const result = await geminiService.generateImage({
      prompt: prompt,
      aspectRatio: config.aspectRatio || '1:1',
      qualityTier: config.quality === 'high' ? 'production' : 'draft',
      enableRefinePass: config.quality === 'high'
    })
    
    if (!result.success || !result.imageUrl) {
      return {
        success: false,
        error: result.error || 'Erro ao gerar imagem com Gemini'
      }
    }
    
    return {
      success: true,
      imageUrl: result.imageUrl,
      metadata: {
        model: result.model || 'gemini-2.5-flash-image',
        quality: config.quality,
        style: config.style,
        promptLength: originalPrompt.length,
        technicalEnhancements: prompt !== originalPrompt ? ['iluminação', 'composição', 'qualidade'] : undefined
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao gerar imagem com Gemini'
    }
  }
}

