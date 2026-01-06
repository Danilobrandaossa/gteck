'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'

export interface AITask {
  id: string
  type: 'generate_page' | 'generate_image' | 'generate_quiz' | 'generate_ad' | 'optimize_seo' | 'translate_content'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  title: string
  description: string
  input: any
  output?: any
  error?: string
  progress: number
  createdAt: Date
  completedAt?: Date
  organizationId: string
  siteId?: string
}

export interface AIGenerationRequest {
  type: 'page' | 'image' | 'quiz' | 'ad' | 'seo' | 'translate'
  prompt: string
  context?: string
  language?: string
  style?: string
  length?: 'short' | 'medium' | 'long'
  targetAudience?: string
  keywords?: string[]
  template?: string
  siteId?: string
}

export interface AIGeneratedContent {
  id: string
  type: string
  title: string
  content: string
  metadata?: {
    wordCount?: number
    readingTime?: number
    keywords?: string[]
    sentiment?: string
    language?: string
  }
  createdAt: Date
}

interface AIContextType {
  tasks: AITask[]
  generatedContent: AIGeneratedContent[]
  isLoading: boolean
  error: string | null
  isGenerating: boolean
  currentTask: AITask | null
  generateContent: (request: AIGenerationRequest) => Promise<AIGeneratedContent>
  generatePage: (prompt: string, context?: string) => Promise<AIGeneratedContent>
  generateImage: (prompt: string, style?: string) => Promise<AIGeneratedContent>
  generateQuiz: (topic: string, questions: number) => Promise<AIGeneratedContent>
  generateAd: (product: string, platform: string) => Promise<AIGeneratedContent>
  optimizeSEO: (content: string, keywords: string[]) => Promise<AIGeneratedContent>
  translateContent: (content: string, targetLanguage: string) => Promise<AIGeneratedContent>
  getTaskStatus: (taskId: string) => AITask | null
  cancelTask: (taskId: string) => Promise<void>
  retryTask: (taskId: string) => Promise<void>
  refreshTasks: () => Promise<void>
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization, currentSite } = useOrganization()
  const [tasks, setTasks] = useState<AITask[]>([])
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentTask, setCurrentTask] = useState<AITask | null>(null)

  // Dados mock para demonstração
  const mockTasks: AITask[] = [
    {
      id: '1',
      type: 'generate_page',
      status: 'completed',
      title: 'Gerar Página: Como Vender Online',
      description: 'Criar página completa sobre vendas online',
      input: { prompt: 'Como vender online em 2024', context: 'E-commerce' },
      output: { content: 'Conteúdo gerado...', wordCount: 1200 },
      progress: 100,
      createdAt: new Date('2024-01-15T10:00:00'),
      completedAt: new Date('2024-01-15T10:05:00'),
      organizationId: '1',
      siteId: '1'
    },
    {
      id: '2',
      type: 'generate_image',
      status: 'processing',
      title: 'Gerar Imagem: Produto Tecnologia',
      description: 'Criar imagem para produto de tecnologia',
      input: { prompt: 'Produto tecnológico moderno', style: 'minimalist' },
      progress: 65,
      createdAt: new Date('2024-01-15T11:00:00'),
      organizationId: '1',
      siteId: '1'
    },
    {
      id: '3',
      type: 'generate_quiz',
      status: 'failed',
      title: 'Gerar Quiz: Marketing Digital',
      description: 'Criar quiz sobre marketing digital',
      input: { topic: 'Marketing Digital', questions: 10 },
      error: 'Erro na geração do quiz',
      progress: 0,
      createdAt: new Date('2024-01-15T12:00:00'),
      organizationId: '1',
      siteId: '1'
    }
  ]

  const mockGeneratedContent: AIGeneratedContent[] = [
    {
      id: '1',
      type: 'page',
      title: 'Como Vender Online em 2024: Guia Completo',
      content: 'O e-commerce está em constante evolução...',
      metadata: {
        wordCount: 1200,
        readingTime: 5,
        keywords: ['vendas online', 'e-commerce', 'marketing digital'],
        sentiment: 'positive',
        language: 'pt-BR'
      },
      createdAt: new Date('2024-01-15T10:05:00')
    },
    {
      id: '2',
      type: 'image',
      title: 'Produto Tecnológico Moderno',
      content: 'URL da imagem gerada: https://example.com/image.jpg',
      metadata: {
        keywords: ['tecnologia', 'produto', 'moderno'],
        language: 'pt-BR'
      },
      createdAt: new Date('2024-01-15T11:05:00')
    }
  ]

  const refreshTasks = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Filtrar tarefas pela organização atual
      const orgTasks = mockTasks.filter(task => task.organizationId === currentOrganization.id)
      
      setTasks(orgTasks)
    } catch (err) {
      setError('Erro ao carregar tarefas de IA')
      console.error('Erro ao carregar tarefas de IA:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createTask = (type: AITask['type'], title: string, description: string, input: any): AITask => {
    const task: AITask = {
      id: Date.now().toString(),
      type,
      status: 'pending',
      title,
      description,
      input,
      progress: 0,
      createdAt: new Date(),
      organizationId: currentOrganization?.id || '',
      siteId: currentSite?.id
    }
    
    setTasks(prev => [task, ...prev])
    return task
  }

  const updateTask = (taskId: string, updates: Partial<AITask>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ))
  }

  const simulateAIGeneration = async (task: AITask): Promise<AIGeneratedContent> => {
    // Simular progresso
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      updateTask(task.id, { progress: i, status: 'processing' })
    }

    // Simular resultado
    const result: AIGeneratedContent = {
      id: Date.now().toString(),
      type: task.type.replace('generate_', ''),
      title: `Conteúdo Gerado: ${task.title}`,
      content: `Conteúdo gerado para: ${task.input.prompt || task.input.topic || 'conteúdo'}`,
      metadata: {
        wordCount: Math.floor(Math.random() * 1000) + 500,
        readingTime: Math.floor(Math.random() * 10) + 3,
        keywords: ['IA', 'gerado', 'conteúdo'],
        sentiment: 'positive',
        language: 'pt-BR'
      },
      createdAt: new Date()
    }

    updateTask(task.id, { 
      status: 'completed', 
      output: result,
      completedAt: new Date()
    })

    setGeneratedContent(prev => [result, ...prev])
    return result
  }

  const generateContent = async (request: AIGenerationRequest): Promise<AIGeneratedContent> => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const task = createTask(
        `generate_${request.type}` as AITask['type'],
        `Gerar ${request.type}: ${request.prompt}`,
        `Gerando conteúdo do tipo ${request.type}`,
        request
      )

      setCurrentTask(task)
      const result = await simulateAIGeneration(task)
      setCurrentTask(null)
      
      return result
    } catch (err) {
      setError('Erro ao gerar conteúdo')
      throw err
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePage = async (prompt: string, context?: string): Promise<AIGeneratedContent> => {
    return generateContent({
      type: 'page',
      prompt,
      context,
      length: 'long'
    })
  }

  const generateImage = async (prompt: string, style?: string): Promise<AIGeneratedContent> => {
    return generateContent({
      type: 'image',
      prompt,
      style
    })
  }

  const generateQuiz = async (topic: string, questions: number): Promise<AIGeneratedContent> => {
    return generateContent({
      type: 'quiz',
      prompt: topic,
      context: `${questions} perguntas`
    })
  }

  const generateAd = async (product: string, platform: string): Promise<AIGeneratedContent> => {
    return generateContent({
      type: 'ad',
      prompt: product,
      context: platform
    })
  }

  const optimizeSEO = async (content: string, keywords: string[]): Promise<AIGeneratedContent> => {
    return generateContent({
      type: 'seo',
      prompt: content,
      keywords
    })
  }

  const translateContent = async (content: string, targetLanguage: string): Promise<AIGeneratedContent> => {
    return generateContent({
      type: 'translate',
      prompt: content,
      language: targetLanguage
    })
  }

  const getTaskStatus = (taskId: string): AITask | null => {
    return tasks.find(task => task.id === taskId) || null
  }

  const cancelTask = async (taskId: string): Promise<void> => {
    updateTask(taskId, { status: 'failed', error: 'Cancelado pelo usuário' })
  }

  const retryTask = async (taskId: string): Promise<void> => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      updateTask(taskId, { status: 'pending', progress: 0, error: undefined })
      await simulateAIGeneration(task)
    }
  }

  useEffect(() => {
    if (currentOrganization) {
      refreshTasks()
    }
  }, [currentOrganization])

  const value: AIContextType = {
    tasks,
    generatedContent,
    isLoading,
    error,
    isGenerating,
    currentTask,
    generateContent,
    generatePage,
    generateImage,
    generateQuiz,
    generateAd,
    optimizeSEO,
    translateContent,
    getTaskStatus,
    cancelTask,
    retryTask,
    refreshTasks
  }

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error('useAI deve ser usado dentro de um AIProvider')
  }
  return context
}

