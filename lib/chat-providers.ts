/**
 * 💬 CHAT PROVIDERS - Abstração para múltiplos provedores de chat/completions
 * 
 * Providers suportados:
 * - OpenAI (gpt-4o, gpt-4o-mini, gpt-4-turbo)
 * - Google Gemini (gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash)
 * 
 * FUTUROS:
 * - Claude (claude-3-sonnet, claude-3-opus)
 * - Anthropic
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export interface ChatResponse {
  content: string
  model: string
  provider: string
  finishReason: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  costUSD: number
}

export interface ChatProvider {
  name: 'openai' | 'gemini' | 'claude'
  model: string
  
  /**
   * Gera completion de chat
   */
  generateCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatResponse>
  
  /**
   * Gera completion com streaming
   */
  generateCompletionStream(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ReadableStream<Uint8Array>>
  
  /**
   * Calcula custo estimado em USD
   */
  calculateCost(promptTokens: number, completionTokens: number): number
}

/**
 * Provider OpenAI
 */
export class OpenAIChatProvider implements ChatProvider {
  name = 'openai' as const
  model: string
  private apiKey: string
  private baseUrl: string = 'https://api.openai.com/v1'

  constructor(
    apiKey: string,
    model: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-4' = 'gpt-4o-mini'
  ) {
    this.apiKey = apiKey
    this.model = model
  }

  async generateCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatResponse> {
    const {
      temperature = 0.7,
      maxTokens = 2000,
      topP = 1,
      frequencyPenalty = 0,
      presencePenalty = 0
    } = options

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          frequency_penalty: frequencyPenalty,
          presence_penalty: presencePenalty
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`)
      }

      const data = await response.json()
      const choice = data.choices[0]
      const usage = data.usage

      return {
        content: choice.message.content,
        model: data.model,
        provider: 'openai',
        finishReason: choice.finish_reason,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        },
        costUSD: this.calculateCost(usage.prompt_tokens, usage.completion_tokens)
      }
    } catch (error) {
      throw new Error(`Failed to generate OpenAI completion: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateCompletionStream(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const {
      temperature = 0.7,
      maxTokens = 2000,
      topP = 1,
      frequencyPenalty = 0,
      presencePenalty = 0
    } = options

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          frequency_penalty: frequencyPenalty,
          presence_penalty: presencePenalty,
          stream: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      return response.body
    } catch (error) {
      throw new Error(`Failed to generate OpenAI stream: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  calculateCost(promptTokens: number, completionTokens: number): number {
    // Preços por 1K tokens (USD) - atualizado 2025
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.0025, output: 0.01 }, // $2.50/$10 por 1M tokens
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // $0.15/$0.60 por 1M tokens
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 }
    }

    const price = pricing[this.model] || pricing['gpt-4o-mini']
    return (promptTokens / 1000) * price.input + (completionTokens / 1000) * price.output
  }
}

/**
 * Provider Google Gemini
 */
export class GeminiChatProvider implements ChatProvider {
  name = 'gemini' as const
  model: string
  private apiKey: string
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta'

  constructor(
    apiKey: string,
    model: 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-2.0-flash' = 'gemini-1.5-flash'
  ) {
    this.apiKey = apiKey
    this.model = model
  }

  async generateCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatResponse> {
    const {
      temperature = 0.7,
      maxTokens = 2000,
      topP = 1
    } = options

    try {
      // Converter mensagens para formato Gemini
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

      const endpoint = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            topP
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`)
      }

      const data = await response.json()
      const candidate = data.candidates[0]
      const usageMetadata = data.usageMetadata || {}

      return {
        content: candidate.content.parts[0].text,
        model: this.model,
        provider: 'gemini',
        finishReason: candidate.finishReason || 'stop',
        usage: {
          promptTokens: usageMetadata.promptTokenCount || 0,
          completionTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || 0
        },
        costUSD: this.calculateCost(
          usageMetadata.promptTokenCount || 0,
          usageMetadata.candidatesTokenCount || 0
        )
      }
    } catch (error) {
      throw new Error(`Failed to generate Gemini completion: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateCompletionStream(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const {
      temperature = 0.7,
      maxTokens = 2000,
      topP = 1
    } = options

    try {
      // Converter mensagens para formato Gemini
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

      const endpoint = `${this.baseUrl}/models/${this.model}:streamGenerateContent?key=${this.apiKey}`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            topP
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      return response.body
    } catch (error) {
      throw new Error(`Failed to generate Gemini stream: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  calculateCost(promptTokens: number, completionTokens: number): number {
    // Preços Gemini (atualizado 2025)
    // gemini-1.5-flash: $0.075/$0.30 por 1M tokens
    // gemini-1.5-pro: $1.25/$5.00 por 1M tokens
    // gemini-2.0-flash: Verificar documentação atualizada
    
    const pricing: Record<string, { input: number; output: number }> = {
      'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
      'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
      'gemini-2.0-flash': { input: 0.000075, output: 0.0003 } // Assumindo mesmo preço do 1.5-flash
    }

    const price = pricing[this.model] || pricing['gemini-1.5-flash']
    return (promptTokens / 1000) * price.input + (completionTokens / 1000) * price.output
  }
}

/**
 * Factory para criar providers
 */
export function createChatProvider(
  provider: 'openai' | 'gemini',
  apiKey: string,
  model?: string
): ChatProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIChatProvider(
        apiKey,
        (model as any) || 'gpt-4o-mini'
      )
    
    case 'gemini':
      return new GeminiChatProvider(
        apiKey,
        (model as any) || 'gemini-1.5-flash'
      )
    
    default:
      throw new Error(`Unsupported chat provider: ${provider}`)
  }
}

/**
 * Obtém API key do provider
 */
export function getProviderApiKey(provider: 'openai' | 'gemini'): string {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY || ''
    case 'gemini':
      return process.env.GOOGLE_API_KEY || ''
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

