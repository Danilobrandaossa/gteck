import { useState, useCallback } from 'react'
import { SmartSyncManager, SyncProgress, SmartSyncResult } from '@/lib/smart-sync-manager'

export function useSmartSync() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<SyncProgress>({
    phase: 'initial',
    currentStep: '',
    percentage: 0,
    itemsLoaded: 0,
    totalItems: 0,
    backgroundProgress: 0,
    isComplete: false,
    hasError: false,
    errors: [],
    details: []
  })
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [syncResult, setSyncResult] = useState<SmartSyncResult | null>(null)
  const [backgroundData, setBackgroundData] = useState<any[]>([])
  const [backgroundErrors, setBackgroundErrors] = useState<string[]>([])

  const smartSync = useCallback(async (
    baseUrl: string,
    username: string,
    password: string,
    endpoint: string
  ) => {
    setIsLoading(true)
    setShowProgressModal(true)
    setProgress({
      phase: 'initial',
      currentStep: 'Iniciando sincronização inteligente...',
      percentage: 0,
      itemsLoaded: 0,
      totalItems: 0,
      backgroundProgress: 0,
      isComplete: false,
      hasError: false,
      errors: [],
      details: [
        'Configurando sincronização inteligente...',
        'Priorizando conteúdo mais novo...',
        'Preparando carregamento gradual...'
      ]
    })

    try {
      const syncManager = SmartSyncManager.getInstance()
      
      // Configurar sincronização inteligente
      syncManager.setConfig({
        initialLoad: 15,           // 15 itens iniciais
        backgroundBatch: 10,       // 10 itens por lote em segundo plano
        delayBetweenRequests: 2000, // 2 segundos entre requisições
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000
      })

      const result = await syncManager.smartSync(
        baseUrl,
        username,
        password,
        endpoint,
        (progressData) => {
          setProgress(progressData)
          
          // Atualizar dados do segundo plano
          if (progressData.phase === 'background') {
            setBackgroundData(syncManager.getBackgroundData())
            setBackgroundErrors(syncManager.getBackgroundErrors())
          }
        }
      )

      setSyncResult(result)
      
      // Atualizar progresso final
      setProgress(prev => ({
        ...prev,
        phase: 'complete',
        currentStep: 'Sincronização concluída com sucesso!',
        percentage: 100,
        isComplete: true,
        hasError: false,
        details: [
          ...prev.details,
          'Sincronização inteligente concluída!',
          `Carregamento inicial: ${result.stats.initialLoad} itens`,
          `Segundo plano: ${result.stats.backgroundLoad} itens`,
          `Total: ${result.stats.totalLoad} itens`,
          `Duração: ${Math.round(result.stats.duration / 1000)}s`
        ]
      }))

    } catch (error) {
      console.error('Erro na sincronização inteligente:', error)
      setProgress(prev => ({
        ...prev,
        phase: 'initial',
        currentStep: 'Erro na sincronização',
        percentage: 0,
        isComplete: false,
        hasError: true,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
        details: [
          ...prev.details,
          `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          'Tente novamente ou verifique as credenciais'
        ]
      }))
      setSyncResult({
        success: false,
        initialData: [],
        backgroundData: [],
        totalLoaded: 0,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
        stats: {
          initialLoad: 0,
          backgroundLoad: 0,
          totalLoad: 0,
          duration: 0
        }
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const closeProgressModal = () => {
    setShowProgressModal(false)
    setProgress({
      phase: 'initial',
      currentStep: '',
      percentage: 0,
      itemsLoaded: 0,
      totalItems: 0,
      backgroundProgress: 0,
      isComplete: false,
      hasError: false,
      errors: [],
      details: []
    })
  }

  const getBackgroundSyncStatus = () => {
    const syncManager = SmartSyncManager.getInstance()
    return {
      isActive: syncManager.isBackgroundSyncActive(),
      data: syncManager.getBackgroundData(),
      errors: syncManager.getBackgroundErrors()
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }

  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Teste de Notificação', {
        body: 'Sistema de notificações funcionando corretamente!',
        icon: '/favicon.ico'
      })
    }
  }

  return {
    isLoading,
    progress,
    showProgressModal,
    syncResult,
    backgroundData,
    backgroundErrors,
    smartSync,
    closeProgressModal,
    getBackgroundSyncStatus,
    requestNotificationPermission,
    sendTestNotification
  }
}









