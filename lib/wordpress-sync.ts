// Sincronização completa e organização de dados WordPress no CMS
import { WordPressAPI } from './wordpress-api'

export interface WordPressContent {
  posts: any[]
  pages: any[]
  media: any[]
  categories: any[]
  tags: any[]
  users: any[]
}

export interface SyncResult {
  success: boolean
  data: WordPressContent
  stats: {
    posts: number
    pages: number
    media: number
    categories: number
    tags: number
    users: number
  }
  errors?: string[]
}

export class WordPressSync {
  private wpApi: WordPressAPI

  constructor(baseUrl: string, username: string, password: string) {
    this.wpApi = new WordPressAPI(baseUrl, username, password)
  }

  // Sincronização completa de todos os dados
  async syncAllContent(): Promise<SyncResult> {
    try {
      console.log('Iniciando sincronização completa do WordPress...')
      
      const errors: string[] = []
      
      // Buscar todos os dados em paralelo
      const [posts, pages, media, categories, tags, users] = await Promise.all([
        this.fetchAllPosts().catch(err => {
          console.error('Erro ao buscar posts:', err)
          errors.push(`Posts: ${err.message}`)
          return []
        }),
        this.fetchAllPages().catch(err => {
          console.error('Erro ao buscar páginas:', err)
          errors.push(`Páginas: ${err.message}`)
          return []
        }),
        this.fetchAllMedia().catch(err => {
          console.error('Erro ao buscar mídia:', err)
          errors.push(`Mídia: ${err.message}`)
          return []
        }),
        this.fetchAllCategories().catch(err => {
          console.error('Erro ao buscar categorias:', err)
          errors.push(`Categorias: ${err.message}`)
          return []
        }),
        this.fetchAllTags().catch(err => {
          console.error('Erro ao buscar tags:', err)
          errors.push(`Tags: ${err.message}`)
          return []
        }),
        this.fetchAllUsers().catch(err => {
          console.error('Erro ao buscar usuários:', err)
          errors.push(`Usuários: ${err.message}`)
          return []
        })
      ])

      const result: SyncResult = {
        success: errors.length === 0,
        data: {
          posts,
          pages,
          media,
          categories,
          tags,
          users
        },
        stats: {
          posts: posts.length,
          pages: pages.length,
          media: media.length,
          categories: categories.length,
          tags: tags.length,
          users: users.length
        },
        errors: errors.length > 0 ? errors : undefined
      }

      console.log('Sincronização concluída:')
      console.log(`Posts: ${result.stats.posts}`)
      console.log(`Páginas: ${result.stats.pages}`)
      console.log(`Mídia: ${result.stats.media}`)
      console.log(`Categorias: ${result.stats.categories}`)
      console.log(`Tags: ${result.stats.tags}`)
      console.log(`Usuários: ${result.stats.users}`)

      if (errors.length > 0) {
        console.warn('Erros durante a sincronização:', errors)
      }

      return result

    } catch (error) {
      console.error('Erro na sincronização completa:', error)
      return {
        success: false,
        data: {
          posts: [],
          pages: [],
          media: [],
          categories: [],
          tags: [],
          users: []
        },
        stats: {
          posts: 0,
          pages: 0,
          media: 0,
          categories: 0,
          tags: 0,
          users: 0
        },
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      }
    }
  }

  // Buscar todos os posts (com paginação)
  private async fetchAllPosts(): Promise<any[]> {
    const allPosts: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      console.log(`Buscando posts - página ${page}...`)
      
      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${this.wpApi['baseUrl']}/wp-json/wp/v2/posts?per_page=100&page=${page}&status=publish`,
          method: 'GET',
          headers: { 'Authorization': this.wpApi['authHeader'] }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error('Falha na resposta do proxy')
      }

      let posts = []
      if (typeof result.data === 'string') {
        try {
          posts = JSON.parse(result.data)
        } catch (parseError) {
          console.error('Erro ao fazer parse dos posts:', parseError)
          posts = []
        }
      } else if (Array.isArray(result.data)) {
        posts = result.data
      } else {
        console.warn('Formato inesperado de dados de posts:', typeof result.data)
        posts = []
      }
      
      console.log(`Posts recebidos: ${posts.length} (tipo: ${typeof posts})`)

      if (posts.length === 0) {
        hasMore = false
      } else {
        // Verificar se posts é um array antes de fazer spread
        if (Array.isArray(posts)) {
          allPosts.push(...posts)
        } else {
          console.warn('Posts não é um array:', typeof posts)
        }
        page++
        
        // Limite de segurança para evitar loops infinitos
        if (page > 50) {
          console.warn('Limite de páginas atingido (50)')
          break
        }
      }
    }

    console.log(`Posts encontrados: ${allPosts.length}`)
    return allPosts
  }

  // Buscar todas as páginas (com paginação)
  private async fetchAllPages(): Promise<any[]> {
    const allPages: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      console.log(` Buscando páginas - página ${page}...`)
      
      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${this.wpApi['baseUrl']}/wp-json/wp/v2/pages?per_page=100&page=${page}&status=publish`,
          method: 'GET',
          headers: { 'Authorization': this.wpApi['authHeader'] }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error('Falha na resposta do proxy')
      }

