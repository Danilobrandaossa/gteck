'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'

export interface WordPressSite {
  id: string
  name: string
  url: string
  apiUrl: string
  username: string
  password: string
  authType: 'basic' | 'nonce' | 'jwt'
  nonce?: string
  jwtToken?: string
  isActive: boolean
  lastSync?: Date
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export interface WordPressPost {
  id: number
  title: string
  content: string
  excerpt: string
  slug: string
  status: 'publish' | 'draft' | 'private' | 'pending'
  date: string
  modified: string
  author: number
  featured_media: number
  categories: number[]
  tags: number[]
  acf_fields?: Record<string, any>
  meta?: Record<string, any>
}

export interface WordPressCategory {
  id: number
  name: string
  slug: string
  description: string
  count: number
  parent: number
}

export interface WordPressTag {
  id: number
  name: string
  slug: string
  description: string
  count: number
}

export interface WordPressMedia {
  id: number
  title: string
  source_url: string
  media_details: {
    width: number
    height: number
    file: string
    sizes: Record<string, any>
  }
  mime_type: string
  date: string
}

interface WordPressContextType {
  sites: WordPressSite[]
  currentSite: WordPressSite | null
  isLoading: boolean
  error: string | null
  isConnected: boolean
  lastSync: Date | null
  posts: WordPressPost[]
  categories: WordPressCategory[]
  tags: WordPressTag[]
  media: WordPressMedia[]
  setCurrentSite: (site: WordPressSite | null) => void
  testConnection: (site: WordPressSite) => Promise<boolean>
  syncData: (site: WordPressSite) => Promise<void>
  createPost: (site: WordPressSite, postData: Partial<WordPressPost>) => Promise<WordPressPost>
  updatePost: (site: WordPressSite, id: number, postData: Partial<WordPressPost>) => Promise<WordPressPost>
  deletePost: (site: WordPressSite, id: number) => Promise<void>
  uploadMedia: (site: WordPressSite, file: File) => Promise<WordPressMedia>
  getCategories: (site: WordPressSite) => Promise<WordPressCategory[]>
  getTags: (site: WordPressSite) => Promise<WordPressTag[]>
  getPosts: (site: WordPressSite, params?: any) => Promise<WordPressPost[]>
  refreshSites: () => Promise<void>
  updateSite: (siteId: string, updates: Partial<WordPressSite>) => Promise<void>
}

const WordPressContext = createContext<WordPressContextType | undefined>(undefined)

export function WordPressProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useOrganization()
  const [sites, setSites] = useState<WordPressSite[]>([])
  const [currentSite, setCurrentSite] = useState<WordPressSite | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [posts, setPosts] = useState<WordPressPost[]>([])
  const [categories, setCategories] = useState<WordPressCategory[]>([])
  const [tags, setTags] = useState<WordPressTag[]>([])
  const [media, setMedia] = useState<WordPressMedia[]>([])

  // Dados mock para demonstração
  const mockSites: WordPressSite[] = [
    {
      id: '1',
      name: 'Site Principal',
      url: 'https://meusite.com',
      apiUrl: 'https://meusite.com/wp-json/wp/v2',
      username: 'admin',
      password: 'password123',
      authType: 'basic',
      isActive: true,
      lastSync: new Date('2024-01-15T10:30:00'),
      organizationId: '1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Blog Corporativo',
      url: 'https://blog.empresa.com',
      apiUrl: 'https://blog.empresa.com/wp-json/wp/v2',
      username: 'editor',
      password: 'editor123',
      authType: 'nonce',
      nonce: 'abc123def456',
      isActive: true,
      lastSync: new Date('2024-01-14T15:45:00'),
      organizationId: '1',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-14')
    },
    {
      id: '3',
      name: 'Loja Online',
      url: 'https://loja.empresa.com',
      apiUrl: 'https://loja.empresa.com/wp-json/wp/v2',
      username: 'admin',
      password: 'admin123',
      authType: 'jwt',
      jwtToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
      isActive: false,
      organizationId: '1',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-10')
    }
  ]

  const refreshSites = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Filtrar sites pela organização atual
      const orgSites = mockSites.filter(site => site.organizationId === currentOrganization.id)
      
