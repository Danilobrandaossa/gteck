// Sistema de Sincronização Inteligente - Carregamento Gradual e Priorização
export interface SmartSyncConfig {
  initialLoad: number        // Quantidade inicial (ex: 15)
  backgroundBatch: number    // Lote para segundo plano (ex: 10)
  delayBetweenRequests: number // Delay entre requisições (ms)
  maxRetries: number
  retryDelay: number
  timeout: number
}

export interface SyncProgress {
  phase: 'initial' | 'background' | 'complete'
  currentStep: string
  percentage: number
  itemsLoaded: number
  totalItems: number
  backgroundProgress: number
  isComplete: boolean
  hasError: boolean
  errors: string[]
  details: string[]
}

export interface SmartSyncResult {
  success: boolean
  initialData: any[]
  backgroundData: any[]
  totalLoaded: number
  errors: string[]
  stats: {
    initialLoad: number
    backgroundLoad: number
    totalLoad: number
    duration: number
  }
}

export class SmartSyncManager {
  private static instance: SmartSyncManager
  private config: SmartSyncConfig = {
    initialLoad: 15,
    backgroundBatch: 10,
    delayBetweenRequests: 2000, // 2 segundos entre requisições
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000
  }
  private backgroundSyncActive = false
  private backgroundData: any[] = []
  private backgroundErrors: string[] = []

  private constructor() {}

  static getInstance(): SmartSyncManager {
    if (!SmartSyncManager.instance) {
      SmartSyncManager.instance = new SmartSyncManager()
    }
    return SmartSyncManager.instance
  }

