/**
 * Serviço para geração de imagens usando Google Gemini 2.5 Flash Image (Nano Banana)
 * Focado em criativos comerciais agressivos e de alta conversão
 * 
 * Documentação oficial: https://ai.google.dev/gemini-api/docs
 * Modelo: gemini-2.5-flash-image-exp (experimental) ou gemini-2.5-flash-image
 */

export interface GeminiImageRequest {
  prompt: string
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9'
  safetyFilter?: 'block_some' | 'block_most' | 'block_few' | 'block_none'
}

export interface GeminiImageResponse {
  success: boolean
  imageUrl?: string
  prompt?: string
  error?: string
  base64Image?: string // Imagem em base64 se retornada pela API
}

export class GeminiImageService {
  private apiKey: string
  private endpoint: string = 'https://generativelanguage.googleapis.com/v1beta'
  private model: string = 'gemini-2.5-flash-image-exp' // Modelo experimental com geração de imagens

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Gera imagem usando Gemini 2.5 Flash Image (Nano Banana)
   * Focado em criativos comerciais agressivos
   * 
   * Formato da API conforme documentação oficial:
   * POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
   */
  async generateImage(request: GeminiImageRequest): Promise<GeminiImageResponse> {
    try {
      // Mapear aspect ratio para dimensões (conforme documentação)
      const aspectRatioMap: Record<string, { width: number; height: number }> = {
        '1:1': { width: 1024, height: 1024 },
        '4:5': { width: 1024, height: 1280 },
        '9:16': { width: 1024, height: 1792 },
        '16:9': { width: 1792, height: 1024 }
      }

       aspectRatioMap[request.aspectRatio || '1:1'] || aspectRatioMap['1:1']

      // Usar o prompt original diretamente - ele já vem completo do creative-generator
      // O creative-generator já adiciona todas as instruções necessárias
      const finalPrompt = request.prompt
      
      console.log('[GeminiImage] Prompt completo:', finalPrompt)

      // Endpoint correto conforme documentação oficial do Gemini API
      // Formato: /v1beta/models/{model}:generateContent
      const url = `${this.endpoint}/models/${this.model}:generateContent?key=${this.apiKey}`

      // Estrutura da requisição conforme documentação oficial
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
          temperature: 0.4, // Reduzido para gerar textos mais precisos e legíveis
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192
        },
        // Configuração específica para geração de imagens
        imageGenerationConfig: {
          numberOfImages: 1,
          aspectRatio: request.aspectRatio || '1:1',
          safetyFilterLevel: request.safetyFilter || 'block_some',
          personGeneration: 'allow_all' // Permitir geração de pessoas
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

      console.log('[GeminiImage] Chamando API Gemini:', url)
      console.log('[GeminiImage] Modelo:', this.model)
      console.log('[GeminiImage] Prompt completo:', finalPrompt)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[GeminiImage] Erro na API:', response.status, response.statusText)
        console.error('[GeminiImage] Detalhes:', errorText)
        
        // Tentar modelo alternativo se o experimental falhar
        if (this.model.includes('exp')) {
          console.log('[GeminiImage] Tentando modelo não-experimental...')
          const originalModel = this.model
          this.model = 'gemini-2.5-flash-image'
          try {
            const retryResult = await this.generateImage(request)
            if (retryResult.success && retryResult.imageUrl) {
              return retryResult
            }
          } catch (retryError) {
            console.warn('[GeminiImage] Modelo alternativo também falhou:', retryError)
          }
          // Restaurar modelo original para próxima tentativa
          this.model = originalModel
        }

        // Se ambos falharem, retornar prompt otimizado
        console.warn('[GeminiImage] Modelos não disponíveis, retornando prompt otimizado')
        return {
          success: false,
          prompt: finalPrompt,
          imageUrl: undefined,
          error: `API retornou erro ${response.status}: ${response.statusText}. ${errorText.substring(0, 200)}`
        }
      }

      const data = await response.json()
      console.log('[GeminiImage] Resposta completa da API:', JSON.stringify(data, null, 2))

      // Extrair imagem da resposta conforme formato da API Gemini
      // A API pode retornar em diferentes formatos:
      // 1. Base64 inline data em parts[].inlineData
      // 2. URL da imagem em parts[].imageUrl
      // 3. Imagem direta no campo imageUrl
      // 4. Imagem em candidates[].content.parts[].inlineData
      
      let imageUrl: string | undefined
      let base64Image: string | undefined

      // Formato 1: Verificar candidates (formato padrão da API Gemini)
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0]
        console.log('[GeminiImage] Candidate encontrado:', JSON.stringify(candidate, null, 2).substring(0, 500))
        
        // Verificar se há conteúdo de imagem
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            console.log('[GeminiImage] Verificando part:', Object.keys(part))
            
            // Verificar se há texto em vez de imagem (indica que a API não gerou imagem)
            if (part.text) {
              console.warn('[GeminiImage] API retornou texto em vez de imagem:', part.text.substring(0, 200))
              // Se o texto contém informações sobre erro ou limitação, registrar
              if (part.text.toLowerCase().includes('não posso') || 
                  part.text.toLowerCase().includes('não consigo') ||
                  part.text.toLowerCase().includes('não posso gerar')) {
                console.error('[GeminiImage] API indicou que não pode gerar imagem:', part.text)
              }
            }
            
