'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useTemplates } from '@/contexts/templates-context'
import { ArrowLeft, Save, Eye, Plus, Trash2, Settings, Code, Type } from 'lucide-react'

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  if (!params) return null
  const { templates, currentTemplate: _currentTemplate, setCurrentTemplate, updateTemplate, isLoading } = useTemplates()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    category: '',
    isGlobal: false,
    fields: [] as any[],
    htmlTemplate: '',
    cssTemplate: '',
    jsTemplate: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'fields' | 'template' | 'preview'>('fields')
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text' as any,
    required: false,
    placeholder: '',
    options: [] as string[]
  })

  const templateId = params.id as string
  const template = templates.find(t => t.id === templateId)

  useEffect(() => {
    if (template) {
      setCurrentTemplate(template)
      setFormData({
        name: template.name,
        description: template.description,
        slug: template.slug,
        category: template.category,
        isGlobal: template.isGlobal,
        fields: template.fields,
        htmlTemplate: template.htmlTemplate,
        cssTemplate: template.cssTemplate || '',
        jsTemplate: template.jsTemplate || ''
      })
    }
  }, [template, setCurrentTemplate])

  const handleSave = async () => {
    if (!template) return

    setIsSaving(true)
    try {
      await updateTemplate(templateId, formData)
      router.push('/templates')
    } catch (err) {
      console.error('Erro ao salvar template:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const addField = () => {
    if (!newField.name || !newField.label) return

    const field = {
      id: Date.now().toString(),
      name: newField.name,
      label: newField.label,
      type: newField.type,
      required: newField.required,
      placeholder: newField.placeholder,
      options: newField.type === 'select' ? newField.options : undefined
    }

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, field]
    }))

    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: []
    })
  }

  const removeField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }))
  }

  (fieldId: string, updates: any) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }))
  }

  const generatePreview = () => {
    let html = formData.htmlTemplate
    formData.fields.forEach(field => {
      const placeholder = `{{${field.name}}}`
      const sampleValue = getSampleValue(field.type)
      html = html.replace(new RegExp(placeholder, 'g'), sampleValue)
    })
    return html
  }

  const getSampleValue = (type: string) => {
    switch (type) {
      case 'text': return 'Texto de exemplo'
      case 'textarea': return 'Texto longo de exemplo...'
      case 'number': return '123'
      case 'email': return 'exemplo@email.com'
      case 'url': return 'https://exemplo.com'
      case 'date': return '2024-01-15'
      case 'select': return 'Opção 1'
      case 'checkbox': return 'Sim'
      case 'image': return 'https://via.placeholder.com/300x200'
      case 'wysiwyg': return '<p>Conteúdo rico de exemplo</p>'
      default: return 'Valor de exemplo'
    }
  }

  if (!template && !isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
              Template não encontrado
            </h1>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
              O template que você está procurando não existe ou foi removido.
            </p>
            <button
              className="cms-btn cms-btn-primary"
              onClick={() => router.push('/templates')}
            >
              <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              Voltar para templates
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
                onClick={() => router.push('/templates')}
              >
                <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Voltar
              </button>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--gray-900)' }}>
                {template ? `Editar: ${template.name}` : 'Carregando...'}
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
                onClick={() => setActiveTab('preview')}
              >
                <Eye style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Visualizar
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
            <button
              onClick={() => setActiveTab('fields')}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'fields' ? 'var(--primary)' : 'var(--gray-600)',
                borderBottom: activeTab === 'fields' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Type style={{ width: '1rem', height: '1rem' }} />
              Campos
            </button>
            <button
              onClick={() => setActiveTab('template')}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'template' ? 'var(--primary)' : 'var(--gray-600)',
                borderBottom: activeTab === 'template' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Code style={{ width: '1rem', height: '1rem' }} />
              Template
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'preview' ? 'var(--primary)' : 'var(--gray-600)',
                borderBottom: activeTab === 'preview' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Eye style={{ width: '1rem', height: '1rem' }} />
              Preview
            </button>
          </div>
        </div>

        {/* Fields Tab */}
        {activeTab === 'fields' && (
          <div className="cms-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Template Info */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h2 className="cms-card-title">Informações do Template</h2>
              </div>
              <div className="cms-card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Nome do Template
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do template..."
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do template..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Categoria
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="Categoria..."
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Slug
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="slug-do-template"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="isGlobal"
                      checked={formData.isGlobal}
                      onChange={(e) => setFormData(prev => ({ ...prev, isGlobal: e.target.checked }))}
                    />
                    <label htmlFor="isGlobal" style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                      Template global (disponível para todas as organizações)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Add New Field */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h2 className="cms-card-title">Adicionar Campo</h2>
              </div>
              <div className="cms-card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Nome do Campo
                    </label>
                    <input
                      type="text"
                      value={newField.name}
                      onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="nome_do_campo"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Label do Campo
                    </label>
                    <input
                      type="text"
                      value={newField.label}
                      onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="Nome do Campo"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Tipo do Campo
                    </label>
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--white)'
                      }}
                    >
                      <option value="text">Texto</option>
                      <option value="textarea">Área de Texto</option>
                      <option value="number">Número</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                      <option value="date">Data</option>
                      <option value="select">Seleção</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="image">Imagem</option>
                      <option value="wysiwyg">Editor WYSIWYG</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="required"
                      checked={newField.required}
                      onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                    />
                    <label htmlFor="required" style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                      Campo obrigatório
                    </label>
                  </div>

                  <button
                    className="cms-btn cms-btn-primary"
                    onClick={addField}
                    disabled={!newField.name || !newField.label}
                    style={{ width: '100%' }}
                  >
                    <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Adicionar Campo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Tab */}
        {activeTab === 'template' && (
          <div className="cms-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* HTML Template */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h2 className="cms-card-title">Template HTML</h2>
              </div>
              <div className="cms-card-content">
                <textarea
                  value={formData.htmlTemplate}
                  onChange={(e) => setFormData(prev => ({ ...prev, htmlTemplate: e.target.value }))}
                  placeholder="Digite o template HTML usando {{nome_do_campo}} para os campos..."
                  rows={15}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* CSS Template */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h2 className="cms-card-title">Template CSS</h2>
              </div>
              <div className="cms-card-content">
                <textarea
                  value={formData.cssTemplate}
                  onChange={(e) => setFormData(prev => ({ ...prev, cssTemplate: e.target.value }))}
                  placeholder="Digite o CSS do template..."
                  rows={15}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="cms-card">
            <div className="cms-card-header">
              <h2 className="cms-card-title">Preview do Template</h2>
            </div>
            <div className="cms-card-content">
              <div
                style={{
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  backgroundColor: 'var(--white)'
                }}
                dangerouslySetInnerHTML={{ __html: generatePreview() }}
              />
            </div>
          </div>
        )}

        {/* Fields List */}
        {activeTab === 'fields' && formData.fields.length > 0 && (
          <div className="cms-card" style={{ marginTop: '1.5rem' }}>
            <div className="cms-card-header">
              <h2 className="cms-card-title">Campos do Template ({formData.fields.length})</h2>
            </div>
            <div className="cms-card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formData.fields.map((field) => (
                  <div key={field.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    backgroundColor: 'var(--gray-50)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--gray-200)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                            {field.label}
                          </h4>
                          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                            {field.name} • {field.type} {field.required && '• Obrigatório'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="cms-btn cms-btn-icon cms-btn-secondary"
                        title="Editar campo"
                      >
                        <Settings style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      <button
                        className="cms-btn cms-btn-icon cms-btn-secondary"
                        title="Remover campo"
                        onClick={() => removeField(field.id)}
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
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

