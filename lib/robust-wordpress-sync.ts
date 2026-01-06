// Sistema de Sincronização Robusto para WordPress
export interface SyncConfig {
  baseUrl: string
  username: string
  password: string
  maxRetries?: number
  delayBetweenRequests?: number
  maxItemsPerPage?: number
}

export interface SyncResult {
  success: boolean
  data: any[]
  totalItems: number
  errors: string[]
  warnings: string[]
}

export interface SyncProgress {
  currentStep: string
  percentage: number
  totalItems: number
  processedItems: number
  errors: number
  warnings: number
}

export class RobustWordPressSync {
  private config: SyncConfig
  private progress: SyncProgress
  private onProgressCallback?: (progress: SyncProgress) => void

  constructor(config: SyncConfig) {
    this.config = {
      maxRetries: 3,
      delayBetweenRequests: 1000,
      maxItemsPerPage: 10,
      ...config
    }
    
    this.progress = {
      currentStep: 'Iniciando...',
      percentage: 0,
      totalItems: 0,
      processedItems: 0,
      errors: 0,
      warnings: 0
    }
  }

  // Configurar callback de progresso
  onProgress(callback: (progress: SyncProgress) => void) {
    this.onProgressCallback = callback
  }

  // Atualizar progresso
  private updateProgress(step: string, percentage: number, processedItems: number, errors: number = 0, warnings: number = 0) {
    this.progress = {
      currentStep: step,
      percentage,
      totalItems: this.progress.totalItems,
      processedItems,
      errors: this.progress.errors + errors,
      warnings: this.progress.warnings + warnings
    }
    
    if (this.onProgressCallback) {
      this.onProgressCallback(this.progress)
    }
  }

