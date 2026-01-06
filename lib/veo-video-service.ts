/**
 * Veo Video Service - Geração de Vídeo com Gemini Veo 3
 * 
 * Suporta:
 * - Veo 3 e Veo 3.1
 * - Long-running operations (predictLongRunning)
 * - Polling de status
 * - Timeouts e retries
 */

export interface VeoVideoRequest {
  prompt: string
  videoModel?: 'veo3' | 'veo31'
  aspectRatio?: '9:16' | '16:9'
  durationSeconds?: 4 | 6 | 8
  variations?: 1 | 2
  seed?: number
  imageReference?: {
    url: string
    role: 'style' | 'produto' | 'inspiração'
  }
}

export interface VeoVideoJob {
  jobId: string
  status: 'queued' | 'running' | 'failed' | 'done'
  progress?: number
  videoUrl?: string
  thumbnailUrl?: string
  failureReason?: string
  metadata?: {
    model: string
    durationSeconds: number
    aspectRatio: string
    prompt: string
  }
  createdAt: number
  updatedAt: number
}

export interface VeoVideoConfig {
  apiKey: string
  endpoint?: string
  timeoutMs?: number
  maxRetries?: number
  backoffBaseMs?: number
  primaryModel?: string
  fallbackModel?: string
}

export class VeoVideoService {
  private apiKey: string
  private endpoint: string
  private primaryModel: string
  private fallbackModel: string
  private timeoutMs: number
  private maxRetries: number
  private backoffBaseMs: number

  constructor(config: VeoVideoConfig) {
    this.apiKey = config.apiKey
    this.endpoint = config.endpoint || process.env.VEO_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta'
    this.primaryModel = config.primaryModel || process.env.VEO_MODEL_NAME || 'veo-3.1-generate-preview'
    this.fallbackModel = config.fallbackModel || process.env.VEO_MODEL_FALLBACK || 'veo-3.1-generate-preview'
    this.timeoutMs = config.timeoutMs || parseInt(process.env.VEO_TIMEOUT_MS || '300000', 10) // 5min default
    this.maxRetries = config.maxRetries || parseInt(process.env.VEO_MAX_RETRIES || '2', 10)
    this.backoffBaseMs = config.backoffBaseMs || parseInt(process.env.VEO_BACKOFF_BASE_MS || '2000', 10)
  }

