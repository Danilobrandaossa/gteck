import { useState, useCallback } from 'react'
import { RobustWordPressSync, SyncConfig, SyncProgress } from '@/lib/robust-wordpress-sync'

export function useRobustWordPressSync() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<SyncProgress>({
    currentStep: 'Iniciando...',
    percentage: 0,
    totalItems: 0,
    processedItems: 0,
    errors: 0,
    warnings: 0
  })
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)

  const syncData = useCallback(async (
    baseUrl: string,
    username: string,
    password: string
  ) => {
    setIsLoading(true)
    setShowProgressModal(true)
    setProgress({
      currentStep: 'Iniciando sincronização...',
      percentage: 0,
      totalItems: 0,
      processedItems: 0,
      errors: 0,
      warnings: 0
    })

    try {
      const config: SyncConfig = {
        baseUrl,
        username,
        password,
        maxRetries: 3,
        delayBetweenRequests: 1500, // 1.5s entre requisições
        maxItemsPerPage: 10 // Máximo 10 itens por página
      }

      const robustSync = new RobustWordPressSync(config)
      
      // Configurar callback de progresso
      robustSync.onProgress((progress) => {
        setProgress(progress)
      })

      // Sincronizar todos os dados
      const results = await robustSync.syncAllData()

      // Calcular estatísticas finais
      const totalItems = Object.values(results).reduce((sum, result) => sum + result.totalItems, 0)
      const totalErrors = Object.values(results).reduce((sum, result) => sum + result.errors.length, 0)
      const totalWarnings = Object.values(results).reduce((sum, result) => sum + result.warnings.length, 0)

      setProgress({
        currentStep: 'Sincronização concluída com sucesso!',
        percentage: 100,
        totalItems,
        processedItems: totalItems,
        errors: totalErrors,
        warnings: totalWarnings
      })

      setSyncResult({
        success: true,
        message: 'Sincronização concluída com sucesso!',
        data: results,
        stats: {
          totalItems,
          totalErrors,
          totalWarnings,
          posts: results.posts.totalItems,
          pages: results.pages.totalItems,
          media: results.media.totalItems,
          categories: results.categories.totalItems,
          tags: results.tags.totalItems,
          users: results.users.totalItems
        }
      })

    } catch (error) {
      console.error('Erro na sincronização:', error)
      setProgress({
        currentStep: 'Erro na sincronização',
        percentage: 0,
        totalItems: 0,
        processedItems: 0,
        errors: 1,
        warnings: 0
      })

      setSyncResult({
        success: false,
        message: 'Erro na sincronização',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const closeProgressModal = () => {
    setShowProgressModal(false)
    setProgress({
      currentStep: 'Iniciando...',
      percentage: 0,
      totalItems: 0,
      processedItems: 0,
      errors: 0,
      warnings: 0
    })
  }

  return {
    isLoading,
    progress,
    showProgressModal,
    syncResult,
    syncData,
    closeProgressModal
  }
}








