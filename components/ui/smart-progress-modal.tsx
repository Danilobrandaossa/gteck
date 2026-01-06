'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Clock, Zap, Database, Bell } from 'lucide-react'
import { SyncProgress } from '@/lib/smart-sync-manager'

interface SmartProgressModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  progress: SyncProgress
  onRequestNotification?: () => void
}

export function SmartProgressModal({ 
  isOpen, 
  onClose, 
  title, 
  progress,
  onRequestNotification 
}: SmartProgressModalProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      onRequestNotification?.()
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'initial':
        return <Zap className="w-5 h-5 text-blue-500" />
      case 'background':
        return <Database className="w-5 h-5 text-green-500" />
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <RefreshCw className="w-5 h-5 text-gray-500" />
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'initial':
        return 'text-blue-600'
      case 'background':
        return 'text-green-600'
      case 'complete':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'initial':
        return 'Carregamento Inicial'
      case 'background':
        return 'Sincronização em Segundo Plano'
      case 'complete':
        return 'Sincronização Concluída'
      default:
        return 'Processando'
    }
  }

  const getStatusIcon = () => {
    if (progress.hasError) {
      return <XCircle className="w-6 h-6 text-red-500" />
    } else if (progress.isComplete) {
      return <CheckCircle className="w-6 h-6 text-green-500" />
    } else {
      return <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
    }
  }

  const getStatusColor = () => {
    if (progress.hasError) {
      return 'text-red-600'
    } else if (progress.isComplete) {
      return 'text-green-600'
    } else {
      return 'text-blue-600'
    }
  }

  const getStatusText = () => {
    if (progress.hasError) {
      return 'Erro na Sincronização'
    } else if (progress.isComplete) {
      return 'Sincronização Concluída'
    } else {
      return 'Sincronizando...'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h2 className={`text-xl font-semibold ${getStatusColor()}`}>
                {getStatusText()}
              </h2>
              <p className="text-sm text-gray-600">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Phase Indicator */}
          <div className="flex items-center gap-3">
            {getPhaseIcon(progress.phase)}
            <div>
              <h3 className={`font-medium ${getPhaseColor(progress.phase)}`}>
                {getPhaseText(progress.phase)}
              </h3>
              <p className="text-sm text-gray-600">{progress.currentStep}</p>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4">
            {/* Main Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progresso Principal</span>
                <span className="text-sm text-gray-600">{progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    progress.hasError ? 'bg-red-500' : 
                    progress.isComplete ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            {/* Background Progress */}
            {progress.phase === 'background' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Segundo Plano</span>
                  <span className="text-sm text-gray-600">{progress.backgroundProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${progress.backgroundProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Carregados</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{progress.itemsLoaded}</div>
              <div className="text-xs text-blue-600">itens iniciais</div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">Total</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{progress.totalItems}</div>
              <div className="text-xs text-green-600">itens estimados</div>
            </div>
          </div>

          {/* Notification Permission */}
          {progress.phase === 'background' && notificationPermission === 'default' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    Receber Notificação de Conclusão
                  </h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Ative as notificações para ser avisado quando a sincronização em segundo plano for concluída.
                  </p>
                  <button
                    onClick={requestNotificationPermission}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                  >
                    Ativar Notificações
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {progress.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-2">Erros Encontrados</h4>
                  <ul className="space-y-1">
                    {progress.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Details Toggle */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <Clock className="w-4 h-4" />
              {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
            </button>

            {showDetails && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-gray-800">Detalhes da Sincronização</h4>
                <ul className="space-y-1">
                  {progress.details.map((detail, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {progress.isComplete && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Concluir
              </button>
            )}
            {progress.hasError && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Fechar
              </button>
            )}
            {!progress.isComplete && !progress.hasError && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Minimizar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}