  /**
   * Inicia long-running operation de geração de vídeo
   */
  async startVideoJob(request: VeoVideoRequest): Promise<{ jobId: string; status: 'queued' }> {
    const model = request.videoModel === 'veo31' 
      ? (process.env.VEO_MODEL_NAME || 'veo-3.1-generate-preview')
      : (process.env.VEO_MODEL_NAME || 'veo-3-generate-preview')
    
    const url = `${this.endpoint}/models/${model}:predictLongRunning?key=${this.apiKey}`

    // Construir payload mínimo conforme documentação
    const requestBody: any = {
      instances: [
        {
          prompt: request.prompt
        }
      ]
    }

    // Whitelist de parameters enviados ao Veo (Gemini API)
    // durationSeconds NÃO é garantido no payload Gemini Veo; manter apenas como campo de UI
    const parameters: any = {}
    if (request.aspectRatio) {
      parameters.aspectRatio = request.aspectRatio
    }
    // Adicionar outros parameters SOMENTE se comprovadamente suportados pela API
    // Exemplo: negativePrompt (se suportado)
    if (Object.keys(parameters).length > 0) {
      requestBody.parameters = parameters
    }

    // Adicionar image reference se fornecido
    if (request.imageReference) {
      // Converter imagem para base64 se necessário
      const imageData = request.imageReference.url.startsWith('data:')
        ? request.imageReference.url.split(',')[1]
        : await this.fetchImageAsBase64(request.imageReference.url)
      requestBody.instances[0].imageReference = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData
        }
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API retornou erro ${response.status}: ${errorText.substring(0, 200)}`)
      }

      const data = await response.json()
      
      // jobId = operation.name
      const jobId = data.name
      if (!jobId) {
        throw new Error('Resposta da API não contém operation.name')
      }

      // Log seguro (sem expor tokens/query params)
      const logHost = new URL(this.endpoint).hostname
      console.log('[VeoVideoService] Long-running operation iniciada:', { jobId, model, endpoint: logHost })

      return { jobId, status: 'queued' }
    } catch (error) {
      console.error('[VeoVideoService] Erro ao iniciar operação:', error)
      throw error
    }
  }

  /**
   * Obtém status da operação long-running
   */
  async getVideoJobStatus(jobId: string): Promise<VeoVideoJob | null> {
    return this.getOperationStatus(jobId)
  }

  /**
   * Consulta status da operação na API
   */
  private async getOperationStatus(operationName: string): Promise<VeoVideoJob | null> {
    const url = `${this.endpoint}/${operationName}?key=${this.apiKey}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-goog-api-key': this.apiKey
        }
      })

      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
          // 4xx: operação não encontrada ou inválida
          return {
            jobId: operationName,
            status: 'failed',
            failureReason: `Operação não encontrada ou inválida (${response.status})`,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        }
        // 5xx: erro do servidor
        const errorText = await response.text()
        throw new Error(`Erro ao consultar operação: ${response.status} - ${errorText.substring(0, 200)}`)
      }

      const operation = await response.json()

      // Mapear status
      let status: 'queued' | 'running' | 'failed' | 'done'
      let videoUri: string | undefined
      let failureReason: string | undefined

      if (operation.done === true) {
        // Operação concluída
        if (operation.error) {
          status = 'failed'
          failureReason = operation.error.message || 'Erro desconhecido na operação'
        } else {
          status = 'done'
          // Extrair videoUri da resposta
          videoUri = this.extractVideoUri(operation.response)
        }
      } else {
        // Operação ainda em execução
        status = 'running'
      }

      // Calcular progress (estimado baseado em done)
      const progress = operation.done ? 100 : (operation.metadata?.progressPercent || 0)

      // Log seguro (apenas host, sem query/tokens)
      if (videoUri) {
        try {
          const uriObj = new URL(videoUri.startsWith('gs://') ? `https://storage.googleapis.com/${videoUri.substring(5)}` : videoUri)
          const logHost = uriObj.hostname
          console.log('[VeoVideoService] VideoUri extraído:', { host: logHost, scheme: videoUri.startsWith('gs://') ? 'gs' : 'https' })
        } catch {
          // Ignorar erro de parsing (pode ser gs://)
        }
      }

      return {
        jobId: operationName,
        status,
        progress,
        videoUrl: videoUri ? `/api/creative/video-download?uri=${encodeURIComponent(videoUri)}` : undefined,
        failureReason,
        metadata: {
          model: operation.metadata?.model || 'unknown',
          durationSeconds: operation.metadata?.durationSeconds || 6,
          aspectRatio: operation.metadata?.aspectRatio || '9:16',
          prompt: operation.metadata?.prompt || ''
        },
        createdAt: operation.metadata?.createTime ? new Date(operation.metadata.createTime).getTime() : Date.now(),
        updatedAt: Date.now()
      }
    } catch (error) {
      console.error('[VeoVideoService] Erro ao consultar operação:', error)
      return {
        jobId: operationName,
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Erro desconhecido',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    }
  }

  /**
   * Extrai videoUri da resposta da operação (parser tolerante a variações)
   * Retorna string limpa (sem objetos)
   */
  private extractVideoUri(response: any): string | undefined {
    if (!response) return undefined

    // Helper para extrair URI de objeto ou string
    const extractUri = (value: any): string | undefined => {
      if (!value) return undefined
      if (typeof value === 'string') return value
      if (value.uri && typeof value.uri === 'string') return value.uri
      if (value.url && typeof value.url === 'string') return value.url
      return undefined
    }

    // Formato 1: response.generateVideoResponse.generatedSamples[0].video.uri
    if (response.generateVideoResponse?.generatedSamples && Array.isArray(response.generateVideoResponse.generatedSamples)) {
      const sample = response.generateVideoResponse.generatedSamples[0]
      const uri = extractUri(sample?.video?.uri)
      if (uri) return uri
    }

    // Formato 2: response.predictions[0].videoUri
    if (response.predictions && Array.isArray(response.predictions) && response.predictions.length > 0) {
      const prediction = response.predictions[0]
      const uri = extractUri(prediction.videoUri)
      if (uri) return uri
    }

    // Formato 3: response.generatedVideos ou response.generated_videos
    const generatedVideos = response.generatedVideos || response.generated_videos
    if (generatedVideos) {
      const video = Array.isArray(generatedVideos) ? generatedVideos[0] : generatedVideos
      const uri = extractUri(video?.uri) || extractUri(video?.videoUri)
      if (uri) return uri
    }

    // Formato 4: response.videoUri
    const uri4 = extractUri(response.videoUri)
    if (uri4) return uri4

    // Formato 5: response.uri (fallback)
    const uri5 = extractUri(response.uri)
    if (uri5) return uri5

    // Formato 6: response.response.uri (fallback adicional)
    if (response.response) {
      const uri6 = extractUri(response.response.uri) || extractUri(response.response.videoUri)
      if (uri6) return uri6
    }

    return undefined
  }

  /**
   * Busca imagem e converte para base64
   */
  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      return buffer.toString('base64')
    } catch (error) {
      console.warn('[VeoVideoService] Erro ao buscar imagem:', error)
      throw new Error('Erro ao processar referência de imagem')
    }
  }
}
