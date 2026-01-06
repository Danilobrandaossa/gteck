'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'

export interface BulkOperation {
  id: string
  type: 'import' | 'export' | 'generate' | 'delete' | 'update' | 'duplicate'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  title: string
  description: string
  totalItems: number
  processedItems: number
  successItems: number
  failedItems: number
  progress: number
  data: any
  result?: any
  error?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  organizationId: string
  siteId?: string
  userId: string
}

export interface ImportData {
  source: 'csv' | 'json' | 'xml' | 'wordpress' | 'excel'
  file?: File
  url?: string
  mapping?: Record<string, string>
  options?: {
    skipDuplicates?: boolean
    updateExisting?: boolean
    validateData?: boolean
  }
}

export interface ExportData {
  format: 'csv' | 'json' | 'xml' | 'wordpress'
  filters?: {
    status?: string[]
    category?: string[]
    dateRange?: {
      start: Date
      end: Date
    }
  }
  fields?: string[]
}

export interface GenerateData {
  type: 'pages' | 'templates' | 'categories' | 'media'
  count: number
  template?: string
  aiPrompt?: string
  options?: {
    randomize?: boolean
    includeImages?: boolean
    seoOptimized?: boolean
  }
}

interface BulkOperationsContextType {
  operations: BulkOperation[]
  isLoading: boolean
  error: string | null
  isProcessing: boolean
  currentOperation: BulkOperation | null
  importData: (data: ImportData) => Promise<BulkOperation>
  exportData: (data: ExportData) => Promise<BulkOperation>
  generateContent: (data: GenerateData) => Promise<BulkOperation>
  deleteItems: (itemIds: string[], type: string) => Promise<BulkOperation>
  updateItems: (itemIds: string[], updates: any) => Promise<BulkOperation>
  duplicateItems: (itemIds: string[], type: string) => Promise<BulkOperation>
  cancelOperation: (operationId: string) => Promise<void>
  retryOperation: (operationId: string) => Promise<void>
  getOperationStatus: (operationId: string) => BulkOperation | null
  refreshOperations: () => Promise<void>
}

const BulkOperationsContext = createContext<BulkOperationsContextType | undefined>(undefined)

