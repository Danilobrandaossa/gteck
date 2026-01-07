'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PersistenceManager } from '@/lib/persistence-manager'
import { Download, Upload, RefreshCw, Trash2, CheckCircle, Database, Shield } from 'lucide-react'

export default function BackupPage() {
  const [backupData, setBackupData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  const persistenceManager = PersistenceManager.getInstance()

  useEffect(() => {
    loadBackupInfo()
  }, [])

  const loadBackupInfo = () => {
    try {
      const backup = localStorage.getItem('cms-backup')
      if (backup) {
        const parsedBackup = JSON.parse(backup)
        setBackupData(parsedBackup)
      }
    } catch (error) {
      console.error('Erro ao carregar informações do backup:', error)
    }
  }

  const handleCreateBackup = () => {
    setIsLoading(true)
    try {
      persistenceManager.createBackup()
      setMessage({ type: 'success', text: '✅ Backup criado com sucesso!' })
      loadBackupInfo()
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Erro ao criar backup' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreBackup = () => {
    if (!confirm('Tem certeza que deseja restaurar do backup? Isso substituirá os dados atuais.')) {
      return
    }

    setIsLoading(true)
    try {
      const success = persistenceManager.restoreFromBackup()
      if (success) {
        setMessage({ type: 'success', text: '✅ Dados restaurados do backup!' })
        window.location.reload()
      } else {
        setMessage({ type: 'error', text: '❌ Nenhum backup encontrado' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Erro ao restaurar backup' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportConfigurations = () => {
    try {
      const configs = persistenceManager.exportConfigurations()
      if (configs) {
        const blob = new Blob([JSON.stringify(configs, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cms-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setMessage({ type: 'success', text: '✅ Configurações exportadas!' })
      } else {
        setMessage({ type: 'error', text: '❌ Erro ao exportar configurações' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Erro ao exportar configurações' })
    }
  }

  const handleImportConfigurations = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const configs = JSON.parse(e.target?.result as string)
        const success = persistenceManager.importConfigurations(configs)
        if (success) {
          setMessage({ type: 'success', text: '✅ Configurações importadas com sucesso!' })
          window.location.reload()
        } else {
          setMessage({ type: 'error', text: '❌ Erro ao importar configurações' })
        }
      } catch (error) {
        setMessage({ type: 'error', text: '❌ Arquivo inválido' })
      }
    }
    reader.readAsText(file)
  }

  const handleClearCorruptedData = () => {
    if (!confirm('Tem certeza que deseja limpar dados corrompidos? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      persistenceManager.clearCorruptedData()
      setMessage({ type: 'success', text: '✅ Dados corrompidos removidos!' })
      loadBackupInfo()
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Erro ao limpar dados' })
    }
  }

  const checkDataIntegrity = () => {
    const isIntegrity = persistenceManager.checkDataIntegrity()
    if (isIntegrity) {
      setMessage({ type: 'success', text: '✅ Integridade dos dados verificada!' })
    } else {
      setMessage({ type: 'error', text: '❌ Problemas de integridade detectados' })
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ padding: '2rem' }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '0.5rem', 
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ 
              fontSize: '1.875rem', 
              fontWeight: '700', 
              color: 'var(--gray-900)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Database style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
              Gerenciamento de Backup
            </h1>
            
            <p style={{ 
              color: 'var(--gray-600)', 
              marginBottom: '2rem',
              fontSize: '1rem'
            }}>
              Gerencie backups automáticos e mantenha suas configurações seguras
            </p>

            {message && (
              <div style={{ 
                padding: '1rem', 
                borderRadius: '0.5rem', 
                marginBottom: '2rem',
                backgroundColor: message.type === 'success' ? 'var(--green-50)' : 
                                message.type === 'error' ? 'var(--red-50)' : 'var(--blue-50)',
                border: `1px solid ${message.type === 'success' ? 'var(--green-200)' : 
                                        message.type === 'error' ? 'var(--red-200)' : 'var(--blue-200)'}`,
                color: message.type === 'success' ? 'var(--green-700)' : 
                       message.type === 'error' ? 'var(--red-700)' : 'var(--blue-700)'
              }}>
                {message.text}
              </div>
            )}

            {/* Status do Backup */}
            {backupData && (
              <div style={{ 
                padding: '1.5rem', 
                backgroundColor: 'var(--green-50)', 
                borderRadius: '0.5rem', 
                border: '1px solid var(--green-200)',
                marginBottom: '2rem'
              }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: 'var(--green-900)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} />
                  Status do Backup
                </h3>
                <div style={{ fontSize: '0.875rem', color: 'var(--green-700)' }}>
                  <p><strong>Último backup:</strong> {new Date(backupData.timestamp).toLocaleString('pt-BR')}</p>
                  <p><strong>Sites:</strong> {backupData.sites ? 'Salvos' : 'Não disponível'}</p>
                  <p><strong>APIs:</strong> {backupData.apiConfigs ? 'Salvas' : 'Não disponível'}</p>
                </div>
              </div>
            )}

            {/* Ações de Backup */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <button
                onClick={handleCreateBackup}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <RefreshCw style={{ width: '1.25rem', height: '1.25rem' }} />
                Criar Backup
              </button>

              <button
                onClick={handleRestoreBackup}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  backgroundColor: 'var(--blue-600)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <Upload style={{ width: '1.25rem', height: '1.25rem' }} />
                Restaurar Backup
              </button>

              <button
                onClick={checkDataIntegrity}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  backgroundColor: 'var(--yellow-600)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <Shield style={{ width: '1.25rem', height: '1.25rem' }} />
                Verificar Integridade
              </button>

              <button
                onClick={handleClearCorruptedData}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  backgroundColor: 'var(--red-600)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <Trash2 style={{ width: '1.25rem', height: '1.25rem' }} />
                Limpar Dados Corrompidos
              </button>
            </div>

            {/* Import/Export */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1rem'
            }}>
              <button
                onClick={handleExportConfigurations}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  backgroundColor: 'var(--green-600)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <Download style={{ width: '1.25rem', height: '1.25rem' }} />
                Exportar Configurações
              </button>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
                backgroundColor: 'var(--blue-600)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                <Upload style={{ width: '1.25rem', height: '1.25rem' }} />
                Importar Configurações
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportConfigurations}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Informações do Sistema */}
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              backgroundColor: 'var(--gray-50)', 
              borderRadius: '0.5rem',
              border: '1px solid var(--gray-200)'
            }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: 'var(--gray-800)', 
                marginBottom: '1rem' 
              }}>
                ℹ️ Informações do Sistema
              </h3>
              <ul style={{ fontSize: '0.875rem', color: 'var(--gray-600)', margin: 0, paddingLeft: '1.5rem' }}>
                <li>Backup automático a cada 30 segundos</li>
                <li>Dados salvos no localStorage do navegador</li>
                <li>Verificação de integridade na inicialização</li>
                <li>Restauração automática em caso de corrupção</li>
                <li>Exportação/Importação de configurações</li>
              </ul>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

