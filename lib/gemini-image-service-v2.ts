/**
 * Gemini Image Service V2 - Robusto com Timeouts, Retries, Quality Tier
 * 
 * Melhorias:
 * - Timeouts configuráveis
 * - Retries com backoff exponencial
 * - Quality tier (draft/production)
 * - Refine pass (production)
 * - Logs estruturados
 */

export interface GeminiImageRequestV2 {
  prompt: string
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9'
  safetyFilter?: 'block_some' | 'block_most' | 'block_few' | 'block_none'
  qualityTier?: 'draft' | 'production'
  enableRefinePass?: boolean
}

export interface GeminiImageResponseV2 {
  success: boolean
  imageUrl?: string
  prompt?: string
  error?: string
  base64Image?: string
  model?: string
  fallbackApplied?: boolean
  refineApplied?: boolean
  timing?: {
    prompt: number
    generate: number
    refine?: number
    total: number
  }
  estimatedCost?: number
}

export interface GeminiImageConfig {
  apiKey: string
  timeoutMs?: number
  maxRetries?: number
  backoffBaseMs?: number
  primaryModel?: string
  fallbackModel?: string
}

export class GeminiImageServiceV2 {
  private apiKey: string
  private endpoint: string = 'https://generativelanguage.googleapis.com/v1beta'
  private primaryModel: string
  private fallbackModel: string
  private timeoutMs: number
  private maxRetries: number
  private backoffBaseMs: number

  constructor(config: GeminiImageConfig) {
    this.apiKey = config.apiKey
    // Default: STABLE (não experimental)
    // Experimental só se ENABLE_GEMINI_EXPERIMENTAL=true
    const enableExperimental = process.env.ENABLE_GEMINI_EXPERIMENTAL === 'true'
    this.primaryModel = config.primaryModel || 
      (enableExperimental ? 'gemini-2.5-flash-image-exp' : 'gemini-2.5-flash-image')
    this.fallbackModel = config.fallbackModel || process.env.GEMINI_MODEL_FALLBACK || 'gemini-2.5-flash-image'
    this.timeoutMs = config.timeoutMs || parseInt(process.env.GEMINI_TIMEOUT_MS || '60000', 10)
    this.maxRetries = config.maxRetries || parseInt(process.env.GEMINI_MAX_RETRIES || '3', 10)
    this.backoffBaseMs = config.backoffBaseMs || parseInt(process.env.GEMINI_BACKOFF_BASE_MS || '1000', 10)
  }

