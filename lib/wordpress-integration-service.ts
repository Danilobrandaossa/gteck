// Serviço unificado para integração WordPress
import { WordPressDataManager } from './wordpress-data-manager'
import { WordPressService } from './ai-services'

export interface WordPressCredentials {
  url: string
  username: string
  password: string
}

export interface SyncOptions {
  gradual?: boolean
  itemsPerPage?: number
  onProgress?: (type: string, progress: any) => void
}

export interface WordPressPostData {
  title: string
  content: string
  status: 'draft' | 'published' | 'archived'
  slug?: string
  excerpt?: string
  categories?: number[]
  tags?: number[]
  featured_media?: number
  acf_fields?: Record<string, any>
  idempotency_key?: string
}

export class WordPressIntegrationService {
  private dataManager: WordPressDataManager
  private wpService: WordPressService | null = null

  constructor() {
    this.dataManager = WordPressDataManager.getInstance()
  }

  // Configurar credenciais
  configure(credentials: WordPressCredentials) {
    const config = {
      id: '1',
      name: 'WordPress Site',
      type: 'wordpress' as const,
      status: 'active' as const,
      credentials: {
        endpoint: credentials.url,
        username: credentials.username,
        password: credentials.password
      },
      settings: {
        timeout: 30000,
        retries: 3
      },
      usage: {
        requests: 0,
        tokens: 0,
        cost: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.wpService = new WordPressService(config)
  }

  // Sincronizar dados do WordPress
  async syncData(options: SyncOptions = {}) {
    if (!this.wpService) {
      throw new Error('Credenciais WordPress não configuradas')
    }

    const { gradual = true, itemsPerPage = 15, onProgress } = options

    if (gradual) {
      return await this.dataManager.syncAllData(
        this.wpService.config.credentials.endpoint,
        this.wpService.config.credentials.username,
        this.wpService.config.credentials.password,
        onProgress
      )
    } else {
      // Sincronização completa (legacy)
      const { WordPressSync } = await import('./wordpress-sync')
      const wpSync = new WordPressSync(
        this.wpService.config.credentials.endpoint,
        this.wpService.config.credentials.username,
        this.wpService.config.credentials.password
      )
      
      return await wpSync.syncAllContent()
    }
  }

  // Criar post no WordPress
  async createPost(postData: WordPressPostData) {
    if (!this.wpService) {
      throw new Error('Credenciais WordPress não configuradas')
    }

    // Gerar chave de idempotência se não fornecida
    if (!postData.idempotency_key) {
      postData.idempotency_key = this.generateIdempotencyKey(postData)
    }

    return await this.wpService.createPost({
      title: postData.title,
      content: postData.content,
      status: postData.status as 'draft' | 'publish' | 'private',
      slug: postData.slug,
      excerpt: postData.excerpt,
      categories: postData.categories,
      tags: postData.tags,
      featured_media: postData.featured_media,
      meta: {},
      acf_fields: postData.acf_fields,
      idempotency_key: postData.idempotency_key
    })
  }

  // Atualizar post no WordPress
  async updatePost(postId: number, postData: Partial<WordPressPostData>) {
    if (!this.wpService) {
      throw new Error('Credenciais WordPress não configuradas')
    }

    // Implementar atualização de post
    const response = await fetch(`${this.wpService.config.credentials.endpoint}/wp-json/wp/v2/posts/${postId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${this.wpService.config.credentials.username}:${this.wpService.config.credentials.password}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: postData.title,
        content: postData.content,
        status: postData.status,
        slug: postData.slug,
        excerpt: postData.excerpt,
        categories: postData.categories,
        tags: postData.tags,
        featured_media: postData.featured_media
      })
    })

    if (!response.ok) {
      throw new Error(`Erro ao atualizar post: ${response.status}`)
    }

    return await response.json()
  }

  // Deletar post no WordPress
  async deletePost(postId: number) {
    if (!this.wpService) {
      throw new Error('Credenciais WordPress não configuradas')
    }

    const response = await fetch(`${this.wpService.config.credentials.endpoint}/wp-json/wp/v2/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${btoa(`${this.wpService.config.credentials.username}:${this.wpService.config.credentials.password}`)}`
      }
    })

    if (!response.ok) {
      throw new Error(`Erro ao deletar post: ${response.status}`)
    }

    return await response.json()
  }

  // Testar conexão
  async testConnection(): Promise<boolean> {
    if (!this.wpService) {
      return false
    }

    try {
      return await this.wpService.testConnection()
    } catch (error) {
      console.error('Erro ao testar conexão:', error)
      return false
    }
  }

  // Carregar dados do localStorage
  loadFromLocalStorage() {
    return this.dataManager.loadFromLocalStorage()
  }

  // Gerar chave de idempotência
  private generateIdempotencyKey(postData: WordPressPostData): string {
    const timestamp = Date.now()
    const contentHash = this.hashString(postData.title + postData.content)
    return `cms_${timestamp}_${contentHash}`
  }

  // Hash simples para idempotência
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

// Instância singleton
export const wordpressIntegration = new WordPressIntegrationService()









