'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAPIConfig } from '@/contexts/api-config-context'
import { 
  Plus, 
  Settings, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Key, 
  Globe, 
  Bot, 
  Image, 
  Zap,
  Trash2,
  Edit,
  RefreshCw,
  Activity
} from 'lucide-react'

export default function APIConfigPage() {
  const { configs, error, deleteConfig, testConnection } = useAPIConfig()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'openai':
      case 'claude':
      case 'gemini':
        return <Bot style={{ width: '1rem', height: '1rem' }} />
      case 'stable-diffusion':
      case 'dalle':
        return <Image style={{ width: '1rem', height: '1rem' }} />
      case 'wordpress':
        return <Globe style={{ width: '1rem', height: '1rem' }} />
      case 'n8n':
      case 'zapier':
      case 'webhook':
        return <Zap style={{ width: '1rem', height: '1rem' }} />
      default:
        return <Settings style={{ width: '1rem', height: '1rem' }} />
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'openai':
        return 'OpenAI'
      case 'claude':
        return 'Claude (Anthropic)'
      case 'gemini':
        return 'Google Gemini'
      case 'stable-diffusion':
        return 'Stable Diffusion'
      case 'dalle':
        return 'DALL-E'
      case 'wordpress':
        return 'WordPress'
      case 'n8n':
        return 'n8n'
      case 'zapier':
        return 'Zapier'
      case 'webhook':
        return 'Webhook'
      default:
        return type
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--success)' }} />
      case 'error':
        return <XCircle style={{ width: '1rem', height: '1rem', color: 'var(--danger)' }} />
      case 'inactive':
        return <AlertTriangle style={{ width: '1rem', height: '1rem', color: 'var(--warning)' }} />
      default:
        return <AlertTriangle style={{ width: '1rem', height: '1rem', color: 'var(--gray-400)' }} />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'cms-badge-success'
      case 'error':
        return 'cms-badge-danger'
      case 'inactive':
        return 'cms-badge-warning'
      default:
        return 'cms-badge-secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'error':
        return 'Erro'
      case 'inactive':
        return 'Inativo'
      default:
        return status
    }
  }

  const handleTestConnection = async (id: string) => {
    setTestingConnection(id)
    try {
      await testConnection(id)
    } catch (err) {
      console.error('Erro ao testar conexão:', err)
    } finally {
      setTestingConnection(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteConfig(id)
      setShowDeleteModal(null)
    } catch (err) {
      console.error('Erro ao deletar configuração:', err)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            Configuração de APIs
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>
            Gerencie as conexões com IAs, WordPress e serviços externos
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

        {/* Header with Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
            {configs.length} configurações de API
          </div>
          <button 
            className="cms-btn cms-btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Nova Configuração
          </button>
        </div>

        {/* API Configs Grid */}
        <div className="cms-grid cms-grid-cols-3">
          {configs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', gridColumn: 'span 3' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                Nenhuma configuração de API encontrada
              </h3>
              <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
                Configure suas primeiras APIs para começar a usar o sistema
              </p>
              <button 
                className="cms-btn cms-btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Nova Configuração
              </button>
            </div>
          ) : (
            configs.map((config) => (
              <div key={config.id} className="cms-card">
                <div className="cms-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {getTypeIcon(config.type)}
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                          {config.name}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                          {getTypeName(config.type)}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusIcon(config.status)}
                      <span className={`cms-badge ${getStatusBadge(config.status)}`}>
                        {getStatusText(config.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="cms-card-content">
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Key style={{ width: '0.875rem', height: '0.875rem', color: 'var(--gray-400)' }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {config.credentials.apiKey ? 'API Key configurada' : 'Sem API Key'}
                      </span>
                    </div>
                    {config.credentials.endpoint && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Globe style={{ width: '0.875rem', height: '0.875rem', color: 'var(--gray-400)' }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          {config.credentials.endpoint}
                        </span>
                      </div>
                    )}
                    {config.lastUsed && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Activity style={{ width: '0.875rem', height: '0.875rem', color: 'var(--gray-400)' }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          Último uso: {config.lastUsed.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Usage Stats */}
                  <div style={{ 
                    backgroundColor: 'var(--gray-50)', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius)', 
                    marginBottom: '1rem' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Requisições</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                        {config.usage.requests.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Tokens</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                        {config.usage.tokens.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Custo</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                        ${config.usage.cost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="cms-btn cms-btn-icon cms-btn-secondary"
                      onClick={() => handleTestConnection(config.id)}
                      disabled={testingConnection === config.id}
                      title="Testar Conexão"
                    >
                      {testingConnection === config.id ? (
                        <RefreshCw style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <TestTube style={{ width: '1rem', height: '1rem' }} />
                      )}
                    </button>
                    <button 
                      className="cms-btn cms-btn-icon cms-btn-secondary"
                      onClick={() => {}}
                      title="Editar (em desenvolvimento)"
                      disabled
                    >
                      <Edit style={{ width: '1rem', height: '1rem' }} />
                    </button>
                    <button 
                      className="cms-btn cms-btn-icon cms-btn-secondary"
                      onClick={() => setShowDeleteModal(config.id)}
                      title="Excluir"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Config Modal */}
        {showAddModal && (
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
            <div className="cms-card" style={{ maxWidth: '600px', margin: '1rem', width: '100%' }}>
              <div className="cms-card-header">
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Nova Configuração de API
                </h3>
              </div>
              <div className="cms-card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Nome da Configuração
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: OpenAI GPT-4"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        fontSize: '0.875rem' 
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Tipo de API
                    </label>
                    <select style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      fontSize: '0.875rem',
                      backgroundColor: 'var(--white)'
                    }}>
                      <option value="">Selecione o tipo</option>
                      <option value="openai">OpenAI</option>
                      <option value="claude">Claude (Anthropic)</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="stable-diffusion">Stable Diffusion</option>
                      <option value="dalle">DALL-E</option>
                      <option value="wordpress">WordPress</option>
                      <option value="n8n">n8n</option>
                      <option value="zapier">Zapier</option>
                      <option value="webhook">Webhook</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      API Key
                    </label>
                    <input
                      type="password"
                      placeholder="Cole sua API key aqui"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        fontSize: '0.875rem' 
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Endpoint (opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://api.exemplo.com/v1"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        fontSize: '0.875rem' 
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button 
                    className="cms-btn cms-btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="cms-btn cms-btn-primary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Salvar Configuração
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
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
            <div className="cms-card" style={{ maxWidth: '400px', margin: '1rem' }}>
              <div className="cms-card-header">
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Confirmar exclusão
                </h3>
              </div>
              <div className="cms-card-content">
                <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
                  Tem certeza que deseja excluir esta configuração de API? Esta ação não pode ser desfeita.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button 
                    className="cms-btn cms-btn-secondary"
                    onClick={() => setShowDeleteModal(null)}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="cms-btn"
                    onClick={() => handleDelete(showDeleteModal)}
                    style={{ backgroundColor: 'var(--danger)', color: 'var(--white)' }}
                  >
                    Excluir
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

