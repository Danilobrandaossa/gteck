// Conversor de Texto para JSON Pressel
'use client'

import { useState } from 'react'
import { PresselAutomationService, PresselConversionResult } from '@/lib/pressel-automation-service'
import { CheckCircle, XCircle, Eye, RefreshCw, Zap, Rocket, Settings, Link as _LinkIcon, Code } from 'lucide-react'

interface PresselTextConverterProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (result: PresselConversionResult) => void
}

export function PresselTextConverter({ isOpen, onClose, onSuccess }: PresselTextConverterProps) {
  const [textContent, setTextContent] = useState('')
  const [pageModel, setPageModel] = useState('modelo_v1')
  const [pageSlug, setPageSlug] = useState('')
  const [customSettings, setCustomSettings] = useState({
    button_type: '',
    button_color: '#2352AE',
    button_1_url: '',
    button_2_url: '',
    button_3_url: ''
  })
  const [isConverting, setIsConverting] = useState(false)
  const [conversionResult, setConversionResult] = useState<PresselConversionResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const presselService = PresselAutomationService.getInstance()

  // Modelos disponíveis
  const models = [
    { value: 'modelo_v1', label: 'Modelo V1 (Brasileiro)', description: 'Template pressel-oficial.php' },
    { value: 'modelo_v2', label: 'Modelo V2 (Internacional)', description: 'Template presell-enus.php' },
    { value: 'modelo_v3', label: 'Modelo V3 (Minimalista)', description: 'Template presell-minimal.php' },
    { value: 'modelo_v4', label: 'Modelo V4 (E-commerce)', description: 'Template presell-ecommerce.php' },
    { value: 'modelo_v5', label: 'Modelo V5 (Afiliado)', description: 'Template presell-affiliate.php' }
  ]

  // Tipos de botão
  const buttonTypes = [
    { value: '', label: 'Auto-detectar do texto' },
    { value: 'normal', label: 'Normal' },
    { value: 'rewarded', label: 'Rewarded (av-rewarded)' }
  ]

  // Cores de botão predefinidas
  const buttonColors = [
    { value: '#2352AE', label: 'Azul Padrão', color: '#2352AE' },
    { value: '#FF6B35', label: 'Laranja', color: '#FF6B35' },
    { value: '#10B981', label: 'Verde', color: '#10B981' },
    { value: '#EF4444', label: 'Vermelho', color: '#EF4444' },
    { value: '#8B5CF6', label: 'Roxo', color: '#8B5CF6' },
    { value: '#F59E0B', label: 'Amarelo', color: '#F59E0B' }
  ]

  // Converter texto para JSON
  const handleConvert = async () => {
    if (!textContent.trim()) {
      alert('Por favor, insira o texto do ChatGPT')
      return
    }

    setIsConverting(true)
    setConversionResult(null)

    try {
      const result = await presselService.convertTextToJSON(
        textContent,
        pageModel,
        pageSlug,
        customSettings
      )

      setConversionResult(result)
      
      if (result.success) {
        setShowPreview(true)
      }
    } catch (error) {
      console.error('Erro na conversão:', error)
      setConversionResult({
        success: false,
        error: 'Erro interno na conversão'
      })
    } finally {
      setIsConverting(false)
    }
  }

  // Criar página no WordPress
  const handleCreatePage = async () => {
    if (!conversionResult?.success || !conversionResult.data) {
      alert('Nenhum resultado de conversão disponível')
      return
    }

    // Aqui você integraria com a API do WordPress
    // Por enquanto, vamos simular
    try {
      console.log('Criando página no WordPress...', conversionResult.data)
      
      // Simular criação
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onSuccess(conversionResult)
      onClose()
    } catch (error) {
      console.error('Erro ao criar página:', error)
      alert('Erro ao criar página no WordPress')
    }
  }

  // Limpar formulário
  const handleClear = () => {
    setTextContent('')
    setPageSlug('')
    setCustomSettings({
      button_type: '',
      button_color: '#2352AE',
      button_1_url: '',
      button_2_url: '',
      button_3_url: ''
    })
    setConversionResult(null)
    setShowPreview(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Code className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Conversão de Texto para JSON Pressel
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Texto do ChatGPT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto do ChatGPT *
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={8}
              placeholder="Cole aqui o texto completo gerado pelo ChatGPT..."
            />
            <p className="mt-1 text-sm text-gray-500">
              {textContent.length} caracteres
            </p>
          </div>

          {/* Configurações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo de Página
              </label>
              <select
                value={pageModel}
                onChange={(e) => setPageModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {models.map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {models.find(m => m.value === pageModel)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug da Página (opcional)
              </label>
              <input
                type="text"
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="exemplo: minha-pagina-pressel"
              />
              <p className="mt-1 text-sm text-gray-500">
                Se não preenchido, será gerado automaticamente do título
              </p>
            </div>
          </div>

          {/* Configurações Personalizadas */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações Personalizadas (Opcional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Botão
                </label>
                <select
                  value={customSettings.button_type}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, button_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {buttonTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor do Botão
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customSettings.button_color}
                    onChange={(e) => setCustomSettings(prev => ({ ...prev, button_color: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={customSettings.button_color}
                      onChange={(e) => setCustomSettings(prev => ({ ...prev, button_color: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#2352AE"
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {buttonColors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setCustomSettings(prev => ({ ...prev, button_color: color.value }))}
                      className="px-3 py-1 text-xs rounded-md border border-gray-300 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: color.color + '20', borderColor: color.color }}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Botão 1
                </label>
                <input
                  type="url"
                  value={customSettings.button_1_url}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, button_1_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Botão 2
                </label>
                <input
                  type="url"
                  value={customSettings.button_2_url}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, button_2_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Botão 3
                </label>
                <input
                  type="url"
                  value={customSettings.button_3_url}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, button_3_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://exemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Limpar
              </button>

              {conversionResult && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Ocultar' : 'Visualizar'} JSON
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConvert}
                disabled={isConverting || !textContent.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConverting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Convertendo...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Converter Texto
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Resultado da Conversão */}
          {conversionResult && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                {conversionResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className="text-lg font-medium text-gray-900">
                  {conversionResult.success ? 'Conversão Concluída!' : 'Erro na Conversão'}
                </h3>
              </div>

              {conversionResult.success ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">JSON gerado com sucesso!</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Título: {conversionResult.data?.page_title}
                    </p>
                    <p className="text-sm text-green-700">
                      Modelo: {conversionResult.data?.page_model}
                    </p>
                    <p className="text-sm text-green-700">
                      Campos ACF: {Object.keys(conversionResult.data?.acf_fields || {}).length}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCreatePage}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Rocket className="w-4 h-4" />
                      Criar Página no WordPress
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
          )}

          {/* Preview do JSON */}
          {showPreview && conversionResult?.success && conversionResult.generated_json && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview do JSON Gerado</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
                  {JSON.stringify(conversionResult.generated_json, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
