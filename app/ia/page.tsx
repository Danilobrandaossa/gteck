'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAI } from '@/contexts/ai-context'
import { useOrganization } from '@/contexts/organization-context'
// import { getLayoutStyles, getCardStyles, getButtonStyles, getBadgeStyles } from '@/lib/design-system'
import { Image, FileText, MessageSquare, Zap, Play, Clock, CheckCircle, XCircle, RefreshCw, Eye, Download } from 'lucide-react'

export default function IAPage() {
  const { tasks, generatedContent, isLoading: _isLoading, error, isGenerating, currentTask, generatePage, generateImage, generateQuiz, generateAd, cancelTask, retryTask } = useAI()
  const { currentOrganization } = useOrganization()
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [showResults, setShowResults] = useState(false)

  const iaFeatures = [
    { 
      id: 'page',
      name: 'Gerar Páginas', 
      description: 'Crie páginas de conteúdo completas com IA', 
      icon: FileText,
      color: 'var(--primary)'
    },
    { 
      id: 'image',
      name: 'Gerar Imagens', 
      description: 'Crie imagens e gráficos personalizados', 
      icon: Image,
      color: 'var(--success)'
    },
    { 
      id: 'quiz',
      name: 'Gerar Quizzes', 
      description: 'Crie quizzes interativos para engajamento', 
      icon: MessageSquare,
      color: 'var(--warning)'
    },
    { 
      id: 'ad',
      name: 'Gerar Anúncios', 
      description: 'Crie criativos para anúncios de Facebook/Google', 
      icon: Zap,
      color: 'var(--info)'
    },
  ]

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedFeature) return

    try {
      switch (selectedFeature) {
        case 'page':
          await generatePage(prompt)
          break
        case 'image':
          await generateImage(prompt)
          break
        case 'quiz':
          await generateQuiz(prompt, 5)
          break
        case 'ad':
          await generateAd(prompt, 'Facebook')
          break
      }
      setShowResults(true)
    } catch (err) {
      console.error('Erro ao gerar conteúdo:', err)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--success)' }} />
      case 'failed':
        return <XCircle style={{ width: '1rem', height: '1rem', color: 'var(--danger)' }} />
      case 'processing':
        return <Clock style={{ width: '1rem', height: '1rem', color: 'var(--warning)' }} />
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
      case 'pending':
        return 'Pendente'
      default:
        return status
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            Inteligência Artificial
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>
            {currentOrganization 
              ? `Automatize a criação de conteúdo com IA para ${currentOrganization.name}`
              : 'Automatize a criação de conteúdo com IA'
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

        {/* Current Task */}
        {currentTask && (
          <div className="cms-card" style={{ marginBottom: '2rem' }}>
            <div className="cms-card-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                Gerando Conteúdo...
              </h3>
            </div>
            <div className="cms-card-content">
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    {currentTask.title}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                    {currentTask.progress}%
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
                    width: `${currentTask.progress}%`,
                    height: '100%',
                    backgroundColor: 'var(--primary)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
              <button 
                className="cms-btn cms-btn-secondary"
                onClick={() => cancelTask(currentTask.id)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* AI Features Grid */}
        <div className="cms-grid cms-grid-cols-2" style={{ marginBottom: '2rem' }}>
          {iaFeatures.map((feature) => (
            <div 
              key={feature.id} 
              className="cms-card"
              style={{ 
                cursor: 'pointer',
                border: selectedFeature === feature.id ? `2px solid ${feature.color}` : '1px solid var(--gray-200)',
                backgroundColor: selectedFeature === feature.id ? `${feature.color}10` : 'var(--white)'
              }}
              onClick={() => setSelectedFeature(feature.id)}
            >
              <div className="cms-card-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ 
                    width: '3rem', 
                    height: '3rem', 
                    backgroundColor: `${feature.color}20`, 
                    borderRadius: 'var(--radius-lg)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <feature.icon style={{ width: '1.5rem', height: '1.5rem', color: feature.color }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                      {feature.name}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
                {selectedFeature === feature.id && (
                  <div style={{ 
                    padding: '0.75rem', 
                    backgroundColor: `${feature.color}10`, 
                    borderRadius: 'var(--radius)', 
                    border: `1px solid ${feature.color}30` 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: feature.color, fontSize: '0.875rem', fontWeight: '500' }}>
                      <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                      Selecionado
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Content Generator */}
        {selectedFeature && (
          <div className="cms-card" style={{ marginBottom: '2rem' }}>
            <div className="cms-card-header">
              <h2 className="cms-card-title">
                {iaFeatures.find(f => f.id === selectedFeature)?.name}
              </h2>
            </div>
            <div className="cms-card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    {selectedFeature === 'image' ? 'Descrição da Imagem' : 
                     selectedFeature === 'quiz' ? 'Tópico do Quiz' :
                     selectedFeature === 'ad' ? 'Produto/Serviço' :
                     'Tema do Conteúdo'}
                  </label>
                  <textarea
                    placeholder={
                      selectedFeature === 'image' ? 'Ex: Um gato astronauta no espaço...' :
                      selectedFeature === 'quiz' ? 'Ex: Marketing Digital' :
                      selectedFeature === 'ad' ? 'Ex: Curso de Programação' :
                      'Ex: Como vender online em 2024'
                    }
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                {selectedFeature === 'page' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Contexto Adicional
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: E-commerce, Blog, Landing Page..."
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        fontSize: '0.875rem' 
                      }}
                    />
                  </div>
                )}

                <button 
                  className="cms-btn cms-btn-primary"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  style={{ 
                    opacity: (!prompt.trim() || isGenerating) ? 0.7 : 1,
                    cursor: (!prompt.trim() || isGenerating) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Play style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  {isGenerating ? 'Gerando...' : 'Gerar Conteúdo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        {tasks.length > 0 && (
          <div className="cms-card" style={{ marginBottom: '2rem' }}>
            <div className="cms-card-header">
              <h2 className="cms-card-title">Tarefas de IA</h2>
            </div>
            <div className="cms-card-content">
              <div>
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="cms-page-item">
                    <div className="cms-page-info">
                      <h4 style={{ marginBottom: '0.25rem' }}>{task.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                        <span>{task.description}</span>
                        <span>{task.createdAt.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getStatusIcon(task.status)}
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {getStatusText(task.status)}
                        </span>
                      </div>
                      {task.status === 'processing' && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                          {task.progress}%
                        </div>
                      )}
                      {task.status === 'failed' && (
                        <button 
                          className="cms-btn cms-btn-icon cms-btn-secondary"
                          onClick={() => retryTask(task.id)}
                          title="Tentar novamente"
                        >
                          <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      )}
                      {task.status === 'completed' && (
                        <button 
                          className="cms-btn cms-btn-icon cms-btn-secondary"
                          title="Visualizar resultado"
                        >
                          <Eye style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generated Content */}
        {generatedContent.length > 0 && showResults && (
          <div className="cms-card">
            <div className="cms-card-header">
              <h2 className="cms-card-title">Conteúdo Gerado</h2>
            </div>
            <div className="cms-card-content">
              <div>
                {generatedContent.slice(0, 3).map((content) => (
                  <div key={content.id} className="cms-page-item">
                    <div className="cms-page-info">
                      <h4 style={{ marginBottom: '0.25rem' }}>{content.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                        <span>Tipo: {content.type}</span>
                        {content.metadata?.wordCount && (
                          <span>{content.metadata.wordCount} palavras</span>
                        )}
                        {content.metadata?.readingTime && (
                          <span>{content.metadata.readingTime} min de leitura</span>
                        )}
                        <span>{content.createdAt.toLocaleString('pt-BR')}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
                        {content.content.substring(0, 200)}...
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        className="cms-btn cms-btn-icon cms-btn-secondary"
                        title="Visualizar"
                      >
                        <Eye style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      <button 
                        className="cms-btn cms-btn-icon cms-btn-secondary"
                        title="Download"
                      >
                        <Download style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}