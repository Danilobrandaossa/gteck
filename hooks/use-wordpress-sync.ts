import { useState, useCallback } from 'react'
import { WordPressDataManager } from '@/lib/wordpress-data-manager'

interface SyncProgress {
  percentage: number
  currentStep: string
  totalSteps: number
  currentStepIndex: number
  details: string[]
  isComplete: boolean
  hasError: boolean
}

export function useWordPressSync() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<SyncProgress>({
    percentage: 0,
    currentStep: '',
    totalSteps: 6, // posts, pages, media, categories, tags, users
    currentStepIndex: 0,
    details: [],
    isComplete: false,
    hasError: false
  })
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    success: boolean
    message: string
    stats?: any
  } | null>(null)

  const syncData = useCallback(async (
    baseUrl: string,
    username: string,
    password: string
  ) => {
    setIsLoading(true)
    setShowProgressModal(true)
    setProgress({
      percentage: 0,
      currentStep: 'Iniciando sincronização...',
      totalSteps: 6,
      currentStepIndex: 0,
      details: ['Conectando com WordPress...', 'Preparando carregamento gradual...'],
      isComplete: false,
      hasError: false
    })

    try {
      const dataManager = WordPressDataManager.getInstance()
      
      const stats = await dataManager.syncAllData(
        baseUrl,
        username,
        password,
        (type: string, progressData: any) => {
          const stepIndex = ['posts', 'pages', 'media', 'categories', 'tags', 'users'].indexOf(type)
          const stepPercentage = (stepIndex + 1) / 6 * 100
          
          setProgress(prev => ({
            ...prev,
            percentage: Math.min(stepPercentage, 95), // Máximo 95% até completar
            currentStep: `Sincronizando ${type} (${progressData.currentPage}/${progressData.totalPages})`,
            currentStepIndex: stepIndex,
            details: [
              ...prev.details,
              `${type}: Página ${progressData.currentPage}/${progressData.totalPages} - ${Math.round(progressData.percentage)}%`,
              `${type}: ${progressData.itemsLoaded || 0} itens carregados`
            ]
          }))
        }
      )

      setProgress(prev => ({
        ...prev,
        percentage: 100,
        currentStep: 'Sincronização concluída!',
        currentStepIndex: 5,
        details: [
          ...prev.details,
          'Sincronização finalizada com sucesso!',
          `Posts: ${stats.posts} encontrados`,
          `Páginas: ${stats.pages} encontradas`,
          `Mídia: ${stats.media} encontradas`,
          `Categorias: ${stats.categories} encontradas`,
          `Tags: ${stats.tags} encontradas`,
          `Usuários: ${stats.users} encontrados`,
          `Total: ${stats.totalItems} itens sincronizados`
        ],
        isComplete: true,
        hasError: false
      }))

      setSyncResult({
        success: true,
        message: 'Sincronização concluída com sucesso!',
        stats
      })

    } catch (error) {
      console.error('Erro na sincronização:', error)
      setProgress(prev => ({
        ...prev,
        percentage: 0,
        currentStep: 'Erro na sincronização',
        details: [
          ...prev.details,
          `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          'Tente novamente ou verifique as credenciais'
        ],
        isComplete: false,
        hasError: true
      }))
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const closeProgressModal = () => {
    setShowProgressModal(false)
    setProgress({
      percentage: 0,
      currentStep: '',
      totalSteps: 6,
      currentStepIndex: 0,
      details: [],
      isComplete: false,
      hasError: false
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
