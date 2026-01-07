// Formulário de Criação/Edição de Modelos Pressel
'use client'

import { useState, useEffect } from 'react'
import { PresselModel } from '@/lib/pressel-automation-service'
import { XCircle, Plus, Trash2, Eye, Save, LayoutTemplate, Link as _LinkIcon, FileText } from 'lucide-react'

interface PresselModelFormProps {
  isOpen: boolean
  onClose: () => void
  model?: PresselModel | null
  onSuccess: (model: PresselModel) => void
}

export function PresselModelForm({ isOpen, onClose, model, onSuccess }: PresselModelFormProps) {
  const [formData, setFormData] = useState<Partial<PresselModel>>({
    name: '',
    slug: '',
    description: '',
    category: 'general',
    status: 'active',
    version: '1.0.0',
    author: 'CMS Moderno',
    acf_fields: [],
    template_content: '',
    theme_settings: {},
    usage_count: 0,
    is_auto_detected: false,
    wordpress_template: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  // Categorias disponíveis
  const categories = [
    { value: 'brasileiro', label: 'Brasileiro' },
    { value: 'internacional', label: 'Internacional' },
    { value: 'minimalista', label: 'Minimalista' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'afiliado', label: 'Afiliado' },
    { value: 'general', label: 'Geral' }
  ]

  // Status disponíveis
  const statusOptions = [
    { value: 'active', label: 'Ativo', color: '#10b981' },
    { value: 'inactive', label: 'Inativo', color: '#6b7280' },
    { value: 'draft', label: 'Rascunho', color: '#f59e0b' }
  ]

  // Inicializar formulário
  useEffect(() => {
    if (model) {
      setFormData(model)
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        category: 'general',
        status: 'active',
        version: '1.0.0',
        author: 'CMS Moderno',
        acf_fields: [],
        template_content: '',
        theme_settings: {},
        usage_count: 0,
        is_auto_detected: false,
        wordpress_template: ''
      })
    }
    setErrors({})
  }, [model, isOpen])

  // Gerar slug automaticamente
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Atualizar slug quando nome mudar
  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value)
    }))
  }

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.slug?.trim()) {
      newErrors.slug = 'Slug é obrigatório'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens'
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    if (!formData.wordpress_template?.trim()) {
      newErrors.wordpress_template = 'Template WordPress é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const modelData: PresselModel = {
        id: model?.id || `modelo_${Date.now()}`,
        name: formData.name!,
        slug: formData.slug!,
        description: formData.description!,
        category: formData.category!,
        status: formData.status!,
        version: formData.version!,
        author: formData.author!,
        created_at: model?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        acf_fields: formData.acf_fields || [],
        template_content: formData.template_content || '',
        theme_settings: formData.theme_settings || {},
        usage_count: formData.usage_count || 0,
        is_auto_detected: formData.is_auto_detected || false,
        wordpress_template: formData.wordpress_template!
      }

      // Simular salvamento (aqui você integraria com a API)
      await new Promise(resolve => setTimeout(resolve, 1000))

      onSuccess(modelData)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar modelo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Adicionar campo ACF
  const addACFField = () => {
    const newField = {
      name: '',
      type: 'text',
      label: '',
      required: false,
      options: []
    }

    setFormData(prev => ({
      ...prev,
      acf_fields: [...(prev.acf_fields || []), newField]
    }))
  }

  // Remover campo ACF
  const removeACFField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      acf_fields: prev.acf_fields?.filter((_, i) => i !== index) || []
    }))
  }

  // Atualizar campo ACF
  const updateACFField = (index: number, field: any) => {
    setFormData(prev => ({
      ...prev,
      acf_fields: prev.acf_fields?.map((f, i) => i === index ? field : f) || []
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <LayoutTemplate className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {model ? 'Editar Modelo Pressel' : 'Novo Modelo Pressel'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Modelo *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Modelo V1 Brasileiro"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="modelo-v1-brasileiro"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={3}
              placeholder="Descreva o modelo e suas características..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Configurações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={formData.category || 'general'}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Versão
              </label>
              <input
                type="text"
                value={formData.version || '1.0.0'}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1.0.0"
              />
            </div>
          </div>

          {/* Template WordPress */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template WordPress *
            </label>
            <input
              type="text"
              value={formData.wordpress_template || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, wordpress_template: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.wordpress_template ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="pressel-oficial.php"
            />
            {errors.wordpress_template && (
              <p className="mt-1 text-sm text-red-600">{errors.wordpress_template}</p>
            )}
          </div>

          {/* Campos ACF */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Campos ACF</h3>
              <button
                type="button"
                onClick={addACFField}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Campo
              </button>
            </div>

            <div className="space-y-4">
              {(formData.acf_fields || []).map((field, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Campo {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeACFField(index)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Campo
                      </label>
                      <input
                        type="text"
                        value={field.name || ''}
                        onChange={(e) => updateACFField(index, { ...field, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="hero_description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select
                        value={field.type || 'text'}
                        onChange={(e) => updateACFField(index, { ...field, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="text">Texto</option>
                        <option value="textarea">Área de Texto</option>
                        <option value="wysiwyg">Editor WYSIWYG</option>
                        <option value="select">Seleção</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="url">URL</option>
                        <option value="email">Email</option>
                        <option value="number">Número</option>
                        <option value="color_picker">Seletor de Cor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Label
                      </label>
                      <input
                        type="text"
                        value={field.label || ''}
                        onChange={(e) => updateACFField(index, { ...field, label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Descrição do Hero"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.required || false}
                        onChange={(e) => updateACFField(index, { ...field, required: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Campo obrigatório</span>
                    </label>
                  </div>
                </div>
              ))}

              {(!formData.acf_fields || formData.acf_fields.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Nenhum campo ACF adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Campo" para começar</p>
                </div>
              )}
            </div>
          </div>

          {/* Configurações de Tema */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Tema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Esquema de Cores
                </label>
                <select
                  value={formData.theme_settings?.color_scheme || 'blue'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    theme_settings: { ...prev.theme_settings, color_scheme: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="blue">Azul</option>
                  <option value="green">Verde</option>
                  <option value="red">Vermelho</option>
                  <option value="purple">Roxo</option>
                  <option value="orange">Laranja</option>
                  <option value="gray">Cinza</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Layout
                </label>
                <select
                  value={formData.theme_settings?.layout || 'standard'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    theme_settings: { ...prev.theme_settings, layout: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">Padrão</option>
                  <option value="minimal">Minimalista</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="affiliate">Afiliado</option>
                  <option value="international">Internacional</option>
                </select>
              </div>
            </div>
          </div>

          {/* Opções Avançadas */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Opções Avançadas</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_auto_detected || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_auto_detected: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Detecção Automática</span>
                  <p className="text-xs text-gray-500">Permitir que o sistema detecte este modelo automaticamente</p>
                </div>
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Ocultar' : 'Visualizar'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {model ? 'Atualizar' : 'Criar'} Modelo
                </>
              )}
            </button>
          </div>
        </form>

        {/* Preview */}
        {showPreview && (
          <div className="p-6 border-t bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview do Modelo</h3>
            <div className="bg-white p-4 rounded-lg border">
              <pre className="text-sm text-gray-600 overflow-x-auto">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}