// Integração real com WordPress REST API
export interface WordPressPost {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  status: string
  date: string
  slug: string
  type: string
  author: number
  featured_media: number
  categories: number[]
  tags: number[]
}

export interface WordPressPage {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  status: string
  date: string
  slug: string
  parent: number
  menu_order: number
}

export interface WordPressMedia {
  id: number
  title: { rendered: string }
  media_type: string
  mime_type: string
  source_url: string
  date: string
  alt_text: string
}

export interface WordPressStats {
  posts: number
  pages: number
  media: number
  categories: number
  tags: number
  users: number
  lastSync: Date
}

export class WordPressAPI {
  private baseUrl: string
  private username: string
  private password: string
  private authHeader: string

  constructor(siteUrl: string, username: string, password: string) {
    this.baseUrl = siteUrl.replace(/\/$/, '') // Remove trailing slash
    this.username = username
    this.password = password
    this.authHeader = 'Basic ' + btoa(`${username}:${password}`)
  }

  // Testar conexão com WordPress usando proxy
  async testConnection(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Usar proxy para contornar CORS
      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: `${this.baseUrl}/wp-json/wp/v2/`,
          method: 'GET',
          headers: {
            'Authorization': this.authHeader
          }
        })
      })

      const result = await response.json()

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Erro na conexão'
        }
      }

      // Parse do JSON retornado
      const data = JSON.parse(result.data)
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // Obter estatísticas reais do site
  async getSiteStats(): Promise<WordPressStats> {
    try {
      console.log(' Iniciando sincronização completa com WordPress...')
      
      // Obter contadores totais primeiro (sem per_page para obter o total real)
      const [postsTotalResponse, pagesTotalResponse, mediaTotalResponse, categoriesTotalResponse, tagsTotalResponse, usersTotalResponse] = await Promise.all([
        fetch('/api/wordpress/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${this.baseUrl}/wp-json/wp/v2/posts?status=publish`,
            method: 'GET',
            headers: { 'Authorization': this.authHeader }
          })
        }),
        fetch('/api/wordpress/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${this.baseUrl}/wp-json/wp/v2/pages?status=publish`,
            method: 'GET',
            headers: { 'Authorization': this.authHeader }
          })
        }),
        fetch('/api/wordpress/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${this.baseUrl}/wp-json/wp/v2/media`,
            method: 'GET',
            headers: { 'Authorization': this.authHeader }
          })
        }),
        fetch('/api/wordpress/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${this.baseUrl}/wp-json/wp/v2/categories`,
            method: 'GET',
            headers: { 'Authorization': this.authHeader }
          })
        }),
        fetch('/api/wordpress/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${this.baseUrl}/wp-json/wp/v2/tags`,
            method: 'GET',
            headers: { 'Authorization': this.authHeader }
          })
        }),
        fetch('/api/wordpress/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${this.baseUrl}/wp-json/wp/v2/users`,
            method: 'GET',
            headers: { 'Authorization': this.authHeader }
          })
        })
      ])

      const getTotalCount = async (response: Response, type: string) => {
        if (!response.ok) {
          console.error(` ${type} Response not OK:`, response.status, response.statusText)
          return 0
        }
        
        try {
          const result = await response.json()
          console.log(` ${type} Proxy response:`, result)
          
          if (!result.success) {
            console.error(` ${type} Proxy returned success: false`)
            return 0
          }
          
          let data = []
          
          // Verificar se result.data é uma string JSON válida
          if (typeof result.data === 'string') {
            // Se for string, tentar fazer parse
            data = JSON.parse(result.data)
            console.log(` ${type} Parsed data:`, data.length, 'items')
          } else if (Array.isArray(result.data)) {
            // Se já for array, usar diretamente
            data = result.data
            console.log(` ${type} Array data:`, data.length, 'items')
          } else {
            console.error(` ${type} Data format not recognized:`, typeof result.data)
            return 0
          }
          
          return data.length || 0
        } catch (parseError) {
          console.error(` ${type} Parse error:`, parseError)
          const responseText = await response.text()
          console.log(` ${type} Raw response (first 500 chars):`, responseText.substring(0, 500))
          return 0
        }
      }

      console.log(' Processando respostas...')
      
      const [posts, pages, media, categories, tags, users] = await Promise.all([
        getTotalCount(postsTotalResponse, 'Posts'),
        getTotalCount(pagesTotalResponse, 'Pages'),
        getTotalCount(mediaTotalResponse, 'Media'),
        getTotalCount(categoriesTotalResponse, 'Categories'),
        getTotalCount(tagsTotalResponse, 'Tags'),
        getTotalCount(usersTotalResponse, 'Users')
      ])

      console.log('🎯 Resultados da sincronização:')
      console.log(`📝 Posts: ${posts}`)
      console.log(` Pages: ${pages}`)
      console.log(`🖼️ Media: ${media}`)
      console.log(`🏷️ Categories: ${categories}`)
      console.log(`🔖 Tags: ${tags}`)
      console.log(`👥 Users: ${users}`)

      return {
        posts,
        pages,
        media,
        categories,
        tags,
        users,
        lastSync: new Date()
      }
    } catch (error) {
      console.error(' Erro ao obter estatísticas:', error)
      throw new Error('Falha ao conectar com WordPress')
    }
  }

  // Obter posts do WordPress
  async getPosts(perPage: number = 10, page: number = 1): Promise<WordPressPost[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&status=publish`,
        {
          headers: { 'Authorization': this.authHeader }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao obter posts:', error)
      throw error
    }
  }

  // Obter páginas do WordPress
  async getPages(perPage: number = 10, page: number = 1): Promise<WordPressPage[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/wp-json/wp/v2/pages?per_page=${perPage}&page=${page}&status=publish`,
        {
          headers: { 'Authorization': this.authHeader }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao obter páginas:', error)
      throw error
    }
  }

  // Obter mídia do WordPress
  async getMedia(perPage: number = 10, page: number = 1): Promise<WordPressMedia[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/wp-json/wp/v2/media?per_page=${perPage}&page=${page}`,
        {
          headers: { 'Authorization': this.authHeader }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao obter mídia:', error)
      throw error
    }
  }

  // Criar post no WordPress
  async createPost(postData: {
    title: string
    content: string
    status?: 'publish' | 'draft' | 'private'
    excerpt?: string
    categories?: number[]
    tags?: number[]
    featured_media?: number
  }): Promise<WordPressPost> {
    try {
      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${this.baseUrl}/wp-json/wp/v2/posts`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.authHeader
          },
          body: JSON.stringify(postData)
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro na criação do post')
      }

      return JSON.parse(result.data)
    } catch (error) {
      console.error('Erro ao criar post:', error)
      throw error
    }
  }

  // Atualizar post no WordPress
  async updatePost(postId: number, postData: Partial<{
    title: string
    content: string
    status: string
    excerpt: string
    categories: number[]
    tags: number[]
    featured_media: number
  }>): Promise<WordPressPost> {
    try {
      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${this.baseUrl}/wp-json/wp/v2/posts/${postId}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.authHeader
          },
          body: JSON.stringify(postData)
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro na atualização do post')
      }

      return JSON.parse(result.data)
    } catch (error) {
      console.error('Erro ao atualizar post:', error)
      throw error
    }
  }

  // Deletar post no WordPress
  async deletePost(postId: number): Promise<boolean> {
    try {
      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${this.baseUrl}/wp-json/wp/v2/posts/${postId}?force=true`,
          method: 'DELETE',
          headers: { 'Authorization': this.authHeader }
        })
      })

      return response.ok
    } catch (error) {
      console.error('Erro ao deletar post:', error)
      throw error
    }
  }

  // Upload de mídia
  async uploadMedia(file: File, altText?: string): Promise<WordPressMedia> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (altText) formData.append('alt_text', altText)

      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${this.baseUrl}/wp-json/wp/v2/media`,
          method: 'POST',
          headers: { 'Authorization': this.authHeader },
          body: formData
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro na atualização do post')
      }

      return JSON.parse(result.data)
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      throw error
    }
  }
}

