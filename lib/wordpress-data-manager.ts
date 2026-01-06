// Gerenciador de Dados WordPress - Sincronização Completa
import { WordPressAPI } from './wordpress-api'
import { GradualSyncManager, SyncProgress } from './gradual-sync-manager'

export interface WordPressData {
  posts: any[]
  pages: any[]
  media: any[]
  categories: any[]
  tags: any[]
  users: any[]
  lastSync: Date
}

export interface SyncStats {
  posts: number
  pages: number
  media: number
  categories: number
  tags: number
  users: number
  totalItems: number
}

export class WordPressDataManager {
  private static instance: WordPressDataManager
  private data: WordPressData = {
    posts: [],
    pages: [],
    media: [],
    categories: [],
    tags: [],
    users: [],
    lastSync: new Date()
  }
  private gradualSyncManager = GradualSyncManager.getInstance()

  private constructor() {}

  static getInstance(): WordPressDataManager {
    if (!WordPressDataManager.instance) {
      WordPressDataManager.instance = new WordPressDataManager()
    }
    return WordPressDataManager.instance
  }

  // Sincronizar todos os dados do WordPress com carregamento gradual
  async syncAllData(
    baseUrl: string, 
    username: string, 
    password: string,
    onProgress?: (type: string, progress: SyncProgress) => void
  ): Promise<SyncStats> {
    console.log(' Iniciando sincronização gradual com WordPress...')
    console.log(` Site: ${baseUrl}`)
    console.log(`👤 Usuário: ${username}`)
    console.log(` Carregamento: 15 itens por vez`)

    try {
      // Configurar carregamento gradual
      this.gradualSyncManager.setConfig({
        itemsPerPage: 15,
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000
      })

      // Sincronizar cada tipo de dado gradualmente
      const [posts, pages, media, categories, tags, users] = await Promise.all([
        this.syncGradually(baseUrl, username, password, 'posts', (progress) => onProgress?.('posts', progress)),
        this.syncGradually(baseUrl, username, password, 'pages', (progress) => onProgress?.('pages', progress)),
        this.syncGradually(baseUrl, username, password, 'media', (progress) => onProgress?.('media', progress)),
        this.syncGradually(baseUrl, username, password, 'categories', (progress) => onProgress?.('categories', progress)),
        this.syncGradually(baseUrl, username, password, 'tags', (progress) => onProgress?.('tags', progress)),
        this.syncGradually(baseUrl, username, password, 'users', (progress) => onProgress?.('users', progress))
      ])

      // Atualizar dados
      this.data = {
        posts,
        pages,
        media,
        categories,
        tags,
        users,
        lastSync: new Date()
      }

      // Salvar no localStorage
      this.saveToLocalStorage()

      const stats: SyncStats = {
        posts: posts.length,
        pages: pages.length,
        media: media.length,
        categories: categories.length,
        tags: tags.length,
        users: users.length,
        totalItems: posts.length + pages.length + media.length + categories.length + tags.length + users.length
      }

      console.log(' Sincronização gradual concluída:', stats)
      return stats

    } catch (error) {
      console.error(' Erro na sincronização gradual:', error)
      throw error
    }
  }

  // Sincronizar dados gradualmente
  private async syncGradually(
    baseUrl: string,
    username: string,
    password: string,
    endpoint: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<any[]> {
    console.log(` Sincronizando ${endpoint} gradualmente...`)
    
    const result = await this.gradualSyncManager.syncGradually(
      baseUrl,
      username,
      password,
      endpoint,
      onProgress
    )

    if (result.success) {
      console.log(` ${endpoint}: ${result.items.length} itens carregados`)
      return result.items
    } else {
      console.error(` Erro ao sincronizar ${endpoint}:`, result.error)
      return []
    }
  }


  // Salvar dados no localStorage
  private saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cms-wordpress-data', JSON.stringify(this.data))
      console.log(' Dados salvos no localStorage')
    }
  }

  // Carregar dados do localStorage
  loadFromLocalStorage(): WordPressData | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cms-wordpress-data')
      if (stored) {
        try {
          this.data = JSON.parse(stored)
          console.log(' Dados carregados do localStorage')
          return this.data
        } catch (error) {
          console.error(' Erro ao carregar dados do localStorage:', error)
        }
      }
    }
    return null
  }

  // Obter dados
  getData(): WordPressData {
    return this.data
  }

  // Obter posts
  getPosts(): any[] {
    return this.data.posts
  }

  // Obter páginas
  getPages(): any[] {
    return this.data.pages
  }

  // Obter mídia
  getMedia(): any[] {
    return this.data.media
  }

  // Obter categorias
  getCategories(): any[] {
    return this.data.categories
  }

  // Obter tags
  getTags(): any[] {
    return this.data.tags
  }

  // Obter usuários
  getUsers(): any[] {
    return this.data.users
  }

  // Obter estatísticas
  getStats(): SyncStats {
    return {
      posts: this.data.posts.length,
      pages: this.data.pages.length,
      media: this.data.media.length,
      categories: this.data.categories.length,
      tags: this.data.tags.length,
      users: this.data.users.length,
      totalItems: this.data.posts.length + this.data.pages.length + this.data.media.length + 
                  this.data.categories.length + this.data.tags.length + this.data.users.length
    }
  }

  // Limpar dados
  clearData() {
    this.data = {
      posts: [],
      pages: [],
      media: [],
      categories: [],
      tags: [],
      users: [],
      lastSync: new Date()
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cms-wordpress-data')
    }
    console.log(' Dados limpos')
  }
}
