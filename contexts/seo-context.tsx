'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'

export interface SEOAnalysis {
  id: string
  pageId: string
  url: string
  title: string
  metaDescription: string
  focusKeyword: string
  score: number
  issues: SEOIssue[]
  suggestions: SEOSuggestion[]
  createdAt: Date
  updatedAt: Date
}

export interface SEOIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  description: string
  fix: string
  priority: 'high' | 'medium' | 'low'
}

export interface SEOSuggestion {
  id: string
  type: 'improvement' | 'optimization' | 'enhancement'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
}

export interface SitemapEntry {
  url: string
  lastModified: Date
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
  pageId: string
}

export interface RobotsTxtRule {
  userAgent: string
  allow: string[]
  disallow: string[]
  crawlDelay?: number
}

interface SEOContextType {
  analyses: SEOAnalysis[]
  sitemap: SitemapEntry[]
  robotsTxt: string
  isLoading: boolean
  error: string | null
  analyzePage: (pageId: string, url: string, content: string) => Promise<SEOAnalysis>
  generateSitemap: () => Promise<SitemapEntry[]>
  generateRobotsTxt: () => Promise<string>
  optimizeContent: (content: string, keywords: string[]) => Promise<string>
  generateMetaTags: (title: string, description: string, keywords: string[]) => Promise<{ title: string; description: string; keywords: string }>
  refreshAnalyses: () => Promise<void>
}

const SEOContext = createContext<SEOContextType | undefined>(undefined)

