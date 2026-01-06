// Componente para criação de categorias no CMS
'use client'

import { useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { X, Save, Tag, AlertCircle } from 'lucide-react'

interface CreateCategoryFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (category: any) => void
  categoryType: 'pages' | 'pressels' | 'quizzes' | 'articles' | 'general'
}

export function CreateCategoryForm({ isOpen, onClose, onSuccess, categoryType }: CreateCategoryFormProps) {
  const { currentSite } = useOrganization()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
    parent: '',
    type: categoryType
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Auto-gerar slug baseado no nome
    if (name === 'name') {
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
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
    
    setIsLoading(true)
    
    try {
      console.log('Criando nova categoria...', formData)
      
      // Simular criação da categoria (será implementada com API real)
      const newCategory = {
        id: Date.now(),
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        color: formData.color,
        parent: formData.parent || null,
        type: formData.type,
        count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('Categoria criada com sucesso:', newCategory)
      
      // Chamar callback de sucesso
      onSuccess?.(newCategory)
      
      // Limpar formulário
      setFormData({
        name: '',
        slug: '',
        description: '',
        color: '#3B82F6',
        parent: '',
        type: categoryType
      })
      
      // Fechar modal
      onClose()
      
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      setErrors({ general: 'Erro ao criar categoria. Tente novamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryTypeLabel = () => {
    switch (categoryType) {
      case 'pages': return 'Páginas'
      case 'pressels': return 'Pressels'
      case 'quizzes': return 'Quizzes'
      case 'articles': return 'Artigos'
      default: return 'Geral'
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
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
            <Tag style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', display: 'inline' }} />
            Criar Nova Categoria - {getCategoryTypeLabel()}
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
            {/* Nome */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Nome da Categoria *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Digite o nome da categoria"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.name ? '#DC2626' : '#D1D5DB'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
              {errors.name && (
                <p style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.name}
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
                placeholder="url-da-categoria"
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

            {/* Descrição */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Breve descrição da categoria"
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

            {/* Cor e Tipo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Cor
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    style={{
                      width: '3rem',
                      height: '2.5rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={handleInputChange}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Categoria Pai
                </label>
                <select
                  name="parent"
                  value={formData.parent}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Nenhuma (categoria principal)</option>
                  {/* Aqui seriam carregadas as categorias existentes */}
                </select>
              </div>
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
                  Criar Categoria
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