  /**
   * Gera imagem com retries e timeouts
   */
  async generateImage(request: GeminiImageRequestV2): Promise<GeminiImageResponseV2> {
    const startTime = Date.now()
    const qualityTier = request.qualityTier || 'draft'
    
    console.log('[GeminiImageV2] Iniciando geração:', {
      qualityTier,
      aspectRatio: request.aspectRatio || '1:1',
      enableRefinePass: request.enableRefinePass || false
    })

    // Tentar com modelo primário primeiro
    let lastError: Error | undefined
    let fallbackApplied = false
    let model = this.primaryModel

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.generateImageWithModel(request, model, startTime)
        
        // Se sucesso, aplicar refine pass se necessário
        if (result.success && result.imageUrl && request.enableRefinePass && qualityTier === 'production') {
          const refineResult = await this.applyRefinePass(result, request, startTime)
          if (refineResult.success) {
            return refineResult
          }
          // Se refine falhar, retornar imagem base
          console.warn('[GeminiImageV2] Refine pass falhou, retornando imagem base')
        }
        
        return {
          ...result,
          model,
          fallbackApplied,
          timing: result.timing
        }
      } catch (error) {
        lastError = error as Error
        console.warn(`[GeminiImageV2] Tentativa ${attempt + 1}/${this.maxRetries + 1} falhou:`, error instanceof Error ? error.message : 'Erro desconhecido')
        
        // Se não for última tentativa, tentar fallback
        if (attempt === 0 && model === this.primaryModel) {
          console.log('[GeminiImageV2] Tentando modelo fallback...')
          model = this.fallbackModel
          fallbackApplied = true
          continue
        }
        
        // Se última tentativa, aguardar backoff antes de falhar
        if (attempt < this.maxRetries) {
          const delay = this.backoffBaseMs * Math.pow(2, attempt)
          console.log(`[GeminiImageV2] Aguardando ${delay}ms antes de retry...`)
          await this.sleep(delay)
        }
      }
    }

    // Todas as tentativas falharam
    const totalTime = Date.now() - startTime
    console.error('[GeminiImageV2] Todas as tentativas falharam:', lastError)
    
    return {
      success: false,
      prompt: request.prompt,
      error: lastError?.message || 'Erro desconhecido após todas as tentativas',
      model,
      fallbackApplied,
      timing: {
        prompt: 0,
        generate: 0,
        total: totalTime
      }
    }
  }

  /**
   * Gera imagem com modelo específico
   */
  private async generateImageWithModel(
    request: GeminiImageRequestV2,
    model: string,
    startTime: number
  ): Promise<GeminiImageResponseV2> {
    const promptStartTime = Date.now()
    const finalPrompt = request.prompt

    const url = `${this.endpoint}/models/${model}:generateContent?key=${this.apiKey}`

    // Estrutura da requisição
    // NOTA: imageGenerationConfig não é suportado pelo modelo gemini-2.5-flash-image
    // As configurações de imagem devem estar no prompt (aspectRatio, etc.)
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: finalPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4, // Mantido para textos legíveis
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    }

    const promptTime = Date.now() - promptStartTime
    const generateStartTime = Date.now()

    // Fetch com timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API retornou erro ${response.status}: ${response.statusText}. ${errorText.substring(0, 200)}`)
      }

      const data = await response.json()
      const generateTime = Date.now() - generateStartTime

      // Extrair imagem (mesma lógica do serviço original)
      const imageData = this.extractImageFromResponse(data)

      if (!imageData.imageUrl && !imageData.base64Image) {
        console.warn('[GeminiImageV2] Nenhuma imagem encontrada na resposta')
        return {
          success: false,
          prompt: finalPrompt,
          error: 'Nenhuma imagem encontrada na resposta da API',
          timing: {
            prompt: promptTime,
            generate: generateTime,
            total: Date.now() - startTime
          }
        }
      }

      const totalTime = Date.now() - startTime

      const qualityTier = request.qualityTier || 'draft'
      
      // Log estruturado
      console.log('[GeminiImageV2] Geração concluída:', {
        model,
        success: true,
        timing: {
          prompt: promptTime,
          generate: generateTime,
          total: totalTime
        },
        estimatedCost: this.estimateCost(qualityTier)
      })

      return {
        success: true,
        imageUrl: imageData.imageUrl || (imageData.base64Image ? `data:image/png;base64,${imageData.base64Image}` : undefined),
        base64Image: imageData.base64Image,
        prompt: finalPrompt,
        timing: {
          prompt: promptTime,
          generate: generateTime,
          total: totalTime
        },
        estimatedCost: this.estimateCost(qualityTier)
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timeout após ${this.timeoutMs}ms`)
      }
      
      throw error
    }
  }

  /**
   * Aplica refine pass (production)
   */
  private async applyRefinePass(
    baseResult: GeminiImageResponseV2,
    request: GeminiImageRequestV2,
    startTime: number
  ): Promise<GeminiImageResponseV2> {
    const refineStartTime = Date.now()
    
    // Refine pass: corrige artefatos mantendo composição
    const refinePrompt = `${request.prompt}

Refinamento:
- Corrigir artefatos (mãos, texturas, plástico)
- Manter composição original
- Sem texto, sem logos
- Se refine falhar, retornar imagem base`

    try {
      const refineResult = await this.generateImageWithModel(
        { ...request, prompt: refinePrompt },
        this.primaryModel,
        startTime
      )

      if (refineResult.success && refineResult.imageUrl) {
        const refineTime = Date.now() - refineStartTime
        const totalTime = Date.now() - startTime

        console.log('[GeminiImageV2] Refine pass aplicado:', {
          timing: {
            prompt: baseResult.timing?.prompt || 0,
            generate: baseResult.timing?.generate || 0,
            refine: refineTime,
            total: totalTime
          }
        })

        return {
          ...refineResult,
          refineApplied: true,
          timing: {
            prompt: baseResult.timing?.prompt || 0,
            generate: baseResult.timing?.generate || 0,
            refine: refineTime,
            total: totalTime
          }
        }
      }
    } catch (error) {
      console.warn('[GeminiImageV2] Refine pass falhou:', error)
    }

    // Fallback: retornar imagem base
    return {
      ...baseResult,
      refineApplied: false
    }
  }

  /**
   * Extrai imagem da resposta (mesma lógica do serviço original)
   */
  private extractImageFromResponse(data: any): { imageUrl?: string; base64Image?: string } {
    let imageUrl: string | undefined
    let base64Image: string | undefined

    // Formato 1: candidates
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0]
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            base64Image = part.inlineData.data
            const mimeType = part.inlineData.mimeType || 'image/png'
            imageUrl = `data:${mimeType};base64,${base64Image}`
            break
          }
          if (part.imageUrl) {
            imageUrl = typeof part.imageUrl === 'string' ? part.imageUrl : part.imageUrl.url
            break
          }
        }
      }
    }

    // Formato 2: resposta direta
    if (!imageUrl && !base64Image) {
      if (data.imageUrl) {
        imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl : data.imageUrl.url
      }
      if (data.inlineData) {
        base64Image = typeof data.inlineData === 'string' ? data.inlineData : data.inlineData.data
        const mimeType = data.inlineData.mimeType || 'image/png'
        imageUrl = `data:${mimeType};base64,${base64Image}`
      }
    }

    // Formato 3: generatedImages
    if (!imageUrl && !base64Image && data.generatedImages) {
      const generatedImage = Array.isArray(data.generatedImages) ? data.generatedImages[0] : data.generatedImages
      if (generatedImage) {
        imageUrl = generatedImage.url || generatedImage.imageUrl
        base64Image = generatedImage.base64 || generatedImage.data
        if (base64Image && !imageUrl) {
          imageUrl = `data:image/png;base64,${base64Image}`
        }
      }
    }

    // Formato 4: busca recursiva
    if (!imageUrl && !base64Image) {
      const searchForImage = (obj: any, depth = 0): string | undefined => {
        if (depth > 5) return undefined
        if (!obj || typeof obj !== 'object') return undefined
        
        for (const key in obj) {
          if (key.toLowerCase().includes('image') || key.toLowerCase().includes('data')) {
            const value = obj[key]
            if (typeof value === 'string') {
              if (value.startsWith('data:image') || value.startsWith('http')) {
                return value
              }
              if (value.length > 1000) {
                return `data:image/png;base64,${value}`
              }
            }
          }
          if (typeof obj[key] === 'object') {
            const found = searchForImage(obj[key], depth + 1)
            if (found) return found
          }
        }
        return undefined
      }
      
      const foundImage = searchForImage(data)
      if (foundImage) {
        imageUrl = foundImage
      }
    }

    return { imageUrl, base64Image }
  }

  /**
   * Estima custo (aproximado)
   */
  private estimateCost(qualityTier: 'draft' | 'production'): number {
    // Estimativa baseada em tier
    // Draft: ~$0.01 por imagem
    // Production: ~$0.02 por imagem (com refine pode ser mais)
    return qualityTier === 'production' ? 0.02 : 0.01
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

