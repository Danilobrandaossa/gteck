'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react'

interface SyncLog {
  id: string
  timestamp: Date
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  details?: string
  url?: string
  status?: number
}

interface SyncLogsModalProps {
  isOpen: boolean
  onClose: () => void
  siteName: string
  logs: SyncLog[]
  isRunning: boolean
}

export function SyncLogsModal({ isOpen, onClose, siteName, logs, isRunning }: SyncLogsModalProps) {
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'warning'>('all')

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    return log.type === filter
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4 text-blue-500" />
    }
  }

  const getStatusColor = (status?: number) => {
    if (!status) return ''
    if (status >= 200 && status < 300) return 'text-green-600'
    if (status >= 400 && status < 500) return 'text-red-600'
    if (status >= 500) return 'text-red-800'
    return 'text-yellow-600'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <RefreshCw className={`w-5 h-5 ${isRunning ? 'animate-spin text-blue-500' : 'text-gray-500'}`} />
            <div>
              <h2 className="text-xl font-semibold">Logs de Sincronização</h2>
              <p className="text-sm text-gray-600">Site: {siteName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Todos ({logs.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'success' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Sucesso ({logs.filter(l => l.type === 'success').length})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'error' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Erros ({logs.filter(l => l.type === 'error').length})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Avisos ({logs.filter(l => l.type === 'warning').length})
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum log encontrado</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {getIcon(log.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{log.message}</span>
                    {log.status && (
                      <span className={`text-xs font-mono px-2 py-1 rounded ${getStatusColor(log.status)} bg-gray-200`}>
                        {log.status}
                      </span>
                    )}
                  </div>
                  {log.details && (
                    <p className="text-sm text-gray-600 mb-1">{log.details}</p>
                  )}
                  {log.url && (
                    <p className="text-xs text-gray-500 font-mono break-all">{log.url}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {log.timestamp.toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {isRunning ? 'Sincronização em andamento...' : 'Sincronização finalizada'}
            </div>
            <div className="text-sm text-gray-500">
              {logs.length} logs • {new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}











