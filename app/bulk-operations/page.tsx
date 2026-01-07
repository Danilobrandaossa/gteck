'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useBulkOperations } from '@/contexts/bulk-operations-context'
import { useOrganization } from '@/contexts/organization-context'
import { Upload, Download, Zap, Trash2, Copy, RefreshCw, Pause, FileText, Database, Globe } from 'lucide-react'

export default function BulkOperationsPage() {
  const { operations, isLoading: _isLoading, error, isProcessing, currentOperation, importData, exportData, generateContent, deleteItems: _deleteItems, cancelOperation, retryOperation } = useBulkOperations()
  const { currentOrganization } = useOrganization()
  const [_selectedOperation, _setSelectedOperation] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)



  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído'
      case 'failed':
        return 'Falhou'
      case 'processing':
        return 'Processando'
      case 'cancelled':
        return 'Cancelado'
      case 'pending':
        return 'Pendente'
      default:
        return status
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'cms-badge-success'
      case 'failed':
        return 'cms-badge-danger'
      case 'processing':
        return 'cms-badge-warning'
      case 'cancelled':
        return 'cms-badge-secondary'
      case 'pending':
        return 'cms-badge-info'
      default:
        return 'cms-badge-secondary'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'import':
        return <Upload style={{ width: '1rem', height: '1rem' }} />
      case 'export':
        return <Download style={{ width: '1rem', height: '1rem' }} />
      case 'generate':
        return <Zap style={{ width: '1rem', height: '1rem' }} />
      case 'delete':
        return <Trash2 style={{ width: '1rem', height: '1rem' }} />
      case 'duplicate':
        return <Copy style={{ width: '1rem', height: '1rem' }} />
      default:
        return <Database style={{ width: '1rem', height: '1rem' }} />
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'import':
        return 'Importação'
      case 'export':
        return 'Exportação'
      case 'generate':
        return 'Geração'
      case 'delete':
        return 'Exclusão'
      case 'update':
        return 'Atualização'
      case 'duplicate':
        return 'Duplicação'
      default:
        return type
    }
  }

  const handleImport = async (source: string) => {
    try {
      await importData({
        source: source as any,
        options: {
          skipDuplicates: true,
          updateExisting: false,
          validateData: true
        }
      })
      setShowImportModal(false)
    } catch (err) {
      console.error('Erro ao importar:', err)
    }
  }

  const handleExport = async (format: string) => {
    try {
      await exportData({
        format: format as any,
        filters: {
          status: ['published']
        }
      })
      setShowExportModal(false)
    } catch (err) {
      console.error('Erro ao exportar:', err)
    }
  }

  const handleGenerate = async (type: string, count: number) => {
    try {
      await generateContent({
        type: type as any,
        count,
        aiPrompt: `Gerar ${count} ${type} sobre tecnologia`,
        options: {
          randomize: true,
          includeImages: true,
          seoOptimized: true
        }
      })
      setShowGenerateModal(false)
    } catch (err) {
      console.error('Erro ao gerar:', err)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            Operações em Massa
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>
            {currentOrganization
              ? `Execute operações em massa na organização ${currentOrganization.name}`
              : 'Execute operações em massa no seu conteúdo'
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--error-light)',
            border: '1px solid var(--red-300)',
            borderRadius: 'var(--radius)',
            color: 'var(--danger)',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Current Operation */}
        {currentOperation && (
          <div className="cms-card" style={{ marginBottom: '2rem' }}>
            <div className="cms-card-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                Operação em Andamento: {currentOperation.title}
              </h3>
            </div>
            <div className="cms-card-content">
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Progresso
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                    {currentOperation.processedItems} de {currentOperation.totalItems} itens
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '0.5rem',
                  backgroundColor: 'var(--gray-200)',
                  borderRadius: '0.25rem',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${currentOperation.progress}%`,
                    height: '100%',
                    backgroundColor: 'var(--primary)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="cms-btn cms-btn-secondary"
                  onClick={() => cancelOperation(currentOperation.id)}
                >
                  <Pause style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="cms-grid cms-grid-cols-4" style={{ marginBottom: '2rem' }}>
          <div className="cms-card">
            <div className="cms-card-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: 'var(--primary-light)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Upload style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                    Importar Dados
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Importar de CSV, JSON, WordPress
                  </p>
                </div>
              </div>
              <button
                className="cms-btn cms-btn-primary"
                onClick={() => setShowImportModal(true)}
                disabled={isProcessing}
                style={{ width: '100%' }}
              >
                <Upload style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Importar
              </button>
            </div>
          </div>

          <div className="cms-card">
            <div className="cms-card-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: 'var(--success-light)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Download style={{ width: '1.5rem', height: '1.5rem', color: 'var(--success)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                    Exportar Dados
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Exportar para CSV, JSON, XML
                  </p>
                </div>
              </div>
              <button
                className="cms-btn cms-btn-primary"
                onClick={() => setShowExportModal(true)}
                disabled={isProcessing}
                style={{ width: '100%' }}
              >
                <Download style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Exportar
              </button>
            </div>
          </div>

          <div className="cms-card">
            <div className="cms-card-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: 'var(--warning-light)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap style={{ width: '1.5rem', height: '1.5rem', color: 'var(--warning)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                    Gerar Conteúdo
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Gerar páginas, templates com IA
                  </p>
                </div>
              </div>
              <button
                className="cms-btn cms-btn-primary"
                onClick={() => setShowGenerateModal(true)}
                disabled={isProcessing}
                style={{ width: '100%' }}
              >
                <Zap style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Gerar
              </button>
            </div>
          </div>

          <div className="cms-card">
            <div className="cms-card-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: 'var(--info-light)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Database style={{ width: '1.5rem', height: '1.5rem', color: 'var(--info)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                    Operações Avançadas
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Duplicar, atualizar, excluir
                  </p>
                </div>
              </div>
              <button
                className="cms-btn cms-btn-primary"
                disabled={isProcessing}
                style={{ width: '100%' }}
              >
                <Database style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Avançadas
              </button>
            </div>
          </div>
        </div>

        {/* Operations List */}
        <div className="cms-card">
          <div className="cms-card-header">
            <h2 className="cms-card-title">Histórico de Operações</h2>
          </div>
          <div className="cms-card-content">
            {operations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                  Nenhuma operação encontrada
                </h3>
                <p style={{ color: 'var(--gray-600)' }}>
                  Execute sua primeira operação em massa para começar
                </p>
              </div>
            ) : (
              <div>
                {operations.map((operation) => (
                  <div key={operation.id} className="cms-page-item">
                    <div className="cms-page-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        {getTypeIcon(operation.type)}
                        <h4 style={{ marginBottom: '0.25rem' }}>{operation.title}</h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                        <span>{operation.description}</span>
                        <span>{operation.createdAt.toLocaleString('pt-BR')}</span>
                        {operation.startedAt && (
                          <span>Iniciado: {operation.startedAt.toLocaleString('pt-BR')}</span>
                        )}
                        {operation.completedAt && (
                          <span>Concluído: {operation.completedAt.toLocaleString('pt-BR')}</span>
                        )}
                      </div>
                      {operation.status === 'processing' && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Progresso</span>
                            <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{operation.progress}%</span>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '0.25rem',
                            backgroundColor: 'var(--gray-200)',
                            borderRadius: '0.125rem',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${operation.progress}%`,
                              height: '100%',
                              backgroundColor: 'var(--primary)',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                      )}
                      {operation.error && (
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          backgroundColor: 'var(--error-light)',
                          border: '1px solid var(--red-300)',
                          borderRadius: 'var(--radius)',
                          color: 'var(--danger)',
                          fontSize: '0.875rem'
                        }}>
                          <strong>Erro:</strong> {operation.error}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`cms-badge ${getStatusBadge(operation.status)}`}>
                        {getStatusText(operation.status)}
                      </span>
                      <span className="cms-badge cms-badge-secondary">
                        {getTypeText(operation.type)}
                      </span>
                      {operation.status === 'completed' && (
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          {operation.successItems} sucessos, {operation.failedItems} falhas
                        </span>
                      )}
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {operation.status === 'failed' && (
                          <button
                            className="cms-btn cms-btn-icon cms-btn-secondary"
                            onClick={() => retryOperation(operation.id)}
                            title="Tentar novamente"
                          >
                            <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        )}
                        {operation.status === 'processing' && (
                          <button
                            className="cms-btn cms-btn-icon cms-btn-secondary"
                            onClick={() => cancelOperation(operation.id)}
                            title="Cancelar"
                            style={{ color: 'var(--danger)' }}
                          >
                            <Pause style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="cms-card" style={{ maxWidth: '500px', margin: '1rem', width: '100%' }}>
              <div className="cms-card-header">
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Importar Dados
                </h3>
              </div>
              <div className="cms-card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button
                    className="cms-btn cms-btn-secondary"
                    onClick={() => handleImport('csv')}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <FileText style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Importar CSV
                  </button>
                  <button
                    className="cms-btn cms-btn-secondary"
                    onClick={() => handleImport('json')}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <FileText style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Importar JSON
                  </button>
                  <button
                    className="cms-btn cms-btn-secondary"
                    onClick={() => handleImport('wordpress')}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Globe style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Importar do WordPress
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button
                    className="cms-btn cms-btn-secondary"
                    onClick={() => setShowImportModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="cms-card" style={{ maxWidth: '500px', margin: '1rem', width: '100%' }}>
              <div className="cms-card-header">
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Exportar Dados
                </h3>
              </div>
              <div className="cms-card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button
                    className="cms-btn cms-btn-secondary"
                    onClick={() => handleExport('csv')}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <FileText style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Exportar CSV
                  </button>
                  <button
                    className="cms-btn cms-btn-secondary"
                    onClick={() => handleExport('json')}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <FileText style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Exportar JSON
                  </button>
                  <button
                    className="cms-btn cms-btn-secondary"
                    onClick={() => handleExport('xml')}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <FileText style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Exportar XML
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button
                    className="cms-btn cms-btn-secondary"
                    onClick={() => setShowExportModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Modal */}
        {showGenerateModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="cms-card" style={{ maxWidth: '500px', margin: '1rem', width: '100%' }}>
              <div className="cms-card-header">
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Gerar Conteúdo
                </h3>
              </div>
              <div className="cms-card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button
                    className="cms-btn cms-btn-secondary"
                    onClick={() => handleGenerate('pages', 10)}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <FileText style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Gerar 10 Páginas
                  </button>
                  <button
                    className="cms-btn cms-btn-secondary"
                    onClick={() => handleGenerate('templates', 5)}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <FileText style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Gerar 5 Templates
                  </button>
                  <button
                    className="cms-btn cms-btn-secondary"
                    onClick={() => handleGenerate('categories', 20)}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Database style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Gerar 20 Categorias
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button
                    className="cms-btn cms-btn-secondary"
                    onClick={() => setShowGenerateModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

