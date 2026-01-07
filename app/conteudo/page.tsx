'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useOrganization } from '@/contexts/organization-context'
import { 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  X,
  Save
} from 'lucide-react'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'

interface AIContent {
  id: string
  title: string
  excerpt: string | null
  content: string | null
  status: 'draft' | 'published' | 'error' | 'generating'
  language: string
  category: string | null
  keywords: string | null
  wordCount: number | null
  errorMessage: string | null
  wordpressPostId: number | null
  wordpressUrl: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export default function ConteudoPage() {
  const { currentSite } = useOrganization()
  const [contents, setContents] = useState<AIContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'error'>('all')
  const [selectedContent, setSelectedContent] = useState<AIContent | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    keywords: '',
    metaDescription: '',
    slug: ''
  })
  
  // Estado do modal de geração
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false)
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [generateForm, setGenerateForm] = useState({
    title: '',
    keywords: '',
    category: 'Beleza',
    language: 'pt-BR',
    aiModel: 'gpt-4',
    prompt: ''
  })

  useEffect(() => {
    if (currentSite) {
      loadContents()
    }
  }, [currentSite])

  useEffect(() => {
    if (selectedContent && showEditModal) {
      setEditForm({
        title: selectedContent.title || '',
        content: selectedContent.content || '',
        excerpt: selectedContent.excerpt || '',
        keywords: selectedContent.keywords || '',
        metaDescription: '',
        slug: ''
      })
    }
  }, [selectedContent, showEditModal])

  const handleSaveEdit = async () => {
    if (!selectedContent) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/ai-content/${selectedContent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          excerpt: editForm.excerpt,
          keywords: editForm.keywords,
          metaDescription: editForm.metaDescription || undefined,
          slug: editForm.slug || undefined
        })
      })

      if (response.ok) {
        setShowEditModal(false)
        setSelectedContent(null)
        loadContents()
      } else {
        const error = await response.json()
        alert(`Erro ao salvar: ${error.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar conteúdo. Verifique o console para mais detalhes.')
    } finally {
      setIsSaving(false)
    }
  }

  const loadContents = async () => {
    if (!currentSite) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/ai-content?siteId=${currentSite.id}`)
      if (response.ok) {
        const data = await response.json()
        setContents(data.contents || [])
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateAISuggestion = async () => {
    if (!currentSite || !generateForm.category) {
      alert('Selecione uma categoria primeiro')
      return
    }

    setIsGeneratingSuggestion(true)
    try {
      // Chamar API para gerar sugestão de pauta
      const response = await fetch('/api/ai-content/suggest-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: generateForm.category,
          language: generateForm.language
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiSuggestion(data.suggestion || '')
        if (data.suggestion && !generateForm.title) {
          setGenerateForm({ ...generateForm, title: data.suggestion })
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('Erro na resposta:', errorData)
        // Usar sugestão mock em caso de erro
        const mockSuggestion = `Sugestão: ${generateForm.category} - Tendências e Novidades para 2025`
        setAiSuggestion(mockSuggestion)
        if (!generateForm.title) {
          setGenerateForm({ ...generateForm, title: mockSuggestion })
        }
      }
    } catch (error) {
      console.error('Erro ao gerar sugestão:', error)
      // Usar sugestão mock em caso de erro
      const mockSuggestion = `Sugestão: ${generateForm.category} - Tendências e Novidades para 2025`
      setAiSuggestion(mockSuggestion)
      if (!generateForm.title) {
        setGenerateForm({ ...generateForm, title: mockSuggestion })
      }
    } finally {
      setIsGeneratingSuggestion(false)
    }
  }

  const handleGenerateKeywords = async () => {
    if (!currentSite || !generateForm.title.trim()) {
      alert('Preencha o título primeiro')
      return
    }

    setIsGeneratingKeywords(true)
    try {
      // Chamar API para buscar palavras-chave baseadas nos 10 melhores artigos do Google
      const response = await fetch('/api/ai-content/generate-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: generateForm.title,
          language: generateForm.language
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.keywords && data.keywords.length > 0) {
          setGenerateForm({ ...generateForm, keywords: data.keywords.join(', ') })
        } else if (data.keywords && typeof data.keywords === 'string') {
          // Se vier como string, usar diretamente
          setGenerateForm({ ...generateForm, keywords: data.keywords })
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('Erro na resposta:', errorData)
        // Gerar palavras-chave mock baseadas no título
        const mockKeywords = generateForm.title.toLowerCase()
          .split(' ')
          .filter(w => w.length > 3)
          .slice(0, 10)
          .concat(['tendências', 'novidades', 'dicas'])
          .join(', ')
        setGenerateForm({ ...generateForm, keywords: mockKeywords })
      }
    } catch (error) {
      console.error('Erro ao gerar palavras-chave:', error)
      // Gerar palavras-chave mock baseadas no título
      const mockKeywords = generateForm.title.toLowerCase()
        .split(' ')
        .filter(w => w.length > 3)
        .slice(0, 10)
        .concat(['tendências', 'novidades', 'dicas'])
        .join(', ')
      setGenerateForm({ ...generateForm, keywords: mockKeywords })
    } finally {
      setIsGeneratingKeywords(false)
    }
  }

  const handleGenerateContent = async () => {
    if (!currentSite || !generateForm.title.trim()) {
      alert('Preencha pelo menos o título')
      return
    }

    setIsGenerating(true)
    try {
      console.log('🚀 Iniciando geração de conteúdo...', { 
        siteId: currentSite.id, 
        title: generateForm.title,
        url: '/api/ai-content/generate'
      })
      const response = await fetch('/api/ai-content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          siteId: currentSite.id,
          title: generateForm.title,
          keywords: generateForm.keywords || undefined,
          category: generateForm.category || undefined,
          language: generateForm.language,
          aiModel: generateForm.aiModel,
          prompt: generateForm.prompt || `Crie um artigo completo sobre: ${generateForm.title}`
        })
      })

      if (response.ok) {
         await response.json()
        setShowGenerateModal(false)
        setAiSuggestion('')
        setGenerateForm({
          title: '',
          keywords: '',
          category: 'Beleza',
          language: 'pt-BR',
          aiModel: 'gpt-4',
          prompt: ''
        })
        
        // Recarregar lista após um breve delay para permitir que a geração comece
        setTimeout(() => {
          loadContents()
        }, 2000)
      } else {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || 'Erro desconhecido' }
        }
        console.error('❌ Erro ao gerar conteúdo:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        alert(`Erro ao gerar conteúdo (${response.status}): ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('❌ Erro ao gerar conteúdo:', error)
      alert(`Erro ao gerar conteúdo: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique o console para mais detalhes.`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublish = async (content: AIContent) => {
    try {
      const response = await fetch(`/api/ai-content/${content.id}/publish`, {
        method: 'POST'
      })
      if (response.ok) {
        loadContents()
      }
    } catch (error) {
      console.error('Erro ao publicar:', error)
      alert('Erro ao publicar conteúdo')
    }
  }

  const handleDelete = async (content: AIContent) => {
    if (!confirm('Tem certeza que deseja excluir este conteúdo?')) return
    
    try {
      const response = await fetch(`/api/ai-content/${content.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        loadContents()
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir conteúdo')
    }
  }

  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (content.excerpt && content.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || content.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { colorClass: 'cms-text-gray-500', bgClass: 'cms-bg-gray-100', label: 'Rascunho', icon: Edit },
      published: { colorClass: 'cms-text-success', bgClass: 'cms-bg-green-50', label: 'Publicado', icon: CheckCircle2 },
      error: { colorClass: 'cms-text-danger', bgClass: 'cms-bg-error-light', label: 'Erro', icon: XCircle },
      generating: { colorClass: 'cms-text-primary', bgClass: 'cms-bg-primary-light', label: 'Gerando...', icon: Loader2 }
    }
    const badge = badges[status as keyof typeof badges] || badges.draft
    const Icon = badge.icon
    return (
      <span className={`cms-inline-flex cms-items-center cms-gap-1 cms-px-3 cms-py-1 cms-rounded-full cms-text-xs cms-font-medium ${badge.colorClass} ${badge.bgClass}`}>
        <Icon style={{ width: '0.875rem', height: '0.875rem' }} />
        {badge.label}
      </span>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="cms-p-8">
          {/* Header */}
          <div className="cms-mb-8">
            <div className="cms-flex cms-justify-between cms-items-center cms-mb-4">
              <div>
                <h1 className="cms-text-3xl cms-font-bold cms-text-gray-800 cms-mb-2">
                  Conteúdo Gerado por IA
                </h1>
                <p className="cms-text-gray-500 cms-text-base">
                  Gerencie posts criados automaticamente com inteligência artificial
                </p>
              </div>
              <button
                className="cms-btn cms-btn-primary cms-flex cms-items-center cms-gap-2"
                onClick={() => setShowGenerateModal(true)}
              >
                <Sparkles style={{ width: '1rem', height: '1rem' }} />
                Gerar Novo Conteúdo (IA)
              </button>
            </div>

            {/* Filters */}
            <div className="cms-flex cms-gap-4 cms-items-center">
              <div className="cms-relative cms-flex-1" style={{ maxWidth: '400px' }}>
                <Search className="cms-absolute" style={{ 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '1rem',
                  height: '1rem',
                  color: 'var(--gray-400)'
                }} />
                <input
                  type="text"
                  placeholder="Buscar por título ou conteúdo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cms-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="cms-select"
              >
                <option value="all">Todos os status</option>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="error">Erro</option>
              </select>
              <button
                onClick={loadContents}
                className="cms-btn cms-flex cms-items-center cms-gap-2"
              >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                Atualizar
              </button>
            </div>
          </div>

          {/* Warning se não houver site */}
          {!currentSite && (
            <div className="cms-card cms-mb-8 cms-bg-warning-light" style={{ borderColor: 'var(--yellow-300)' }}>
              <div className="cms-card-content">
                <p className="cms-text-warning cms-m-0">
                  ⚠️ Selecione um site primeiro para visualizar e gerenciar conteúdos.
                </p>
              </div>
            </div>
          )}

          {/* Content List */}
          {isLoading ? (
            <div className="cms-text-center cms-p-12">
              <Loader2 className="cms-mx-auto cms-mb-4" style={{ 
                width: '2rem', 
                height: '2rem', 
                color: 'var(--primary)',
                animation: 'spin 1s linear infinite'
              }} />
              <p className="cms-text-gray-500">Carregando conteúdos...</p>
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="cms-card">
              <div className="cms-card-content cms-text-center cms-p-12">
                <Sparkles className="cms-mx-auto cms-mb-4" style={{ width: '3rem', height: '3rem', color: 'var(--gray-400)' }} />
                <h3 className="cms-text-lg cms-font-semibold cms-text-gray-800 cms-mb-2">
                  Nenhum conteúdo encontrado
                </h3>
                <p className="cms-text-gray-500 cms-mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Gere seu primeiro conteúdo usando IA'}
                </p>
                <button
                  className="cms-btn cms-btn-primary cms-inline-flex cms-items-center cms-gap-2"
                  onClick={() => setShowGenerateModal(true)}
                >
                  <Sparkles style={{ width: '1rem', height: '1rem' }} />
                  Gerar Novo Conteúdo (IA)
                </button>
              </div>
            </div>
          ) : (
            <div className="cms-card">
              <div className="cms-card-content" style={{ padding: 0 }}>
                {filteredContents.map((content) => (
                  <div
                    key={content.id}
                    className="cms-p-6 cms-border-b cms-border-gray-200 cms-flex cms-justify-between cms-items-start cms-gap-4"
                  >
                    <div className="cms-flex-1">
                      <div className="cms-flex cms-items-center cms-gap-3 cms-mb-2">
                        <h3 className="cms-text-lg cms-font-semibold cms-text-gray-800 cms-m-0">
                          {content.title}
                        </h3>
                        {getStatusBadge(content.status)}
                      </div>
                      {content.excerpt && (
                        <p className="cms-text-gray-500 cms-text-sm cms-mb-3">
                          {content.excerpt.substring(0, 150)}...
                        </p>
                      )}
                      <div className="cms-flex cms-items-center cms-gap-4 cms-text-xs cms-text-gray-400">
                        {content.wordCount && (
                          <span>{content.wordCount} palavras</span>
                        )}
                        {content.category && (
                          <span>• {content.category}</span>
                        )}
                        {content.publishedAt && (
                          <span>• Publicado em {new Date(content.publishedAt).toLocaleDateString('pt-BR')}</span>
                        )}
                        {content.wordpressUrl && (
                          <a 
                            href={content.wordpressUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="cms-text-primary"
                            style={{ textDecoration: 'none' }}
                          >
                            Ver no WordPress →
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="cms-flex cms-gap-2">
                      <button
                        onClick={() => {
                          setSelectedContent(content)
                          setShowEditModal(true)
                        }}
                        className="cms-btn cms-text-sm"
                      >
                        <Edit style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      {content.status !== 'published' && (
                        <button
                          onClick={() => handlePublish(content)}
                          className="cms-btn cms-btn-primary cms-text-sm"
                        >
                          <Eye style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      )}
                      {content.status === 'published' && (
                        <button
                          onClick={() => handlePublish(content)}
                          className="cms-btn cms-text-sm"
                        >
                          <EyeOff style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(content)}
                        className="cms-btn cms-text-sm cms-text-danger"
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal de Gerar Conteúdo */}
        {showGenerateModal && (
          <div className="cms-modal-overlay" style={{ zIndex: 1000, padding: '2rem' }}>
            <div className="cms-card" style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div className="cms-card-content">
                <div className="cms-flex cms-justify-between cms-items-center cms-mb-6">
                  <h2 className="cms-text-2xl cms-font-bold cms-text-gray-800 cms-m-0">
                    Gerar Novo Conteúdo com IA
                  </h2>
                  <button
                    onClick={() => {
                      setShowGenerateModal(false)
                      setAiSuggestion('')
                    }}
                    className="cms-bg-transparent cms-border-none cms-cursor-pointer cms-p-2 cms-flex cms-items-center cms-justify-center"
                  >
                    <X className="cms-text-gray-500" style={{ width: '1.25rem', height: '1.25rem' }} />
                  </button>
                </div>

                <div className="cms-flex-col cms-gap-6">
                  {/* Categoria e Idioma - Movidos para cima */}
                  <div className="cms-grid cms-gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                      <label className="cms-label">
                        Categoria
                      </label>
                      <select
                        value={generateForm.category}
                        onChange={(e) => setGenerateForm({ ...generateForm, category: e.target.value })}
                        className="cms-select"
                      >
                        <option value="Beleza">Beleza</option>
                        <option value="Saúde">Saúde</option>
                        <option value="Tecnologia">Tecnologia</option>
                        <option value="Moda">Moda</option>
                        <option value="Culinária">Culinária</option>
                        <option value="Viagem">Viagem</option>
                        <option value="Negócios">Negócios</option>
                        <option value="Educação">Educação</option>
                        <option value="Entretenimento">Entretenimento</option>
                        <option value="Esportes">Esportes</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="cms-label">
                        Idioma
                      </label>
                      <select
                        value={generateForm.language}
                        onChange={(e) => setGenerateForm({ ...generateForm, language: e.target.value })}
                        className="cms-select"
                      >
                        <option value="pt-BR">Português (BR)</option>
                        <option value="pt-PT">Português (PT)</option>
                        <option value="en-US">Inglês (US)</option>
                        <option value="es-ES">Espanhol</option>
                      </select>
                    </div>
                  </div>

                  {/* Sugestão da IA */}
                  <div>
                    <div className="cms-flex cms-justify-between cms-items-center cms-mb-2">
                      <label className="cms-label" style={{ marginBottom: 0 }}>
                        Sugestão da IA
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateAISuggestion}
                        disabled={isGeneratingSuggestion || !generateForm.category}
                        className="cms-btn"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.5rem 0.75rem',
                          opacity: (isGeneratingSuggestion || !generateForm.category) ? 0.5 : 1,
                          cursor: (isGeneratingSuggestion || !generateForm.category) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isGeneratingSuggestion ? (
                          <>
                            <Loader2 style={{ width: '0.75rem', height: '0.75rem', animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: '0.25rem' }} />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Sparkles style={{ width: '0.75rem', height: '0.75rem', display: 'inline-block', marginRight: '0.25rem' }} />
                            Sugerir Pauta
                          </>
                        )}
                      </button>
                    </div>
                    <p className="cms-text-xs cms-text-gray-500 cms-mb-2 cms-italic">
                      Vamos sugerir uma pauta com base nos interesses do seu público
                    </p>
                    {aiSuggestion && (
                      <div className="cms-p-3 cms-border cms-border-blue-200 cms-rounded cms-text-sm cms-text-blue-800 cms-mb-2" style={{ backgroundColor: 'var(--blue-50)' }}>
                        💡 {aiSuggestion}
                      </div>
                    )}
                  </div>

                  {/* Título */}
                  <div>
                    <label className="cms-label">
                      Título do Artigo <span className="cms-text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={generateForm.title}
                      onChange={(e) => setGenerateForm({ ...generateForm, title: e.target.value })}
                      placeholder="Ex: Amostras Grátis lojas O Boticário"
                      className="cms-input"
                    />
                  </div>

                  {/* Palavras-chave */}
                  <div>
                    <div className="cms-flex cms-justify-between cms-items-center cms-mb-2">
                      <label className="cms-label" style={{ marginBottom: 0 }}>
                        Palavras-Chave
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateKeywords}
                        disabled={isGeneratingKeywords || !generateForm.title.trim()}
                        className="cms-btn"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.5rem 0.75rem',
                          opacity: (isGeneratingKeywords || !generateForm.title.trim()) ? 0.5 : 1,
                          cursor: (isGeneratingKeywords || !generateForm.title.trim()) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isGeneratingKeywords ? (
                          <>
                            <Loader2 style={{ width: '0.75rem', height: '0.75rem', animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: '0.25rem' }} />
                            Buscando...
                          </>
                        ) : (
                          <>
                            <Search style={{ width: '0.75rem', height: '0.75rem', display: 'inline-block', marginRight: '0.25rem' }} />
                            Buscar Palavras-chave
                          </>
                        )}
                      </button>
                    </div>
                    <p className="cms-text-xs cms-text-gray-500 cms-mb-2 cms-italic">
                      Vamos nos basear nos 10 melhores artigos no Google para o tema
                    </p>
                    <input
                      type="text"
                      value={generateForm.keywords}
                      onChange={(e) => setGenerateForm({ ...generateForm, keywords: e.target.value })}
                      placeholder="Ex: amostras grátis, boticário, produtos de beleza"
                      className="cms-input"
                    />
                  </div>

                  {/* Modelo de IA */}
                  <div>
                    <label className="cms-label">
                      Modelo de IA
                    </label>
                    <select
                      value={generateForm.aiModel}
                      onChange={(e) => setGenerateForm({ ...generateForm, aiModel: e.target.value })}
                      className="cms-select"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      <option value="gemini-pro">Gemini Pro</option>
                    </select>
                  </div>

                  {/* Prompt/Instruções */}
                  <div>
                    <label className="cms-label">
                      Instruções Adicionais (Opcional)
                    </label>
                    <textarea
                      value={generateForm.prompt}
                      onChange={(e) => setGenerateForm({ ...generateForm, prompt: e.target.value })}
                      placeholder="Ex: Artigo deve ter 2000-2500 palavras, incluir imagens, foco em SEO..."
                      rows={4}
                      className="cms-textarea"
                    />
                    <p className="cms-text-xs cms-text-gray-500 cms-mt-2 cms-mb-0">
                      Se deixado em branco, será usado um prompt padrão baseado no título.
                    </p>
                  </div>
                </div>

                {/* Botões */}
                <div className="cms-flex cms-justify-end cms-gap-4 cms-mt-8 cms-pt-6 cms-border-t cms-border-gray-200">
                  <button
                    onClick={() => {
                      setShowGenerateModal(false)
                      setAiSuggestion('')
                    }}
                    className="cms-btn"
                    disabled={isGenerating}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGenerateContent}
                    className={`cms-btn cms-btn-primary cms-flex cms-items-center cms-gap-2 ${
                      (isGenerating || !generateForm.title.trim()) ? 'cms-opacity-50 cms-cursor-not-allowed' : ''
                    }`}
                    disabled={isGenerating || !generateForm.title.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles style={{ width: '1rem', height: '1rem' }} />
                        Gerar Conteúdo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição */}
        {showEditModal && selectedContent && (
          <div className="cms-modal-overlay" style={{ zIndex: 1000, padding: '2rem' }}>
            <div className="cms-card" style={{
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div className="cms-card-content">
                <div className="cms-flex cms-justify-between cms-items-center cms-mb-6">
                  <h2 className="cms-text-2xl cms-font-bold cms-text-gray-800 cms-m-0">
                    Editar Conteúdo
                  </h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedContent(null)
                    }}
                    className="cms-bg-transparent cms-border-none cms-cursor-pointer cms-p-2 cms-flex cms-items-center cms-justify-center"
                  >
                    <X className="cms-text-gray-500" style={{ width: '1.25rem', height: '1.25rem' }} />
                  </button>
                </div>

                <div className="cms-flex-col cms-gap-6">
                  {/* Título */}
                  <div>
                    <label className="cms-label">
                      Título <span className="cms-text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="cms-input"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="cms-label">
                      Slug (URL amigável)
                    </label>
                    <input
                      type="text"
                      value={editForm.slug}
                      onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                      placeholder="url-amigavel-do-artigo"
                      className="cms-input"
                    />
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="cms-label">
                      Resumo / Excerpt
                    </label>
                    <textarea
                      value={editForm.excerpt}
                      onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                      rows={3}
                      className="cms-textarea"
                    />
                  </div>

                  {/* Conteúdo */}
                  <div>
                    <label className="cms-label">
                      Conteúdo <span className="cms-text-danger">*</span>
                    </label>
                    <WysiwygEditor
                      content={editForm.content}
                      onChange={(content) => setEditForm({ ...editForm, content })}
                      placeholder="Digite o conteúdo do artigo..."
                    />
                  </div>

                  {/* Palavras-chave */}
                  <div>
                    <label className="cms-label">
                      Palavras-chave
                    </label>
                    <input
                      type="text"
                      value={editForm.keywords}
                      onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })}
                      placeholder="palavra1, palavra2, palavra3"
                      className="cms-input"
                    />
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="cms-label">
                      Meta Description (SEO)
                    </label>
                    <textarea
                      value={editForm.metaDescription}
                      onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })}
                      rows={2}
                      placeholder="Descrição otimizada para SEO (máx 160 caracteres)"
                      maxLength={160}
                      className="cms-textarea"
                    />
                    <p className="cms-text-xs cms-text-gray-500 cms-mt-2 cms-mb-0">
                      {editForm.metaDescription.length}/160 caracteres
                    </p>
                  </div>
                </div>

                {/* Botões */}
                <div className="cms-flex cms-justify-end cms-gap-4 cms-mt-8 cms-pt-6 cms-border-t cms-border-gray-200">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedContent(null)
                    }}
                    className="cms-btn"
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className={`cms-btn cms-btn-primary cms-flex cms-items-center cms-gap-2 ${
                      (isSaving || !editForm.title.trim() || !editForm.content.trim()) ? 'cms-opacity-50 cms-cursor-not-allowed' : ''
                    }`}
                    disabled={isSaving || !editForm.title.trim() || !editForm.content.trim()}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save style={{ width: '1rem', height: '1rem' }} />
                        Salvar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
