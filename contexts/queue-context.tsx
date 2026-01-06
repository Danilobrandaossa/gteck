'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'

export interface QueueJob {
  id: string
  type: 'ai_generation' | 'wordpress_sync' | 'bulk_operation' | 'seo_optimization' | 'media_processing'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  title: string
  description: string
  data: any
  result?: any
  error?: string
  progress: number
  attempts: number
  maxAttempts: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  organizationId: string
  siteId?: string
  userId: string
}

interface QueueContextType {
  jobs: QueueJob[]
  isLoading: boolean
  error: string | null
  isProcessing: boolean
  addJob: (job: Omit<QueueJob, 'id' | 'createdAt' | 'attempts' | 'progress' | 'status'>) => Promise<QueueJob>
  cancelJob: (jobId: string) => Promise<void>
  retryJob: (jobId: string) => Promise<void>
  clearCompletedJobs: () => Promise<void>
  getJobStatus: (jobId: string) => QueueJob | null
  refreshJobs: () => Promise<void>
}

const QueueContext = createContext<QueueContextType | undefined>(undefined)

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useOrganization()
  const [jobs, setJobs] = useState<QueueJob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Dados mock para demonstração
  const mockJobs: QueueJob[] = [
    {
      id: '1',
      type: 'ai_generation',
      status: 'completed',
      priority: 'normal',
      title: 'Gerar Página: Marketing Digital',
      description: 'Criar página completa sobre marketing digital',
      data: { prompt: 'Marketing Digital', type: 'page' },
      result: { content: 'Página gerada com sucesso', wordCount: 1200 },
      progress: 100,
      attempts: 1,
      maxAttempts: 3,
      createdAt: new Date('2024-01-15T10:00:00'),
      startedAt: new Date('2024-01-15T10:00:30'),
      completedAt: new Date('2024-01-15T10:05:00'),
      organizationId: '1',
      siteId: '1',
      userId: '1'
    },
    {
      id: '2',
      type: 'wordpress_sync',
      status: 'processing',
      priority: 'high',
      title: 'Sincronizar WordPress',
      description: 'Sincronizar posts e páginas com WordPress',
      data: { siteId: '1', syncType: 'full' },
      progress: 65,
      attempts: 1,
      maxAttempts: 3,
      createdAt: new Date('2024-01-15T11:00:00'),
      startedAt: new Date('2024-01-15T11:00:15'),
      organizationId: '1',
      siteId: '1',
      userId: '1'
    },
    {
      id: '3',
      type: 'bulk_operation',
      status: 'failed',
      priority: 'normal',
      title: 'Processar 100 Páginas',
      description: 'Aplicar SEO em lote para 100 páginas',
      data: { pageIds: [1, 2, 3], operation: 'seo_optimization' },
      error: 'Erro de conexão com API',
      progress: 0,
      attempts: 3,
      maxAttempts: 3,
      createdAt: new Date('2024-01-15T12:00:00'),
      organizationId: '1',
      siteId: '1',
      userId: '1'
    },
    {
      id: '4',
      type: 'media_processing',
      status: 'pending',
      priority: 'low',
      title: 'Otimizar Imagens',
      description: 'Converter e otimizar 50 imagens para WebP',
      data: { mediaIds: [1, 2, 3], format: 'webp' },
      progress: 0,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date('2024-01-15T13:00:00'),
      organizationId: '1',
      siteId: '1',
      userId: '1'
    }
  ]

  const refreshJobs = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Filtrar jobs pela organização atual
      const orgJobs = mockJobs.filter(job => job.organizationId === currentOrganization.id)
      
      setJobs(orgJobs)
    } catch (err) {
      setError('Erro ao carregar fila de jobs')
      console.error('Erro ao carregar fila de jobs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const addJob = async (jobData: Omit<QueueJob, 'id' | 'createdAt' | 'attempts' | 'progress' | 'status'>): Promise<QueueJob> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const newJob: QueueJob = {
        ...jobData,
        id: Date.now().toString(),
        status: 'pending',
        attempts: 0,
        progress: 0,
        createdAt: new Date()
      }
      
      setJobs(prev => [newJob, ...prev])
      return newJob
    } catch (err) {
      setError('Erro ao adicionar job à fila')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const cancelJob = async (jobId: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 200))
      
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'cancelled' as const }
          : job
      ))
    } catch (err) {
      setError('Erro ao cancelar job')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const retryJob = async (jobId: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 200))
      
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'pending' as const, 
              attempts: 0, 
              progress: 0, 
              error: undefined 
            }
          : job
      ))
    } catch (err) {
      setError('Erro ao tentar novamente')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const clearCompletedJobs = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 200))
      
      setJobs(prev => prev.filter(job => job.status !== 'completed'))
    } catch (err) {
      setError('Erro ao limpar jobs concluídos')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getJobStatus = (jobId: string): QueueJob | null => {
    return jobs.find(job => job.id === jobId) || null
  }

  // Simular processamento de jobs
  useEffect(() => {
    const processJobs = () => {
      const pendingJobs = jobs.filter(job => job.status === 'pending')
      if (pendingJobs.length === 0) return

      const nextJob = pendingJobs.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })[0]

      if (nextJob) {
        setIsProcessing(true)
        setJobs(prev => prev.map(job => 
          job.id === nextJob.id 
            ? { ...job, status: 'processing' as const, startedAt: new Date() }
            : job
        ))

        // Simular processamento
        setTimeout(() => {
          setJobs(prev => prev.map(job => 
            job.id === nextJob.id 
              ? { 
                  ...job, 
                  status: 'completed' as const, 
                  progress: 100, 
                  completedAt: new Date(),
                  result: { message: 'Job processado com sucesso' }
                }
              : job
          ))
          setIsProcessing(false)
        }, 5000)
      }
    }

    const interval = setInterval(processJobs, 2000)
    return () => clearInterval(interval)
  }, [jobs])

  useEffect(() => {
    if (currentOrganization) {
      refreshJobs()
    }
  }, [currentOrganization])

  const value: QueueContextType = {
    jobs,
    isLoading,
    error,
    isProcessing,
    addJob,
    cancelJob,
    retryJob,
    clearCompletedJobs,
    getJobStatus,
    refreshJobs
  }

  return (
    <QueueContext.Provider value={value}>
      {children}
    </QueueContext.Provider>
  )
}

export function useQueue() {
  const context = useContext(QueueContext)
  if (context === undefined) {
    throw new Error('useQueue deve ser usado dentro de um QueueProvider')
  }
  return context
}

