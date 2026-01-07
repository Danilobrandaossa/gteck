'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useQueue } from '@/contexts/queue-context'
import { useOrganization } from '@/contexts/organization-context'
import { Clock, CheckCircle, XCircle, Play, Pause, RefreshCw, Trash2, Filter, Search, MoreHorizontal } from 'lucide-react'

export default function QueuePage() {
  const { jobs, isLoading, error, isProcessing, cancelJob, retryJob, clearCompletedJobs } = useQueue()
  const { currentOrganization } = useOrganization()
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    const matchesType = typeFilter === 'all' || job.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--success)' }} />
      case 'failed':
        return <XCircle style={{ width: '1rem', height: '1rem', color: 'var(--danger)' }} />
      case 'processing':
        return <Play style={{ width: '1rem', height: '1rem', color: 'var(--warning)' }} />
      case 'cancelled':
        return <Pause style={{ width: '1rem', height: '1rem', color: 'var(--gray-400)' }} />
      default:
        return <Clock style={{ width: '1rem', height: '1rem', color: 'var(--gray-400)' }} />
    }
  }

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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'cms-badge-danger'
      case 'high':
        return 'cms-badge-warning'
      case 'normal':
        return 'cms-badge-info'
      case 'low':
        return 'cms-badge-secondary'
      default:
        return 'cms-badge-secondary'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'ai_generation':
        return 'Geração IA'
      case 'wordpress_sync':
        return 'Sincronização WordPress'
      case 'bulk_operation':
        return 'Operação em Massa'
      case 'seo_optimization':
        return 'Otimização SEO'
      case 'media_processing':
        return 'Processamento de Mídia'
      default:
        return type
    }
  }

  const handleCancel = async (jobId: string) => {
    try {
      await cancelJob(jobId)
    } catch (err) {
      console.error('Erro ao cancelar job:', err)
    }
  }

  const handleRetry = async (jobId: string) => {
    try {
      await retryJob(jobId)
    } catch (err) {
      console.error('Erro ao tentar novamente:', err)
    }
  }

  const handleClearCompleted = async () => {
    try {
      await clearCompletedJobs()
    } catch (err) {
      console.error('Erro ao limpar jobs concluídos:', err)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            Fila de Processamento
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>
            {currentOrganization 
              ? `Gerencie as tarefas em processamento da organização ${currentOrganization.name}`
              : 'Gerencie as tarefas em processamento'
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

        {/* Processing Status */}
        {isProcessing && (
          <div className="cms-card" style={{ marginBottom: '2rem' }}>
            <div className="cms-card-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '2rem', 
                  height: '2rem', 
                  border: '3px solid var(--gray-200)', 
                  borderTop: '3px solid var(--primary)', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }} />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                    Processando Tarefas
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    O sistema está processando tarefas da fila...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="cms-grid cms-grid-cols-4" style={{ marginBottom: '2rem' }}>
          <div className="cms-card">
            <div className="cms-card-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gray-900)' }}>
                    {jobs.filter(j => j.status === 'pending').length}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Pendentes</p>
                </div>
                <Clock style={{ width: '2rem', height: '2rem', color: 'var(--info)' }} />
              </div>
            </div>
          </div>
          <div className="cms-card">
            <div className="cms-card-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gray-900)' }}>
                    {jobs.filter(j => j.status === 'processing').length}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Processando</p>
                </div>
                <Play style={{ width: '2rem', height: '2rem', color: 'var(--warning)' }} />
              </div>
            </div>
          </div>
          <div className="cms-card">
            <div className="cms-card-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gray-900)' }}>
                    {jobs.filter(j => j.status === 'completed').length}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Concluídos</p>
                </div>
                <CheckCircle style={{ width: '2rem', height: '2rem', color: 'var(--success)' }} />
              </div>
            </div>
          </div>
          <div className="cms-card">
            <div className="cms-card-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gray-900)' }}>
                    {jobs.filter(j => j.status === 'failed').length}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Falharam</p>
                </div>
                <XCircle style={{ width: '2rem', height: '2rem', color: 'var(--danger)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, maxWidth: '24rem' }}>
            <div className="cms-search">
              <Search />
              <input 
                type="text" 
                placeholder="Buscar tarefas..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ 
              padding: '0.5rem 1rem', 
              border: '1px solid var(--gray-300)', 
              borderRadius: 'var(--radius-lg)', 
              fontSize: '0.875rem', 
              color: 'var(--gray-700)',
              backgroundColor: 'var(--white)'
            }}
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="processing">Processando</option>
            <option value="completed">Concluídos</option>
            <option value="failed">Falharam</option>
            <option value="cancelled">Cancelados</option>
          </select>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ 
              padding: '0.5rem 1rem', 
              border: '1px solid var(--gray-300)', 
              borderRadius: 'var(--radius-lg)', 
              fontSize: '0.875rem', 
              color: 'var(--gray-700)',
              backgroundColor: 'var(--white)'
            }}
          >
            <option value="all">Todos os tipos</option>
            <option value="ai_generation">Geração IA</option>
            <option value="wordpress_sync">Sincronização WordPress</option>
            <option value="bulk_operation">Operação em Massa</option>
            <option value="seo_optimization">Otimização SEO</option>
            <option value="media_processing">Processamento de Mídia</option>
          </select>
          <button className="cms-btn cms-btn-secondary">
            <Filter style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Mais filtros
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
            {filteredJobs.length} de {jobs.length} tarefas
          </div>
          <button 
            className="cms-btn cms-btn-secondary"
            onClick={handleClearCompleted}
            disabled={jobs.filter(j => j.status === 'completed').length === 0}
          >
            <Trash2 style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Limpar Concluídos
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              border: '3px solid var(--gray-200)', 
              borderTop: '3px solid var(--primary)', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite', 
              margin: '0 auto 1rem' 
            }} />
            <p style={{ color: 'var(--gray-600)' }}>Carregando fila de processamento...</p>
          </div>
        )}

        {/* Jobs List */}
        {!isLoading && (
          <div className="cms-card">
            <div className="cms-card-header">
              <h2 className="cms-card-title">Tarefas da Fila</h2>
            </div>
            <div className="cms-card-content">
              {filteredJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                    Nenhuma tarefa encontrada
                  </h3>
                  <p style={{ color: 'var(--gray-600)' }}>
                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'Tente ajustar os filtros de busca'
                      : 'Não há tarefas na fila no momento'
                    }
                  </p>
                </div>
              ) : (
                <div>
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="cms-page-item">
                      <div className="cms-page-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                          {getStatusIcon(job.status)}
                          <h4 style={{ marginBottom: '0.25rem' }}>{job.title}</h4>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                          <span>{job.description}</span>
                          <span>{job.createdAt.toLocaleString('pt-BR')}</span>
                          {job.startedAt && (
                            <span>Iniciado: {job.startedAt.toLocaleString('pt-BR')}</span>
                          )}
                          {job.completedAt && (
                            <span>Concluído: {job.completedAt.toLocaleString('pt-BR')}</span>
                          )}
                        </div>
                        {job.error && (
                          <div style={{ 
                            marginTop: '0.5rem', 
                            padding: '0.5rem', 
                            backgroundColor: 'var(--error-light)', 
                            border: '1px solid var(--red-300)', 
                            borderRadius: 'var(--radius)', 
                            color: 'var(--danger)',
                            fontSize: '0.875rem'
                          }}>
                            <strong>Erro:</strong> {job.error}
                          </div>
                        )}
                        {job.status === 'processing' && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Progresso</span>
                              <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{job.progress}%</span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '0.25rem',
                              backgroundColor: 'var(--gray-200)',
                              borderRadius: '0.125rem',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${job.progress}%`,
                                height: '100%',
                                backgroundColor: 'var(--primary)',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className={`cms-badge ${getStatusBadge(job.status)}`}>
                          {getStatusText(job.status)}
                        </span>
                        <span className={`cms-badge ${getPriorityBadge(job.priority)}`}>
                          {job.priority}
                        </span>
                        <span className="cms-badge cms-badge-secondary">
                          {getTypeText(job.type)}
                        </span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {job.status === 'pending' && (
                            <button 
                              className="cms-btn cms-btn-icon cms-btn-secondary"
                              onClick={() => handleCancel(job.id)}
                              title="Cancelar"
                              style={{ color: 'var(--danger)' }}
                            >
                              <Pause style={{ width: '1rem', height: '1rem' }} />
                            </button>
                          )}
                          {job.status === 'failed' && (
                            <button 
                              className="cms-btn cms-btn-icon cms-btn-secondary"
                              onClick={() => handleRetry(job.id)}
                              title="Tentar novamente"
                            >
                              <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                            </button>
                          )}
                          <button 
                            className="cms-btn cms-btn-icon cms-btn-secondary"
                            title="Mais opções"
                          >
                            <MoreHorizontal style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

