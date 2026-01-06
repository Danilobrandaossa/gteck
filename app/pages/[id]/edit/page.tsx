'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { usePages } from '@/contexts/pages-context'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { Save, Eye, ArrowLeft, Settings, Image, FileText } from 'lucide-react'

export default function EditPagePage() {
  const router = useRouter()
  const params = useParams()
  const { pages, currentPage, setCurrentPage, updatePage, isLoading } = usePages()
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    status: 'draft' as 'draft' | 'published' | 'archived'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content')

  const pageId = params.id as string
  const page = pages.find(p => p.id === pageId)

  useEffect(() => {
    if (page) {
      setCurrentPage(page)
      setFormData({
        title: page.title,
        slug: page.slug,
        content: page.content,
        excerpt: page.excerpt || '',
        seoTitle: page.seoTitle || '',
        seoDescription: page.seoDescription || '',
        seoKeywords: page.seoKeywords || '',
        status: page.status
      })
    }
  }, [page, setCurrentPage])

  const handleSave = async () => {
    if (!page) return

    setIsSaving(true)
    try {
      await updatePage(pageId, formData)
      // Redirecionar para a lista de páginas
      router.push('/pages')
    } catch (err) {
      console.error('Erro ao salvar página:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!page) return

    setIsSaving(true)
    try {
      await updatePage(pageId, { ...formData, status: 'published' })
      router.push('/pages')
    } catch (err) {
      console.error('Erro ao publicar página:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }))
  }

  if (!page && !isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
              Página não encontrada
            </h1>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
              A página que você está procurando não existe ou foi removida.
            </p>
            <button 
              className="cms-btn cms-btn-primary"
              onClick={() => router.push('/pages')}
            >
              <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              Voltar para páginas
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                className="cms-btn cms-btn-secondary"
                onClick={() => router.push('/pages')}
              >
                <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Voltar
              </button>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--gray-900)' }}>
                {page ? `Editar: ${page.title}` : 'Carregando...'}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="cms-btn cms-btn-secondary"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
              <button 
                className="cms-btn cms-btn-primary"
                onClick={handlePublish}
                disabled={isSaving || formData.status === 'published'}
              >
                <Eye style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                {formData.status === 'published' ? 'Publicada' : 'Publicar'}
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
            <button
              onClick={() => setActiveTab('content')}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'content' ? 'var(--primary)' : 'var(--gray-600)',
                borderBottom: activeTab === 'content' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FileText style={{ width: '1rem', height: '1rem' }} />
              Conteúdo
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'seo' ? 'var(--primary)' : 'var(--gray-600)',
                borderBottom: activeTab === 'seo' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Settings style={{ width: '1rem', height: '1rem' }} />
              SEO
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'settings' ? 'var(--primary)' : 'var(--gray-600)',
                borderBottom: activeTab === 'settings' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Settings style={{ width: '1rem', height: '1rem' }} />
              Configurações
            </button>
          </div>
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="cms-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Main Content */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h2 className="cms-card-title">Conteúdo da Página</h2>
              </div>
              <div className="cms-card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Title */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Título da Página
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Digite o título da página..."
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '1rem',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      URL da Página (slug)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>/</span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="url-da-pagina"
                        style={{
                          flex: 1,
                          padding: '0.75rem 1rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: '0.875rem',
                          transition: 'all 0.2s'
                        }}
                      />
                    </div>
                  </div>

                  {/* Content Editor */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Conteúdo
                    </label>
                    <WysiwygEditor
                      content={formData.content}
                      onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                      placeholder="Digite o conteúdo da página..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Excerpt */}
              <div className="cms-card">
                <div className="cms-card-header">
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>Resumo</h3>
                </div>
                <div className="cms-card-content">
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Breve descrição da página..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>
              </div>

              {/* Featured Image */}
              <div className="cms-card">
                <div className="cms-card-header">
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>Imagem Destacada</h3>
                </div>
                <div className="cms-card-content">
                  <div style={{ 
                    border: '2px dashed var(--gray-300)', 
                    borderRadius: 'var(--radius)', 
                    padding: '2rem', 
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    <Image style={{ width: '2rem', height: '2rem', color: 'var(--gray-400)', margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                      Clique para adicionar imagem
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="cms-card">
            <div className="cms-card-header">
              <h2 className="cms-card-title">Configurações de SEO</h2>
            </div>
            <div className="cms-card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Título SEO
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                    placeholder="Título para motores de busca..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Descrição SEO
                  </label>
                  <textarea
                    value={formData.seoDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                    placeholder="Descrição para motores de busca..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Palavras-chave
                  </label>
                  <input
                    type="text"
                    value={formData.seoKeywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoKeywords: e.target.value }))}
                    placeholder="palavra-chave1, palavra-chave2, palavra-chave3"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="cms-card">
            <div className="cms-card-header">
              <h2 className="cms-card-title">Configurações da Página</h2>
            </div>
            <div className="cms-card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Status da Página
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      color: 'var(--gray-700)',
                      backgroundColor: 'var(--white)'
                    }}
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicada</option>
                    <option value="archived">Arquivada</option>
                  </select>
                </div>

                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: 'var(--gray-50)', 
                  borderRadius: 'var(--radius)', 
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)'
                }}>
                  <strong>Informações da Página:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    <li>Criada em: {page?.createdAt.toLocaleDateString('pt-BR')}</li>
                    <li>Última atualização: {page?.updatedAt.toLocaleDateString('pt-BR')}</li>
                    {page?.publishedAt && (
                      <li>Publicada em: {page.publishedAt.toLocaleDateString('pt-BR')}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