  // Sincronização inteligente com carregamento gradual
  async smartSync<T>(
    baseUrl: string,
    username: string,
    password: string,
    endpoint: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<SmartSyncResult> {
    console.log('Iniciando sincronização inteligente...')
    console.log(`Configuração: ${this.config.initialLoad} itens iniciais, ${this.config.backgroundBatch} em lote`)
    
    const startTime = Date.now()
    const result: SmartSyncResult = {
      success: false,
      initialData: [],
      backgroundData: [],
      totalLoaded: 0,
      errors: [],
      stats: {
        initialLoad: 0,
        backgroundLoad: 0,
        totalLoad: 0,
        duration: 0
      }
    }

    try {
      // FASE 1: Carregamento inicial (priorizando conteúdo mais novo)
      console.log('Fase 1: Carregamento inicial...')
      const initialProgress: SyncProgress = {
        phase: 'initial',
        currentStep: 'Carregando conteúdo inicial...',
        percentage: 0,
        itemsLoaded: 0,
        totalItems: 0,
        backgroundProgress: 0,
        isComplete: false,
        hasError: false,
        errors: [],
        details: ['Priorizando conteúdo mais novo...', 'Carregando primeiros itens...']
      }
      onProgress?.(initialProgress)

      // Carregar conteúdo inicial (mais recente primeiro)
      const initialData = await this.loadInitialContent(
        baseUrl,
        username,
        password,
        endpoint,
        (progress) => {
          const updatedProgress: SyncProgress = {
            ...initialProgress,
            percentage: Math.round((progress.itemsLoaded / this.config.initialLoad) * 100),
            itemsLoaded: progress.itemsLoaded,
            totalItems: this.config.initialLoad,
            details: [
              ...initialProgress.details,
              `Carregados: ${progress.itemsLoaded}/${this.config.initialLoad} itens`,
              `Progresso: ${Math.round((progress.itemsLoaded / this.config.initialLoad) * 100)}%`
            ]
          }
          onProgress?.(updatedProgress)
        }
      )

      result.initialData = initialData
      result.stats.initialLoad = initialData.length

      // FASE 2: Iniciar sincronização em segundo plano
      console.log('Fase 2: Iniciando sincronização em segundo plano...')
      const backgroundProgress: SyncProgress = {
        phase: 'background',
        currentStep: 'Sincronização em segundo plano iniciada...',
        percentage: 100,
        itemsLoaded: initialData.length,
        totalItems: initialData.length,
        backgroundProgress: 0,
        isComplete: false,
        hasError: false,
        errors: [],
        details: [
          'Carregamento inicial concluído!',
          'Iniciando sincronização em segundo plano...',
          'Você pode continuar usando o sistema normalmente'
        ]
      }
      onProgress?.(backgroundProgress)

      // Iniciar sincronização em segundo plano
      this.startBackgroundSync(
        baseUrl,
        username,
        password,
        endpoint,
        initialData.length,
        (progress) => {
          const updatedProgress: SyncProgress = {
            ...backgroundProgress,
            backgroundProgress: progress.percentage,
            details: [
              ...backgroundProgress.details,
              `Segundo plano: ${progress.itemsLoaded} itens adicionais`,
              `Progresso total: ${progress.percentage}%`
            ]
          }
          onProgress?.(updatedProgress)
        }
      )

      result.success = true
      result.stats.duration = Date.now() - startTime

      console.log('Sincronização inteligente concluída!')
      console.log(`Estatísticas: ${result.stats.initialLoad} inicial, ${result.stats.backgroundLoad} em segundo plano`)

      return result

    } catch (error) {
      console.error('Erro na sincronização inteligente:', error)
      result.errors.push(error instanceof Error ? error.message : 'Erro desconhecido')
      return result
    }
  }

  // Carregar conteúdo inicial (priorizando mais novo)
  private async loadInitialContent<T>(
    baseUrl: string,
    username: string,
    password: string,
    endpoint: string,
    onProgress?: (progress: { itemsLoaded: number; percentage: number }) => void
  ): Promise<T[]> {
    console.log(`Carregando ${this.config.initialLoad} itens iniciais...`)
    
    const items: T[] = []
    let currentPage = 1
    let itemsLoaded = 0

    try {
      // Carregar em lotes pequenos para evitar Status 400
      while (itemsLoaded < this.config.initialLoad) {
        const remainingItems = this.config.initialLoad - itemsLoaded
        const batchSize = Math.min(5, remainingItems) // Máximo 5 por vez

        console.log(`Carregando lote ${currentPage}: ${batchSize} itens...`)
        
        const response = await this.makeRequestWithDelay(
          `${baseUrl}/wp-json/wp/v2/${endpoint}?per_page=${batchSize}&page=${currentPage}&orderby=date&order=desc`,
          username,
          password
        )

        if (response.success && response.data) {
          const batchData = Array.isArray(response.data) ? response.data : JSON.parse(response.data)
          
          if (batchData.length === 0) {
            console.log('Não há mais itens para carregar')
            break
          }

          items.push(...batchData)
          itemsLoaded += batchData.length

          // Atualizar progresso
          const percentage = Math.round((itemsLoaded / this.config.initialLoad) * 100)
          onProgress?.({ itemsLoaded, percentage })

          console.log(`Lote ${currentPage}: ${batchData.length} itens carregados (${itemsLoaded}/${this.config.initialLoad})`)

          // Delay entre requisições para evitar rate limiting
          if (itemsLoaded < this.config.initialLoad) {
            await this.delay(this.config.delayBetweenRequests)
          }

          currentPage++
        } else {
          console.warn(`Erro no lote ${currentPage}: ${response.error}`)
          break
        }
      }

      console.log(`Carregamento inicial concluído: ${items.length} itens`)
      return items

    } catch (error) {
      console.error('Erro no carregamento inicial:', error)
      return items
    }
  }

  // Iniciar sincronização em segundo plano
  private startBackgroundSync<T>(
    baseUrl: string,
    username: string,
    password: string,
    endpoint: string,
    initialCount: number,
    onProgress?: (progress: { itemsLoaded: number; percentage: number }) => void
  ): void {
    if (this.backgroundSyncActive) {
      console.log('Sincronização em segundo plano já está ativa')
      return
    }

    this.backgroundSyncActive = true
    this.backgroundData = []
    this.backgroundErrors = []

    console.log('Iniciando sincronização em segundo plano...')

    // Executar em segundo plano
    this.backgroundSyncLoop(
      baseUrl,
      username,
      password,
      endpoint,
      initialCount,
      onProgress
    ).then(() => {
      console.log('Sincronização em segundo plano concluída!')
      this.backgroundSyncActive = false
      
      // Enviar notificação de conclusão
      this.sendCompletionNotification()
    }).catch((error) => {
      console.error('Erro na sincronização em segundo plano:', error)
      this.backgroundSyncActive = false
    })
  }

  // Loop de sincronização em segundo plano
  private async backgroundSyncLoop<T>(
    baseUrl: string,
    username: string,
    password: string,
    endpoint: string,
    initialCount: number,
    onProgress?: (progress: { itemsLoaded: number; percentage: number }) => void
  ): Promise<void> {
    let currentPage = Math.ceil(initialCount / this.config.backgroundBatch) + 1
    let totalLoaded = initialCount

    try {
      while (true) {
        console.log(`Segundo plano: Carregando página ${currentPage}...`)
        
        const response = await this.makeRequestWithDelay(
          `${baseUrl}/wp-json/wp/v2/${endpoint}?per_page=${this.config.backgroundBatch}&page=${currentPage}&orderby=date&order=desc`,
          username,
          password
        )

        if (response.success && response.data) {
          const batchData = Array.isArray(response.data) ? response.data : JSON.parse(response.data)
          
          if (batchData.length === 0) {
            console.log('Segundo plano: Não há mais itens para carregar')
            break
          }

          this.backgroundData.push(...batchData)
          totalLoaded += batchData.length

          // Atualizar progresso
          const percentage = Math.round((totalLoaded / (totalLoaded + 100)) * 100) // Estimativa
          onProgress?.({ itemsLoaded: totalLoaded, percentage })

          console.log(`Segundo plano: ${batchData.length} itens carregados (total: ${totalLoaded})`)

          // Delay maior entre requisições em segundo plano
          await this.delay(this.config.delayBetweenRequests * 2)

          currentPage++
        } else {
          console.warn(`Segundo plano: Erro na página ${currentPage}: ${response.error}`)
          this.backgroundErrors.push(`Página ${currentPage}: ${response.error}`)
          
          // Tentar próxima página após delay
          await this.delay(this.config.retryDelay * 2)
          currentPage++
        }
      }

    } catch (error) {
      console.error('Erro no loop de segundo plano:', error)
      this.backgroundErrors.push(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }

  // Fazer requisição com delay e retry
  private async makeRequestWithDelay(
    url: string,
    username: string,
    password: string,
    retryCount: number = 0
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`Requisição: ${url}`)
      
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
          return { success: true, data: data.data }
        } else {
          return { success: false, error: data.error || 'Resposta inválida' }
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        console.log(`Tentativa ${retryCount + 1}/${this.config.maxRetries} falhou, tentando novamente...`)
        await this.delay(this.config.retryDelay)
        return this.makeRequestWithDelay(url, username, password, retryCount + 1)
      } else {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }
    }
  }

  // Delay entre requisições
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Enviar notificação de conclusão
  private sendCompletionNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Sincronização Concluída', {
        body: 'A sincronização em segundo plano foi concluída com sucesso!',
        icon: '/favicon.ico'
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Sincronização Concluída', {
            body: 'A sincronização em segundo plano foi concluída com sucesso!',
            icon: '/favicon.ico'
          })
        }
      })
    }
  }

  // Obter dados do segundo plano
  getBackgroundData(): any[] {
    return this.backgroundData
  }

  // Obter erros do segundo plano
  getBackgroundErrors(): string[] {
    return this.backgroundErrors
  }

  // Verificar se sincronização em segundo plano está ativa
  isBackgroundSyncActive(): boolean {
    return this.backgroundSyncActive
  }

  // Configurar parâmetros
  setConfig(config: Partial<SmartSyncConfig>) {
    this.config = { ...this.config, ...config }
    console.log('Configuração de sincronização inteligente atualizada:', this.config)
  }

  // Obter configuração atual
  getConfig(): SmartSyncConfig {
    return { ...this.config }
  }
}