export function BulkOperationsProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useOrganization()
  const [operations, setOperations] = useState<BulkOperation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentOperation, setCurrentOperation] = useState<BulkOperation | null>(null)

  // Dados mock para demonstração
  const mockOperations: BulkOperation[] = [
    {
      id: '1',
      type: 'import',
      status: 'completed',
      title: 'Importar Páginas do WordPress',
      description: 'Importar 50 páginas do site WordPress',
      totalItems: 50,
      processedItems: 50,
      successItems: 48,
      failedItems: 2,
      progress: 100,
      data: { source: 'wordpress', url: 'https://meusite.com' },
      result: { imported: 48, errors: 2 },
      createdAt: new Date('2024-01-15T10:00:00'),
      startedAt: new Date('2024-01-15T10:00:30'),
      completedAt: new Date('2024-01-15T10:05:00'),
      organizationId: '1',
      siteId: '1',
      userId: '1'
    },
    {
      id: '2',
      type: 'generate',
      status: 'processing',
      title: 'Gerar Páginas com IA',
      description: 'Gerar 20 páginas sobre marketing digital',
      totalItems: 20,
      processedItems: 12,
      successItems: 12,
      failedItems: 0,
      progress: 60,
      data: { type: 'pages', count: 20, aiPrompt: 'marketing digital' },
      createdAt: new Date('2024-01-15T11:00:00'),
      startedAt: new Date('2024-01-15T11:00:15'),
      organizationId: '1',
      siteId: '1',
      userId: '1'
    },
    {
      id: '3',
      type: 'export',
      status: 'failed',
      title: 'Exportar Páginas para CSV',
      description: 'Exportar todas as páginas publicadas',
      totalItems: 100,
      processedItems: 0,
      successItems: 0,
      failedItems: 0,
      progress: 0,
      data: { format: 'csv', filters: { status: ['published'] } },
      error: 'Erro de permissão no arquivo',
      createdAt: new Date('2024-01-15T12:00:00'),
      organizationId: '1',
      siteId: '1',
      userId: '1'
    }
  ]

  const refreshOperations = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Filtrar operações pela organização atual
      const orgOperations = mockOperations.filter(op => op.organizationId === currentOrganization.id)
      
      setOperations(orgOperations)
    } catch (err) {
      setError('Erro ao carregar operações em massa')
      console.error('Erro ao carregar operações em massa:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createOperation = (type: BulkOperation['type'], title: string, description: string, data: any): BulkOperation => {
    const operation: BulkOperation = {
      id: Date.now().toString(),
      type,
      status: 'pending',
      title,
      description,
      totalItems: 0,
      processedItems: 0,
      successItems: 0,
      failedItems: 0,
      progress: 0,
      data,
      createdAt: new Date(),
      organizationId: currentOrganization?.id || '',
      siteId: currentOrganization?.id, // Mock
      userId: '1' // Mock
    }
    
    setOperations(prev => [operation, ...prev])
    return operation
  }

  const updateOperation = (operationId: string, updates: Partial<BulkOperation>) => {
    setOperations(prev => prev.map(op => 
      op.id === operationId ? { ...op, ...updates } : op
    ))
  }

  const simulateOperation = async (operation: BulkOperation): Promise<void> => {
    setCurrentOperation(operation)
    setIsProcessing(true)
    
    // Simular processamento
    const totalItems = operation.data.count || 100
    updateOperation(operation.id, { 
      status: 'processing', 
      totalItems, 
      startedAt: new Date() 
    })
    
    for (let i = 0; i <= totalItems; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const progress = Math.min(100, (i / totalItems) * 100)
      const successItems = Math.floor(i * 0.95) // 95% de sucesso
      const failedItems = i - successItems
      
      updateOperation(operation.id, {
        processedItems: i,
        successItems,
        failedItems,
        progress
      })
    }
    
    // Finalizar operação
    updateOperation(operation.id, {
      status: 'completed',
      completedAt: new Date(),
      result: { 
        message: 'Operação concluída com sucesso',
        successItems: operation.totalItems * 0.95,
        failedItems: operation.totalItems * 0.05
      }
    })
    
    setCurrentOperation(null)
    setIsProcessing(false)
  }

  const importData = async (data: ImportData): Promise<BulkOperation> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const operation = createOperation(
        'import',
        `Importar dados de ${data.source}`,
        `Importar dados do formato ${data.source}`,
        data
      )
      
      await simulateOperation(operation)
      return operation
    } catch (err) {
      setError('Erro ao importar dados')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = async (data: ExportData): Promise<BulkOperation> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const operation = createOperation(
        'export',
        `Exportar dados para ${data.format}`,
        `Exportar dados no formato ${data.format}`,
        data
      )
      
      await simulateOperation(operation)
      return operation
    } catch (err) {
      setError('Erro ao exportar dados')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const generateContent = async (data: GenerateData): Promise<BulkOperation> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const operation = createOperation(
        'generate',
        `Gerar ${data.count} ${data.type}`,
        `Gerar ${data.count} itens do tipo ${data.type}`,
        data
      )
      
      await simulateOperation(operation)
      return operation
    } catch (err) {
      setError('Erro ao gerar conteúdo')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteItems = async (itemIds: string[], type: string): Promise<BulkOperation> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const operation = createOperation(
        'delete',
        `Excluir ${itemIds.length} ${type}`,
        `Excluir ${itemIds.length} itens do tipo ${type}`,
        { itemIds, type }
      )
      
      await simulateOperation(operation)
      return operation
    } catch (err) {
      setError('Erro ao excluir itens')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateItems = async (itemIds: string[], updates: any): Promise<BulkOperation> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const operation = createOperation(
        'update',
        `Atualizar ${itemIds.length} itens`,
        `Atualizar ${itemIds.length} itens`,
        { itemIds, updates }
      )
      
      await simulateOperation(operation)
      return operation
    } catch (err) {
      setError('Erro ao atualizar itens')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const duplicateItems = async (itemIds: string[], type: string): Promise<BulkOperation> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const operation = createOperation(
        'duplicate',
        `Duplicar ${itemIds.length} ${type}`,
        `Duplicar ${itemIds.length} itens do tipo ${type}`,
        { itemIds, type }
      )
      
      await simulateOperation(operation)
      return operation
    } catch (err) {
      setError('Erro ao duplicar itens')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const cancelOperation = async (operationId: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      updateOperation(operationId, { 
        status: 'cancelled',
        completedAt: new Date()
      })
    } catch (err) {
      setError('Erro ao cancelar operação')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const retryOperation = async (operationId: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const operation = operations.find(op => op.id === operationId)
      if (operation) {
        updateOperation(operationId, {
          status: 'pending',
          progress: 0,
          processedItems: 0,
          successItems: 0,
          failedItems: 0,
          error: undefined
        })
        await simulateOperation(operation)
      }
    } catch (err) {
      setError('Erro ao tentar novamente')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getOperationStatus = (operationId: string): BulkOperation | null => {
    return operations.find(op => op.id === operationId) || null
  }

  useEffect(() => {
    if (currentOrganization) {
      refreshOperations()
    }
  }, [currentOrganization])

  const value: BulkOperationsContextType = {
    operations,
    isLoading,
    error,
    isProcessing,
    currentOperation,
    importData,
    exportData,
    generateContent,
    deleteItems,
    updateItems,
    duplicateItems,
    cancelOperation,
    retryOperation,
    getOperationStatus,
    refreshOperations
  }

  return (
    <BulkOperationsContext.Provider value={value}>
      {children}
    </BulkOperationsContext.Provider>
  )
}

export function useBulkOperations() {
  const context = useContext(BulkOperationsContext)
  if (context === undefined) {
    throw new Error('useBulkOperations deve ser usado dentro de um BulkOperationsProvider')
  }
  return context
}