      let pages = []
      if (typeof result.data === 'string') {
        try {
          pages = JSON.parse(result.data)
        } catch (parseError) {
          console.error(' Erro ao fazer parse das páginas:', parseError)
          pages = []
        }
      } else if (Array.isArray(result.data)) {
        pages = result.data
      } else {
        console.warn(' Formato inesperado de dados de páginas:', typeof result.data)
        pages = []
      }
      
      console.log(` Páginas recebidas: ${pages.length} (tipo: ${typeof pages})`)

      if (pages.length === 0) {
        hasMore = false
      } else {
        // Verificar se pages é um array antes de fazer spread
        if (Array.isArray(pages)) {
          allPages.push(...pages)
        } else {
          console.warn(' Pages não é um array:', typeof pages)
        }
        page++
        
        if (page > 50) {
          console.warn('Limite de páginas atingido (50)')
          break
        }
      }
    }

    console.log(` Páginas encontradas: ${allPages.length}`)
    return allPages
  }

  // Buscar toda a mídia (com paginação)
  private async fetchAllMedia(): Promise<any[]> {
    const allMedia: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      console.log(` Buscando mídia - página ${page}...`)
      
      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${this.wpApi['baseUrl']}/wp-json/wp/v2/media?per_page=100&page=${page}`,
          method: 'GET',
          headers: { 'Authorization': this.wpApi['authHeader'] }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error('Falha na resposta do proxy')
      }

      let media = []
      if (typeof result.data === 'string') {
        try {
          media = JSON.parse(result.data)
        } catch (parseError) {
          console.error(' Erro ao fazer parse da mídia:', parseError)
          media = []
        }
      } else if (Array.isArray(result.data)) {
        media = result.data
      } else {
        console.warn(' Formato inesperado de dados de mídia:', typeof result.data)
        media = []
      }
      
      console.log(` Mídia recebida: ${media.length} (tipo: ${typeof media})`)

      if (media.length === 0) {
        hasMore = false
      } else {
        // Verificar se media é um array antes de fazer spread
        if (Array.isArray(media)) {
          allMedia.push(...media)
        } else {
          console.warn(' Media não é um array:', typeof media)
        }
        page++
        
        if (page > 50) {
          console.warn('Limite de páginas atingido (50)')
          break
        }
      }
    }

    console.log(` Mídia encontrada: ${allMedia.length}`)
    return allMedia
  }

  // Buscar todas as categorias
  private async fetchAllCategories(): Promise<any[]> {
    console.log(' Buscando categorias...')
    
    const response = await fetch('/api/wordpress/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `${this.wpApi['baseUrl']}/wp-json/wp/v2/categories?per_page=100`,
        method: 'GET',
        headers: { 'Authorization': this.wpApi['authHeader'] }
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error('Falha na resposta do proxy')
    }

    let categories = []
    if (typeof result.data === 'string') {
      categories = JSON.parse(result.data)
    } else if (Array.isArray(result.data)) {
      categories = result.data
    }

    console.log(` Categorias encontradas: ${categories.length}`)
    return categories
  }

  // Buscar todas as tags
  private async fetchAllTags(): Promise<any[]> {
    console.log(' Buscando tags...')
    
    const response = await fetch('/api/wordpress/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `${this.wpApi['baseUrl']}/wp-json/wp/v2/tags?per_page=100`,
        method: 'GET',
        headers: { 'Authorization': this.wpApi['authHeader'] }
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error('Falha na resposta do proxy')
    }

    let tags = []
    if (typeof result.data === 'string') {
      tags = JSON.parse(result.data)
    } else if (Array.isArray(result.data)) {
      tags = result.data
    }

    console.log(` Tags encontradas: ${tags.length}`)
    return tags
  }

  // Buscar todos os usuários
  private async fetchAllUsers(): Promise<any[]> {
    console.log(' Buscando usuários...')
    
    const response = await fetch('/api/wordpress/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `${this.wpApi['baseUrl']}/wp-json/wp/v2/users?per_page=100`,
        method: 'GET',
        headers: { 'Authorization': this.wpApi['authHeader'] }
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error('Falha na resposta do proxy')
    }

    let users = []
    if (typeof result.data === 'string') {
      users = JSON.parse(result.data)
    } else if (Array.isArray(result.data)) {
      users = result.data
    }

    console.log(` Usuários encontrados: ${users.length}`)
    return users
  }
}