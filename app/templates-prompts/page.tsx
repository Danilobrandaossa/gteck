'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { usePromptTemplates } from '@/contexts/prompt-templates-context'
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Copy, 
  Filter,
  Tag,
  Calendar,
  BarChart3
} from 'lucide-react'

export default function TemplatesPromptsPage() {
  const { 
    templates, 
    addTemplate, 
    updateTemplate, 
    deleteTemplate, 
    searchTemplates,
    getTemplatesByCategory 
  } = usePromptTemplates()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    prompt: '',
    aiType: 'openai',
    category: 'Conteúdo',
    tags: ''
  })

  const categories = ['Conteúdo', 'E-commerce', 'Social Media', 'Marketing', 'Profissional']
  const aiTypes = [
    { id: 'openai', name: 'OpenAI GPT-5' },
    { id: 'gemini', name: 'Google Gemini Pro' },
    { id: 'koala', name: 'Koala.sh' },
    { id: 'claude', name: 'Claude 3 Sonnet' }
  ]

  const filteredTemplates = searchQuery 
    ? searchTemplates(searchQuery)
    : selectedCategory 
    ? getTemplatesByCategory(selectedCategory)
    : templates

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.prompt.trim()) {
      alert('Por favor, preencha o nome e o prompt')
      return
    }

    addTemplate({
      name: newTemplate.name,
      description: newTemplate.description,
      prompt: newTemplate.prompt,
      aiType: newTemplate.aiType as any,
      category: newTemplate.category,
      tags: newTemplate.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    })

    setNewTemplate({
      name: '',
      description: '',
      prompt: '',
      aiType: 'openai',
      category: 'Conteúdo',
      tags: ''
    })
    setShowAddModal(false)
    alert('Template criado com sucesso!')
  }

  const handleEditTemplate = () => {
    if (!editingTemplate.name || !editingTemplate.prompt.trim()) {
      alert('Por favor, preencha o nome e o prompt')
      return
    }

    updateTemplate(editingTemplate.id, {
      name: editingTemplate.name,
      description: editingTemplate.description,
      prompt: editingTemplate.prompt,
      aiType: editingTemplate.aiType,
      category: editingTemplate.category,
      tags: editingTemplate.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    })

    setEditingTemplate(null)
    setShowEditModal(false)
    alert('Template atualizado com sucesso!')
  }

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      deleteTemplate(id)
      alert('Template excluído com sucesso!')
    }
  }

  const handleEditClick = (template: any) => {
    setEditingTemplate({
      ...template,
      tags: template.tags.join(', ')
    })
    setShowEditModal(true)
  }

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    alert('Prompt copiado para a área de transferência!')
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ padding: '2rem' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                  Templates de Prompts
                </h1>
                <p style={{ color: 'var(--gray-600)', marginTop: '0.5rem' }}>
                  Gerencie seus templates de prompts para reutilização e agilidade
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="cms-btn cms-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
                Novo Template
              </button>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px' }}>
                <Search style={{ width: '1rem', height: '1rem', color: 'var(--gray-500)' }} />
                <input
                  type="text"
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter style={{ width: '1rem', height: '1rem', color: 'var(--gray-500)' }} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--white)'
                  }}
                >
                  <option value="">Todas as categorias</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Templates */}
          <div className="cms-card">
            <div className="cms-card-content">
              {filteredTemplates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                  <BookOpen style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Nenhum template encontrado</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    {searchQuery || selectedCategory ? 'Tente ajustar os filtros' : 'Crie seu primeiro template'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {filteredTemplates.map(template => (
                    <div
                      key={template.id}
                      style={{
                        border: '1px solid var(--gray-200)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.5rem',
                        backgroundColor: 'var(--white)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', margin: '0 0 0.5rem 0' }}>
                            {template.name}
                          </h3>
                          <p style={{ color: 'var(--gray-600)', marginBottom: '0.75rem' }}>
                            {template.description}
                          </p>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Tag style={{ width: '1rem', height: '1rem' }} />
                              {template.category}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <BarChart3 style={{ width: '1rem', height: '1rem' }} />
                              {template.usageCount} usos
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar style={{ width: '1rem', height: '1rem' }} />
                              {new Date(template.updatedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => copyPrompt(template.prompt)}
                            className="cms-btn cms-btn-secondary"
                            style={{ padding: '0.5rem' }}
                            title="Copiar prompt"
                          >
                            <Copy style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button
                            onClick={() => handleEditClick(template)}
                            className="cms-btn cms-btn-secondary"
                            style={{ padding: '0.5rem' }}
                            title="Editar template"
                          >
                            <Edit style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="cms-btn cms-btn-danger"
                            style={{ padding: '0.5rem' }}
                            title="Excluir template"
                          >
                            <Trash2 style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: 'var(--gray-50)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--gray-200)'
                      }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                          {template.prompt}
                        </div>
                      </div>
                      {template.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                          {template.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              style={{
                                backgroundColor: 'var(--primary-100)',
                                color: 'var(--primary-700)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Adicionar Template */}
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
            <div className="cms-card" style={{ maxWidth: '600px', margin: '1rem', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="cms-card-header">
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Novo Template de Prompt
                </h3>
              </div>
              <div className="cms-card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Nome do Template *
                    </label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                      placeholder="Ex: Artigo de Blog"
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
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                      placeholder="Breve descrição do template"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        IA Recomendada
                      </label>
                      <select
                        value={newTemplate.aiType}
                        onChange={(e) => setNewTemplate({...newTemplate, aiType: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: '0.875rem',
                          backgroundColor: 'var(--white)'
                        }}
                      >
                        {aiTypes.map(ai => (
                          <option key={ai.id} value={ai.id}>{ai.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Categoria
                      </label>
                      <select
                        value={newTemplate.category}
                        onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: '0.875rem',
                          backgroundColor: 'var(--white)'
                        }}
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Prompt *
                    </label>
                    <textarea
                      value={newTemplate.prompt}
                      onChange={(e) => setNewTemplate({...newTemplate, prompt: e.target.value})}
                      placeholder="Digite o prompt do template..."
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Tags (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={newTemplate.tags}
                      onChange={(e) => setNewTemplate({...newTemplate, tags: e.target.value})}
                      placeholder="blog, artigo, conteúdo"
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
                    onClick={handleAddTemplate}
                  >
                    Criar Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Template */}
        {showEditModal && editingTemplate && (
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
            <div className="cms-card" style={{ maxWidth: '600px', margin: '1rem', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="cms-card-header">
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Editar Template
                </h3>
              </div>
              <div className="cms-card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Nome do Template *
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
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
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.description}
                      onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        IA Recomendada
                      </label>
                      <select
                        value={editingTemplate.aiType}
                        onChange={(e) => setEditingTemplate({...editingTemplate, aiType: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: '0.875rem',
                          backgroundColor: 'var(--white)'
                        }}
                      >
                        {aiTypes.map(ai => (
                          <option key={ai.id} value={ai.id}>{ai.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Categoria
                      </label>
                      <select
                        value={editingTemplate.category}
                        onChange={(e) => setEditingTemplate({...editingTemplate, category: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: '0.875rem',
                          backgroundColor: 'var(--white)'
                        }}
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Prompt *
                    </label>
                    <textarea
                      value={editingTemplate.prompt}
                      onChange={(e) => setEditingTemplate({...editingTemplate, prompt: e.target.value})}
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Tags (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.tags}
                      onChange={(e) => setEditingTemplate({...editingTemplate, tags: e.target.value})}
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
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="cms-btn cms-btn-primary"
                    onClick={handleEditTemplate}
                  >
                    Salvar Alterações
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