  // Fazer requisição segura com retry
  private async safeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const maxRetries = this.config.maxRetries || 3
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentativa ${attempt}/${maxRetries} para ${url}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'CMS-Moderno/1.0 (WordPress Integration)',
            'Accept': 'application/json',
            'Connection': 'keep-alive',
            ...options.headers
          }
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          console.log(`✅ Sucesso na tentativa ${attempt}`)
          return response
        } else {
          console.log(`⚠️ Status ${response.status} na tentativa ${attempt}`)
          
          // Para erros 400, tentar com parâmetros mais seguros
          if (response.status === 400 && attempt < maxRetries) {
            console.log(`🔄 Tentando com parâmetros mais seguros...`)
            const safeUrl = this.makeUrlSafe(url)
            if (safeUrl !== url) {
              console.log(`🔄 URL segura: ${safeUrl}`)
              const safeResponse = await fetch(safeUrl, {
                ...options,
                signal: controller.signal,
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'CMS-Moderno/1.0 (WordPress Integration)',
                  'Accept': 'application/json',
                  'Connection': 'keep-alive',
                  ...options.headers
                }
              })
              
              if (safeResponse.ok) {
                console.log(`✅ Sucesso com URL segura`)
                return safeResponse
              }
            }
          }
          
          if (attempt === maxRetries) {
            return response
          }
        }
      } catch (error) {
        console.log(`❌ Erro na tentativa ${attempt}:`, error instanceof Error ? error.message : 'Erro desconhecido')
        
        if (attempt === maxRetries) {
          throw error
        }
        
        // Backoff exponencial: 2s, 4s, 8s
        const delay = Math.pow(2, attempt) * 1000
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw new Error('Todas as tentativas falharam')
  }

  // Tornar URL mais segura
  private makeUrlSafe(url: string): string {
    try {
      const urlObj = new URL(url)
      const params = new URLSearchParams(urlObj.search)
      
      // Reduzir per_page para valores mais seguros
      if (params.get('per_page')) {
        const perPage = parseInt(params.get('per_page') || '10')
        if (perPage > 5) {
          params.set('per_page', '5')
        }
      }
      
      // Remover orderby se estiver causando problemas
      if (params.get('orderby')) {
        params.delete('orderby')
        params.delete('order')
      }
      
      // Garantir que page seja válida
      if (params.get('page')) {
        const page = parseInt(params.get('page') || '1')
        if (page < 1) {
          params.set('page', '1')
        }
      }
      
      // Reconstruir URL
      urlObj.search = params.toString()
      return urlObj.toString()
    } catch (error) {
      console.log(`⚠️ Erro ao tornar URL segura: ${error}`)
      return url
    }
  }

  // Sincronizar dados com parâmetros seguros
  async syncData(endpoint: string, onProgress?: (progress: SyncProgress) => void): Promise<SyncResult> {
    if (onProgress) {
      this.onProgress(onProgress)
    }

    const result: SyncResult = {
      success: true,
      data: [],
      totalItems: 0,
      errors: [],
      warnings: []
    }

    try {
      this.updateProgress(`Conectando com ${endpoint}...`, 0, 0)
      
      // Primeiro, obter total de itens
      const totalUrl = `${this.config.baseUrl}/wp-json/wp/v2/${endpoint}?per_page=1&page=1`
      const totalResponse = await this.safeRequest(totalUrl)
      
      if (!totalResponse.ok) {
        throw new Error(`Erro ao obter total de ${endpoint}: ${totalResponse.status}`)
      }
      
      const totalItems = parseInt(totalResponse.headers.get('X-WP-Total') || '0')
      this.progress.totalItems = totalItems
      
      this.updateProgress(`Total de ${totalItems} ${endpoint} encontrados`, 10, 0)
      
      // Calcular número de páginas
      const itemsPerPage = this.config.maxItemsPerPage || 10
      const totalPages = Math.ceil(totalItems / itemsPerPage)
      
      console.log(`📊 Sincronizando ${totalItems} ${endpoint} em ${totalPages} páginas`)
      
      // Sincronizar página por página
      for (let page = 1; page <= totalPages; page++) {
        try {
          this.updateProgress(
            `Sincronizando ${endpoint} - Página ${page}/${totalPages}`,
            Math.round((page / totalPages) * 80) + 10,
            (page - 1) * itemsPerPage
          )
          
          const pageUrl = `${this.config.baseUrl}/wp-json/wp/v2/${endpoint}?per_page=${itemsPerPage}&page=${page}`
          const response = await this.safeRequest(pageUrl)
          
          if (response.ok) {
            const data = await response.json()
            result.data.push(...data)
            result.totalItems += data.length
            
            console.log(`✅ Página ${page}/${totalPages} - ${data.length} itens carregados`)
          } else {
            console.log(`⚠️ Erro na página ${page}: ${response.status}`)
            result.warnings.push(`Página ${page} falhou: ${response.status}`)
          }
          
          // Delay entre requisições para evitar rate limiting
          if (page < totalPages) {
            await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenRequests || 1000))
          }
          
        } catch (error) {
          console.log(`❌ Erro na página ${page}:`, error)
          result.errors.push(`Página ${page}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        }
      }
      
      this.updateProgress(`Sincronização de ${endpoint} concluída`, 100, result.totalItems)
      
      console.log(`✅ ${endpoint} sincronizado: ${result.totalItems} itens`)
      
    } catch (error) {
      console.log(`❌ Erro na sincronização de ${endpoint}:`, error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Erro desconhecido')
    }
    
    return result
  }

  // Sincronizar todos os dados
  async syncAllData(): Promise<{
    posts: SyncResult
    pages: SyncResult
    media: SyncResult
    categories: SyncResult
    tags: SyncResult
    users: SyncResult
  }> {
    console.log('🚀 Iniciando sincronização completa...')
    
    const results = {
      posts: await this.syncData('posts'),
      pages: await this.syncData('pages'),
      media: await this.syncData('media'),
      categories: await this.syncData('categories'),
      tags: await this.syncData('tags'),
      users: await this.syncData('users')
    }
    
    console.log('✅ Sincronização completa finalizada')
    return results
  }
}








