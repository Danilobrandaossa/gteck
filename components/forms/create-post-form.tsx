'use client'

import { useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { X, Save } from 'lucide-react'

interface CreatePostFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (post: any) => void
}

export function CreatePostForm({ isOpen, onClose, onSuccess }: CreatePostFormProps) {
  const { currentSite } = useOrganization()
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft' as 'draft' | 'publish' | 'private',
    excerpt: '',
    categories: [] as number[],
    tags: [] as number[],
    featuredImage: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Conteúdo é obrigatório'
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug é obrigatório'
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
      console.log('🚀 Criando novo post no WordPress...', formData)
      
      // Criar post no WordPress via API
      const response = await fetch('/api/wordpress/create-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          status: formData.status,
          excerpt: formData.excerpt,
          categories: formData.categories,
          tags: formData.tags,
          featured_media: formData.featuredImage ? parseInt(formData.featuredImage) : null,
          wordpressUrl: currentSite.settings?.wordpressUrl,
          username: currentSite.settings?.wordpressUser,
          password: currentSite.settings?.wordpressAppPassword
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar post')
      }

      const newPost = {
        id: result.data.id,
        title: { rendered: result.data.title },
        slug: result.data.slug,
        content: { rendered: formData.content },
        status: result.data.status,
        excerpt: { rendered: formData.excerpt },
        date: result.data.date,
        link: result.data.link,
        edit_link: result.data.edit_link
      }
      
      console.log('✅ Post criado com sucesso:', newPost)
      
      // Chamar callback de sucesso
      onSuccess?.(newPost)
      
      // Limpar formulário
      setFormData({
        title: '',
        slug: '',
        content: '',
        status: 'draft',
        excerpt: '',
        categories: [],
        tags: [],
        featuredImage: ''
      })
      
      // Fechar modal
      onClose()
      
    } catch (error) {
      console.error('❌ Erro ao criar post:', error)
      setErrors({ general: error instanceof Error ? error.message : 'Erro ao criar post. Tente novamente.' })
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
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            Criar Novo Post
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Título */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#374151'
              }}
              placeholder="Digite o título do post"
            />
            {errors.title && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.title}
              </p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#374151'
              }}
              placeholder="url-do-post"
            />
            {errors.slug && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.slug}
              </p>
            )}
          </div>

          {/* Conteúdo */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Conteúdo *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#374151',
                resize: 'vertical'
              }}
              placeholder="Digite o conteúdo do post"
            />
            {errors.content && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.content}
              </p>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Resumo
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#374151',
                resize: 'vertical'
              }}
              placeholder="Digite um resumo do post"
            />
          </div>

          {/* Status */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'publish' | 'private' })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#374151'
              }}
            >
              <option value="draft">Rascunho</option>
              <option value="publish">Publicado</option>
              <option value="private">Privado</option>
            </select>
          </div>

          {/* Error geral */}
          {errors.general && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.375rem',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              {errors.general}
            </div>
          )}

          {/* Botões */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
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
                backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
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
                  Criar Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}








