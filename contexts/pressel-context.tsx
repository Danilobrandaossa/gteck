'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { useWordPress } from '@/contexts/wordpress-context'

export interface PresselModel {
  id: string
  name: string
  description: string
  template: string
  language: 'pt-BR' | 'en-US'
  category: 'landing' | 'ecommerce' | 'affiliate' | 'minimal' | 'institutional'
  fields: PresselField[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PresselField {
  id: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'image' | 'url' | 'number' | 'select' | 'checkbox'
  required: boolean
  placeholder?: string
  options?: string[]
  description?: string
  acfField: string
  order: number
}

export interface PresselPage {
  id: string
  title: string
  slug: string
  model: string
  status: 'draft' | 'published' | 'archived'
  siteId: string
  organizationId: string
  acfFields: Record<string, any>
  seo: {
    metaTitle: string
    metaDescription: string
    focusKeyword: string
  }
  content: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  wordpressId?: string
  wordpressUrl?: string
}

export interface PresselGeneration {
  id: string
  type: 'text-to-json' | 'json-to-page' | 'ai-generation'
  input: string
  output: any
  model: string
  siteId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  createdAt: Date
  completedAt?: Date
}

interface PresselContextType {
  models: PresselModel[]
  pages: PresselPage[]
  generations: PresselGeneration[]
  isLoading: boolean
  error: string | null
  isGenerating: boolean
  currentGeneration: PresselGeneration | null
  convertTextToJson: (text: string, model: string) => Promise<PresselGeneration>
  generatePage: (data: any, model: string, siteId: string) => Promise<PresselPage>
  createPage: (pageData: PresselPage) => Promise<PresselPage>
  updatePage: (id: string, updates: Partial<PresselPage>) => Promise<PresselPage>
  deletePage: (id: string) => Promise<void>
  publishPage: (id: string) => Promise<PresselPage>
  getPage: (id: string) => PresselPage | null
  refreshPages: () => Promise<void>
  refreshGenerations: () => Promise<void>
}

const PresselContext = createContext<PresselContextType | undefined>(undefined)

export function PresselProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useOrganization()
  const { sites } = useWordPress()
  const [models, setModels] = useState<PresselModel[]>([])
  const [pages, setPages] = useState<PresselPage[]>([])
  const [generations, setGenerations] = useState<PresselGeneration[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentGeneration, setCurrentGeneration] = useState<PresselGeneration | null>(null)

  // Dados mock para demonstração
  const mockModels: PresselModel[] = [
    {
      id: '1',
      name: 'Pressel Oficial',
      description: 'Modelo principal para páginas de vendas em português',
      template: 'pressel-oficial.php',
      language: 'pt-BR',
      category: 'landing',
      isActive: true,
      fields: [
        {
          id: '1',
          name: 'hero_description',
          label: 'Descrição do Hero',
          type: 'textarea',
          required: true,
          placeholder: 'Digite a descrição principal do hero...',
          description: 'Texto principal que aparece no topo da página',
          acfField: 'hero_description',
          order: 1
        },
        {
          id: '2',
          name: 'titulo_da_secao',
          label: 'Título da Seção',
          type: 'text',
          required: true,
          placeholder: 'Ex: Acesse Agora',
          description: 'Título principal da seção de vendas',
          acfField: 'titulo_da_secao',
          order: 2
        },
        {
          id: '3',
          name: 'texto_usuario',
          label: 'Texto do Usuário',
          type: 'textarea',
          required: true,
          placeholder: 'Conteúdo sobre o usuário...',
          description: 'Texto sobre o usuário e sua experiência',
          acfField: 'texto_usuario',
          order: 3
        },
        {
          id: '4',
          name: 'titulo_h2_',
          label: 'Título H2',
          type: 'text',
          required: true,
          placeholder: 'Título da seção',
          description: 'Título secundário da página',
          acfField: 'titulo_h2_',
          order: 4
        },
        {
          id: '5',
          name: 'info_content',
          label: 'Conteúdo Informativo',
          type: 'textarea',
          required: true,
          placeholder: 'Informações importantes...',
          description: 'Conteúdo informativo da página',
          acfField: 'info_content',
          order: 5
        },
        {
          id: '6',
          name: 'titulo_beneficios',
          label: 'Título dos Benefícios',
          type: 'text',
          required: true,
          placeholder: 'Ex: Benefícios Exclusivos',
          description: 'Título da seção de benefícios',
          acfField: 'titulo_beneficios',
          order: 6
        },
        {
          id: '7',
          name: 'titulo_faq',
          label: 'Título do FAQ',
          type: 'text',
          required: true,
          placeholder: 'Ex: Perguntas Frequentes',
          description: 'Título da seção de perguntas frequentes',
          acfField: 'titulo_faq',
          order: 7
        },
        {
          id: '8',
          name: 'texto_botao_p1',
          label: 'Texto do Botão Principal',
          type: 'text',
          required: true,
          placeholder: 'Ex: VER MAIS',
          description: 'Texto do botão de call-to-action principal',
          acfField: 'texto_botao_p1',
          order: 8
        },
        {
          id: '9',
          name: 'link_botao_p1',
          label: 'Link do Botão Principal',
          type: 'url',
          required: true,
          placeholder: 'https://exemplo.com',
          description: 'URL de destino do botão principal',
          acfField: 'link_botao_p1',
          order: 9
        }
      ],
      createdAt: new Date('2024-01-01T00:00:00'),
      updatedAt: new Date('2024-01-01T00:00:00')
    },
    {
      id: '2',
      name: 'Presell English',
      description: 'English version for international sales pages',
      template: 'presell-enus.php',
      language: 'en-US',
      category: 'landing',
      isActive: true,
      fields: [
        {
          id: '10',
          name: 'hero_description',
          label: 'Hero Description',
          type: 'textarea',
          required: true,
          placeholder: 'Enter the main hero description...',
          description: 'Main text that appears at the top of the page',
          acfField: 'hero_description',
          order: 1
        },
        {
          id: '11',
          name: 'section_title',
          label: 'Section Title',
          type: 'text',
          required: true,
          placeholder: 'Ex: Access Now',
          description: 'Main title of the sales section',
          acfField: 'section_title',
          order: 2
        }
      ],
      createdAt: new Date('2024-01-01T00:00:00'),
      updatedAt: new Date('2024-01-01T00:00:00')
    },
    {
      id: '3',
      name: 'Presell Minimal',
      description: 'Modelo minimalista para páginas simples',
      template: 'presell-minimal.php',
      language: 'pt-BR',
      category: 'minimal',
      isActive: true,
      fields: [
        {
          id: '12',
          name: 'titulo_principal',
          label: 'Título Principal',
          type: 'text',
          required: true,
          placeholder: 'Título da página',
          description: 'Título principal da página',
          acfField: 'titulo_principal',
          order: 1
        },
        {
          id: '13',
          name: 'conteudo_principal',
          label: 'Conteúdo Principal',
          type: 'textarea',
          required: true,
          placeholder: 'Conteúdo da página...',
          description: 'Conteúdo principal da página',
          acfField: 'conteudo_principal',
          order: 2
        }
      ],
      createdAt: new Date('2024-01-01T00:00:00'),
      updatedAt: new Date('2024-01-01T00:00:00')
    },
    {
      id: '4',
      name: 'Presell E-commerce',
      description: 'Modelo para páginas de e-commerce',
      template: 'presell-ecommerce.php',
      language: 'pt-BR',
      category: 'ecommerce',
      isActive: true,
      fields: [
        {
          id: '14',
          name: 'produto_nome',
          label: 'Nome do Produto',
          type: 'text',
          required: true,
          placeholder: 'Nome do produto',
          description: 'Nome do produto a ser vendido',
          acfField: 'produto_nome',
          order: 1
        },
        {
          id: '15',
          name: 'produto_preco',
          label: 'Preço do Produto',
          type: 'text',
          required: true,
          placeholder: 'R$ 99,90',
          description: 'Preço do produto',
          acfField: 'produto_preco',
          order: 2
        },
        {
          id: '16',
          name: 'produto_descricao',
          label: 'Descrição do Produto',
          type: 'textarea',
          required: true,
          placeholder: 'Descrição detalhada do produto...',
          description: 'Descrição completa do produto',
          acfField: 'produto_descricao',
          order: 3
        }
      ],
      createdAt: new Date('2024-01-01T00:00:00'),
      updatedAt: new Date('2024-01-01T00:00:00')
    },
    {
      id: '5',
      name: 'Presell Affiliate',
      description: 'Modelo para páginas de afiliados',
      template: 'presell-affiliate.php',
      language: 'pt-BR',
      category: 'affiliate',
      isActive: true,
      fields: [
        {
          id: '17',
          name: 'produto_afiliado',
          label: 'Produto Afiliado',
          type: 'text',
          required: true,
          placeholder: 'Nome do produto afiliado',
          description: 'Nome do produto que está sendo promovido',
          acfField: 'produto_afiliado',
          order: 1
        },
        {
          id: '18',
          name: 'link_afiliado',
          label: 'Link de Afiliado',
          type: 'url',
          required: true,
          placeholder: 'https://afiliado.com/produto',
          description: 'Link de afiliado para o produto',
          acfField: 'link_afiliado',
          order: 2
        },
        {
          id: '19',
          name: 'comissao',
          label: 'Comissão',
          type: 'text',
          required: true,
          placeholder: '50% de comissão',
          description: 'Percentual de comissão oferecida',
          acfField: 'comissao',
          order: 3
        }
      ],
      createdAt: new Date('2024-01-01T00:00:00'),
      updatedAt: new Date('2024-01-01T00:00:00')
    }
  ]

  const mockPages: PresselPage[] = [
    {
      id: '1',
      title: 'Curso de Marketing Digital',
      slug: 'curso-marketing-digital',
      model: '1',
      status: 'published',
      siteId: '1',
      organizationId: '1',
      acfFields: {
        hero_description: 'Aprenda marketing digital do zero e transforme seu negócio',
        titulo_da_secao: 'Acesse Agora',
        texto_usuario: 'Este curso foi desenvolvido para empreendedores que querem dominar o marketing digital',
        titulo_h2_: 'O que você vai aprender',
        info_content: 'Conteúdo completo com mais de 50 horas de vídeo',
        titulo_beneficios: 'Benefícios Exclusivos',
        titulo_faq: 'Perguntas Frequentes',
        texto_botao_p1: 'QUERO ME INSCREVER',
        link_botao_p1: 'https://exemplo.com/inscricao'
      },
      seo: {
        metaTitle: 'Curso de Marketing Digital - Aprenda do Zero',
        metaDescription: 'Curso completo de marketing digital com mais de 50 horas de conteúdo',
        focusKeyword: 'curso marketing digital'
      },
      content: '<h1>Curso de Marketing Digital</h1><p>Aprenda marketing digital do zero...</p>',
      createdAt: new Date('2024-01-15T10:00:00'),
      updatedAt: new Date('2024-01-15T10:00:00'),
      publishedAt: new Date('2024-01-15T10:00:00'),
      wordpressId: '123',
      wordpressUrl: 'https://meusite.com/curso-marketing-digital'
    }
  ]

  const mockGenerations: PresselGeneration[] = [
    {
      id: '1',
      type: 'text-to-json',
      input: 'Crie uma página de vendas para um curso de marketing digital...',
      output: {
        page_title: 'Curso de Marketing Digital',
        page_model: 'modelo_v1',
        acf_fields: {
          hero_description: 'Aprenda marketing digital do zero',
          titulo_da_secao: 'Acesse Agora'
        }
      },
      model: '1',
      siteId: '1',
      status: 'completed',
      createdAt: new Date('2024-01-15T10:00:00'),
      completedAt: new Date('2024-01-15T10:01:00')
    }
  ]

  const refreshModels = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setModels(mockModels)
    } catch (err) {
      setError('Erro ao carregar modelos Pressel')
      console.error('Erro ao carregar modelos Pressel:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshPages = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Filtrar páginas pela organização atual
      const orgPages = mockPages.filter(page => page.organizationId === currentOrganization.id)
      
      setPages(orgPages)
    } catch (err) {
      setError('Erro ao carregar páginas Pressel')
      console.error('Erro ao carregar páginas Pressel:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshGenerations = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Filtrar gerações pela organização atual
      const orgGenerations = mockGenerations.filter(gen => 
        sites.some(site => site.id === gen.siteId && site.organizationId === currentOrganization.id)
      )
      
      setGenerations(orgGenerations)
    } catch (err) {
      setError('Erro ao carregar gerações Pressel')
      console.error('Erro ao carregar gerações Pressel:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const convertTextToJson = async (text: string, model: string): Promise<PresselGeneration> => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const generation: PresselGeneration = {
        id: Date.now().toString(),
        type: 'text-to-json',
        input: text,
        output: null,
        model,
        siteId: sites[0]?.id || '',
        status: 'processing',
        createdAt: new Date()
      }
      
      setGenerations(prev => [generation, ...prev])
      setCurrentGeneration(generation)
      
      // Simular processamento de IA
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Simular conversão de texto para JSON
      const modelData = models.find(m => m.id === model)
      if (!modelData) throw new Error('Modelo não encontrado')
      
      const output = {
        page_title: extractTitle(text),
        page_model: `modelo_v${model}`,
        page_slug: generateSlug(extractTitle(text)),
        post_status: 'draft',
        acf_fields: generateACFFields(text, modelData.fields),
        seo: {
          meta_title: extractTitle(text),
          meta_description: extractDescription(text),
          focus_keyword: extractKeywords(text)
        }
      }
      
      const completedGeneration = {
        ...generation,
        output,
        status: 'completed' as const,
        completedAt: new Date()
      }
      
      setGenerations(prev => prev.map(g => g.id === generation.id ? completedGeneration : g))
      setCurrentGeneration(null)
      setIsGenerating(false)
      
      return completedGeneration
    } catch (err) {
      setError('Erro ao converter texto para JSON')
      setIsGenerating(false)
      setCurrentGeneration(null)
      throw err
    }
  }

  const generatePage = async (data: any, model: string, siteId: string): Promise<PresselPage> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const modelData = models.find(m => m.id === model)
      if (!modelData) throw new Error('Modelo não encontrado')
      
      const page: PresselPage = {
        id: Date.now().toString(),
        title: data.page_title || 'Nova Página Pressel',
        slug: data.page_slug || 'nova-pagina-pressel',
        model,
        status: 'draft',
        siteId,
        organizationId: currentOrganization?.id || '',
        acfFields: data.acf_fields || {},
        seo: data.seo || {
          metaTitle: data.page_title || 'Nova Página',
          metaDescription: '',
          focusKeyword: ''
        },
        content: generateContent(data, modelData),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setPages(prev => [page, ...prev])
      return page
    } catch (err) {
      setError('Erro ao gerar página')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const createPage = async (pageData: PresselPage): Promise<PresselPage> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const page = {
        ...pageData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setPages(prev => [page, ...prev])
      return page
    } catch (err) {
      setError('Erro ao criar página')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updatePage = async (id: string, updates: Partial<PresselPage>): Promise<PresselPage> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedPage = {
        ...pages.find(p => p.id === id),
        ...updates,
        updatedAt: new Date()
      } as PresselPage
      
      setPages(prev => prev.map(p => p.id === id ? updatedPage : p))
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
      setPages(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      setError('Erro ao deletar página')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const publishPage = async (id: string): Promise<PresselPage> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const page = pages.find(p => p.id === id)
      if (!page) throw new Error('Página não encontrada')
      
      const updatedPage = {
        ...page,
        status: 'published' as const,
        publishedAt: new Date(),
        updatedAt: new Date()
      }
      
      setPages(prev => prev.map(p => p.id === id ? updatedPage : p))
      return updatedPage
    } catch (err) {
      setError('Erro ao publicar página')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getPage = (id: string): PresselPage | null => {
    return pages.find(p => p.id === id) || null
  }

  // Funções auxiliares
  const extractTitle = (text: string): string => {
    const lines = text.split('\n').filter(line => line.trim())
    return lines[0]?.trim() || 'Nova Página Pressel'
  }

  const extractDescription = (text: string): string => {
    const lines = text.split('\n').filter(line => line.trim())
    return lines[1]?.trim() || 'Descrição da página'
  }

  const extractKeywords = (text: string): string => {
    const words = text.toLowerCase().split(/\s+/)
    const commonWords = ['de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'para', 'com', 'por', 'sobre', 'entre', 'até', 'desde', 'durante', 'após', 'antes', 'depois', 'quando', 'onde', 'como', 'porque', 'que', 'qual', 'quais', 'quem', 'cujo', 'cuja', 'cujos', 'cujas', 'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa', 'nossos', 'nossas', 'vosso', 'vossa', 'vossos', 'vossas', 'se', 'não', 'mais', 'muito', 'pouco', 'bem', 'mal', 'sempre', 'nunca', 'já', 'ainda', 'também', 'só', 'apenas', 'até', 'mesmo', 'outro', 'outra', 'outros', 'outras', 'todo', 'toda', 'todos', 'todas', 'cada', 'qualquer', 'algum', 'alguma', 'alguns', 'algumas', 'nenhum', 'nenhuma', 'nenhuns', 'nenhumas', 'tanto', 'tanta', 'tantos', 'tantas', 'quanto', 'quanta', 'quantos', 'quantas', 'tanto', 'quanto', 'mais', 'menos', 'muito', 'pouco', 'bem', 'mal', 'melhor', 'pior', 'maior', 'menor', 'mais', 'menos', 'bem', 'mal', 'melhor', 'pior', 'maior', 'menor']
    const filteredWords = words.filter(word => word.length > 3 && !commonWords.includes(word))
    return [...new Set(filteredWords)].slice(0, 3).join(', ')
  }

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const generateACFFields = (text: string, fields: PresselField[]): Record<string, any> => {
    const acfFields: Record<string, any> = {}
    
    fields.forEach(field => {
      switch (field.name) {
        case 'hero_description':
          acfFields[field.acfField] = extractDescription(text)
          break
        case 'titulo_da_secao':
          acfFields[field.acfField] = 'Acesse Agora'
          break
        case 'texto_usuario':
          acfFields[field.acfField] = text.split('\n')[2]?.trim() || 'Conteúdo sobre o usuário'
          break
        case 'titulo_h2_':
          acfFields[field.acfField] = 'O que você vai aprender'
          break
        case 'info_content':
          acfFields[field.acfField] = text.split('\n').slice(3).join('\n').trim() || 'Conteúdo informativo'
          break
        case 'titulo_beneficios':
          acfFields[field.acfField] = 'Benefícios Exclusivos'
          break
        case 'titulo_faq':
          acfFields[field.acfField] = 'Perguntas Frequentes'
          break
        case 'texto_botao_p1':
          acfFields[field.acfField] = 'VER MAIS'
          break
        case 'link_botao_p1':
          acfFields[field.acfField] = 'https://exemplo.com'
          break
        default:
          acfFields[field.acfField] = field.placeholder || ''
      }
    })
    
    return acfFields
  }

  const generateContent = (data: any, model: PresselModel): string => {
    let content = `<h1>${data.page_title}</h1>\n`
    content += `<p>${data.acf_fields?.hero_description || ''}</p>\n`
    content += `<h2>${data.acf_fields?.titulo_h2_ || ''}</h2>\n`
    content += `<p>${data.acf_fields?.info_content || ''}</p>\n`
    return content
  }

  useEffect(() => {
    refreshModels()
  }, [])

  useEffect(() => {
    if (currentOrganization) {
      refreshPages()
      refreshGenerations()
    }
  }, [currentOrganization])

  const value: PresselContextType = {
    models,
    pages,
    generations,
    isLoading,
    error,
    isGenerating,
    currentGeneration,
    convertTextToJson,
    generatePage,
    createPage,
    updatePage,
    deletePage,
    publishPage,
    getPage,
    refreshPages,
    refreshGenerations
  }

  return (
    <PresselContext.Provider value={value}>
      {children}
    </PresselContext.Provider>
  )
}

export function usePressel() {
  const context = useContext(PresselContext)
  if (context === undefined) {
    throw new Error('usePressel deve ser usado dentro de um PresselProvider')
  }
  return context
}

