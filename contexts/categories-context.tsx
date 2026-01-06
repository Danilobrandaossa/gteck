'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
  parentId?: string
  organizationId: string
  siteIds: string[]
  isActive: boolean
  sortOrder: number
  metadata?: {
    seoTitle?: string
    seoDescription?: string
    featuredImage?: string
    customFields?: Record<string, any>
  }
  createdAt: Date
  updatedAt: Date
}

interface CategoriesContextType {
  categories: Category[]
  isLoading: boolean
  error: string | null
  createCategory: (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Category>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>
  toggleCategoryStatus: (id: string) => Promise<void>
  reorderCategories: (categories: Category[]) => Promise<void>
  searchCategories: (query: string) => Category[]
  filterCategories: (parentId?: string, status?: string) => Category[]
  getCategoryTree: () => Category[]
  refreshCategories: () => Promise<void>
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined)

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useOrganization()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dados mock para demonstração
  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Blog',
      slug: 'blog',
      description: 'Artigos e posts do blog',
      color: '#3B82F6',
      icon: '📝',
      organizationId: '1',
      siteIds: ['1', '2'],
      isActive: true,
      sortOrder: 1,
      metadata: {
        seoTitle: 'Blog - Artigos e Notícias',
        seoDescription: 'Confira nossos artigos e notícias mais recentes',
        featuredImage: '/images/blog-featured.jpg'
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Tecnologia',
      slug: 'tecnologia',
      description: 'Categoria sobre tecnologia e inovação',
      color: '#10B981',
      icon: '💻',
      parentId: '1',
      organizationId: '1',
      siteIds: ['1'],
      isActive: true,
      sortOrder: 1,
      metadata: {
        seoTitle: 'Tecnologia - Artigos sobre Inovação',
        seoDescription: 'Artigos sobre tecnologia, programação e inovação'
      },
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-14')
    },
    {
      id: '3',
      name: 'Marketing Digital',
      slug: 'marketing-digital',
      description: 'Estratégias e dicas de marketing digital',
      color: '#F59E0B',
      icon: '📈',
      parentId: '1',
      organizationId: '1',
      siteIds: ['1', '2'],
      isActive: true,
      sortOrder: 2,
      metadata: {
        seoTitle: 'Marketing Digital - Estratégias e Dicas',
        seoDescription: 'Aprenda sobre marketing digital, SEO e redes sociais'
      },
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-13')
    },
    {
      id: '4',
      name: 'Produtos',
      slug: 'produtos',
      description: 'Catálogo de produtos e serviços',
      color: '#EF4444',
      icon: '🛍️',
      organizationId: '1',
      siteIds: ['1'],
      isActive: true,
      sortOrder: 2,
      metadata: {
        seoTitle: 'Produtos - Nossa Linha Completa',
        seoDescription: 'Conheça nossa linha completa de produtos e serviços'
      },
      createdAt: new Date('2024-01-04'),
      updatedAt: new Date('2024-01-12')
    },
    {
      id: '5',
      name: 'Software',
      slug: 'software',
      description: 'Produtos de software e aplicações',
      color: '#8B5CF6',
      icon: '💿',
      parentId: '4',
      organizationId: '1',
      siteIds: ['1'],
      isActive: true,
      sortOrder: 1,
      metadata: {
        seoTitle: 'Software - Aplicações e Programas',
        seoDescription: 'Nossos produtos de software e aplicações'
      },
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-11')
    },
    {
      id: '6',
      name: 'Consultoria',
      slug: 'consultoria',
      description: 'Serviços de consultoria especializada',
      color: '#06B6D4',
      icon: '🎯',
      parentId: '4',
      organizationId: '1',
      siteIds: ['1', '2'],
      isActive: true,
      sortOrder: 2,
      metadata: {
        seoTitle: 'Consultoria - Serviços Especializados',
        seoDescription: 'Serviços de consultoria em tecnologia e marketing'
      },
      createdAt: new Date('2024-01-06'),
      updatedAt: new Date('2024-01-10')
    },
    {
      id: '7',
      name: 'Categoria Inativa',
      slug: 'categoria-inativa',
      description: 'Categoria desabilitada para testes',
      color: '#6B7280',
      icon: '🚫',
      organizationId: '1',
      siteIds: ['1'],
      isActive: false,
      sortOrder: 3,
      createdAt: new Date('2024-01-07'),
      updatedAt: new Date('2024-01-09')
    }
  ]

  const refreshCategories = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Filtrar categorias pela organização atual
      const orgCategories = mockCategories.filter(category => category.organizationId === currentOrganization.id)
      
      setCategories(orgCategories)
    } catch (err) {
      setError('Erro ao carregar categorias')
      console.error('Erro ao carregar categorias:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newCategory: Category = {
        ...categoryData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setCategories(prev => [newCategory, ...prev])
      return newCategory
    } catch (err) {
      setError('Erro ao criar categoria')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const updatedCategory = {
        ...categories.find(c => c.id === id)!,
        ...updates,
        updatedAt: new Date()
      }
      
      setCategories(prev => prev.map(c => c.id === id ? updatedCategory : c))
      return updatedCategory
    } catch (err) {
      setError('Erro ao atualizar categoria')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCategory = async (id: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError('Erro ao deletar categoria')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCategoryStatus = async (id: string): Promise<void> => {
    const category = categories.find(c => c.id === id)
    if (category) {
      await updateCategory(id, { isActive: !category.isActive })
    }
  }

  const reorderCategories = async (newCategories: Category[]): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setCategories(newCategories)
    } catch (err) {
      setError('Erro ao reordenar categorias')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const searchCategories = (query: string): Category[] => {
    if (!query.trim()) return categories
    
    const lowercaseQuery = query.toLowerCase()
    return categories.filter(category => 
      category.name.toLowerCase().includes(lowercaseQuery) ||
      category.description?.toLowerCase().includes(lowercaseQuery) ||
      category.slug.toLowerCase().includes(lowercaseQuery)
    )
  }

  const filterCategories = (parentId?: string, status?: string): Category[] => {
    let filtered = categories
    
    if (parentId !== undefined) {
      if (parentId === 'root') {
        filtered = filtered.filter(category => !category.parentId)
      } else {
        filtered = filtered.filter(category => category.parentId === parentId)
      }
    }
    
    if (status !== undefined) {
      const isActive = status === 'active'
      filtered = filtered.filter(category => category.isActive === isActive)
    }
    
    return filtered
  }

  const getCategoryTree = (): Category[] => {
    const buildTree = (parentId?: string): Category[] => {
      return categories
        .filter(category => category.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(category => ({
          ...category,
          children: buildTree(category.id)
        }))
    }
    
    return buildTree()
  }

  useEffect(() => {
    if (currentOrganization) {
      refreshCategories()
    }
  }, [currentOrganization])

  const value: CategoriesContextType = {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    reorderCategories,
    searchCategories,
    filterCategories,
    getCategoryTree,
    refreshCategories
  }

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const context = useContext(CategoriesContext)
  if (context === undefined) {
    throw new Error('useCategories deve ser usado dentro de um CategoriesProvider')
  }
  return context
}