      setSites(orgSites)
    } catch (err) {
      setError('Erro ao carregar sites WordPress')
      console.error('Erro ao carregar sites WordPress:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSite = async (siteId: string, updates: Partial<WordPressSite>) => {
    // Persistência simulada (local state). Em produção, faria chamada à API.
    setSites(prev => prev.map(s => s.id === siteId ? { ...s, ...updates, updatedAt: new Date() } : s))
    // atualiza currentSite se estiver selecionado
    setCurrentSite(prev => prev && prev.id === siteId ? { ...prev, ...updates, updatedAt: new Date() } as WordPressSite : prev)
  }

  const testConnection = async (site: WordPressSite): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simular diferentes resultados baseados no site
      const isConnected = site.isActive && site.url.includes('meusite.com')
      
      if (isConnected) {
        setIsConnected(true)
        setLastSync(new Date())
      } else {
        setError('Falha na conexão com o site WordPress')
      }
      
      return isConnected
    } catch (err) {
      setError('Erro ao testar conexão')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const syncData = async (_site: WordPressSite): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular sincronização de dados
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Dados mock para demonstração
      const mockPosts: WordPressPost[] = [
        {
          id: 1,
          title: 'Bem-vindo ao WordPress',
          content: 'Este é o conteúdo do post...',
          excerpt: 'Resumo do post...',
          slug: 'bem-vindo-wordpress',
          status: 'publish',
          date: '2024-01-15T10:00:00',
          modified: '2024-01-15T10:00:00',
          author: 1,
          featured_media: 1,
          categories: [1, 2],
          tags: [1, 2],
          acf_fields: {
            custom_field: 'Valor personalizado'
          }
        }
      ]
      
      const mockCategories: WordPressCategory[] = [
        {
          id: 1,
          name: 'Notícias',
          slug: 'noticias',
          description: 'Categoria de notícias',
          count: 5,
          parent: 0
        },
        {
          id: 2,
          name: 'Tecnologia',
          slug: 'tecnologia',
          description: 'Categoria de tecnologia',
          count: 3,
          parent: 0
        }
      ]
      
      const mockTags: WordPressTag[] = [
        {
          id: 1,
          name: 'wordpress',
          slug: 'wordpress',
          description: 'Tag WordPress',
          count: 2
        },
        {
          id: 2,
          name: 'cms',
          slug: 'cms',
          description: 'Tag CMS',
          count: 1
        }
      ]
      
      const mockMedia: WordPressMedia[] = [
        {
          id: 1,
          title: 'Imagem de exemplo',
          source_url: 'https://meusite.com/wp-content/uploads/2024/01/exemplo.jpg',
          media_details: {
            width: 800,
            height: 600,
            file: '2024/01/exemplo.jpg',
            sizes: {}
          },
          mime_type: 'image/jpeg',
          date: '2024-01-15T10:00:00'
        }
      ]
      
      setPosts(mockPosts)
      setCategories(mockCategories)
      setTags(mockTags)
      setMedia(mockMedia)
      setLastSync(new Date())
      
    } catch (err) {
      setError('Erro ao sincronizar dados')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const createPost = async (_site: WordPressSite, postData: Partial<WordPressPost>): Promise<WordPressPost> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular criação de post
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newPost: WordPressPost = {
        id: Date.now(),
        title: postData.title || 'Novo Post',
        content: postData.content || '',
        excerpt: postData.excerpt || '',
        slug: postData.slug || 'novo-post',
        status: postData.status || 'draft',
        date: new Date().toISOString(),
        modified: new Date().toISOString(),
        author: 1,
        featured_media: postData.featured_media || 0,
        categories: postData.categories || [],
        tags: postData.tags || [],
        acf_fields: postData.acf_fields || {},
        meta: postData.meta || {}
      }
      
      setPosts(prev => [newPost, ...prev])
      return newPost
    } catch (err) {
      setError('Erro ao criar post')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updatePost = async (_site: WordPressSite, id: number, postData: Partial<WordPressPost>): Promise<WordPressPost> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular atualização de post
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const updatedPost = {
        ...posts.find(p => p.id === id)!,
        ...postData,
        modified: new Date().toISOString()
      }
      
      setPosts(prev => prev.map(p => p.id === id ? updatedPost : p))
      return updatedPost
    } catch (err) {
      setError('Erro ao atualizar post')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deletePost = async (_site: WordPressSite, id: number): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular exclusão de post
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setPosts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      setError('Erro ao deletar post')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const uploadMedia = async (site: WordPressSite, file: File): Promise<WordPressMedia> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular upload de mídia
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newMedia: WordPressMedia = {
        id: Date.now(),
        title: file.name,
        source_url: `https://${site.url}/wp-content/uploads/${file.name}`,
        media_details: {
          width: 800,
          height: 600,
          file: file.name,
          sizes: {}
        },
        mime_type: file.type,
        date: new Date().toISOString()
      }
      
      setMedia(prev => [newMedia, ...prev])
      return newMedia
    } catch (err) {
      setError('Erro ao fazer upload de mídia')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getCategories = async (_site: WordPressSite): Promise<WordPressCategory[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular busca de categorias
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return categories
    } catch (err) {
      setError('Erro ao buscar categorias')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getTags = async (_site: WordPressSite): Promise<WordPressTag[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular busca de tags
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return tags
    } catch (err) {
      setError('Erro ao buscar tags')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getPosts = async (_site: WordPressSite, _params: any = {}): Promise<WordPressPost[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular busca de posts
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return posts
    } catch (err) {
      setError('Erro ao buscar posts')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentOrganization) {
      refreshSites()
    }
  }, [currentOrganization])

  const value: WordPressContextType = {
    sites,
    currentSite,
    isLoading,
    error,
    isConnected,
    lastSync,
    posts,
    categories,
    tags,
    media,
    setCurrentSite,
    testConnection,
    syncData,
    createPost,
    updatePost,
    deletePost,
    uploadMedia,
    getCategories,
    getTags,
    getPosts,
    refreshSites,
    updateSite
  }

  return (
    <WordPressContext.Provider value={value}>
      {children}
    </WordPressContext.Provider>
  )
}

export function useWordPress() {
  const context = useContext(WordPressContext)
  if (context === undefined) {
    throw new Error('useWordPress deve ser usado dentro de um WordPressProvider')
  }
  return context
}

