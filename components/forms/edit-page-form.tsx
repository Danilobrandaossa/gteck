// Componente para edição de páginas no CMS
'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { X, Save, Eye, FileText, AlertCircle } from 'lucide-react'

interface EditPageFormProps {
  isOpen: boolean
  onClose: () => void
  page: any
  onSuccess?: (page: any) => void
}

export function EditPageForm({ isOpen, onClose, page, onSuccess }: EditPageFormProps) {
  const { currentSite } = useOrganization()
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft',
    excerpt: '',
    featuredImage: '',
    template: 'default'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Carregar dados da página quando o modal abrir
  useEffect(() => {
    if (isOpen && page) {
      setFormData({
        title: page.title?.rendered || '',
        slug: page.slug || '',
        content: page.content?.rendered || '',
        status: page.status || 'draft',
        excerpt: page.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
        featuredImage: page.featured_media || '',
        template: page.template || 'default'
      })
      setHasChanges(false)
      setErrors({})
    }
  }, [isOpen, page])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Auto-gerar slug baseado no título (apenas se slug estiver vazio)
    if (name === 'title' && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({
        ...prev,
        slug
      }))
    }
    
    // Marcar como modificado
    setHasChanges(true)
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório'
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug é obrigatório'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Conteúdo é obrigatório'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    if (!currentSite?.settings?.wordpressUrl || !currentSite?.settings?.wordpressUser || !currentSite?.settings?.wordpressAppPassword) {
      setErrors({ general: 'Credenciais do WordPress não configuradas' })
      return
    }
    
    setIsLoading(true)
    
    try {
      console.log('Editando página no WordPress...', { id: page.id, formData })
      
      // Simular edição da página (será implementada com API real)
      const updatedPage = {
        ...page,
        title: { rendered: formData.title },
        slug: formData.slug,
        content: { rendered: formData.content },
        status: formData.status,
        excerpt: { rendered: formData.excerpt },
        template: formData.template,
        modified: new Date().toISOString()
      }
      
      console.log('Página editada com sucesso:', updatedPage)
      
      // Chamar callback de sucesso
      onSuccess?.(updatedPage)
      
      // Fechar modal
      onClose()
      
    } catch (error) {
      console.error('Erro ao editar página:', error)
      setErrors({ general: 'Erro ao editar página. Tente novamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm('Você tem alterações não salvas. Deseja realmente fechar?')
      if (!confirmClose) return
    }
    onClose()
  }

  if (!isOpen || !page) return null

  return (
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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        maxWidth: '900px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
            <FileText style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', display: 'inline' }} />
            Editar Página: {page.title?.rendered || 'Sem título'}
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        {hasChanges && (
          <div style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #F59E0B',
            color: '#92400E',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle style={{ width: '1rem', height: '1rem' }} />
            <span style={{ fontSize: '0.875rem' }}>
              Você tem alterações não salvas
            </span>
          </div>
        )}

        {errors.general && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginBottom: '1rem'
          }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Título */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Título *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Digite o título da página"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.title ? '#DC2626' : '#D1D5DB'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
              {errors.title && (
                <p style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.title}
                </p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Slug *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="url-da-pagina"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.slug ? '#DC2626' : '#D1D5DB'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
              {errors.slug && (
                <p style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.slug}
                </p>
              )}
            </div>

            {/* Status e Template */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="draft">Rascunho</option>
                  <option value="publish">Publicado</option>
                  <option value="private">Privado</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Template
                </label>
                <select
                  name="template"
                  value={formData.template}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="default">Padrão</option>
                  <option value="page-fullwidth">Largura Total</option>
                  <option value="page-sidebar">Com Sidebar</option>
                </select>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Resumo
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                placeholder="Breve descrição da página"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Conteúdo */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Conteúdo *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Digite o conteúdo da página"
                rows={12}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.content ? '#DC2626' : '#D1D5DB'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
              {errors.content && (
                <p style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.content}
                </p>
              )}
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => window.open(page.link, '_blank')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Eye style={{ width: '1rem', height: '1rem' }} />
                Visualizar
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !hasChanges}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isLoading || !hasChanges ? '#9CA3AF' : '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: isLoading || !hasChanges ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save style={{ width: '1rem', height: '1rem' }} />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}


