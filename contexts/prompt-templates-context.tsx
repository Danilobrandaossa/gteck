'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface PromptTemplate {
  id: string
  name: string
  description: string
  prompt: string
  aiType: 'openai' | 'gemini' | 'koala' | 'claude'
  category: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  usageCount: number
}

interface PromptTemplatesContextType {
  templates: PromptTemplate[]
  loading: boolean
  error: string | null
  addTemplate: (template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void
  updateTemplate: (id: string, template: Partial<PromptTemplate>) => void
  deleteTemplate: (id: string) => void
  getTemplatesByCategory: (category: string) => PromptTemplate[]
  getTemplatesByAIType: (aiType: string) => PromptTemplate[]
  searchTemplates: (query: string) => PromptTemplate[]
  incrementUsage: (id: string) => void
}

const PromptTemplatesContext = createContext<PromptTemplatesContextType | undefined>(undefined)

export function PromptTemplatesProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [loading, _setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Templates padrão com dados reais das IAs
  const defaultTemplates: PromptTemplate[] = [
    {
      id: '1',
      name: 'Artigo de Blog - GPT-5',
      description: 'Template otimizado para GPT-5 criar artigos de blog completos e estruturados',
      prompt: 'Escreva um artigo completo sobre {tema} com introdução, desenvolvimento e conclusão. Inclua subtítulos, exemplos práticos e uma conclusão que incentive o leitor a agir. Use linguagem clara e objetiva, com SEO otimizado.',
      aiType: 'openai',
      category: 'Conteúdo',
      tags: ['blog', 'artigo', 'conteúdo', 'gpt-5', 'seo'],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    },
    {
      id: '2',
      name: 'Descrição de Produto - Gemini Pro',
      description: 'Template para Gemini Pro criar descrições de produtos e-commerce otimizadas',
      prompt: 'Crie uma descrição atrativa para o produto {produto} destacando suas principais características, benefícios e diferenciais. Use linguagem persuasiva e inclua call-to-action. Foque na conversão e vendas.',
      aiType: 'gemini',
      category: 'E-commerce',
      tags: ['produto', 'ecommerce', 'vendas', 'gemini', 'conversão'],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    },
    {
      id: '3',
      name: 'Post para Redes Sociais - GPT-5',
      description: 'Template para GPT-5 criar posts engajantes para redes sociais',
      prompt: 'Crie um post para {rede_social} sobre {tema} que seja engajante, use hashtags relevantes e incentive a interação dos seguidores. Adapte o tom para a plataforma escolhida.',
      aiType: 'openai',
      category: 'Social Media',
      tags: ['social', 'post', 'engajamento', 'gpt-5', 'hashtags'],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    },
    {
      id: '4',
      name: 'Email Marketing - Koala.sh',
      description: 'Template para Koala.sh criar emails de marketing eficazes e otimizados',
      prompt: 'Escreva um email de marketing sobre {assunto} com assunto atrativo, corpo persuasivo e call-to-action claro. Foque na conversão e use técnicas de copywriting avançadas.',
      aiType: 'koala',
      category: 'Marketing',
      tags: ['email', 'marketing', 'conversão', 'koala', 'copywriting'],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    },
    {
      id: '5',
      name: 'Resumo Executivo - Claude 3',
      description: 'Template para Claude 3 criar resumos executivos de relatórios',
      prompt: 'Crie um resumo executivo sobre {tema} destacando os pontos principais, conclusões e recomendações de forma clara e objetiva. Use linguagem profissional e estruturada.',
      aiType: 'claude',
      category: 'Profissional',
      tags: ['resumo', 'executivo', 'relatório', 'claude', 'profissional'],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    },
    {
      id: '6',
      name: 'Landing Page - GPT-5',
      description: 'Template para GPT-5 criar landing pages persuasivas',
      prompt: 'Crie uma landing page completa sobre {produto/serviço} com headline impactante, benefícios claros, prova social e call-to-action forte. Foque na conversão.',
      aiType: 'openai',
      category: 'Marketing',
      tags: ['landing', 'conversão', 'gpt-5', 'vendas', 'copywriting'],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    },
    {
      id: '7',
      name: 'Tutorial Técnico - Gemini Pro',
      description: 'Template para Gemini Pro criar tutoriais técnicos detalhados',
      prompt: 'Crie um tutorial passo a passo sobre {tema_técnico} com explicações claras, exemplos práticos e dicas importantes. Use linguagem acessível para iniciantes.',
      aiType: 'gemini',
      category: 'Conteúdo',
      tags: ['tutorial', 'técnico', 'gemini', 'educativo', 'passo-a-passo'],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    },
    {
      id: '8',
      name: 'Análise de Mercado - Claude 3',
      description: 'Template para Claude 3 criar análises de mercado profissionais',
      prompt: 'Faça uma análise completa do mercado de {setor} incluindo tendências, oportunidades, ameaças e recomendações estratégicas.',
      aiType: 'claude',
      category: 'Profissional',
      tags: ['análise', 'mercado', 'claude', 'estratégia', 'negócios'],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    },
    {
      id: '9',
      name: 'Conteúdo SEO - Koala.sh',
      description: 'Template para Koala.sh criar conteúdo otimizado para SEO',
      prompt: 'Crie um conteúdo otimizado para SEO sobre {palavra_chave} com estrutura clara, palavras-chave estratégicas e valor para o leitor. Inclua meta descriptions e títulos otimizados.',
      aiType: 'koala',
      category: 'SEO',
      tags: ['seo', 'otimização', 'koala', 'palavras-chave', 'ranking'],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    },
    {
      id: '10',
      name: 'Apresentação Executiva - GPT-5',
      description: 'Template para GPT-5 criar apresentações executivas impactantes',
      prompt: 'Crie uma apresentação executiva sobre {tema} com slides estruturados, dados relevantes e storytelling persuasivo. Foque em decisões e resultados.',
      aiType: 'openai',
      category: 'Profissional',
      tags: ['apresentação', 'executivo', 'gpt-5', 'storytelling', 'negócios'],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    }
  ]

  // Carregar templates do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTemplates = localStorage.getItem('promptTemplates')
      if (savedTemplates) {
        try {
          const parsedTemplates = JSON.parse(savedTemplates)
          setTemplates(parsedTemplates)
        } catch (err) {
          console.error('Erro ao carregar templates:', err)
          setError('Erro ao carregar templates salvos')
          setTemplates(defaultTemplates)
        }
      } else {
        setTemplates(defaultTemplates)
        localStorage.setItem('promptTemplates', JSON.stringify(defaultTemplates))
      }
    } else {
      setTemplates(defaultTemplates)
    }
  }, [])

  const addTemplate = (templateData: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    const newTemplate: PromptTemplate = {
      ...templateData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    }

    const updatedTemplates = [...templates, newTemplate]
    setTemplates(updatedTemplates)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('promptTemplates', JSON.stringify(updatedTemplates))
    }
  }

  const updateTemplate = (id: string, templateData: Partial<PromptTemplate>) => {
    const updatedTemplates = templates.map(template =>
      template.id === id 
        ? { ...template, ...templateData, updatedAt: new Date() }
        : template
    )
    
    setTemplates(updatedTemplates)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('promptTemplates', JSON.stringify(updatedTemplates))
    }
  }

  const deleteTemplate = (id: string) => {
    const updatedTemplates = templates.filter(template => template.id !== id)
    setTemplates(updatedTemplates)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('promptTemplates', JSON.stringify(updatedTemplates))
    }
  }

  const getTemplatesByCategory = (category: string) => {
    return templates.filter(template => template.category === category)
  }

  const getTemplatesByAIType = (aiType: string) => {
    return templates.filter(template => template.aiType === aiType)
  }

  const searchTemplates = (query: string) => {
    const lowercaseQuery = query.toLowerCase()
    return templates.filter(template =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  const incrementUsage = (id: string) => {
    const updatedTemplates = templates.map(template =>
      template.id === id 
        ? { ...template, usageCount: template.usageCount + 1, updatedAt: new Date() }
        : template
    )
    
    setTemplates(updatedTemplates)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('promptTemplates', JSON.stringify(updatedTemplates))
    }
  }

  return (
    <PromptTemplatesContext.Provider
      value={{
        templates,
        loading,
        error,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        getTemplatesByCategory,
        getTemplatesByAIType,
        searchTemplates,
        incrementUsage
      }}
    >
      {children}
    </PromptTemplatesContext.Provider>
  )
}

export function usePromptTemplates() {
  const context = useContext(PromptTemplatesContext)
  if (context === undefined) {
    throw new Error('usePromptTemplates must be used within a PromptTemplatesProvider')
  }
  return context
}