export function SEOProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useOrganization()
  const [analyses, setAnalyses] = useState<SEOAnalysis[]>([])
  const [sitemap, setSitemap] = useState<SitemapEntry[]>([])
  const [robotsTxt, setRobotsTxt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dados mock para demonstração
  const mockAnalyses: SEOAnalysis[] = [
    {
      id: '1',
      pageId: '1',
      url: 'https://meusite.com/sobre',
      title: 'Sobre Nós - Empresa de Tecnologia',
      metaDescription: 'Conheça nossa empresa de tecnologia e nossa missão de inovar.',
      focusKeyword: 'empresa tecnologia',
      score: 85,
      issues: [
        {
          id: '1',
          type: 'warning',
          title: 'Título muito longo',
          description: 'O título tem mais de 60 caracteres',
          fix: 'Reduza o título para 50-60 caracteres',
          priority: 'medium'
        }
      ],
      suggestions: [
        {
          id: '1',
          type: 'improvement',
          title: 'Adicionar palavras-chave',
          description: 'Inclua mais palavras-chave relevantes no conteúdo',
          impact: 'high'
        }
      ],
      createdAt: new Date('2024-01-15T10:00:00'),
      updatedAt: new Date('2024-01-15T10:00:00')
    },
    {
      id: '2',
      pageId: '2',
      url: 'https://meusite.com/contato',
      title: 'Contato',
      metaDescription: '',
      focusKeyword: 'contato',
      score: 45,
      issues: [
        {
          id: '2',
          type: 'error',
          title: 'Meta description ausente',
          description: 'A página não possui meta description',
          fix: 'Adicione uma meta description de 150-160 caracteres',
          priority: 'high'
        },
        {
          id: '3',
          type: 'warning',
          title: 'Título muito curto',
          description: 'O título tem menos de 30 caracteres',
          fix: 'Expanda o título para 30-60 caracteres',
          priority: 'medium'
        }
      ],
      suggestions: [
        {
          id: '2',
          type: 'optimization',
          title: 'Melhorar estrutura',
          description: 'Use mais cabeçalhos H2 e H3',
          impact: 'medium'
        }
      ],
      createdAt: new Date('2024-01-15T11:00:00'),
      updatedAt: new Date('2024-01-15T11:00:00')
    }
  ]

  const mockSitemap: SitemapEntry[] = [
    {
      url: 'https://meusite.com/',
      lastModified: new Date('2024-01-15T10:00:00'),
      changeFrequency: 'daily',
      priority: 1.0,
      pageId: '1'
    },
    {
      url: 'https://meusite.com/sobre',
      lastModified: new Date('2024-01-15T10:00:00'),
      changeFrequency: 'monthly',
      priority: 0.8,
      pageId: '2'
    },
    {
      url: 'https://meusite.com/contato',
      lastModified: new Date('2024-01-15T11:00:00'),
      changeFrequency: 'monthly',
      priority: 0.7,
      pageId: '3'
    }
  ]

  const refreshAnalyses = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Filtrar análises pela organização atual
      const orgAnalyses = mockAnalyses.filter(_analysis => 
        currentOrganization.id === '1' // Mock: assumindo organização 1
      )
      
      setAnalyses(orgAnalyses)
    } catch (err) {
      setError('Erro ao carregar análises de SEO')
      console.error('Erro ao carregar análises de SEO:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const analyzePage = async (pageId: string, url: string, content: string): Promise<SEOAnalysis> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular análise de SEO
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Análise básica simulada
      const title = content.match(/<title>(.*?)<\/title>/i)?.[1] || 'Sem título'
      const metaDescription = content.match(/<meta name="description" content="(.*?)"/i)?.[1] || ''
      
      const issues: SEOIssue[] = []
      const suggestions: SEOSuggestion[] = []
      
      // Verificar título
      if (title.length < 30) {
        issues.push({
          id: '1',
          type: 'warning',
          title: 'Título muito curto',
          description: 'O título tem menos de 30 caracteres',
          fix: 'Expanda o título para 30-60 caracteres',
          priority: 'medium'
        })
      } else if (title.length > 60) {
        issues.push({
          id: '2',
          type: 'warning',
          title: 'Título muito longo',
          description: 'O título tem mais de 60 caracteres',
          fix: 'Reduza o título para 50-60 caracteres',
          priority: 'medium'
        })
      }
      
      // Verificar meta description
      if (!metaDescription) {
        issues.push({
          id: '3',
          type: 'error',
          title: 'Meta description ausente',
          description: 'A página não possui meta description',
          fix: 'Adicione uma meta description de 150-160 caracteres',
          priority: 'high'
        })
      } else if (metaDescription.length < 120) {
        issues.push({
          id: '4',
          type: 'warning',
          title: 'Meta description muito curta',
          description: 'A meta description tem menos de 120 caracteres',
          fix: 'Expanda a meta description para 120-160 caracteres',
          priority: 'medium'
        })
      }
      
      // Verificar cabeçalhos
      const h1Count = (content.match(/<h1[^>]*>/gi) || []).length
      if (h1Count === 0) {
        issues.push({
          id: '5',
          type: 'error',
          title: 'Cabeçalho H1 ausente',
          description: 'A página não possui cabeçalho H1',
          fix: 'Adicione um cabeçalho H1 principal',
          priority: 'high'
        })
      } else if (h1Count > 1) {
        issues.push({
          id: '6',
          type: 'warning',
          title: 'Múltiplos cabeçalhos H1',
          description: 'A página possui mais de um cabeçalho H1',
          fix: 'Use apenas um cabeçalho H1 por página',
          priority: 'medium'
        })
      }
      
      // Sugestões
      suggestions.push({
        id: '1',
        type: 'improvement',
        title: 'Otimizar imagens',
        description: 'Adicione alt text nas imagens',
        impact: 'high'
      })
      
      suggestions.push({
        id: '2',
        type: 'optimization',
        title: 'Melhorar estrutura',
        description: 'Use mais cabeçalhos H2 e H3',
        impact: 'medium'
      })
      
      // Calcular score
      const errorCount = issues.filter(i => i.type === 'error').length
      const warningCount = issues.filter(i => i.type === 'warning').length
      const score = Math.max(0, 100 - (errorCount * 20) - (warningCount * 10))
      
      const analysis: SEOAnalysis = {
        id: Date.now().toString(),
        pageId,
        url,
        title,
        metaDescription,
        focusKeyword: 'palavra-chave',
        score,
        issues,
        suggestions,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setAnalyses(prev => [analysis, ...prev])
      return analysis
    } catch (err) {
      setError('Erro ao analisar página')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const generateSitemap = async (): Promise<SitemapEntry[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular geração de sitemap
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSitemap(mockSitemap)
      return mockSitemap
    } catch (err) {
      setError('Erro ao gerar sitemap')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const generateRobotsTxt = async (): Promise<string> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular geração de robots.txt
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const robotsContent = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://meusite.com/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /wp-admin/
Disallow: /wp-content/
Disallow: /wp-includes/

# Allow important pages
Allow: /sobre/
Allow: /contato/
Allow: /blog/`
      
      setRobotsTxt(robotsContent)
      return robotsContent
    } catch (err) {
      setError('Erro ao gerar robots.txt')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const optimizeContent = async (content: string, keywords: string[]): Promise<string> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular otimização de conteúdo
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simular otimizações básicas
      let optimizedContent = content
      
      // Adicionar palavras-chave no conteúdo
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
        if (!regex.test(optimizedContent)) {
          // Adicionar palavra-chave se não estiver presente
          optimizedContent = optimizedContent.replace(
            /(<p[^>]*>)(.*?)(<\/p>)/gi,
            (match, open, text, close) => {
              if (text.length > 50) {
                return `${open}${text} ${keyword}${close}`
              }
              return match
            }
          )
        }
      })
      
      return optimizedContent
    } catch (err) {
      setError('Erro ao otimizar conteúdo')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const generateMetaTags = async (title: string, description: string, keywords: string[]): Promise<{ title: string; description: string; keywords: string }> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular geração de meta tags
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Otimizar título
      let optimizedTitle = title
      if (optimizedTitle.length < 30) {
        optimizedTitle = `${title} - ${keywords[0] || 'Sua Empresa'}`
      } else if (optimizedTitle.length > 60) {
        optimizedTitle = title.substring(0, 57) + '...'
      }
      
      // Otimizar descrição
      let optimizedDescription = description
      if (optimizedDescription.length < 120) {
        optimizedDescription = `${description} ${keywords.join(', ')}`
      } else if (optimizedDescription.length > 160) {
        optimizedDescription = description.substring(0, 157) + '...'
      }
      
      // Gerar keywords
      const optimizedKeywords = keywords.join(', ')
      
      return {
        title: optimizedTitle,
        description: optimizedDescription,
        keywords: optimizedKeywords
      }
    } catch (err) {
      setError('Erro ao gerar meta tags')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentOrganization) {
      refreshAnalyses()
    }
  }, [currentOrganization])

  const value: SEOContextType = {
    analyses,
    sitemap,
    robotsTxt,
    isLoading,
    error,
    analyzePage,
    generateSitemap,
    generateRobotsTxt,
    optimizeContent,
    generateMetaTags,
    refreshAnalyses
  }

  return (
    <SEOContext.Provider value={value}>
      {children}
    </SEOContext.Provider>
  )
}

export function useSEO() {
  const context = useContext(SEOContext)
  if (context === undefined) {
    throw new Error('useSEO deve ser usado dentro de um SEOProvider')
  }
  return context
}

