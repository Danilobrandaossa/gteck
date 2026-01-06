/**
 * 🔌 EMBEDDING PROVIDERS - Abstração para múltiplos provedores de embeddings
 * 
 * Esta interface permite trocar ou adicionar providers sem refatoração.
 * 
 * Providers suportados:
 * - OpenAI (text-embedding-3-large, text-embedding-ada-002)
 * - Google Gemini (embedding-001, text-embedding-004)
 * 
 * FUTUROS:
 * - Cohere
 * - Hugging Face
 * - OpenAI text-embedding-3-small
 */

export interface EmbeddingResult {
  embedding: number[]
  dimensions: number
  model: string
  provider: string
  tokensUsed?: number
  costUSD?: number
}

export interface EmbeddingProvider {
  name: 'openai' | 'gemini' | 'cohere' | 'huggingface'
  model: string
  dimensions: number
  maxTokens: number
  
  /**
   * Gera embedding para um texto
   */
  generateEmbedding(text: string): Promise<EmbeddingResult>
  
  /**
   * Calcula custo estimado em USD
   */
  calculateCost(tokens: number): number
}

/**
 * Provider OpenAI
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  name = 'openai' as const
  model: string
  dimensions: number
  maxTokens: number = 8191 // Limite do ada-002
  
  private apiKey: string
  private baseUrl: string = 'https://api.openai.com/v1'

  constructor(
    apiKey: string,
    model: 'text-embedding-ada-002' | 'text-embedding-3-small' | 'text-embedding-3-large' = 'text-embedding-ada-002',
    dimensions?: number
  ) {
    this.apiKey = apiKey
    this.model = model
    
    // Dimensões padrão por modelo
    if (dimensions) {
      this.dimensions = dimensions
    } else {
      switch (model) {
        case 'text-embedding-ada-002':
          this.dimensions = 1536
          break
        case 'text-embedding-3-small':
          this.dimensions = 1536
          break
        case 'text-embedding-3-large':
          this.dimensions = 3072
          break
        default:
          this.dimensions = 1536
      }
    }
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }

    const startTime = Date.now()

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
          dimensions: this.dimensions
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`)
      }

      const data = await response.json()
      const embedding = data.data[0].embedding
      const tokensUsed = data.usage?.total_tokens || this.estimateTokens(text)

      return {
        embedding,
        dimensions: embedding.length,
        model: this.model,
        provider: 'openai',
        tokensUsed,
        costUSD: this.calculateCost(tokensUsed)
      }
    } catch (error) {
      throw new Error(`Failed to generate OpenAI embedding: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  calculateCost(tokens: number): number {
    // Preços por 1K tokens (USD)
    const pricing: Record<string, number> = {
      'text-embedding-ada-002': 0.0001, // $0.10 por 1M tokens
      'text-embedding-3-small': 0.00002, // $0.02 por 1M tokens
      'text-embedding-3-large': 0.00013 // $0.13 por 1M tokens
    }

    const pricePer1K = pricing[this.model] || 0.0001
    return (tokens / 1000) * pricePer1K
  }

  private estimateTokens(text: string): number {
    // Estimativa aproximada: ~4 caracteres por token
    return Math.ceil(text.length / 4)
  }
}

/**
 * Provider Google Gemini
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  name = 'gemini' as const
  model: string
  dimensions: number = 768 // Gemini embedding-001 tem 768 dimensões
  maxTokens: number = 2048

  private apiKey: string
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta'

  constructor(
    apiKey: string,
    model: 'embedding-001' | 'text-embedding-004' = 'embedding-001'
  ) {
    this.apiKey = apiKey
    this.model = model
    
    // Ajustar dimensões por modelo
    if (model === 'text-embedding-004') {
      this.dimensions = 768 // Verificar documentação atualizada
    }
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }

    const startTime = Date.now()

    try {
      const endpoint = `${this.baseUrl}/models/${this.model}:embedContent?key=${this.apiKey}`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: `models/${this.model}`,
          content: {
            parts: [{
              text: text
            }]
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`)
      }

      const data = await response.json()
      const embedding = data.embedding?.values || []
      
      if (embedding.length === 0) {
        throw new Error('Empty embedding returned from Gemini API')
      }

      const tokensUsed = this.estimateTokens(text)

      return {
        embedding,
        dimensions: embedding.length,
        model: this.model,
        provider: 'gemini',
        tokensUsed,
        costUSD: this.calculateCost(tokensUsed)
      }
    } catch (error) {
      throw new Error(`Failed to generate Gemini embedding: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  calculateCost(tokens: number): number {
    // Gemini Embedding API é gratuito até certo limite, depois $0.0001 por 1K tokens
    // Para simplificar, assumimos custo zero (verificar documentação atualizada)
    return 0
  }

  private estimateTokens(text: string): number {
    // Estimativa aproximada para Gemini
    return Math.ceil(text.length / 4)
  }
}

/**
 * Factory para criar providers
 */
export function createEmbeddingProvider(
  provider: 'openai' | 'gemini',
  apiKey: string,
  model?: string,
  dimensions?: number
): EmbeddingProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIEmbeddingProvider(
        apiKey,
        (model as any) || 'text-embedding-ada-002',
        dimensions
      )
    
    case 'gemini':
      return new GeminiEmbeddingProvider(
        apiKey,
        (model as any) || 'embedding-001'
      )
    
    default:
      throw new Error(`Unsupported embedding provider: ${provider}`)
  }
}

/**
 * Valida se um provider está configurado corretamente
 */
export async function validateProvider(provider: EmbeddingProvider): Promise<boolean> {
  try {
    const testText = 'Test embedding'
    const result = await provider.generateEmbedding(testText)
    return result.embedding.length > 0 && result.embedding.length === result.dimensions
  } catch (error) {
    console.error('Provider validation failed:', error)
    return false
  }
}