            // Formato 1.1: inlineData (base64)
            if (part.inlineData) {
              base64Image = part.inlineData.data
              const mimeType = part.inlineData.mimeType || 'image/png'
              imageUrl = `data:${mimeType};base64,${base64Image}`
              console.log('[GeminiImage] Imagem encontrada em inlineData, tamanho:', base64Image?.length)
              break
            }
            
            // Formato 1.2: imageUrl
            if (part.imageUrl) {
              imageUrl = typeof part.imageUrl === 'string' ? part.imageUrl : part.imageUrl.url
              console.log('[GeminiImage] Imagem encontrada em imageUrl:', imageUrl)
              break
            }
          }
        }
        
        // Verificar se há finishReason que indique problema
        if (candidate.finishReason) {
          console.log('[GeminiImage] Finish reason:', candidate.finishReason)
          if (candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
            console.warn('[GeminiImage] Finish reason indica problema:', candidate.finishReason)
          }
        }
      }

      // Formato 2: Verificar resposta direta (formato alternativo)
      if (!imageUrl && !base64Image) {
        if (data.imageUrl) {
          imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl : data.imageUrl.url
          console.log('[GeminiImage] Imagem encontrada em data.imageUrl:', imageUrl)
        }
        
        if (data.inlineData) {
          base64Image = typeof data.inlineData === 'string' ? data.inlineData : data.inlineData.data
          const mimeType = data.inlineData.mimeType || 'image/png'
          imageUrl = `data:${mimeType};base64,${base64Image}`
          console.log('[GeminiImage] Imagem encontrada em data.inlineData')
        }
      }

      // Formato 3: Verificar se há imagens geradas em campo específico
      if (!imageUrl && !base64Image && data.generatedImages) {
        const generatedImage = Array.isArray(data.generatedImages) ? data.generatedImages[0] : data.generatedImages
        if (generatedImage) {
          imageUrl = generatedImage.url || generatedImage.imageUrl
          base64Image = generatedImage.base64 || generatedImage.data
          if (base64Image && !imageUrl) {
            imageUrl = `data:image/png;base64,${base64Image}`
          }
          console.log('[GeminiImage] Imagem encontrada em generatedImages')
        }
      }

      // Se ainda não encontrou, verificar toda a estrutura
      if (!imageUrl && !base64Image) {
        console.warn('[GeminiImage] Nenhuma imagem encontrada na resposta')
        console.warn('[GeminiImage] Estrutura completa da resposta:', Object.keys(data))
        
        // Tentar encontrar qualquer campo que possa conter imagem
        const searchForImage = (obj: any, depth = 0): string | undefined => {
          if (depth > 5) return undefined // Limitar profundidade
          if (!obj || typeof obj !== 'object') return undefined
          
          for (const key in obj) {
            if (key.toLowerCase().includes('image') || key.toLowerCase().includes('data')) {
              const value = obj[key]
              if (typeof value === 'string') {
                if (value.startsWith('data:image') || value.startsWith('http')) {
                  return value
                }
                if (value.length > 1000) { // Possível base64
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
          console.log('[GeminiImage] Imagem encontrada via busca recursiva')
        }
      }

      if (!imageUrl && !base64Image) {
        console.warn('[GeminiImage] Nenhuma imagem encontrada após todas as tentativas')
        console.warn('[GeminiImage] Resposta completa:', JSON.stringify(data, null, 2))
        return {
          success: true,
          prompt: finalPrompt,
          imageUrl: undefined
        }
      }

      return {
        success: true,
        imageUrl: imageUrl || (base64Image ? `data:image/png;base64,${base64Image}` : undefined),
        base64Image,
        prompt: finalPrompt
      }

    } catch (error) {
      console.error('[GeminiImage] Erro:', error)
      // Em caso de erro, retornar pelo menos o prompt otimizado
      const errorPrompt = request.prompt.toLowerCase().includes('criar') || 
                          request.prompt.toLowerCase().includes('gerar') ||
                          request.prompt.toLowerCase().includes('imagem')
        ? request.prompt
        : this.buildCommercialPrompt(request.prompt)
      
      return {
        success: false,
        prompt: errorPrompt,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Constrói prompt comercial agressivo para Gemini
   * Focado em conversão, CTA forte, contraste e estilo publicitário
   * IMPORTANTE: Prompt simplificado e direto, similar ao que funciona no Gemini diretamente
   */
  private buildCommercialPrompt(basePrompt: string): string {
    // Se o prompt base já contém instruções de imagem, usar diretamente
    if (basePrompt.toLowerCase().includes('imagem') || 
        basePrompt.toLowerCase().includes('criar') ||
        basePrompt.toLowerCase().includes('gerar')) {
      // Prompt já parece ser para imagem, apenas otimizar
      return basePrompt
    }
    
    // Prompt simplificado e direto - similar ao que funciona no Gemini
    return `Crie uma imagem publicitária de alta conversão para anúncio digital promovendo: ${basePrompt}. Estilo comercial agressivo, alto contraste, cores vibrantes, design impactante, foco em conversão. IMPORTANTE: Todos os textos na imagem devem ser legíveis, profissionais, sem erros ortográficos, claramente visíveis e bem formatados.`
  }
}

