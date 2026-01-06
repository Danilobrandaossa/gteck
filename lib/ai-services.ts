import { APIConfig } from '@/contexts/api-config-context'

export interface AIGenerationRequest {
  prompt: string
  model?: string
  maxTokens?: number
  temperature?: number
  type: 'text' | 'image' | 'code' | 'seo' | 'ad'
}

export interface AIGenerationResponse {
  success: boolean
  data?: any
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    cost: number
  }
}

export class AIService {
  private config: APIConfig

  constructor(config?: APIConfig) {
    this.config = config || {
      id: 'default',
      name: 'Default AI Service',
      type: 'openai',
      status: 'active',
      credentials: {
        apiKey: process.env.OPENAI_API_KEY || '',
        endpoint: 'https://api.openai.com/v1'
      },
      settings: {},
      lastUsed: new Date(),
      usage: { requests: 0, tokens: 0, cost: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  // Getter para acessar settings
  get settings() {
    return this.config.settings || {}
  }

  async generateContent(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    try {
      // Se for geração de imagem, usar DALL-E (ou stable-diffusion se configurado)
      if (request.type === 'image') {
        if (this.config.type === 'stable-diffusion') {
          return await this.generateWithStableDiffusion(request)
        }
        // Padrão: usar DALL-E para imagens
        return await this.generateWithDALLE(request)
      }
      
      switch (this.config.type) {
        case 'openai':
          return await this.generateWithOpenAI(request)
        case 'claude':
          return await this.generateWithClaude(request)
        case 'gemini':
          return await this.generateWithGemini(request)
        case 'stable-diffusion':
          return await this.generateWithStableDiffusion(request)
        case 'dalle':
          return await this.generateWithDALLE(request)
        default:
          throw new Error(`Tipo de IA não suportado: ${this.config.type}`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // Métodos estáticos para teste individual
  static async generateWithOpenAI(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const service = new AIService({
      id: 'openai-test',
      name: 'OpenAI Test',
      type: 'openai',
      status: 'active',
      credentials: {
        apiKey: process.env.OPENAI_API_KEY || '',
        endpoint: 'https://api.openai.com/v1'
      },
      settings: {},
      lastUsed: new Date(),
      usage: { requests: 0, tokens: 0, cost: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    })
    return await service.generateWithOpenAI(request)
  }

  static async generateWithGemini(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const service = new AIService({
      id: 'gemini-test',
      name: 'Gemini Test',
      type: 'gemini',
      status: 'active',
      credentials: {
        apiKey: process.env.GOOGLE_API_KEY || '',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta'
      },
      settings: {},
      lastUsed: new Date(),
      usage: { requests: 0, tokens: 0, cost: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    })
    return await service.generateWithGemini(request)
  }

  // Removido: generateWithKoala não é mais suportado (tipo 'koala' não existe em APIConfig)

  private async generateWithOpenAI(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const { prompt, model = 'gpt-3.5-turbo', maxTokens = 4000, temperature = 0.7 } = request

    try {
      // Verificar se temos API key real
      const rawApiKey = this.config.credentials.apiKey || process.env.OPENAI_API_KEY
      const apiKey = rawApiKey?.trim().replace(/^['"]|['"]$/g, '')

      if (!apiKey || apiKey.startsWith('sk-mock')) {
        // Simular resposta para desenvolvimento
        return this.generateMockResponse(request, 'openai')
      }

      // NÃO adicionar header OpenAI-Organization por padrão (pode causar 403)
      // Só adicionar se explicitamente configurado e necessário
      const rawOrganization = process.env.OPENAI_ORGANIZATION?.trim()
      const organization = rawOrganization?.replace(/^['"]|['"]$/g, '')

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }

      // Remover header OpenAI-Organization para evitar 403
      // if (organization && !organization.toLowerCase().includes('mock')) {
      //   headers['OpenAI-Organization'] = organization
      // }

      const endpoint = `${this.config.credentials.endpoint}/chat/completions`

      const doRequest = async (customHeaders: Record<string, string>) =>
        fetch(endpoint, {
          method: 'POST',
          headers: customHeaders,
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: maxTokens,
            temperature,
            stream: false
          })
        })

      let response = await doRequest(headers)

      if (!response.ok && response.status === 401 && headers['OpenAI-Organization']) {
        console.warn('OpenAI retornou 401 com organização; tentando novamente sem header OpenAI-Organization.')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ['OpenAI-Organization']: _ignored, ...headersWithoutOrg } = headers
        response = await doRequest(headersWithoutOrg)
      }

      if (!response.ok) {
        let errorData: any = {}
        try {
          const text = await response.text()
          errorData = text ? JSON.parse(text) : {}
        } catch {
          errorData = {}
        }

        if (
          response.status === 401 &&
          typeof errorData?.error?.message === 'string' &&
          errorData.error.message.toLowerCase().includes('openai-organization header should match organization')
        ) {
          console.warn('OpenAI retornou 401 por cabeçalho de organização; retornando resposta mock.')
          return this.generateMockResponse(request, 'openai')
        }

        // Melhor mensagem de erro para 403
        const errorMessage = errorData?.error?.message || errorData?.error?.code || errorData?.message || 'Erro desconhecido'
        const errorCode = errorData?.error?.code || errorData?.code || ''
        const errorType = errorData?.error?.type || ''
        
        console.error(`[AIService] OpenAI API error ${response.status}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData?.error || errorData,
          model: model,
          fullError: JSON.stringify(errorData, null, 2)
        })

        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorMessage}${errorCode ? ` (${errorCode})` : ''}${errorType ? ` [${errorType}]` : ''}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data: {
          content: data.choices[0].message.content,
          model: data.model,
          finishReason: data.choices[0].finish_reason
        },
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
          cost: this.calculateCost(data.usage.total_tokens, model)
        }
      }
    } catch (error) {
      console.error('Erro na API OpenAI:', error)
      throw new Error(`Erro na API OpenAI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  private async generateWithClaude(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const { prompt, model = 'claude-3-sonnet-20240229', maxTokens = 4000 } = request

    try {
      const response = await fetch(`${this.config.credentials.endpoint}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.config.credentials.apiKey!,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data: {
          content: data.content[0].text,
          model: data.model,
          stopReason: data.stop_reason
        },
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          cost: this.calculateCost(data.usage.input_tokens + data.usage.output_tokens, model)
        }
      }
    } catch (error) {
      throw new Error(`Erro na API Claude: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  private async generateWithGemini(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const { prompt, model = 'gemini-2.5-flash', maxTokens = 8000 } = request

    try {
      // Usar v1beta para modelos mais recentes (gemini-2.5-flash é o modelo padrão atual)
      let endpoint = this.config.credentials.endpoint || 'https://generativelanguage.googleapis.com/v1beta'
      
      // Se o endpoint não especificar versão, usar v1beta
      if (!endpoint.includes('/v1') && !endpoint.includes('/v1beta')) {
        endpoint = 'https://generativelanguage.googleapis.com/v1beta'
      }
      
      // Formato correto conforme documentação: usar header x-goog-api-key
      let response = await fetch(`${endpoint}/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.config.credentials.apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7
          }
        })
      })

      // Se der 404, tentar múltiplos fallbacks
      if (!response.ok && response.status === 404) {
        console.log(`[AIService] Modelo ${model} não encontrado em ${endpoint}, tentando fallbacks...`)
        
        // Lista de fallbacks: [endpoint, model]
        const fallbacks = [
          ['https://generativelanguage.googleapis.com/v1beta', 'gemini-2.5-flash-lite'],
          ['https://generativelanguage.googleapis.com/v1beta', 'gemini-1.5-flash'],
          ['https://generativelanguage.googleapis.com/v1beta', 'gemini-1.5-pro'],
        ]
        
        let lastError: Error | null = null
        
        for (const [fallbackEndpoint, fallbackModel] of fallbacks) {
          try {
            console.log(`[AIService] Tentando ${fallbackModel} em ${fallbackEndpoint}...`)
            response = await fetch(`${fallbackEndpoint}/models/${fallbackModel}:generateContent`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': this.config.credentials.apiKey
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: prompt
                      }
                    ]
                  }
                ],
                generationConfig: {
                  maxOutputTokens: maxTokens,
                  temperature: 0.7
                }
              })
            })
            
            if (response.ok) {
              console.log(`[AIService] ✅ Sucesso com ${fallbackModel} em ${fallbackEndpoint}`)
              break
            }
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err))
            continue
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData?.error?.message || response.statusText
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorMsg}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data: {
          content: data.candidates[0].content.parts[0].text,
          model: model,
          finishReason: data.candidates[0].finishReason
        },
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0,
          cost: this.calculateCost(data.usageMetadata?.totalTokenCount || 0, model)
        }
      }
    } catch (error) {
      throw new Error(`Erro na API Gemini: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  private async generateWithStableDiffusion(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const { prompt } = request

    try {
      const response = await fetch(`${this.config.credentials.endpoint}/generation/stable-diffusion-xl-1024-v1-0/text-to-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30
        })
      })

      if (!response.ok) {
        throw new Error(`Stable Diffusion API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data: {
          images: data.artifacts.map((artifact: any) => ({
            base64: artifact.base64,
            seed: artifact.seed,
            finishReason: artifact.finishReason
          })),
          model: 'stable-diffusion-xl-1024-v1-0'
        },
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0.04 // Custo fixo por imagem
        }
      }
    } catch (error) {
      throw new Error(`Erro na API Stable Diffusion: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  private async generateWithDALLE(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const { prompt } = request

    try {
      // DALL-E 3 suporta apenas tamanhos: 1024x1024, 1792x1024, 1024x1792
      // Determinar tamanho baseado no prompt (se mencionar vertical/horizontal)
      let size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024'
      const promptLower = prompt.toLowerCase()
      if (promptLower.includes('vertical') || promptLower.includes('9:16') || promptLower.includes('feed')) {
        size = '1024x1792' // Vertical
      } else if (promptLower.includes('horizontal') || promptLower.includes('16:9') || promptLower.includes('display')) {
        size = '1792x1024' // Horizontal
      }

      const response = await fetch(`${this.config.credentials.endpoint}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          model: 'dall-e-3',
          n: 1,
          size: size,
          quality: 'hd', // Alta qualidade (HD) - melhor para criativos profissionais
          style: 'vivid' // Estilo vivid para imagens mais vibrantes e detalhadas (melhor para publicidade)
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erro DALL-E API:', errorText)
        throw new Error(`DALL-E API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // DALL-E retorna URL da imagem
      const imageUrl = data.data[0]?.url || data.data[0]?.b64_json
      const revisedPrompt = data.data[0]?.revised_prompt || prompt
      
      if (!imageUrl) {
        throw new Error('Nenhuma imagem retornada pela API DALL-E')
      }

      // Se for base64, converter para data URL
      const finalImageUrl = typeof imageUrl === 'string' && imageUrl.startsWith('data:') 
        ? imageUrl 
        : imageUrl
      
      return {
        success: true,
        data: {
          images: [{
            url: finalImageUrl,
            revisedPrompt: revisedPrompt,
            width: 600, // Dimensões desejadas
            height: 400, // Dimensões desejadas
            originalWidth: 1024, // Dimensões originais do DALL-E
            originalHeight: 1024
          }],
          model: 'dall-e-3'
        },
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0.12 // Custo fixo por imagem DALL-E 3 HD (mais caro que standard)
        }
      }
    } catch (error) {
      throw new Error(`Erro na API DALL-E: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  // Método removido - mantendo DALL-E como padrão para geração de imagens

  private generateMockResponse(request: AIGenerationRequest, aiType: string): AIGenerationResponse {
    const mockResponses = {
      openai: "Este é um conteúdo gerado pelo OpenAI GPT-4. Em produção, este seria o resultado real da API.",
      claude: "Este é um conteúdo gerado pelo Claude 3 Sonnet. Em produção, este seria o resultado real da API.",
      gemini: "Este é um conteúdo gerado pelo Google Gemini Pro. Em produção, este seria o resultado real da API.",
      koala: "Este é um conteúdo gerado pelo Koala.sh. Em produção, este seria o resultado real da API.",
      'stable-diffusion': "Imagem gerada pelo Stable Diffusion XL. Em produção, esta seria uma imagem real.",
      dalle: "Imagem gerada pelo DALL-E 3. Em produção, esta seria uma imagem real."
    }

    return {
      success: true,
      data: {
        content: mockResponses[aiType as keyof typeof mockResponses] || "Conteúdo gerado com sucesso",
        model: request.model || `${aiType}-model`,
        finishReason: 'stop'
      },
      usage: {
        promptTokens: Math.floor(request.prompt.length / 4),
        completionTokens: Math.floor((mockResponses[aiType as keyof typeof mockResponses] || "").length / 4),
        totalTokens: Math.floor(request.prompt.length / 4) + Math.floor((mockResponses[aiType as keyof typeof mockResponses] || "").length / 4),
        cost: 0.01
      }
    }
  }

  private calculateCost(tokens: number, model: string): number {
    // Preços aproximados por 1K tokens (USD)
    const pricing: Record<string, number> = {
      'gpt-5': 0.02, // GPT-5 mais eficiente que GPT-4
      'gpt-4': 0.03,
      'gpt-4-turbo': 0.01,
      'gpt-3.5-turbo': 0.002,
      'claude-3-sonnet-20240229': 0.015,
      'claude-3-haiku-20240307': 0.0025,
      'claude-3-opus-20240229': 0.075,
      'gemini-pro': 0.0005,
      'gemini-pro-vision': 0.0005,
      'koala-7b': 0.001
    }

    const pricePer1K = pricing[model] || 0.01
    return (tokens / 1000) * pricePer1K
  }
}

export class WordPressService {
  private config: APIConfig

  constructor(config: APIConfig) {
    this.config = config
  }

  async createPost(postData: {
    title: string
    content: string
    status: 'draft' | 'publish' | 'private'
    slug?: string
    excerpt?: string
    categories?: number[]
    tags?: number[]
    featured_media?: number
    meta?: Record<string, any>
    acf_fields?: Record<string, any>
    idempotency_key?: string
  }): Promise<AIGenerationResponse> {
    try {
      // Verificar idempotência se chave fornecida
      if (postData.idempotency_key) {
        const existingPost = await this.checkExistingPost(postData.idempotency_key)
        if (existingPost) {
          return {
            success: true,
            data: existingPost
          }
        }
      }

      // Mapear status CMS para WordPress
      const wpStatus = this.mapCMSStatusToWordPress(postData.status)
      
      const response = await fetch(`${this.config.credentials.endpoint}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.credentials.username}:${this.config.credentials.password}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...postData,
          status: wpStatus,
          meta: {
            ...postData.meta,
            idempotency_key: postData.idempotency_key
          }
        })
      })

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Processar campos ACF se fornecidos
      if (postData.acf_fields && Object.keys(postData.acf_fields).length > 0) {
        await this.updateACFFields(data.id, postData.acf_fields)
      }
      
      return {
        success: true,
        data: {
          id: data.id,
          title: data.title.rendered,
          slug: data.slug,
          link: data.link,
          status: data.status,
          date: data.date
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Erro na API WordPress: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  // Mapear status do CMS para WordPress
  private mapCMSStatusToWordPress(cmsStatus: string): string {
    switch (cmsStatus) {
      case 'draft':
        return 'draft'
      case 'published':
        return 'publish'
      case 'archived':
        return 'private'
      default:
        return 'draft'
    }
  }

  // Atualizar campos ACF
  private async updateACFFields(postId: number, acfFields: Record<string, any>): Promise<void> {
    try {
      for (const [fieldName, fieldValue] of Object.entries(acfFields)) {
        const response = await fetch(`${this.config.credentials.endpoint}/wp-json/acf/v3/posts/${postId}/fields/${fieldName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${this.config.credentials.username}:${this.config.credentials.password}`)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: fieldValue })
        })

        if (!response.ok) {
          console.warn(`Falha ao atualizar campo ACF ${fieldName}: ${response.status}`)
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar campos ACF:', error)
    }
  }

  // Verificar se post já existe (idempotência)
  private async checkExistingPost(idempotencyKey: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.config.credentials.endpoint}/wp-json/wp/v2/posts?meta_key=idempotency_key&meta_value=${idempotencyKey}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.credentials.username}:${this.config.credentials.password}`)}`
        }
      })

      if (response.ok) {
        const posts = await response.json()
        if (posts.length > 0) {
          return {
            id: posts[0].id,
            title: posts[0].title.rendered,
            slug: posts[0].slug,
            link: posts[0].link,
            status: posts[0].status,
            date: posts[0].date
          }
        }
      }
      return null
    } catch (error) {
      console.error('Erro ao verificar post existente:', error)
      return null
    }
  }

  async uploadMedia(file: File, title?: string, alt?: string): Promise<AIGenerationResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (title) formData.append('title', title)
      if (alt) formData.append('alt_text', alt)

      const response = await fetch(`${this.config.credentials.endpoint}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.credentials.username}:${this.config.credentials.password}`)}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`WordPress Media API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data: {
          id: data.id,
          url: data.source_url,
          title: data.title.rendered,
          alt: data.alt_text,
          mime_type: data.mime_type,
          file_size: data.media_details?.file_size
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Erro no upload de mídia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  async createACFField(fieldData: {
    field_group: number
    field_name: string
    field_label: string
    field_type: string
    field_instructions?: string
    required?: boolean
    default_value?: any
  }): Promise<AIGenerationResponse> {
    try {
      const response = await fetch(`${this.config.credentials.endpoint}/wp-json/acf/v3/fields`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.credentials.username}:${this.config.credentials.password}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fieldData)
      })

      if (!response.ok) {
        throw new Error(`ACF API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          label: data.label,
          type: data.type,
          required: data.required
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Erro na API ACF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.credentials.endpoint}/wp-json/wp/v2/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.credentials.username}:${this.config.credentials.password}`)}`
        }
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  private async generateWithKoala(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const { prompt, model = 'gpt-4.1-mini', maxTokens = 4000, temperature = 0.7 } = request;

    try {
      const apiKey = this.config.credentials.apiKey;
      if (!apiKey || apiKey.startsWith('sk-mock')) {
        return {
          success: true,
          data: {
            content: `Conteúdo gerado com Koala.sh: ${prompt}`,
            model: 'koala-mock'
          }
        };
      }

      // Koala.sh usa a API do KoalaWriter para geração de artigos
      const response = await fetch('https://koala.sh/api/articles/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetKeyword: prompt,
          gptVersion: model,
          articleLength: 'medium',
          autoPolish: true,
          polishSettings: {
            'split-up-long-paragraphs': true,
            'remove-mid-article-conclusions': true,
            'remove-repetitive-sentences': true,
            'convert-passive-voice': false,
            'simplify-complex-sentences': false,
            'humanize': true
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Koala API error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
      }

      const data = await response.json();

      // Koala.sh retorna um articleId, precisamos fazer polling para obter o resultado
      return {
        success: true,
        data: {
          content: `Artigo criado com sucesso! ID: ${data.articleId}. O artigo está sendo processado em background.`,
          model: model,
          finishReason: 'stop',
          articleId: data.articleId
        },
        usage: {
          promptTokens: Math.floor(prompt.length / 4),
          completionTokens: 0,
          totalTokens: Math.floor(prompt.length / 4),
          cost: 0.01
        }
      };
    } catch (error) {
      console.error('Erro na API Koala:', error);
      throw new Error(`Erro na API Koala: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

export class WebhookService {
  private config: APIConfig

  constructor(config: APIConfig) {
    this.config = config
  }

  async sendWebhook(data: any): Promise<AIGenerationResponse> {
    try {
      const response = await fetch(this.config.credentials.webhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.credentials.token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status} ${response.statusText}`)
      }

      return {
        success: true,
        data: await response.json()
      }
    } catch (error) {
      return {
        success: false,
        error: `Erro no webhook: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }
}
