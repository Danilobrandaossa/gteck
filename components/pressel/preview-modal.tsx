'use client'

import { useState } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Edit, Eye, Rocket, FileText, Settings, Code } from 'lucide-react'

interface PreviewData {
  preview: any
  detectedModel: {
    modelName: string
    template: string
    confidence: number
    matchedFields: string[]
    uniqueFields: string[]
  }
  validation: {
    isValid: boolean
    filledFieldsCount: number
    requiredFieldsCount: number
    missingFields: string[]
    warnings: string[]
    filledFields: string[]
    optionalFieldsFilled: number
  }
  stats: {
    totalFields: number
    requiredFields: number
    filledFields: number
    missingFields: number
    confidence: number
    isValid: boolean
  }
}

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  previewData: PreviewData | null
  jsonData: any
  onEdit?: (jsonData: any) => void
  onPublish?: (jsonData: any) => void
}

export function PreviewModal({ isOpen, onClose, previewData, jsonData, onEdit, onPublish }: PreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'json' | 'validation' | 'technical'>('json')

  if (!isOpen || !previewData) return null

  const { preview, detectedModel, validation, stats } = previewData

  // Criar objeto completo do modelo identificado para exibição
  const modelPreview = {
    id: jsonData.page_model || `modelo_${detectedModel.modelName.toLowerCase()}`,
    name: `Modelo ${detectedModel.modelName}`,
    slug: jsonData.page_slug || 'sem-slug',
    description: `Template ${detectedModel.template} - ${detectedModel.modelName}`,
    category: jsonData.page_model?.includes('v4') ? 'internacional' : 'brasileiro',
    status: jsonData.post_status || 'draft',
    version: '1.0.0',
    author: 'CMS Moderno',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    template: detectedModel.template,
    confidence: Math.round(detectedModel.confidence * 100),
    acf_fields: Object.keys(jsonData.acf_fields || {}).map((fieldName: string) => {
      const fieldValue = jsonData.acf_fields[fieldName]
      const isRequired = validation.requiredFieldsCount > 0 && 
                         detectedModel.uniqueFields?.includes(fieldName)
      return {
        name: fieldName,
        type: Array.isArray(fieldValue) ? 'repeater' : typeof fieldValue,
        label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        required: isRequired,
        value: fieldValue
      }
    }),
    ...jsonData
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ backgroundColor: '#F3F4F6' }}>
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6" style={{ color: '#FF6B35' }} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Preview: Modelo {detectedModel.modelName} {jsonData.page_model?.includes('v4') ? '(Internacional)' : '(Brasileiro)'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          {[
            { id: 'json', label: 'JSON', icon: Code },
            { id: 'validation', label: 'Validação', icon: CheckCircle },
            { id: 'technical', label: 'Técnico', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-6 py-3 flex items-center gap-2 font-medium transition-colors ${
                activeTab === id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#1F2937' }}>
          {activeTab === 'json' && (
            <div style={{ padding: '16px' }}>
              <pre style={{ 
                fontSize: '14px', 
                color: '#10B981',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                overflowX: 'auto'
              }}>
                {JSON.stringify(modelPreview, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="space-y-4" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Modelo Identificado</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">{detectedModel.modelName}</div>
                  <div className="text-xs text-blue-700 mt-1">
                    {Math.round(detectedModel.confidence * 100)}% confiança
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Campos Preenchidos</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">{validation.filledFieldsCount}</div>
                  <div className="text-xs text-green-700 mt-1">de {stats.totalFields} total</div>
                </div>
                <div className={`p-4 rounded-lg ${validation.missingFields.length > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                  <div className={`text-sm font-medium ${validation.missingFields.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    Campos Obrigatórios
                  </div>
                  <div className={`text-2xl font-bold mt-1 ${validation.missingFields.length > 0 ? 'text-yellow-900' : 'text-green-900'}`}>
                    {validation.filledFieldsCount - validation.missingFields.length}/{validation.requiredFieldsCount}
                  </div>
                  <div className={`text-xs mt-1 ${validation.missingFields.length > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                    {validation.missingFields.length > 0 ? `${validation.missingFields.length} faltando` : 'Todos preenchidos'}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Template</div>
                  <div className="text-lg font-bold text-purple-900 mt-1 truncate" title={detectedModel.template}>
                    {detectedModel.template || 'page.php'}
                  </div>
                  <div className="text-xs text-purple-700 mt-1">Template aplicado</div>
                </div>
              </div>

              {/* Missing Fields */}
              {validation.missingFields.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Campos Obrigatórios Faltando</h3>
                  <ul className="space-y-1">
                    {validation.missingFields.map((field, idx) => (
                      <li key={idx} className="text-sm text-yellow-800 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Filled Fields */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Campos Preenchidos ({validation.filledFields.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {validation.filledFields.map((field, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="space-y-4" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Informações Técnicas</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Modelo:</span>{' '}
                    <span className="font-medium">{detectedModel.modelName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Template:</span>{' '}
                    <span className="font-medium">{detectedModel.template}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Confiança:</span>{' '}
                    <span className="font-medium">{Math.round(detectedModel.confidence * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Campos correspondentes:</span>{' '}
                    <span className="font-medium">{detectedModel.matchedFields.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
          <div className="flex gap-3">
            {onEdit && (
              <button
                onClick={() => onEdit(jsonData)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar JSON
              </button>
            )}
            {onPublish && (
              <button
                onClick={() => onPublish(jsonData)}
                disabled={!validation.isValid}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  validation.isValid
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Rocket className="w-4 h-4" />
                Publicar Página
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


