'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { 
  Plus, 
  Settings, 
  Trash2, 
  Edit, 
  Clock, 
  Zap, 
  Webhook, 
  Bot, 
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState<'webhooks' | 'triggers' | 'actions' | 'cron'>('webhooks')
  const [showAddModal, setShowAddModal] = useState(false)

  // Dados mock para demonstração
  const [webhooks] = useState([
    {
      id: '1',
      name: 'n8n Content Created',
      url: 'https://n8n.exemplo.com/webhook/content-created',
      method: 'POST',
      events: ['content_created', 'content_updated'],
      active: true,
      lastCall: new Date('2024-01-15T10:30:00'),
      successRate: 98.5
    },
    {
      id: '2',
      name: 'Zapier User Registration',
      url: 'https://hooks.zapier.com/hooks/catch/123456/abc123/',
      method: 'POST',
      events: ['user_registered'],
      active: true,
      lastCall: new Date('2024-01-15T09:15:00'),
      successRate: 100
    },
    {
      id: '3',
      name: 'Slack Notifications',
      url: 'https://example.com/webhook/slack',
      method: 'POST',
      events: ['ai_generated', 'wordpress_synced'],
      active: false,
      lastCall: new Date('2024-01-14T16:45:00'),
      successRate: 95.2
    }
  ])

  const [triggers] = useState([
    {
      id: '1',
      name: 'Content Created Trigger',
      type: 'content_created',
      conditions: { category: 'blog' },
      webhooks: ['1', '3'],
      active: true,
      lastTriggered: new Date('2024-01-15T10:30:00')
    },
    {
      id: '2',
      name: 'User Registration Trigger',
      type: 'user_registered',
      conditions: {},
      webhooks: ['2'],
      active: true,
      lastTriggered: new Date('2024-01-15T09:15:00')
    }
  ])

  const [cronJobs] = useState([
    {
      id: '1',
      name: 'WordPress Sync',
      schedule: '*/15',
      active: true,
      lastRun: new Date('2024-01-15T10:15:00'),
      nextRun: new Date('2024-01-15T10:30:00'),
      successRate: 100
    },
    {
      id: '2',
      name: 'Log Cleanup',
      schedule: '*/60',
      active: true,
      lastRun: new Date('2024-01-15T09:00:00'),
      nextRun: new Date('2024-01-15T10:00:00'),
      successRate: 100
    },
    {
      id: '3',
      name: 'Database Backup',
      schedule: '*/1440',
      active: false,
      lastRun: new Date('2024-01-14T10:00:00'),
      nextRun: new Date('2024-01-16T10:00:00'),
      successRate: 100
    }
  ])

  const getStatusIcon = (active: boolean) => {
    return active ? (
      <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--success)' }} />
    ) : (
      <XCircle style={{ width: '1rem', height: '1rem', color: 'var(--danger)' }} />
    )
  }

  const getStatusBadge = (active: boolean) => {
    return active ? 'cms-badge-success' : 'cms-badge-danger'
  }

  const getStatusText = (active: boolean) => {
    return active ? 'Ativo' : 'Inativo'
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'var(--success)'
    if (rate >= 80) return 'var(--warning)'
    return 'var(--danger)'
  }

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'content_created':
      case 'content_updated':
      case 'content_deleted':
        return <Settings style={{ width: '0.875rem', height: '0.875rem' }} />
      case 'user_registered':
        return <Bot style={{ width: '0.875rem', height: '0.875rem' }} />
      case 'ai_generated':
        return <Zap style={{ width: '0.875rem', height: '0.875rem' }} />
      case 'wordpress_synced':
        return <Webhook style={{ width: '0.875rem', height: '0.875rem' }} />
      default:
        return <Activity style={{ width: '0.875rem', height: '0.875rem' }} />
    }
  }

  const getEventName = (event: string) => {
    switch (event) {
      case 'content_created': return 'Conte├║do Criado'
      case 'content_updated': return 'Conte├║do Atualizado'
      case 'content_deleted': return 'Conte├║do Deletado'
      case 'user_registered': return 'Usu├írio Registrado'
      case 'ai_generated': return 'IA Gerou Conte├║do'
      case 'wordpress_synced': return 'WordPress Sincronizado'
      default: return event
    }
  }

  const getCronDescription = (schedule: string) => {
    switch (schedule) {
      case '*/15': return 'A cada 15 minutos'
      case '*/60': return 'A cada 60 minutos'
      case '*/1440': return 'A cada 24 horas'
      default: return schedule
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            Automa├º├Áes
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>
            Gerencie webhooks, triggers, a├º├Áes e tarefas agendadas
          </p>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--gray-200)', 
          marginBottom: '2rem' 
        }}>
          {[
            { id: 'webhooks', name: 'Webhooks', icon: Webhook, count: webhooks.length },
            { id: 'triggers', name: 'Triggers', icon: Zap, count: triggers.length },
            { id: 'actions', name: 'A├º├Áes', icon: Settings, count: 0 },
            { id: 'cron', name: 'Cron Jobs', icon: Clock, count: cronJobs.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                border: 'none',
                backgroundColor: 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--gray-600)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <tab.icon style={{ width: '1rem', height: '1rem' }} />
              {tab.name}
              <span style={{
                backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'var(--gray-200)',
                color: activeTab === tab.id ? 'var(--white)' : 'var(--gray-600)',
                padding: '0.125rem 0.5rem',
                borderRadius: 'var(--radius)',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                Webhooks
              </h2>
              <button 
                className="cms-btn cms-btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Novo Webhook
              </button>
            </div>

            <div className="cms-grid cms-grid-cols-1">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="cms-card">
                  <div className="cms-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Webhook style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                        <div>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                            {webhook.name}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                            {webhook.url}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getStatusIcon(webhook.active)}
                        <span className={`cms-badge ${getStatusBadge(webhook.active)}`}>
                          {getStatusText(webhook.active)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="cms-card-content">
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                          Eventos:
                        </span>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {webhook.events.map((event) => (
                            <span key={event} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: 'var(--gray-100)',
                              borderRadius: 'var(--radius)',
                              fontSize: '0.75rem',
                              color: 'var(--gray-700)'
                            }}>
                              {getEventIcon(event)}
                              {getEventName(event)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                          Taxa de Sucesso:
                        </span>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '500', 
                          color: getSuccessRateColor(webhook.successRate)
                        }}>
                          {webhook.successRate}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                          ├Ültima Chamada:
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          {webhook.lastCall.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="cms-btn cms-btn-icon cms-btn-secondary"
                        onClick={() => {}}
                        title="Editar"
                      >
                        <Edit style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      <button 
                        className="cms-btn cms-btn-icon cms-btn-secondary"
                        onClick={() => {}}
                        title="Excluir"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cron Jobs Tab */}
        {activeTab === 'cron' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                Cron Jobs
              </h2>
              <button 
                className="cms-btn cms-btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Novo Cron Job
              </button>
            </div>

            <div className="cms-grid cms-grid-cols-1">
              {cronJobs.map((job) => (
                <div key={job.id} className="cms-card">
                  <div className="cms-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Clock style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                        <div>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                            {job.name}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                            {getCronDescription(job.schedule)}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getStatusIcon(job.active)}
                        <span className={`cms-badge ${getStatusBadge(job.active)}`}>
                          {getStatusText(job.active)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="cms-card-content">
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                          ├Ültima Execu├º├úo:
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          {job.lastRun.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                          Pr├│xima Execu├º├úo:
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          {job.nextRun.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                          Taxa de Sucesso:
                        </span>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '500', 
                          color: getSuccessRateColor(job.successRate)
                        }}>
                          {job.successRate}%
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="cms-btn cms-btn-icon cms-btn-secondary"
                        onClick={() => {}}
                        title="Editar"
                      >
                        <Edit style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      <button 
                        className="cms-btn cms-btn-icon cms-btn-secondary"
                        onClick={() => {}}
                        title="Excluir"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Modal */}
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
                  Novo {activeTab === 'webhooks' ? 'Webhook' : 'Cron Job'}
                </h3>
              </div>
              <div className="cms-card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Nome
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do webhook/cron job"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        fontSize: '0.875rem' 
                      }}
                    />
                  </div>
                  {activeTab === 'webhooks' && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                          URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://exemplo.com/webhook"
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
                          Eventos
                        </label>
                        <select multiple style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid var(--gray-300)', 
                          borderRadius: 'var(--radius-lg)', 
                          fontSize: '0.875rem',
                          backgroundColor: 'var(--white)'
                        }}>
                          <option value="content_created">Conte├║do Criado</option>
                          <option value="content_updated">Conte├║do Atualizado</option>
                          <option value="user_registered">Usu├írio Registrado</option>
                          <option value="ai_generated">IA Gerou Conte├║do</option>
                        </select>
                      </div>
                    </>
                  )}
                  {activeTab === 'cron' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Agendamento
                      </label>
                      <select style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--white)'
                      }}>
                        <option value="*/15">A cada 15 minutos</option>
                        <option value="*/60">A cada 60 minutos</option>
                        <option value="*/1440">A cada 24 horas</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </div>
                  )}
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
                    Salvar
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

