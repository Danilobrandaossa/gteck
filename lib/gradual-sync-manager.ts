// Gerenciador de Sincronização Gradual - 15 registros por vez
export interface GradualSyncConfig {
  itemsPerPage: number
  maxRetries: number
  retryDelay: number
  timeout: number
}

export interface SyncProgress {
  currentPage: number
  totalPages: number
  itemsLoaded: number
  totalItems: number
  percentage: number
  isComplete: boolean
  errors: string[]
}

export interface GradualSyncResult<T> {
  items: T[]
  progress: SyncProgress
  success: boolean
  error?: string
}

export class GradualSyncManager {
  private static instance: GradualSyncManager
  private config: GradualSyncConfig = {
    itemsPerPage: 15,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000
  }

  private constructor() {}

  static getInstance(): GradualSyncManager {
    if (!GradualSyncManager.instance) {
      GradualSyncManager.instance = new GradualSyncManager()
    }
    return GradualSyncManager.instance
  }

  // Sincronização gradual de dados WordPress
  async syncGradually<T>(
    baseUrl: string,
    username: string,
    password: string,
    endpoint: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<GradualSyncResult<T>> {
    console.log(` Iniciando sincronização gradual: ${endpoint}`)
    console.log(` Configuração: ${this.config.itemsPerPage} itens por página`)

    const allItems: T[] = []
    let currentPage = 1
    let hasMore = true
    let totalItems = 0
    const errors: string[] = []

    try {
      // Primeira requisição para obter total de itens
      const firstUrl = `${baseUrl}/wp-json/wp/v2/${endpoint}?per_page=${this.config.itemsPerPage}&page=1`
      console.log(` Iniciando requisição para: ${firstUrl}`)
      const firstResponse = await this.makeRequest(
        firstUrl,
        username,
        password
      )

      if (firstResponse.success && firstResponse.data) {
        const firstData = Array.isArray(firstResponse.data) ? firstResponse.data : JSON.parse(firstResponse.data)
        allItems.push(...firstData)
        totalItems = firstResponse.totalItems || firstData.length

        // Atualizar progresso
        const progress: SyncProgress = {
          currentPage: 1,
          totalPages: Math.ceil(totalItems / this.config.itemsPerPage),
          itemsLoaded: allItems.length,
          totalItems,
          percentage: Math.round((allItems.length / totalItems) * 100),
          isComplete: false,
          errors: []
        }

        onProgress?.(progress)
        console.log(` Página 1: ${allItems.length} itens carregados (${progress.percentage}%)`)

        // Continuar carregando páginas se houver mais dados
        if (firstData.length === this.config.itemsPerPage) {
          currentPage = 2
          hasMore = true
        } else {
          hasMore = false
        }
      } else {
        throw new Error(`Erro na primeira requisição: ${firstResponse.error}`)
      }

      // Carregar páginas restantes gradualmente
      while (hasMore) {
        try {
          const response = await this.makeRequest(
            `${baseUrl}/wp-json/wp/v2/${endpoint}?per_page=${this.config.itemsPerPage}&page=${currentPage}`,
            username,
            password
          )

          if (response.success && response.data) {
            const pageData = Array.isArray(response.data) ? response.data : JSON.parse(response.data)
            
            if (pageData.length === 0) {
              hasMore = false
            } else {
              allItems.push(...pageData)
              
              // Atualizar progresso
              const progress: SyncProgress = {
                currentPage,
                totalPages: Math.ceil(totalItems / this.config.itemsPerPage),
                itemsLoaded: allItems.length,
                totalItems,
                percentage: Math.round((allItems.length / totalItems) * 100),
                isComplete: false,
                errors: [...errors]
              }

              onProgress?.(progress)
              console.log(` Página ${currentPage}: ${pageData.length} itens carregados (${progress.percentage}%)`)

              // Verificar se ainda há mais páginas
              if (pageData.length < this.config.itemsPerPage) {
                hasMore = false
              } else {
                currentPage++
              }
            }
          } else {
            console.warn(` Erro na página ${currentPage}: ${response.error}`)
            errors.push(`Página ${currentPage}: ${response.error}`)
            hasMore = false
          }
        } catch (error) {
          console.error(` Erro na página ${currentPage}:`, error)
          errors.push(`Página ${currentPage}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
          hasMore = false
        }
      }

      // Progresso final
      const finalProgress: SyncProgress = {
        currentPage,
        totalPages: Math.ceil(totalItems / this.config.itemsPerPage),
        itemsLoaded: allItems.length,
        totalItems,
        percentage: 100,
        isComplete: true,
        errors: [...errors]
      }

      onProgress?.(finalProgress)
      console.log(` Sincronização gradual concluída: ${allItems.length} itens carregados`)

      return {
        items: allItems,
        progress: finalProgress,
        success: true
      }

    } catch (error) {
      console.error(' Erro na sincronização gradual:', error)
      return {
        items: allItems,
        progress: {
          currentPage,
          totalPages: Math.ceil(totalItems / this.config.itemsPerPage),
          itemsLoaded: allItems.length,
          totalItems,
          percentage: Math.round((allItems.length / totalItems) * 100),
          isComplete: false,
          errors: [...errors, error instanceof Error ? error.message : 'Erro desconhecido']
        },
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // Fazer requisição com retry e timeout
  private async makeRequest(
    url: string,
    username: string,
    password: string,
    retryCount: number = 0
  ): Promise<{ success: boolean; data?: any; totalItems?: number; error?: string }> {
    try {
      console.log(`Tentativa ${retryCount + 1}/${this.config.maxRetries} para ${url}`)
      
      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(`${username}:${password}`)}`
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          let items = []
          if (typeof data.data === 'string') {
            items = JSON.parse(data.data)
          } else if (Array.isArray(data.data)) {
            items = data.data
          }

          return {
            success: true,
            data: items,
            totalItems: data.totalItems || items.length
          }
        } else {
          return {
            success: false,
            error: data.error || 'Resposta inválida do servidor'
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        console.log(` Tentativa ${retryCount + 1}/${this.config.maxRetries} falhou, tentando novamente...`)
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
        return this.makeRequest(url, username, password, retryCount + 1)
      } else {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }
    }
  }

  // Configurar parâmetros
  setConfig(config: Partial<GradualSyncConfig>) {
    this.config = { ...this.config, ...config }
    console.log(' Configuração atualizada:', this.config)
  }

  // Obter configuração atual
  getConfig(): GradualSyncConfig {
    return { ...this.config }
  }
}


