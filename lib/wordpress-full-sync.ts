// Sincronização Completa com WordPress - Site ATLZ
import { WordPressAPI } from './wordpress-api'

export interface SyncResult {
  success: boolean
  data: {
    posts: any[]
    pages: any[]
    media: any[]
    categories: any[]
    tags: any[]
    users: any[]
  }
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

export class WordPressFullSync {
  private wpApi: WordPressAPI
  private baseUrl: string
  private username: string
  private password: string

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl
    this.username = username
    this.password = password
    this.wpApi = new WordPressAPI(baseUrl, username, password)
  }

  // Sincronizar todos os dados do WordPress
  async syncAllData(): Promise<SyncResult> {
    console.log('🔄 Iniciando sincronização completa com WordPress...')
    
    try {
      // Buscar todos os dados em paralelo
      const [posts, pages, media, categories, tags, users] = await Promise.all([
        this.fetchAllPosts(),
        this.fetchAllPages(),
        this.fetchAllMedia(),
        this.fetchAllCategories(),
        this.fetchAllTags(),
        this.fetchAllUsers()
      ])

      const result: SyncResult = {
        success: true,
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
        }
      }

      console.log('✅ Sincronização completa concluída:', result.stats)
      return result

    } catch (error) {
      console.error('❌ Erro na sincronização completa:', error)
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

  // Buscar todos os posts com paginação
  private async fetchAllPosts(): Promise<any[]> {
    console.log('📝 Buscando todos os posts...')
    const allPosts = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      try {
        const response = await fetch('/api/wordpress/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${this.baseUrl}/wp-json/wp/v2/posts?per_page=100&page=${page}&status=publish`,
            method: 'GET',
            headers: {
              'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            let posts = []
            if (typeof data.data === 'string') {
              posts = JSON.parse(data.data)
            } else if (Array.isArray(data.data)) {
              posts = data.data
            }

            if (posts.length === 0) {
              hasMore = false
            } else {
              allPosts.push(...posts)
              console.log(`📝 Posts página ${page}: ${posts.length} encontrados`)
              page++
            }
          } else {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar posts página ${page}:`, error)
        hasMore = false
      }
    }

    console.log(`✅ Total de posts encontrados: ${allPosts.length}`)
    return allPosts
  }

  // Buscar todas as páginas com paginação
  private async fetchAllPages(): Promise<any[]> {
    console.log('📄 Buscando todas as páginas...')
    const allPages = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      try {
        const response = await fetch('/api/wordpress/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${this.baseUrl}/wp-json/wp/v2/pages?per_page=100&page=${page}&status=publish`,
            method: 'GET',
            headers: {
              'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            let pages = []
            if (typeof data.data === 'string') {
              pages = JSON.parse(data.data)
            } else if (Array.isArray(data.data)) {
              pages = data.data
            }

            if (pages.length === 0) {
              hasMore = false
            } else {
              allPages.push(...pages)
              console.log(`📄 Páginas página ${page}: ${pages.length} encontradas`)
              page++
            }
          } else {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar páginas página ${page}:`, error)
        hasMore = false
      }
    }

    console.log(`✅ Total de páginas encontradas: ${allPages.length}`)
    return allPages
  }

  // Buscar toda a mídia com paginação
  private async fetchAllMedia(): Promise<any[]> {
    console.log('🖼️ Buscando toda a mídia...')
    const allMedia = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      try {
        const response = await fetch('/api/wordpress/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${this.baseUrl}/wp-json/wp/v2/media?per_page=100&page=${page}`,
            method: 'GET',
            headers: {
              'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            let media = []
            if (typeof data.data === 'string') {
              media = JSON.parse(data.data)
            } else if (Array.isArray(data.data)) {
              media = data.data
            }

            if (media.length === 0) {
              hasMore = false
            } else {
              allMedia.push(...media)
              console.log(`🖼️ Mídia página ${page}: ${media.length} encontradas`)
              page++
            }
          } else {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar mídia página ${page}:`, error)
        hasMore = false
      }
    }

    console.log(`✅ Total de mídia encontrada: ${allMedia.length}`)
    return allMedia
  }

  // Buscar todas as categorias
  private async fetchAllCategories(): Promise<any[]> {
    console.log('🏷️ Buscando todas as categorias...')
    try {
      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${this.baseUrl}/wp-json/wp/v2/categories?per_page=100`,
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          let categories = []
          if (typeof data.data === 'string') {
            categories = JSON.parse(data.data)
          } else if (Array.isArray(data.data)) {
            categories = data.data
          }
          console.log(`✅ Total de categorias encontradas: ${categories.length}`)
          return categories
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error)
    }
    return []
  }

  // Buscar todas as tags
  private async fetchAllTags(): Promise<any[]> {
    console.log('🔖 Buscando todas as tags...')
    try {
      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${this.baseUrl}/wp-json/wp/v2/tags?per_page=100`,
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          let tags = []
          if (typeof data.data === 'string') {
            tags = JSON.parse(data.data)
          } else if (Array.isArray(data.data)) {
            tags = data.data
          }
          console.log(`✅ Total de tags encontradas: ${tags.length}`)
          return tags
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar tags:', error)
    }
    return []
  }

  // Buscar todos os usuários
  private async fetchAllUsers(): Promise<any[]> {
    console.log('👥 Buscando todos os usuários...')
    try {
      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${this.baseUrl}/wp-json/wp/v2/users?per_page=100`,
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          let users = []
          if (typeof data.data === 'string') {
            users = JSON.parse(data.data)
          } else if (Array.isArray(data.data)) {
            users = data.data
          }
          console.log(`✅ Total de usuários encontrados: ${users.length}`)
          return users
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error)
    }
    return []
  }
}











