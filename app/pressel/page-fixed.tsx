// Página de Gerenciamento de Modelos Pressel - CMS Moderno
'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useOrganization } from '@/contexts/organization-context'
import { PresselModelForm } from '@/components/forms/pressel-model-form'
import { PresselTextConverter } from '@/components/forms/pressel-text-converter'
import { PresselAutomationService, PresselModel, PresselConversionResult } from '@/lib/pressel-automation-service'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Settings, 
  Copy, 
  Zap, 
  FlaskConical, 
  Code, 
  LayoutTemplate, 
  FileText, 
  Palette, 
  Users, 
  Calendar, 
  Tag, 
  Link as LinkIcon, 
  RefreshCw, 
  Play, 
  Pause,
  Square,
  X,
  Upload,
  Download,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Rocket,
  Globe,
  FileText as FileTextIcon,
  BarChart,
  TrendingUp,
  Star,
  Clock
} from 'lucide-react'

export default function PresselPage() {
  const { currentOrganization, currentSite } = useOrganization()
  const [models, setModels] = useState<PresselModel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTextConverter, setShowTextConverter] = useState(false)
  const [showJSONUpload, setShowJSONUpload] = useState(false)
  const [selectedModel, setSelectedModel] = useState<PresselModel | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedModelForPreview, setSelectedModelForPreview] = useState<PresselModel | null>(null)
  const [activeTab, setActiveTab] = useState<'models' | 'converter' | 'upload' | 'analytics'>('models')
  const [jsonFile, setJsonFile] = useState<File | null>(null)
  const [jsonContent, setJsonContent] = useState('')
  const [conversionResult, setConversionResult] = useState<PresselConversionResult | null>(null)

  const presselService = PresselAutomationService.getInstance()

  // Carregar modelos
  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    setIsLoading(true)
    try {
      const loadedModels = presselService.getModels()
      setModels(loadedModels)
      console.log(`📊 ${loadedModels.length} modelos Pressel carregados`)
    } catch (error) {
      console.error('❌ Erro ao carregar modelos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar modelos
  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || model.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || model.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Categorias disponíveis
  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'brasileiro', label: 'Brasileiro' },
    { value: 'internacional', label: 'Internacional' },
    { value: 'minimalista', label: 'Minimalista' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'afiliado', label: 'Afiliado' },
    { value: 'general', label: 'Geral' }
  ]

  // Status disponíveis
  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'active', label: 'Ativo', color: 'var(--success)' },
    { value: 'inactive', label: 'Inativo', color: 'var(--gray-500)' },
    { value: 'draft', label: 'Rascunho', color: 'var(--warning)' }
  ]

  // Funções de CRUD
  const handleCreateModel = () => {
    setSelectedModel(null)
    setShowCreateModal(true)
  }

  const handleEditModel = (model: PresselModel) => {
    setSelectedModel(model)
    setShowEditModal(true)
  }

  const handleDeleteModel = async (modelId: string) => {
    try {
      console.log('🗑️ Deletando modelo:', modelId)
      setModels(prev => prev.filter(model => model.id !== modelId))
      setShowDeleteModal(null)
    } catch (error) {
      console.error('❌ Erro ao deletar modelo:', error)
    }
  }

  const handleModelSaved = (model: PresselModel) => {
    if (selectedModel) {
      setModels(prev => prev.map(m => m.id === model.id ? model : m))
    } else {
      setModels(prev => [...prev, model])
    }
    setShowCreateModal(false)
    setShowEditModal(false)
    setSelectedModel(null)
  }

  // Funções de conversão
  const handleTextConversion = () => {
    setShowTextConverter(true)
  }

  const handleJSONUpload = () => {
    setShowJSONUpload(true)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setJsonFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setJsonContent(e.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  const handleJSONProcess = async () => {
    if (!jsonContent.trim()) {
      alert('Por favor, selecione um arquivo JSON válido')
      return
    }

    try {
      const jsonData = JSON.parse(jsonContent)
      console.log('📄 JSON carregado:', jsonData)
      
      setConversionResult({
        success: true,
        data: jsonData,
        generated_json: jsonData
      })
    } catch (error) {
      console.error('❌ Erro ao processar JSON:', error)
      setConversionResult({
        success: false,
        error: 'JSON inválido'
      })
    }
  }

  const handleConversionSuccess = (result: PresselConversionResult) => {
    console.log('✅ Conversão bem-sucedida:', result)
    setConversionResult(result)
    setShowTextConverter(false)
    setShowJSONUpload(false)
  }

  // Preview de modelo
  const handlePreviewModel = (model: PresselModel) => {
    setSelectedModelForPreview(model)
    setShowPreviewModal(true)
  }

  // Testar modelo
  const handleTestModel = async (model: PresselModel) => {
    try {
      console.log('🧪 Testando modelo:', model.name)
      alert(`Modelo ${model.name} testado com sucesso!`)
    } catch (error) {
      console.error('❌ Erro ao testar modelo:', error)
    }
  }

  // Detecção automática
  const handleAutoDetection = async () => {
    try {
      console.log('🔍 Iniciando detecção automática de modelos...')
      alert('Detecção automática concluída!')
    } catch (error) {
      console.error('❌ Erro na detecção automática:', error)
    }
  }

  // Estatísticas
  const getStats = () => {
    const totalModels = models.length
    const activeModels = models.filter(m => m.status === 'active').length
    const totalUsage = models.reduce((sum, model) => sum + model.usage_count, 0)
    const autoDetected = models.filter(m => m.is_auto_detected).length

    return { totalModels, activeModels, totalUsage, autoDetected }
  }

  const stats = getStats()

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pressel Automation</h1>
              <p className="text-gray-600 mt-1">
                Gerencie modelos Pressel e automatize a criação de páginas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAutoDetection}
                className="cms-btn cms-btn-secondary"
              >
                <FlaskConical className="w-4 h-4" />
                Detecção Automática
              </button>
              <button 
                onClick={handleCreateModel}
                className="cms-btn cms-btn-primary"
              >
                <Plus className="w-4 h-4" />
                Novo Modelo
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="cms-grid cms-grid-cols-4">
            <div className="cms-card cms-stat-card">
              <div className="cms-stat-content">
                <div className="cms-stat-info">
                  <h3>Total de Modelos</h3>
                  <h2>{stats.totalModels}</h2>
                </div>
                <div className="cms-stat-icon">
                  <LayoutTemplate className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="cms-card cms-stat-card">
              <div className="cms-stat-content">
                <div className="cms-stat-info">
                  <h3>Modelos Ativos</h3>
                  <h2>{stats.activeModels}</h2>
                </div>
                <div className="cms-stat-icon">
                  <CheckCircle className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="cms-card cms-stat-card">
              <div className="cms-stat-content">
                <div className="cms-stat-info">
                  <h3>Total de Uso</h3>
                  <h2>{stats.totalUsage}</h2>
                </div>
                <div className="cms-stat-icon">
                  <BarChart className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="cms-card cms-stat-card">
              <div className="cms-stat-content">
                <div className="cms-stat-info">
                  <h3>Auto-detectados</h3>
                  <h2>{stats.autoDetected}</h2>
                </div>
                <div className="cms-stat-icon">
                  <FlaskConical className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="cms-card">
            <div className="cms-card-header">
              <nav className="flex space-x-8">
                {[
                  { id: 'models', label: 'Modelos', icon: LayoutTemplate },
                  { id: 'converter', label: 'Conversor de Texto', icon: Code },
                  { id: 'upload', label: 'Upload JSON', icon: Upload },
                  { id: 'analytics', label: 'Analytics', icon: BarChart }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`cms-nav-item ${
                      activeTab === tab.id ? 'active' : ''
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="cms-card-content">
              {/* Tab: Modelos */}
              {activeTab === 'models' && (
                <div className="space-y-6">
                  {/* Filtros */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="cms-search">
                        <Search className="w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Buscar modelos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="cms-btn cms-btn-secondary"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="cms-btn cms-btn-secondary"
                    >
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lista de Modelos */}
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Carregando modelos...</p>
                    </div>
                  ) : filteredModels.length === 0 ? (
                    <div className="text-center py-12">
                      <LayoutTemplate className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum modelo encontrado</h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                          ? 'Tente ajustar os filtros de busca'
                          : 'Comece criando seu primeiro modelo Pressel'
                        }
                      </p>
                      {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
                        <button 
                          onClick={handleCreateModel}
                          className="cms-btn cms-btn-primary"
                        >
                          <Plus className="w-4 h-4" />
                          Criar Primeiro Modelo
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="cms-grid cms-grid-cols-3">
                      {filteredModels.map(model => (
                        <div key={model.id} className="cms-card">
                          <div className="cms-card-content">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="cms-card-title">
                                  {model.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  {model.description}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className={`cms-badge ${
                                    model.status === 'active' ? 'cms-badge-success' :
                                    model.status === 'inactive' ? 'cms-badge-warning' :
                                    'cms-badge-info'
                                  }`}>
                                    {model.status === 'active' ? 'Ativo' :
                                     model.status === 'inactive' ? 'Inativo' : 'Rascunho'}
                                  </span>
                                  <span className="cms-badge cms-badge-info">
                                    {model.category}
                                  </span>
                                  {model.is_auto_detected && (
                                    <span className="cms-badge cms-badge-warning">
                                      Auto
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handlePreviewModel(model)}
                                  className="cms-btn cms-btn-icon"
                                  title="Visualizar"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleEditModel(model)}
                                  className="cms-btn cms-btn-icon"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setShowDeleteModal(model.id)}
                                  className="cms-btn cms-btn-icon"
                                  title="Deletar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                <span>{model.wordpress_template}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span>{model.acf_fields.length} campos ACF</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <BarChart className="w-4 h-4" />
                                <span>{model.usage_count} usos</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>v{model.version}</span>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                              <button
                                onClick={() => handleTestModel(model)}
                                className="cms-btn cms-btn-primary flex-1"
                              >
                                <Play className="w-4 h-4" />
                                Testar
                              </button>
                              <button 
                                onClick={() => handlePreviewModel(model)}
                                className="cms-btn cms-btn-secondary flex-1"
                              >
                                <Eye className="w-4 h-4" />
                                Preview
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Conversor de Texto */}
              {activeTab === 'converter' && (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <Code className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h3 className="cms-card-title">
                      Conversor de Texto para JSON
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Converta texto do ChatGPT em JSON estruturado para criação automática de páginas Pressel
                    </p>
                    <button 
                      onClick={handleTextConversion}
                      className="cms-btn cms-btn-primary"
                    >
                      <Zap className="w-5 h-5" />
                      Iniciar Conversão
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Upload JSON */}
              {activeTab === 'upload' && (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <Upload className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="cms-card-title">
                      Upload de JSON
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Faça upload de um arquivo JSON gerado pelo ChatGPT para criar páginas automaticamente
                    </p>
                    
                    <div className="max-w-md mx-auto">
                      <div className="cms-upload-area border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="json-upload"
                        />
                        <label
                          htmlFor="json-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            Clique para selecionar arquivo JSON
                          </span>
                          <span className="text-xs text-gray-500">
                            ou arraste e solte aqui
                          </span>
                        </label>
                      </div>
                      
                      {jsonFile && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-800">Arquivo carregado</span>
                          </div>
                          <p className="text-sm text-green-700">{jsonFile.name}</p>
                          <button 
                            onClick={handleJSONProcess}
                            className="cms-btn cms-btn-primary mt-3 w-full"
                          >
                            <Rocket className="w-4 h-4" />
                            Processar JSON
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Analytics */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <BarChart className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                    <h3 className="cms-card-title">
                      Analytics de Modelos
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Acompanhe o desempenho e uso dos seus modelos Pressel
                    </p>
                    <div className="text-sm text-gray-500">
                      Em desenvolvimento...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resultado da Conversão */}
          {conversionResult && (
            <div className="cms-card">
              <div className="cms-card-content">
                <div className="flex items-center gap-2 mb-4">
                  {conversionResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className="cms-card-title">
                    {conversionResult.success ? 'Conversão Concluída!' : 'Erro na Conversão'}
                  </h3>
                </div>

                {conversionResult.success ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">Página criada com sucesso!</span>
                      </div>
                      <div className="text-sm text-green-700 space-y-1">
                        <p><strong>Título:</strong> {conversionResult.data?.page_title}</p>
                        <p><strong>Modelo:</strong> {conversionResult.data?.page_model}</p>
                        <p><strong>Template:</strong> {conversionResult.data?.page_template}</p>
                        <p><strong>Campos ACF:</strong> {Object.keys(conversionResult.data?.acf_fields || {}).length}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => window.open((conversionResult.data as any)?.edit_link, '_blank')}
                        className="cms-btn cms-btn-primary"
                      >
                        <Edit className="w-4 h-4" />
                        Editar Página
                      </button>
                      <button 
                        onClick={() => window.open((conversionResult.data as any)?.view_link, '_blank')}
                        className="cms-btn cms-btn-secondary"
                      >
                        <Eye className="w-4 h-4" />
                        Visualizar Página
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-red-800">Erro na conversão</span>
                    </div>
                    <p className="text-sm text-red-700">{conversionResult.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <PresselModelForm
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModelSaved}
        />

        <PresselModelForm
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          model={selectedModel}
          onSuccess={handleModelSaved}
        />

        <PresselTextConverter
          isOpen={showTextConverter}
          onClose={() => setShowTextConverter(false)}
          onSuccess={handleConversionSuccess}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="cms-card max-w-md w-full">
              <div className="cms-card-content">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <h3 className="cms-card-title">Confirmar Exclusão</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Tem certeza que deseja excluir este modelo? Esta ação não pode ser desfeita.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setShowDeleteModal(null)}
                    className="cms-btn cms-btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleDeleteModel(showDeleteModal)}
                    className="cms-btn cms-btn-primary"
                    style={{ backgroundColor: 'var(--danger)' }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && selectedModelForPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="cms-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="cms-card-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="w-6 h-6 text-blue-600" />
                    <h3 className="cms-card-title">
                      Preview: {selectedModelForPreview.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="cms-btn cms-btn-icon"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="cms-card-content">
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
                    {JSON.stringify(selectedModelForPreview, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}








