// Componente para criação de páginas no CMS
'use client'

import { useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { X, Save, FileText } from 'lucide-react'

interface CreatePageFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (page: any) => void
}

export function CreatePageForm({ isOpen, onClose, onSuccess }: CreatePageFormProps) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Auto-gerar slug baseado no título
    if (name === 'title') {
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
      console.log('🚀 Criando nova página no WordPress...', formData)
      
      // Criar página no WordPress via API
      const response = await fetch('/api/wordpress/create-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          status: formData.status,
          excerpt: formData.excerpt,
          template: formData.template,
          wordpressUrl: currentSite.settings?.wordpressUrl,
          username: currentSite.settings?.wordpressUser,
          password: currentSite.settings?.wordpressAppPassword
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar página')
      }

      const newPage = {
        id: result.data.id,
        title: { rendered: result.data.title },
        slug: result.data.slug,
        content: { rendered: formData.content },
        status: result.data.status,
        excerpt: { rendered: formData.excerpt },
        date: result.data.date,
        link: result.data.link,
        template: result.data.template,
        edit_link: result.data.edit_link
      }
      
      console.log('✅ Página criada com sucesso:', newPage)
      
      // Chamar callback de sucesso
      onSuccess?.(newPage)
      
      // Limpar formulário
      setFormData({
        title: '',
        slug: '',
        content: '',
        status: 'draft',
        excerpt: '',
        featuredImage: '',
        template: 'default'
      })
      
      // Fechar modal
      onClose()
      
    } catch (error) {
      console.error('❌ Erro ao criar página:', error)
      setErrors({ general: error instanceof Error ? error.message : 'Erro ao criar página. Tente novamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

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
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
            <FileText style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', display: 'inline' }} />
            Criar Nova Página
          </h3>
          <button
            onClick={onClose}
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
                rows={8}
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
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
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
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isLoading ? '#9CA3AF' : '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
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
                  Criando...
                </>
              ) : (
                <>
                  <Save style={{ width: '1rem', height: '1rem' }} />
                  Criar Página
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


