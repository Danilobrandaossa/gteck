'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'

export interface Page {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  status: 'draft' | 'published' | 'archived'
  templateId?: string
  organizationId: string
  siteId?: string
  authorId: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  featuredImage?: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

interface PagesContextType {
  pages: Page[]
  currentPage: Page | null
  isLoading: boolean
  error: string | null
  setCurrentPage: (page: Page | null) => void
  createPage: (pageData: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Page>
  updatePage: (id: string, pageData: Partial<Page>) => Promise<Page>
  deletePage: (id: string) => Promise<void>
  publishPage: (id: string) => Promise<Page>
  unpublishPage: (id: string) => Promise<Page>
  refreshPages: () => Promise<void>
}

const PagesContext = createContext<PagesContextType | undefined>(undefined)

export function PagesProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization, currentSite } = useOrganization()
  const [pages, setPages] = useState<Page[]>([])
  const [currentPage, setCurrentPage] = useState<Page | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dados mock para demonstração
  const mockPages: Page[] = [
    {
      id: '1',
      title: 'Página de Início',
      slug: 'pagina-inicio',
      content: '<h1>Bem-vindo ao nosso site</h1><p>Esta é a página principal do nosso site.</p>',
      excerpt: 'Página principal do site',
      status: 'published',
      templateId: '1',
      organizationId: '1',
      siteId: '1',
      authorId: '1',
      seoTitle: 'Página Inicial - Empresa Principal',
      seoDescription: 'Bem-vindo ao site da Empresa Principal',
      seoKeywords: 'início, home, empresa',
      featuredImage: '/images/home-banner.jpg',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      publishedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      title: 'Sobre Nós',
      slug: 'sobre-nos',
      content: '<h2>Nossa História</h2><p>Somos uma empresa dedicada à excelência...</p>',
      excerpt: 'Conheça nossa história e valores',
      status: 'draft',
      templateId: '2',
      organizationId: '1',
      siteId: '1',
      authorId: '1',
      seoTitle: 'Sobre Nós - Empresa Principal',
      seoDescription: 'Conheça nossa história e valores',
      seoKeywords: 'sobre, empresa, história',
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: '3',
      title: 'Contato',
      slug: 'contato',
      content: '<h2>Entre em Contato</h2><p>Estamos aqui para ajudar...</p>',
      excerpt: 'Formas de entrar em contato conosco',
      status: 'published',
      templateId: '3',
      organizationId: '1',
      siteId: '1',
      authorId: '1',
      seoTitle: 'Contato - Empresa Principal',
      seoDescription: 'Entre em contato conosco',
      seoKeywords: 'contato, telefone, email',
      createdAt: new Date('2024-01-13'),
      updatedAt: new Date('2024-01-13'),
      publishedAt: new Date('2024-01-13')
    },
    {
      id: '4',
      title: 'Blog Post Exemplo',
      slug: 'blog-post-exemplo',
      content: '<h1>Como criar um CMS moderno</h1><p>Neste artigo vamos explorar...</p>',
      excerpt: 'Dicas para criar um CMS moderno e eficiente',
      status: 'published',
      templateId: '4',
      organizationId: '1',
      siteId: '2',
      authorId: '1',
      seoTitle: 'Como criar um CMS moderno - Blog',
      seoDescription: 'Dicas para criar um CMS moderno e eficiente',
      seoKeywords: 'CMS, desenvolvimento, web',
      featuredImage: '/images/cms-banner.jpg',
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12'),
      publishedAt: new Date('2024-01-12')
    }
  ]

  const refreshPages = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Filtrar páginas pela organização atual
      const orgPages = mockPages.filter(page => page.organizationId === currentOrganization.id)
      
      // Se há site selecionado, filtrar também por site
      const filteredPages = currentSite 
        ? orgPages.filter(page => !page.siteId || page.siteId === currentSite.id)
        : orgPages
      
      setPages(filteredPages)
    } catch (err) {
      setError('Erro ao carregar páginas')
      console.error('Erro ao carregar páginas:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createPage = async (pageData: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<Page> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const newPage: Page = {
        ...pageData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setPages(prev => [newPage, ...prev])
      return newPage
    } catch (err) {
      setError('Erro ao criar página')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updatePage = async (id: string, pageData: Partial<Page>): Promise<Page> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const updatedPage = {
        ...pages.find(p => p.id === id)!,
        ...pageData,
        updatedAt: new Date()
      }
      
      setPages(prev => prev.map(p => p.id === id ? updatedPage : p))
      if (currentPage?.id === id) {
        setCurrentPage(updatedPage)
      }
      
      return updatedPage
    } catch (err) {
      setError('Erro ao atualizar página')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deletePage = async (id: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setPages(prev => prev.filter(p => p.id !== id))
      if (currentPage?.id === id) {
        setCurrentPage(null)
      }
    } catch (err) {
      setError('Erro ao deletar página')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const publishPage = async (id: string): Promise<Page> => {
    return updatePage(id, { 
      status: 'published', 
      publishedAt: new Date() 
    })
  }

  const unpublishPage = async (id: string): Promise<Page> => {
    return updatePage(id, { 
      status: 'draft',
      publishedAt: undefined
    })
  }

  useEffect(() => {
    if (currentOrganization) {
      refreshPages()
    }
  }, [currentOrganization, currentSite])

  const value: PagesContextType = {
    pages,
    currentPage,
    isLoading,
    error,
    setCurrentPage,
    createPage,
    updatePage,
    deletePage,
    publishPage,
    unpublishPage,
    refreshPages
  }

  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  )
}

export function usePages() {
  const context = useContext(PagesContext)
  if (context === undefined) {
    throw new Error('usePages deve ser usado dentro de um PagesProvider')
  }
  return context
}

